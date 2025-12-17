export type Debate = {
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

export type DebateListItem = {
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

export type Turn = {
  id: string;
  debate_id: string;
  round: number;
  actor: string;
  content: string;
  model: string | null;
  usage: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DebateDetailResponse = {
  debate: Debate;
  turns: Turn[];
};

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) return "http://localhost:8000";
  return url.replace(/\/$/, "");
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

