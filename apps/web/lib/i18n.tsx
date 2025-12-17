"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "zh-Hant" | "zh-Hans" | "en";

const STORAGE_KEY = "llm-debate:language";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (
    key: keyof typeof messages,
    vars?: Record<string, string | number>,
  ) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const messages = {
  appName: {
    "zh-Hant": "LLM 辯論",
    "zh-Hans": "LLM 辩论",
    en: "llm-debate",
  },
  homeSubtitle: {
    "zh-Hant": "兩位辯手輪流辯論；裁判在最後給出一次最終裁決。",
    "zh-Hans": "两位辩手轮流辩论；裁判在最后给出一次最终裁决。",
    en: "Two debaters debate turn-by-turn; a judge produces one final verdict at the end.",
  },
  debates: {
    "zh-Hant": "辯論",
    "zh-Hans": "辩论",
    en: "Debates",
  },
  debateTitle: {
    "zh-Hant": "辯論",
    "zh-Hans": "辩论",
    en: "Debate",
  },
  judge: {
    "zh-Hant": "裁判",
    "zh-Hans": "裁判",
    en: "Judge",
  },
  refresh: {
    "zh-Hant": "刷新",
    "zh-Hans": "刷新",
    en: "Refresh",
  },
  searchPlaceholder: {
    "zh-Hant": "搜尋…",
    "zh-Hans": "搜索…",
    en: "Search…",
  },
  noDebatesYet: {
    "zh-Hant": "暫無辯論。建立一個辯論後會在這裡顯示。",
    "zh-Hans": "暂无辩论。创建一个辩论后会在这里显示。",
    en: "No debates yet. Create one to see it here.",
  },
  loadDebates: {
    "zh-Hant": "載入辯論",
    "zh-Hans": "加载辩论",
    en: "Load debates",
  },
  loading: {
    "zh-Hant": "載入中…",
    "zh-Hans": "加载中…",
    en: "Loading…",
  },
  delete: {
    "zh-Hant": "刪除",
    "zh-Hans": "删除",
    en: "Delete",
  },
  deleteConfirm: {
    "zh-Hant": "刪除此辯論？此操作無法復原。",
    "zh-Hans": "删除此辩论？此操作无法撤销。",
    en: "Delete this debate? This cannot be undone.",
  },
  deleteFailed: {
    "zh-Hant": "刪除失敗",
    "zh-Hans": "删除失败",
    en: "Delete failed",
  },
  noMatches: {
    "zh-Hant": "沒有符合的結果。",
    "zh-Hans": "没有匹配结果。",
    en: "No matches.",
  },
  home: {
    "zh-Hant": "首頁",
    "zh-Hans": "首页",
    en: "Home",
  },
  controls: {
    "zh-Hant": "控制",
    "zh-Hans": "控制",
    en: "Controls",
  },
  start: {
    "zh-Hant": "開始",
    "zh-Hans": "开始",
    en: "Start",
  },
  stop: {
    "zh-Hant": "停止",
    "zh-Hans": "停止",
    en: "Stop",
  },
  resume: {
    "zh-Hant": "繼續",
    "zh-Hans": "继续",
    en: "Resume",
  },
  cancel: {
    "zh-Hant": "取消",
    "zh-Hans": "取消",
    en: "Cancel",
  },
  retry: {
    "zh-Hant": "重試",
    "zh-Hans": "重试",
    en: "Retry",
  },
  topic: {
    "zh-Hant": "主題",
    "zh-Hans": "主题",
    en: "Topic",
  },
  topicPlaceholder: {
    "zh-Hant": "輸入辯論主題…",
    "zh-Hans": "输入辩论主题…",
    en: "Enter a debate topic…",
  },
  stance: {
    "zh-Hant": "立場",
    "zh-Hans": "立场",
    en: "Stance",
  },
  debaterAPro: {
    "zh-Hant": "辯手 A：支持",
    "zh-Hans": "辩手 A：支持",
    en: "Debater A: Pro",
  },
  debaterACon: {
    "zh-Hant": "辯手 A：反對",
    "zh-Hans": "辩手 A：反对",
    en: "Debater A: Con",
  },
  advanced: {
    "zh-Hant": "進階",
    "zh-Hans": "高级",
    en: "Advanced",
  },
  advancedSettings: {
    "zh-Hant": "進階設定",
    "zh-Hans": "高级设置",
    en: "Advanced settings",
  },
  newDebate: {
    "zh-Hant": "新辯論",
    "zh-Hans": "新辩论",
    en: "New debate",
  },
  debaterAStancePlaceholder: {
    "zh-Hant": "辯手 A 立場",
    "zh-Hans": "辩手 A 立场",
    en: "Debater A stance",
  },
  modelDebaters: {
    "zh-Hant": "模型（辯手）",
    "zh-Hans": "模型（辩手）",
    en: "Model (Debaters)",
  },
  modelJudge: {
    "zh-Hant": "模型（裁判）",
    "zh-Hans": "模型（裁判）",
    en: "Model (Judge)",
  },
  modelOverridePlaceholder: {
    "zh-Hant": "覆寫模型 ID…",
    "zh-Hans": "覆盖模型 ID…",
    en: "Override model id…",
  },
  maxRoundsLabel: {
    "zh-Hant": "最多回合數",
    "zh-Hans": "最多回合数",
    en: "Max rounds",
  },
  maxRuntimeSecondsLabel: {
    "zh-Hant": "最長運行秒數",
    "zh-Hans": "最长运行秒数",
    en: "Max runtime (seconds)",
  },
  maxTotalOutputTokensLabel: {
    "zh-Hant": "總輸出 Token 上限",
    "zh-Hans": "总输出 Token 上限",
    en: "Max total output tokens",
  },
  maxTokensDebaterLabel: {
    "zh-Hant": "辯手 Token 上限",
    "zh-Hans": "辩手 Token 上限",
    en: "Max tokens (debater)",
  },
  maxTokensJudgeLabel: {
    "zh-Hant": "裁判 Token 上限",
    "zh-Hans": "裁判 Token 上限",
    en: "Max tokens (judge)",
  },
  roundLabel: {
    "zh-Hant": "回合 {n}",
    "zh-Hans": "回合 {n}",
    en: "Round {n}",
  },
  noTurnsYet: {
    "zh-Hant": "尚無內容。",
    "zh-Hans": "暂无内容。",
    en: "No turns yet.",
  },
  createFailed: {
    "zh-Hant": "建立失敗",
    "zh-Hans": "创建失败",
    en: "Create failed",
  },
  language: {
    "zh-Hant": "語言",
    "zh-Hans": "语言",
    en: "Language",
  },
  languageZhHant: {
    "zh-Hant": "繁體中文",
    "zh-Hans": "繁体中文",
    en: "Traditional Chinese",
  },
  languageZhHans: {
    "zh-Hant": "簡體中文",
    "zh-Hans": "简体中文",
    en: "Simplified Chinese",
  },
  languageEn: {
    "zh-Hant": "英文",
    "zh-Hans": "英文",
    en: "English",
  },
} as const;

function interpolate(
  template: string,
  vars: Record<string, string | number> | undefined,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`),
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh-Hant");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === "zh-Hant" || stored === "zh-Hans" || stored === "en")
      setLanguageState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    document.title = messages.appName[language];
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const t = useCallback(
    (key: keyof typeof messages, vars?: Record<string, string | number>) => {
      const raw = messages[key][language];
      return interpolate(raw, vars);
    },
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
