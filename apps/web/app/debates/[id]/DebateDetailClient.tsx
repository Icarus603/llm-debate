"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Turn = {
  id: string;
  debate_id: string;
  round: number;
  actor: string;
  content: string;
  model: string | null;
  usage: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Debate = {
  id: string;
  topic: string;
  status: string;
  next_round: number;
  next_actor: string;
  stop_reason?: string | null;
  last_error?: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) return "http://localhost:8000";
  return url.replace(/\/$/, "");
}

function labelForActor(actor: string): string {
  if (actor === "debater_a") return "Debater A";
  if (actor === "debater_b") return "Debater B";
  if (actor === "judge") return "Judge";
  return actor;
}

function renderVerdict(meta: Record<string, unknown>): {
  winner?: string;
  scoreA?: number;
  scoreB?: number;
  summary?: string;
  noNew?: boolean;
} {
  const winner = typeof meta.winner === "string" ? meta.winner : undefined;
  const scoreA = typeof meta.score_a === "number" ? meta.score_a : undefined;
  const scoreB = typeof meta.score_b === "number" ? meta.score_b : undefined;
  const summary = typeof meta.summary === "string" ? meta.summary : undefined;
  const noNew =
    typeof meta.no_new_substantive_arguments === "boolean"
      ? meta.no_new_substantive_arguments
      : undefined;
  return { winner, scoreA, scoreB, summary, noNew };
}

export default function DebateDetailClient({ debateId }: { debateId: string }) {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);

  const [debate, setDebate] = useState<Debate | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSeenTurnIdRef = useRef<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/debates/${debateId}`);
    if (!res.ok) {
      setError(`Load failed (${res.status})`);
      return;
    }
    const data = await res.json();
    setDebate(data.debate);
    setTurns(data.turns);
    lastSeenTurnIdRef.current = data.turns.length ? data.turns[data.turns.length - 1].id : null;
  }, [apiBaseUrl, debateId]);

  async function start(): Promise<void> {
    await fetch(`${apiBaseUrl}/debates/${debateId}/start`, { method: "POST" });
    await load();
  }

  async function resume(): Promise<void> {
    await fetch(`${apiBaseUrl}/debates/${debateId}/resume`, { method: "POST" });
    await load();
  }

  async function stop(): Promise<void> {
    await fetch(`${apiBaseUrl}/debates/${debateId}/stop`, { method: "POST" });
    await load();
  }

  useEffect(() => {
    setError(null);
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    eventSourceRef.current?.close();
    const after = lastSeenTurnIdRef.current;
    const url = after
      ? `${apiBaseUrl}/debates/${debateId}/events?after=${encodeURIComponent(after)}`
      : `${apiBaseUrl}/debates/${debateId}/events`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("turn", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as Turn;
      setTurns((current) => {
        if (current.some((t) => t.id === data.id)) return current;
        lastSeenTurnIdRef.current = data.id;
        return [...current, data].sort((a, b) => {
          const c = a.created_at.localeCompare(b.created_at);
          if (c !== 0) return c;
          return a.id.localeCompare(b.id);
        });
      });
    });

    es.onerror = () => {
      // Browser retries automatically.
    };

    return () => {
      es.close();
    };
  }, [apiBaseUrl, debateId]);

  useEffect(() => {
    const interval = setInterval(() => {
      load().catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [load]);

  const status = debate?.status ?? "loading";
  const canStart = status === "created";
  const canResume = status === "stopped" || status === "failed";
  const canStop = status === "running";

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="card" style={{ flex: 1, minWidth: 320 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ margin: 0 }}>Debate</h1>
          <Link className="button" href="/">
            Home
          </Link>
        </div>

        {error ? (
          <p style={{ color: "tomato" }}>
            <strong>Error:</strong> {error}
          </p>
        ) : null}

        {debate ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600 }}>{debate.topic}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {debate.id} · status={debate.status} · next={debate.next_actor}@{debate.next_round}
              {debate.stop_reason ? ` · stop=${debate.stop_reason}` : ""}
            </div>
            {debate.last_error ? (
              <div className="muted" style={{ fontSize: 12, marginTop: 8, color: "tomato" }}>
                last_error: {debate.last_error}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="muted">Loading…</p>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <button className="button" onClick={start} disabled={!canStart}>
            Start
          </button>
          <button className="button" onClick={resume} disabled={!canResume}>
            Resume
          </button>
          <button className="button" onClick={stop} disabled={!canStop}>
            Stop
          </button>
          <button className="button" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ flex: 2, minWidth: 320 }}>
        <h2 style={{ marginTop: 0 }}>Transcript</h2>
        {turns.length === 0 ? (
          <p className="muted">No turns yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {turns.map((t) => {
              const verdict = t.actor === "judge" ? renderVerdict(t.metadata) : null;
              return (
                <div key={t.id} className="card">
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                    Round {t.round} · {labelForActor(t.actor)}
                  </div>
                  {verdict && (verdict.winner || verdict.scoreA != null || verdict.scoreB != null) ? (
                    <div className="card" style={{ padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 600 }}>
                        Verdict:{" "}
                        {verdict.winner === "a"
                          ? "A"
                          : verdict.winner === "b"
                            ? "B"
                            : verdict.winner === "tie"
                              ? "Tie"
                              : "—"}
                      </div>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        Scores: A={verdict.scoreA ?? "—"}, B={verdict.scoreB ?? "—"}
                        {verdict.noNew === true ? " · no new substantive arguments" : ""}
                      </div>
                      {verdict.summary ? (
                        <div className="muted" style={{ marginTop: 8 }}>
                          {verdict.summary}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="turn">{t.content}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

