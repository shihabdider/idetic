import type { ConnectionStatus } from "../core/types";
import { OPENAI_CODEX_CREDENTIALS } from "../private/openai-creds.generated";

export interface OpenAICodexCredentials {
  access: string;
  refresh: string;
  expires: number;
  accountId: string;
}

export function openAICredentialStatus(): ConnectionStatus {
  if (OPENAI_CODEX_CREDENTIALS === undefined) {
    return { kind: "disconnected", label: "ai", detail: "no exported OpenAI/Codex credentials" };
  }

  if (Date.now() >= OPENAI_CODEX_CREDENTIALS.expires) {
    return { kind: "error", label: "ai", detail: "exported OpenAI/Codex credentials are expired" };
  }

  return { kind: "connected", label: "ai", detail: "OpenAI/Codex credentials seeded" };
}
