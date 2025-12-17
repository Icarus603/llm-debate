"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { DebateListItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { deleteDebate, fetchJson, getApiBaseUrl } from "@/lib/api";

export function DebatesSidebar({
  activeDebateId,
  onDebateCreated,
}: {
      activeDebateId?: string;
      onDebateCreated?: (debateId: string) => void;
    }) {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [debates, setDebates] = useState<DebateListItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const derivedActiveId = useMemo(() => {
    if (activeDebateId) return activeDebateId;
    const match = /^\/debates\/([^/]+)$/.exec(pathname);
    return match?.[1];
  }, [activeDebateId, pathname]);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const items = await fetchJson<DebateListItem[]>(
        `${apiBaseUrl}/debates?limit=50`,
      );
      setDebates(items);
      setLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const remove = useCallback(
    async (debateId: string): Promise<void> => {
      const ok = window.confirm(t("deleteConfirm"));
      if (!ok) return;
      try {
        await deleteDebate(apiBaseUrl, debateId);
        setDebates((current) => current.filter((d) => d.id !== debateId));
        if (derivedActiveId === debateId) router.push("/");
      } catch (e) {
        toast.error((e as Error).message || t("deleteFailed"));
      }
    },
    [apiBaseUrl, derivedActiveId, router, t],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return debates;
    return debates.filter(
      (d) =>
        d.topic.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
    );
  }, [debates, filter]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refresh().catch(() => {});
    }, 10000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="h-[120px] space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3 flex-nowrap">
          <CardTitle className="min-w-0 flex-1 truncate whitespace-nowrap text-xl leading-none">
            {t("debates")}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh().catch(() => {})}
              disabled={loading}
            >
              {t("refresh")}
            </Button>
          </div>
        </div>
        <Input
          className="h-8 mt-2"
          placeholder={t("searchPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </CardHeader>
      <Separator />
      <CardContent className="scrollbar-none min-h-0 flex-1 overflow-auto pt-4">
        {!loadedOnce ? (
          <div className="text-sm text-muted-foreground">{t("loading")}</div>
        ) : debates.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("noDebatesYet")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">{t("noMatches")}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((d) => {
              const active = d.id === derivedActiveId;
              return (
                <div
                  key={d.id}
                  className={[
                    "flex h-8 items-center rounded-md border px-3 text-sm",
                    "text-foreground",
                    active
                      ? "border-border bg-white"
                      : "border-border bg-card hover:bg-muted",
                  ].join(" ")}
                >
                  <Link
                    href={`/debates/${d.id}`}
                    className="min-w-0 flex-1 truncate no-underline text-sm font-medium leading-none"
                    onClick={() => onDebateCreated?.(d.id)}
                  >
                    {d.topic}
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-foreground opacity-60 hover:opacity-100"
                    onClick={() => remove(d.id).catch(() => {})}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
