import { env } from "@/lib/env";
import { GeminiProvider } from "./gemini";
import { MockProvider } from "./mock";
import type { TryOnProvider } from "./provider";

export * from "./provider";

let cached: TryOnProvider | null = null;

export function getTryOnProvider(): TryOnProvider {
  if (!cached) cached = env.ai.provider === "gemini" ? new GeminiProvider() : new MockProvider();
  return cached;
}
