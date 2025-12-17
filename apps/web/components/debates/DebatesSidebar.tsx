"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { DebateListItem } from "@/lib/api";
import { fetchJson, getApiBaseUrl } from "@/lib/api";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "running") return "default";
  if (status === "failed") return "destructive";
  if (status === "canceled") return "secondary";
  if (status === "completed") return "secondary";
  return "outline";
}

export function DebatesSidebar({
  activeDebateId,
  onDebateCreated,
}: {
  activeDebateId?: string;
  onDebateCreated?: (debateId: string) => void;
}) {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const [debates, setDebates] = useState<DebateListItem[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const items = await fetchJson<DebateListItem[]>(`${apiBaseUrl}/debates?limit=50`);
      setDebates(items);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return debates;
    return debates.filter((d) => d.topic.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
  }, [debates, filter]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Debates</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refresh().catch(() => {})} disabled={loading}>
            Refresh
          </Button>
        </div>
        <div className="pt-2">
          <Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="min-h-0 flex-1 overflow-auto pt-4">
        {debates.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No debates yet. Create one to see it here.
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => refresh().catch(() => {})}>
                Load debates
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No matches.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((d) => {
              const active = d.id === activeDebateId;
              return (
                <Link
                  key={d.id}
                  href={`/debates/${d.id}`}
                  className={[
                    "rounded-lg border px-3 py-2 text-sm",
                    "text-foreground no-underline",
                    active ? "border-primary bg-white" : "border-border bg-card hover:bg-muted",
                  ].join(" ")}
                  onClick={() => onDebateCreated?.(d.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.topic}</div>
                      <div className="pt-1 text-xs text-muted-foreground">rounds={d.completed_rounds}</div>
                    </div>
                    <Badge variant={statusVariant(d.status)} className="shrink-0">
                      {d.status}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
