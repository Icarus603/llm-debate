"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n, type Language } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  const compactLabel =
    language === "zh-Hant" ? "繁中" : language === "zh-Hans" ? "简中" : "EN";

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
      <SelectTrigger className="h-8 w-[88px] px-2">
        <span className="text-sm">{compactLabel}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="zh-Hant">{t("languageZhHant")}</SelectItem>
        <SelectItem value="zh-Hans">{t("languageZhHans")}</SelectItem>
        <SelectItem value="en">{t("languageEn")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
