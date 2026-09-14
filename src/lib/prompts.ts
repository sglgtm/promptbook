import type { SupabaseClient } from "@supabase/supabase-js";

export type Prompt = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  variables: unknown;
  tags: string[];
  model: "sonar" | "sonar-pro";
  created_at: string;
  updated_at: string;
};

export type PromptRunStatus = "pending" | "ok" | "error";

// Разбор поля tags из формы: "seo, ai, копирайт" -> ["seo","ai","копирайт"]
export function parseTags(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

// Извлекает переменные вида {{name}} из тела промпта.
export function extractVariables(body: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) set.add(m[1]);
  return Array.from(set);
}

// Подставляет значения в тело: {{name}} -> value; пропуски заменяются на пустую строку.
export function assemble(body: string, values: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, (_m, name) => values[name] ?? "");
}

export async function fetchPromptsList(supabase: SupabaseClient) {
  return supabase
    .from("prompts")
    .select("id,title,tags,model,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);
}

export async function fetchPrompt(supabase: SupabaseClient, id: string) {
  return supabase.from("prompts").select("*").eq("id", id).single();
}
