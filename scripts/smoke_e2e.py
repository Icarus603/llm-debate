from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
import sys
import time
from typing import Any

import httpx


@dataclass(frozen=True)
class Turn:
    id: str
    actor: str
    round: int
    content: str


def _api_base_url() -> str:
    raw = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
    return raw


def _read_sse_events(url: str, *, max_turns: int, timeout_seconds: float) -> list[Turn]:
    turns: list[Turn] = []
    started = time.time()

    with httpx.stream("GET", url, timeout=timeout_seconds) as r:
        r.raise_for_status()
        event: dict[str, str] = {}
        for line in r.iter_lines():
            if time.time() - started > timeout_seconds:
                break
            if line == "":
                if event.get("event") == "turn" and "data" in event:
                    data = json.loads(event["data"])
                    turns.append(
                        Turn(
                            id=str(data["id"]),
                            actor=str(data["actor"]),
                            round=int(data["round"]),
                            content=str(data["content"]),
                        )
                    )
                    if len(turns) >= max_turns:
                        return turns
                event = {}
                continue
            if line.startswith("event:"):
                event["event"] = line[len("event:") :].strip()
            elif line.startswith("data:"):
                event["data"] = line[len("data:") :].strip()
            elif line.startswith("id:"):
                event["id"] = line[len("id:") :].strip()

    return turns


def main() -> int:
    parser = argparse.ArgumentParser(description="Manual smoke test (requires API + worker running).")
    parser.add_argument("--topic", default="Is remote work better than office work?")
    parser.add_argument("--timeout-seconds", type=float, default=120.0)
    args = parser.parse_args()

    api = _api_base_url()

    with httpx.Client(timeout=args.timeout_seconds) as client:
        create = client.post(f"{api}/debates", json={"topic": args.topic})
        create.raise_for_status()
        debate = create.json()
        debate_id = debate["id"]

        start = client.post(f"{api}/debates/{debate_id}/start")
        start.raise_for_status()

        events_url = f"{api}/debates/{debate_id}/events"
        turns = _read_sse_events(events_url, max_turns=3, timeout_seconds=args.timeout_seconds)
        if len(turns) < 3:
            raise RuntimeError(f"Expected >=3 turns, got {len(turns)}")

        state = client.get(f"{api}/debates/{debate_id}")
        state.raise_for_status()
        payload: dict[str, Any] = state.json()
        persisted_turns = payload.get("turns", [])
        if len(persisted_turns) < 3:
            raise RuntimeError(f"Expected >=3 persisted turns, got {len(persisted_turns)}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"smoke_e2e failed: {exc}", file=sys.stderr)
        raise

