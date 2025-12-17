"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Debate } from "@/lib/api";
import { fetchJson, getApiBaseUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const apiBaseUrl = useMemo(getApiBaseUrl, []);
  const router = useRouter();
  const { language, t } = useI18n();
  const [topic, setTopic] = useState("");
  const [stance, setStance] = useState<"pro" | "con">("pro");
  const [modelDebater, setModelDebater] = useState("");
  const [modelJudge, setModelJudge] = useState("");
  const [maxRounds, setMaxRounds] = useState<string>("");
  const [maxRuntimeSeconds, setMaxRuntimeSeconds] = useState<string>("");
  const [maxTotalOutputTokens, setMaxTotalOutputTokens] = useState<string>("");
  const [maxTokensDebater, setMaxTokensDebater] = useState<string>("");
  const [maxTokensJudge, setMaxTokensJudge] = useState<string>("");

  function buildAdvancedSettings(): Record<string, unknown> {
    const settings: Record<string, unknown> = {};
    if (modelDebater.trim()) settings.model_debater = modelDebater.trim();
    if (modelJudge.trim()) settings.model_judge = modelJudge.trim();
    if (maxRounds.trim()) settings.max_rounds = Number(maxRounds);
    if (maxRuntimeSeconds.trim())
      settings.max_runtime_seconds = Number(maxRuntimeSeconds);
    if (maxTotalOutputTokens.trim())
      settings.max_total_output_tokens = Number(maxTotalOutputTokens);
    if (maxTokensDebater.trim())
      settings.max_tokens_debater = Number(maxTokensDebater);
    if (maxTokensJudge.trim())
      settings.max_tokens_judge = Number(maxTokensJudge);
    return settings;
  }

  async function createDebate(): Promise<void> {
    const trimmed = topic.trim();
    if (!trimmed) return;

    const settings: Record<string, unknown> = {
      ...buildAdvancedSettings(),
      debater_a_side: stance,
      output_language: language,
    };

    try {
      const created = await fetchJson<Debate>(`${apiBaseUrl}/debates`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: trimmed, settings }),
      });
      router.push(`/debates/${created.id}`);
    } catch (e) {
      toast.error((e as Error).message || t("createFailed"));
    }
  }

  return (
    <Card className="flex min-h-0 flex-col">
      <CardHeader className="h-[120px] flex flex-col justify-between pb-3">
        <div className="flex h-8 items-center justify-between gap-3">
          <CardTitle className="truncate text-xl leading-none">
            {t("appName")}
          </CardTitle>
          <div className="h-8 w-0 shrink-0" />
        </div>
        <div className="h-0" />
      </CardHeader>

      <CardContent className="scrollbar-none min-h-0 flex-1 overflow-auto space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">{t("topic")}</div>
          <Input
            placeholder={t("topicPlaceholder")}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">{t("stance")}</div>
          <Select
            value={stance}
            onValueChange={(v) => setStance(v as "pro" | "con")}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("debaterAStancePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pro">{t("debaterAPro")}</SelectItem>
              <SelectItem value="con">{t("debaterACon")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="advanced">
            <AccordionTrigger>{t("advanced")}</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t("modelDebaters")}
                  </div>
                  <Input
                    placeholder={t("modelOverridePlaceholder")}
                    value={modelDebater}
                    onChange={(e) => setModelDebater(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">{t("modelJudge")}</div>
                  <Input
                    placeholder={t("modelOverridePlaceholder")}
                    value={modelJudge}
                    onChange={(e) => setModelJudge(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t("maxRoundsLabel")}
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder="5"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t("maxRuntimeSecondsLabel")}
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder="600"
                    value={maxRuntimeSeconds}
                    onChange={(e) => setMaxRuntimeSeconds(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t("maxTotalOutputTokensLabel")}
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder="8000"
                    value={maxTotalOutputTokens}
                    onChange={(e) => setMaxTotalOutputTokens(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t("maxTokensDebaterLabel")}
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder="600"
                    value={maxTokensDebater}
                    onChange={(e) => setMaxTokensDebater(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-medium">
                    {t("maxTokensJudgeLabel")}
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder="400"
                    value={maxTokensJudge}
                    onChange={(e) => setMaxTokensJudge(e.target.value)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      <CardFooter className="flex items-center justify-end pt-3">
        <Button
          onClick={() => createDebate().catch(() => {})}
          disabled={!topic.trim()}
        >
          {t("newDebate")}
        </Button>
      </CardFooter>
    </Card>
  );
}
