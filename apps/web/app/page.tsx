"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DebatesSidebar } from "@/components/debates/DebatesSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Debate } from "@/lib/api";
import { fetchJson, getApiBaseUrl } from "@/lib/api";

export default function HomePage() {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [stance, setStance] = useState<"pro" | "con">("pro");
  const [modelDebater, setModelDebater] = useState("");
  const [modelJudge, setModelJudge] = useState("");
  const [maxRounds, setMaxRounds] = useState<string>("");
  const [maxRuntimeSeconds, setMaxRuntimeSeconds] = useState<string>("");
  const [maxTotalOutputTokens, setMaxTotalOutputTokens] = useState<string>("");
  const [maxTokensDebater, setMaxTokensDebater] = useState<string>("");
  const [maxTokensJudge, setMaxTokensJudge] = useState<string>("");

  async function createDebate(): Promise<void> {
    const trimmed = topic.trim();
    if (!trimmed) return;

    const settings: Record<string, unknown> = { debater_a_side: stance };
    if (modelDebater.trim()) settings.model_debater = modelDebater.trim();
    if (modelJudge.trim()) settings.model_judge = modelJudge.trim();
    if (maxRounds.trim()) settings.max_rounds = Number(maxRounds);
    if (maxRuntimeSeconds.trim()) settings.max_runtime_seconds = Number(maxRuntimeSeconds);
    if (maxTotalOutputTokens.trim()) settings.max_total_output_tokens = Number(maxTotalOutputTokens);
    if (maxTokensDebater.trim()) settings.max_tokens_debater = Number(maxTokensDebater);
    if (maxTokensJudge.trim()) settings.max_tokens_judge = Number(maxTokensJudge);

    try {
      const created = await fetchJson<Debate>(`${apiBaseUrl}/debates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: trimmed, settings }),
      });
      router.push(`/debates/${created.id}`);
    } catch (e) {
      toast.error((e as Error).message || "Create failed");
    }
  }

  return (
    <div className="grid flex-1 min-h-0 gap-4 lg:grid-cols-[280px_1fr_320px]">
      <DebatesSidebar />

      <Card className="min-h-0">
        <CardHeader>
          <CardTitle>llm-debate</CardTitle>
          <CardDescription>
            Two debaters debate turn-by-turn; a judge produces one final verdict at the end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Topic</div>
            <Input placeholder="Enter a debate topic…" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Stance</div>
            <Select value={stance} onValueChange={(v) => setStance(v as "pro" | "con")}>
              <SelectTrigger>
                <SelectValue placeholder="Debater A stance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pro">Debater A: Pro</SelectItem>
                <SelectItem value="con">Debater A: Con</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">Model (Debaters)</div>
                    <Input placeholder="Override model id…" value={modelDebater} onChange={(e) => setModelDebater(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">Model (Judge)</div>
                    <Input placeholder="Override model id…" value={modelJudge} onChange={(e) => setModelJudge(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">max_rounds</div>
                    <Input inputMode="numeric" placeholder="5" value={maxRounds} onChange={(e) => setMaxRounds(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">max_runtime_seconds</div>
                    <Input inputMode="numeric" placeholder="600" value={maxRuntimeSeconds} onChange={(e) => setMaxRuntimeSeconds(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">max_total_output_tokens</div>
                    <Input inputMode="numeric" placeholder="8000" value={maxTotalOutputTokens} onChange={(e) => setMaxTotalOutputTokens(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">max_tokens_debater</div>
                    <Input inputMode="numeric" placeholder="600" value={maxTokensDebater} onChange={(e) => setMaxTokensDebater(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-sm font-medium">max_tokens_judge</div>
                    <Input inputMode="numeric" placeholder="400" value={maxTokensJudge} onChange={(e) => setMaxTokensJudge(e.target.value)} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => createDebate().catch(() => {})} disabled={!topic.trim()}>
              New debate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-0">
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>Docker-first. Live updates via SSE. Advanced settings are optional.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div>Default limits: max_rounds=5, max_runtime_seconds=600, max_total_output_tokens=8000.</div>
          <div>Debater A stance is chosen here; Debater B takes the opposite stance automatically.</div>
        </CardContent>
      </Card>
    </div>
  );
}
