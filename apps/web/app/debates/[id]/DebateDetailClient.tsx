"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { DebatesSidebar } from "@/components/debates/DebatesSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Debate, Turn } from "@/lib/api";
import { fetchJson, getApiBaseUrl } from "@/lib/api";

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
  const [connection, setConnection] = useState<"connecting" | "connected" | "reconnecting">(
    "connecting"
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSeenTurnIdRef = useRef<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchJson<{ debate: Debate; turns: Turn[] }>(`${apiBaseUrl}/debates/${debateId}`);
      setDebate(data.debate);
      setTurns(data.turns);
      lastSeenTurnIdRef.current = data.turns.length ? data.turns[data.turns.length - 1].id : null;
    } catch (e) {
      setError((e as Error).message || "Load failed");
    }
  }, [apiBaseUrl, debateId]);

  async function start(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/start`, { method: "POST" });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Start failed");
    }
  }

  async function resume(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/resume`, { method: "POST" });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Resume failed");
    }
  }

  async function stop(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/stop`, { method: "POST" });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Stop failed");
    }
  }

  async function cancel(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/cancel`, { method: "POST" });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Cancel failed");
    }
  }

  async function retry(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/retry`, { method: "POST" });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Retry failed");
    }
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
    setConnection("connecting");

    es.onopen = () => {
      setConnection("connected");
    };

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
      setConnection("reconnecting");
    };

    return () => {
      es.close();
    };
  }, [apiBaseUrl, debateId]);

  useEffect(() => {
    if (debate?.status !== "running" && debate?.status !== "stopping") return;
    const interval = setInterval(() => {
      load().catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [debate?.status, load]);

  const status = debate?.status ?? "loading";
  const canStart = status === "created";
  const canResume = status === "stopped" || status === "failed";
  const canStop = status === "running";
  const canCancel = debate?.status != null && !["completed", "failed", "canceled"].includes(debate.status);
  const canRetry = status === "failed";

  const debaterASide =
    debate?.settings && typeof debate.settings.debater_a_side === "string"
      ? (debate.settings.debater_a_side as string)
      : null;

  const debaterALabel =
    debaterASide === "pro" ? "Debater A (Pro)" : debaterASide === "con" ? "Debater A (Con)" : "Debater A";
  const debaterBLabel =
    debaterASide === "pro" ? "Debater B (Con)" : debaterASide === "con" ? "Debater B (Pro)" : "Debater B";

  const latestJudgeTurn = [...turns].reverse().find((t) => t.actor === "judge") ?? null;
  const verdict = latestJudgeTurn ? renderVerdict(latestJudgeTurn.metadata) : null;

  return (
    <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[280px_1fr_320px]">
      <DebatesSidebar activeDebateId={debateId} />

      <Card className="flex min-h-0 flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">{debate?.topic ?? "Debate"}</CardTitle>
              <CardDescription className="pt-1">
                <span className="font-mono text-xs">{debateId}</span>
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/">Home</Link>
            </Button>
          </div>
          <div className="pt-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge
                variant={
                  status === "running"
                    ? "default"
                    : status === "failed"
                      ? "destructive"
                      : status === "completed" || status === "canceled"
                        ? "secondary"
                        : "outline"
                }
              >
                {status}
              </Badge>
              <Badge variant="outline">
                {connection === "connected" ? "SSE: connected" : connection === "reconnecting" ? "SSE: reconnecting" : "SSE: connecting"}
              </Badge>
              {debate ? (
                <span className="text-muted-foreground">
                  next={debate.next_actor}@{debate.next_round}
                  {debate.stop_reason ? ` · stop=${debate.stop_reason}` : ""}
                </span>
              ) : null}
            </div>
            {debate?.last_error ? (
              <div className="pt-2 text-sm text-destructive">last_error: {debate.last_error}</div>
            ) : null}
            {error ? <div className="pt-2 text-sm text-destructive">{error}</div> : null}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="min-h-0 flex-1 overflow-auto pt-4">
          {verdict && (verdict.winner || verdict.scoreA != null || verdict.scoreB != null) ? (
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
              <div className="text-sm font-semibold">
                Final verdict:{" "}
                {verdict.winner === "a"
                  ? "A"
                  : verdict.winner === "b"
                    ? "B"
                    : verdict.winner === "tie"
                      ? "Tie"
                      : "—"}
              </div>
              <div className="pt-1 text-xs text-muted-foreground">
                Scores: A={verdict.scoreA ?? "—"}, B={verdict.scoreB ?? "—"}
                {verdict.noNew === true ? " · no new substantive arguments" : ""}
              </div>
              {verdict.summary ? <div className="pt-2 text-sm text-muted-foreground">{verdict.summary}</div> : null}
            </div>
          ) : null}

          {turns.length === 0 ? (
            <div className="text-sm text-muted-foreground">No turns yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {turns.map((t) => {
                const actorLabel =
                  t.actor === "debater_a" ? debaterALabel : t.actor === "debater_b" ? debaterBLabel : labelForActor(t.actor);
                const border =
                  t.actor === "debater_a"
                    ? "border-l-primary"
                    : t.actor === "debater_b"
                      ? "border-l-border"
                      : "border-l-border";
                const bg =
                  t.actor === "debater_a"
                    ? "bg-white"
                    : t.actor === "debater_b"
                      ? "bg-white"
                      : "bg-muted";

                return (
                  <div key={t.id} className={`rounded-xl border border-border border-l-4 ${border} ${bg} p-4`}>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div>
                        Round {t.round} · <span className="font-medium text-foreground">{actorLabel}</span>
                      </div>
                      <div className="font-mono">{new Date(t.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div className="pt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{t.content}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex h-full min-h-0 flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Controls</CardTitle>
          <CardDescription>
            {debaterALabel} vs {debaterBLabel}. Judge runs once at the end.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="min-h-0 flex-1 space-y-3 overflow-auto pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => start().catch(() => {})} disabled={!canStart}>
              Start
            </Button>
            <Button variant="outline" onClick={() => stop().catch(() => {})} disabled={!canStop}>
              Stop
            </Button>
            <Button variant="outline" onClick={() => resume().catch(() => {})} disabled={!canResume}>
              Resume
            </Button>
            <Button variant="outline" onClick={() => load().catch(() => {})}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" onClick={() => cancel().catch(() => {})} disabled={!canCancel}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => retry().catch(() => {})} disabled={!canRetry}>
              Retry
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {debate ? (
              <div>
                status={debate.status} · next={debate.next_actor}@{debate.next_round}
              </div>
            ) : (
              <div>Loading status…</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
