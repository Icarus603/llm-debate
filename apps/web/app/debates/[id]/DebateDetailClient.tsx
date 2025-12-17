"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Debate, Turn } from "@/lib/api";
import { fetchJson, getApiBaseUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function DebateDetailClient({ debateId }: { debateId: string }) {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const { language, t } = useI18n();

  const [debate, setDebate] = useState<Debate | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [followingLatest, setFollowingLatest] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastSeenTurnIdRef = useRef<string | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchJson<{ debate: Debate; turns: Turn[] }>(
        `${apiBaseUrl}/debates/${debateId}`,
      );
      setDebate(data.debate);
      setTurns(data.turns);
      lastSeenTurnIdRef.current = data.turns.length
        ? data.turns[data.turns.length - 1].id
        : null;
    } catch (e) {
      setError((e as Error).message || "Load failed");
    }
  }, [apiBaseUrl, debateId]);

  async function start(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/start`, {
        method: "POST",
        headers: { "X-UI-Language": language },
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Start failed");
    }
  }

  async function resume(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/resume`, {
        method: "POST",
        headers: { "X-UI-Language": language },
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Resume failed");
    }
  }

  async function stop(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/stop`, {
        method: "POST",
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Stop failed");
    }
  }

  async function cancel(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/cancel`, {
        method: "POST",
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Cancel failed");
    }
  }

  async function retry(): Promise<void> {
    try {
      await fetchJson(`${apiBaseUrl}/debates/${debateId}/retry`, {
        method: "POST",
        headers: { "X-UI-Language": language },
      });
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

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    transcriptEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  useEffect(() => {
    if (!followingLatest) return;
    scrollToLatest("auto");
  }, [followingLatest, scrollToLatest, turns.length]);

  const handleTranscriptScroll = useCallback(() => {
    const el = transcriptScrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceToBottom < 48;
    setFollowingLatest(atBottom);
  }, []);

  const status = debate?.status ?? "loading";
  const canStart = status === "created";
  const canResume = status === "stopped" || status === "failed";
  const canStop = status === "running";
  const canCancel =
    debate?.status != null &&
    !["completed", "failed", "canceled"].includes(debate.status);
  const canRetry = status === "failed";

  const actorPrefix = useCallback(
    (actor: string): string => {
      if (actor === "debater_a") return "A";
      if (actor === "debater_b") return "B";
      if (actor === "judge") return t("judge");
      return actor;
    },
    [t],
  );

  return (
    <>
      <Card className="flex min-h-0 flex-col">
        <CardHeader className="h-[120px] space-y-2 pb-3">
          <div className="flex h-8 items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-xl leading-none">
                {debate?.topic ?? t("debateTitle")}
              </CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/">{t("home")}</Link>
            </Button>
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => start().catch(() => {})}
              disabled={!canStart}
            >
              {t("start")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => stop().catch(() => {})}
              disabled={!canStop}
            >
              {t("stop")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => resume().catch(() => {})}
              disabled={!canResume}
            >
              {t("resume")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => load().catch(() => {})}
            >
              {t("refresh")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancel().catch(() => {})}
              disabled={!canCancel}
            >
              {t("cancel")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => retry().catch(() => {})}
              disabled={!canRetry}
            >
              {t("retry")}
            </Button>
          </div>
          {debate?.last_error ? (
            <div className="pt-2 text-sm text-destructive">
              {debate.last_error}
            </div>
          ) : null}
          {error ? (
            <div className="pt-2 text-sm text-destructive">{error}</div>
          ) : null}
        </CardHeader>
        <Separator />
        <CardContent
          ref={transcriptScrollRef}
          onScroll={handleTranscriptScroll}
          className="scrollbar-none min-h-0 flex-1 overflow-auto pt-4"
        >
          {turns.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t("noTurnsYet")}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(() => {
                const out: ReactNode[] = [];
                let lastRound: number | null = null;
                for (const turn of turns) {
                  if (lastRound !== turn.round) {
                    lastRound = turn.round;
                    out.push(
                      <div
                        key={`round-${turn.round}`}
                        className="pt-1 text-base font-medium text-muted-foreground"
                      >
                        {t("roundLabel", { n: turn.round })}
                      </div>,
                    );
                  }

                  out.push(
                    <div key={turn.id} className="flex items-baseline gap-3">
                      <div className="w-10 shrink-0 text-base font-semibold leading-7 text-foreground">
                        {actorPrefix(turn.actor)}
                      </div>
                      <div className="min-w-0 flex-1 whitespace-pre-wrap text-base leading-7 text-foreground">
                        {turn.content}
                      </div>
                    </div>,
                  );
                }
                return out;
              })()}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
