"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

type DebateListItem = {
  id: string;
  topic: string;
  status: string;
  next_round: number;
  next_actor: string;
  stop_reason?: string | null;
  last_error?: string | null;
  completed_rounds: number;
  created_at: string;
  updated_at: string;
};

function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) return "http://localhost:8000";
  return url.replace(/\/$/, "");
}

export default function HomePage() {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [stance, setStance] = useState<"pro" | "con">("pro");
  const [debates, setDebates] = useState<DebateListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshDebatesList = useCallback(async (): Promise<void> => {
    const res = await fetch(`${apiBaseUrl}/debates?limit=50`);
    if (!res.ok) return;
    const items: DebateListItem[] = await res.json();
    setDebates(items);
  }, [apiBaseUrl]);

  async function createDebate(): Promise<void> {
    setError(null);
    const res = await fetch(`${apiBaseUrl}/debates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ topic, settings: { debater_a_side: stance } }),
    });
    if (!res.ok) {
      setError(`Create failed (${res.status})`);
      return;
    }
    const created: Debate = await res.json();
    await refreshDebatesList();
    router.push(`/debates/${created.id}`);
  }

  useEffect(() => {
    refreshDebatesList().catch(() => {});
  }, [refreshDebatesList]);

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="card" style={{ flex: 1, minWidth: 320 }}>
        <h1 style={{ marginTop: 0 }}>llm-debate</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Two debaters debate round-by-round; a judge gives a final verdict. Live updates via SSE.
        </p>

        <div className="row" style={{ alignItems: "center" }}>
          <input
            className="input"
            placeholder="Enter a debate topic..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <select
            className="input"
            style={{ minWidth: 180, flex: "0 0 auto" }}
            value={stance}
            onChange={(e) => setStance(e.target.value as "pro" | "con")}
          >
            <option value="pro">Debater A: Pro</option>
            <option value="con">Debater A: Con</option>
          </select>
          <button className="button primary" onClick={createDebate} disabled={!topic.trim()}>
            New debate
          </button>
        </div>

        {error ? (
          <p style={{ color: "tomato" }}>
            <strong>Error:</strong> {error}
          </p>
        ) : null}

        <div className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Debates</h2>
            <button className="button" onClick={refreshDebatesList}>
              Refresh
            </button>
          </div>

          {debates.length === 0 ? (
            <p className="muted">No debates yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {debates.map((d) => (
                <Link
                  key={d.id}
                  className="button"
                  href={`/debates/${d.id}`}
                  style={{ justifyContent: "space-between", textAlign: "left" }}
                >
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{d.topic}</span>
                  <span className="muted" style={{ marginLeft: 12, fontSize: 12 }}>
                    {d.status} · rounds={d.completed_rounds}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
