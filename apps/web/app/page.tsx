"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Turn = {
  id: string;
  debate_id: string;
  round: number;
  actor: string;
  content: string;
  model: string | null;
  created_at: string;
};

type Debate = {
  id: string;
  topic: string;
  status: string;
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

export default function HomePage() {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const [topic, setTopic] = useState("");
  const [debate, setDebate] = useState<Debate | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  async function createDebate(): Promise<void> {
    setError(null);
    const res = await fetch(`${apiBaseUrl}/debates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      setError(`Create failed (${res.status})`);
      return;
    }
    const created: Debate = await res.json();
    setDebate(created);
    setTurns([]);
  }

  async function refreshDebate(debateId: string): Promise<void> {
    const res = await fetch(`${apiBaseUrl}/debates/${debateId}`);
    if (!res.ok) return;
    const data = await res.json();
    setDebate(data.debate);
    setTurns(data.turns);
  }

  async function start(): Promise<void> {
    if (!debate) return;
    await fetch(`${apiBaseUrl}/debates/${debate.id}/start`, { method: "POST" });
    await refreshDebate(debate.id);
  }

  async function resume(): Promise<void> {
    if (!debate) return;
    await fetch(`${apiBaseUrl}/debates/${debate.id}/resume`, { method: "POST" });
    await refreshDebate(debate.id);
  }

  async function stop(): Promise<void> {
    if (!debate) return;
    await fetch(`${apiBaseUrl}/debates/${debate.id}/stop`, { method: "POST" });
    await refreshDebate(debate.id);
  }

  useEffect(() => {
    if (!debate) return;

    refreshDebate(debate.id).catch(() => {});

    eventSourceRef.current?.close();
    const es = new EventSource(`${apiBaseUrl}/debates/${debate.id}/events`);
    eventSourceRef.current = es;

    es.addEventListener("turn", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as Turn;
      setTurns((current) => {
        if (current.some((t) => t.id === data.id)) return current;
        return [...current, data].sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    });

    es.onerror = () => {
      // Browser will retry by default; keep UI quiet for now.
    };

    return () => {
      es.close();
    };
  }, [apiBaseUrl, debate]);

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="card" style={{ flex: 2, minWidth: 320 }}>
        <h1 style={{ marginTop: 0 }}>llm-debate</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Two debaters and a judge. Live updates via SSE.
        </p>

        <div className="row" style={{ alignItems: "center" }}>
          <input
            className="input"
            placeholder="Enter a debate topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button className="button primary" onClick={createDebate} disabled={!topic.trim()}>
            New debate
          </button>
        </div>

        {error ? (
          <p style={{ color: "tomato" }}>
            <strong>Error:</strong> {error}
          </p>
        ) : null}

        {debate ? (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="muted">Debate</div>
                <div style={{ fontWeight: 600 }}>{debate.topic}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {debate.id} · status={debate.status}
                </div>
              </div>
              <div className="row">
                <button className="button" onClick={start}>
                  Start
                </button>
                <button className="button" onClick={resume}>
                  Resume
                </button>
                <button className="button" onClick={stop}>
                  Stop
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card" style={{ flex: 3, minWidth: 320 }}>
        <h2 style={{ marginTop: 0 }}>Transcript</h2>
        {turns.length === 0 ? (
          <p className="muted">No turns yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {turns.map((t) => (
              <div key={t.id} className="card">
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                  Round {t.round} · {labelForActor(t.actor)}
                </div>
                <div className="turn">{t.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

