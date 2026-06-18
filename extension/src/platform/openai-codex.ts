import { normalizeTagToken } from "../core/tag-policy";
import type { ActiveConversation, BrowserContext, ConnectionStatus } from "../core/types";

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const TOKEN_URL = "https://auth.openai.com/oauth/token";
const REDIRECT_URI = "http://localhost:1455/auth/callback";
const SCOPE = "openid profile email offline_access";
const CODEX_RESPONSES_URL = "https://chatgpt.com/backend-api/codex/responses";
const OPENAI_CODEX_MODEL = "gpt-5.5";
const OPENAI_CODEX_CREDENTIALS_KEY = "idetic.openaiCodexCredentials";
const CREDENTIAL_REFRESH_SKEW_MS = 60_000;
const JWT_CLAIM_PATH = "https://api.openai.com/auth";
const ORIGINATOR = "pi";

const IDETIC_AI_INSTRUCTIONS = [
  "You are Idetic's AI assistant inside a keyboard-first browser popup.",
  "Help the learner understand the current visible browser context.",
  "Answer in plain text only.",
  "Do not generate Anki cards or bulk suggestions; the learner writes cards manually.",
  "If source provenance is uncertain, say so briefly instead of inventing missing details.",
  "End every response with one final hidden control line: IDETIC_SOURCE_TAG: <tag>.",
  "Use source tag format firstauthor_YYYY_MM_DD, shortened only to explicit visible precision; leave the tag blank when author or date precision is uncertain.",
  "The control line is for Idetic only and will be hidden from the learner.",
].join("\n");

export interface OpenAICodexCredentials {
  access: string;
  refresh: string;
  expires: number;
  accountId: string;
}

export type OpenAICodexCredentialState = "connected" | "disconnected" | "expired" | "failed";

export interface OpenAICodexReadiness {
  status: ConnectionStatus;
  credentialState: OpenAICodexCredentialState;
}

export interface OpenAICodexOAuthSession {
  authUrl: string;
  state: string;
  verifier: string;
}

export type OpenAICodexOAuthCallback =
  | { kind: "code"; code: string }
  | { kind: "error"; error: string };

export interface OpenAICodexChatRequest {
  message: string;
  conversation: ActiveConversation;
  context?: BrowserContext;
}

export interface OpenAICodexChatResponse {
  text: string;
  model: string;
  sourceTagSuggestion?: string;
}

export interface OpenAICodexRuntimeOptions {
  credentials?: OpenAICodexCredentials | null;
  fetchImpl?: typeof fetch;
  now?: () => number;
  persistCredentials?: (credentials: OpenAICodexCredentials) => Promise<void>;
}

export class OpenAICodexError extends Error {
  constructor(
    message: string,
    readonly credentialState: Exclude<OpenAICodexCredentialState, "connected"> = "failed",
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "OpenAICodexError";
  }
}

function isOpenAICodexCredentials(value: unknown): value is OpenAICodexCredentials {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<OpenAICodexCredentials>;
  return (
    typeof record.access === "string" &&
    record.access.length > 0 &&
    typeof record.refresh === "string" &&
    record.refresh.length > 0 &&
    typeof record.expires === "number" &&
    Number.isFinite(record.expires) &&
    typeof record.accountId === "string" &&
    record.accountId.length > 0
  );
}

function safeErrorDetail(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Bearer\s+[^\s"']+/gi, "Bearer [redacted]")
    .replace(/["']?access_token["']?\s*[:=]\s*["']?[^\s"',}]+/gi, "access_token=[redacted]")
    .replace(/["']?refresh_token["']?\s*[:=]\s*["']?[^\s"',}]+/gi, "refresh_token=[redacted]")
    .slice(0, 500);
}

function nowFrom(options: OpenAICodexRuntimeOptions): number {
  return options.now?.() ?? Date.now();
}

async function readStoredOpenAICodexCredentials(): Promise<OpenAICodexCredentials | undefined> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return undefined;
  try {
    const result = await chrome.storage.local.get(OPENAI_CODEX_CREDENTIALS_KEY);
    const stored = result[OPENAI_CODEX_CREDENTIALS_KEY] as unknown;
    return isOpenAICodexCredentials(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

async function persistOpenAICodexCredentials(
  credentials: OpenAICodexCredentials,
  options: OpenAICodexRuntimeOptions,
): Promise<void> {
  if (options.persistCredentials) {
    await options.persistCredentials(credentials);
    return;
  }
  if ("credentials" in options) return;
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [OPENAI_CODEX_CREDENTIALS_KEY]: credentials });
}

async function loadOpenAICodexCredentials(
  options: OpenAICodexRuntimeOptions = {},
): Promise<OpenAICodexCredentials | undefined> {
  if ("credentials" in options) return options.credentials ?? undefined;
  return readStoredOpenAICodexCredentials();
}

function decodeJwtPayload(token: string): Record<string, unknown> | undefined {
  try {
    const [, payload] = token.split(".");
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(globalThis.atob(padded)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function accountIdFromAccessToken(accessToken: string): string | undefined {
  const payload = decodeJwtPayload(accessToken);
  const auth = payload?.[JWT_CLAIM_PATH] as { chatgpt_account_id?: unknown } | undefined;
  return typeof auth?.chatgpt_account_id === "string" && auth.chatgpt_account_id.length > 0 ? auth.chatgpt_account_id : undefined;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function randomState(): string {
  return Array.from(randomBytes(16), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createPkceVerifier(): string {
  return base64Url(randomBytes(32));
}

async function createPkceChallenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

export async function createOpenAICodexAuthorizationUrl(verifier: string, state: string): Promise<string> {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("code_challenge", await createPkceChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("id_token_add_organizations", "true");
  url.searchParams.set("codex_cli_simplified_flow", "true");
  url.searchParams.set("originator", ORIGINATOR);
  return url.toString();
}

export async function createOpenAICodexOAuthSession(): Promise<OpenAICodexOAuthSession> {
  const verifier = createPkceVerifier();
  const state = randomState();
  return { authUrl: await createOpenAICodexAuthorizationUrl(verifier, state), state, verifier };
}

export function parseOpenAICodexOAuthCallbackUrl(
  value: string | undefined,
  expectedState: string,
): OpenAICodexOAuthCallback | undefined {
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  const redirectUrl = new URL(REDIRECT_URI);
  if (url.origin !== redirectUrl.origin || url.pathname !== redirectUrl.pathname) return undefined;

  if (url.searchParams.get("state") !== expectedState) {
    return { kind: "error", error: "OpenAI OAuth state mismatch" };
  }

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const description = url.searchParams.get("error_description");
    return { kind: "error", error: description ? `${oauthError}: ${description}` : oauthError };
  }

  const code = url.searchParams.get("code");
  if (!code) return { kind: "error", error: "OpenAI OAuth callback was missing a code" };
  return { kind: "code", code };
}

async function exchangeOpenAICodexToken(
  body: URLSearchParams,
  options: OpenAICodexRuntimeOptions = {},
  fallbackRefreshToken?: string,
  fallbackAccountId?: string,
): Promise<OpenAICodexCredentials> {
  const response = await (options.fetchImpl ?? fetch)(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OpenAI Codex OAuth token exchange failed with HTTP ${response.status}: ${text}`);
  }

  const json = (await response.json()) as { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown };
  const access = typeof json.access_token === "string" ? json.access_token : undefined;
  const refresh = typeof json.refresh_token === "string" ? json.refresh_token : fallbackRefreshToken;
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : undefined;
  if (!access || !refresh || expiresIn === undefined) {
    throw new Error("OpenAI Codex OAuth token response was missing tokens.");
  }

  const accountId = accountIdFromAccessToken(access) ?? fallbackAccountId;
  if (!accountId) throw new Error("OpenAI Codex OAuth token did not include a ChatGPT account id.");

  return {
    access,
    refresh,
    expires: nowFrom(options) + expiresIn * 1000,
    accountId,
  };
}

export async function completeOpenAICodexOAuthConnection(
  code: string,
  verifier: string,
  options: OpenAICodexRuntimeOptions = {},
): Promise<OpenAICodexCredentials> {
  const credentials = await exchangeOpenAICodexToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
    }),
    options,
  );
  await persistOpenAICodexCredentials(credentials, options);
  return credentials;
}

async function refreshOpenAICodexCredentials(
  credentials: OpenAICodexCredentials,
  options: OpenAICodexRuntimeOptions = {},
): Promise<OpenAICodexCredentials> {
  return exchangeOpenAICodexToken(
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: credentials.refresh, client_id: CLIENT_ID }),
    options,
    credentials.refresh,
    credentials.accountId,
  );
}

async function loadValidOpenAICodexCredentials(
  options: OpenAICodexRuntimeOptions = {},
): Promise<OpenAICodexCredentials> {
  const credentials = await loadOpenAICodexCredentials(options);
  if (!credentials) {
    throw new OpenAICodexError("OpenAI/Codex is not connected; run :connect", "disconnected");
  }

  const now = nowFrom(options);
  if (now < credentials.expires - CREDENTIAL_REFRESH_SKEW_MS) return credentials;

  try {
    const refreshed = await refreshOpenAICodexCredentials(credentials, options);
    await persistOpenAICodexCredentials(refreshed, options);
    return refreshed;
  } catch (error) {
    const credentialState: Exclude<OpenAICodexCredentialState, "connected"> = now >= credentials.expires ? "expired" : "failed";
    const prefix = credentialState === "expired" ? "OpenAI/Codex credentials are expired; run :connect" : "OpenAI/Codex refresh failed";
    throw new OpenAICodexError(`${prefix}: ${safeErrorDetail(error)}`, credentialState, error);
  }
}

function readinessFromError(error: unknown): OpenAICodexReadiness {
  if (error instanceof OpenAICodexError && error.credentialState === "disconnected") {
    return {
      credentialState: "disconnected",
      status: { kind: "disconnected", label: "ai", detail: error.message },
    };
  }

  const credentialState = error instanceof OpenAICodexError ? error.credentialState : "failed";
  return {
    credentialState,
    status: { kind: "error", label: "ai", detail: safeErrorDetail(error) || "OpenAI/Codex failed" },
  };
}

export function openAICodexErrorStatus(error: unknown): ConnectionStatus {
  return readinessFromError(error).status;
}

export async function readOpenAICodexReadiness(options: OpenAICodexRuntimeOptions = {}): Promise<OpenAICodexReadiness> {
  try {
    const credentials = await loadValidOpenAICodexCredentials(options);
    return {
      credentialState: "connected",
      status: {
        kind: "connected",
        label: "ai",
        detail: `OpenAI/Codex credentials ready (${new Date(credentials.expires).toLocaleTimeString()})`,
      },
    };
  } catch (error) {
    return readinessFromError(error);
  }
}

function formatBrowserContext(context: BrowserContext | undefined): string {
  if (!context) return "Browser context: no screenshot is available.";
  const lines = ["Browser context:"];
  if (context.title.trim()) lines.push(`- title: ${context.title.trim()}`);
  if (context.domain.trim()) lines.push(`- domain: ${context.domain.trim()}`);
  lines.push(`- captured at: ${context.capturedAt}`);
  lines.push("- screenshot: attached image from the visible tab");
  return lines.join("\n");
}

function formatTurns(conversation: ActiveConversation): string {
  return conversation.turns.map((turn) => `${turn.role}: ${turn.text}`).join("\n");
}

function requestText(request: OpenAICodexChatRequest): string {
  const previousTurns = formatTurns(request.conversation);
  return [
    formatBrowserContext(request.context ?? request.conversation.context),
    previousTurns ? `Conversation so far:\n${previousTurns}` : "Conversation so far: none",
    `Learner question:\n${request.message.trim()}`,
  ].join("\n\n");
}

function codexHeaders(credentials: OpenAICodexCredentials): Headers {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${credentials.access}`);
  headers.set("chatgpt-account-id", credentials.accountId);
  headers.set("openai-beta", "responses=experimental");
  headers.set("originator", ORIGINATOR);
  headers.set("accept", "text/event-stream");
  headers.set("content-type", "application/json");
  return headers;
}

function textFromContentPart(content: unknown): string {
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";
  const record = content as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if (typeof record.output_text === "string") return record.output_text;
  if (typeof record.value === "string") return record.value;
  if (record.text && typeof record.text === "object" && typeof (record.text as Record<string, unknown>).value === "string") {
    return String((record.text as Record<string, unknown>).value);
  }
  if (Array.isArray(record.parts)) return record.parts.map(textFromContentPart).join("");
  return "";
}

function extractResponseText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record.delta === "string") return record.delta;
  if (typeof record.text === "string") return record.text;
  if (typeof record.output_text === "string") return record.output_text;

  const message = record.message as Record<string, unknown> | undefined;
  if (Array.isArray(message?.content)) return message.content.map(textFromContentPart).join("");
  if (message?.content) return textFromContentPart(message.content);

  const response = record.response as Record<string, unknown> | undefined;
  const output = response?.output ?? record.output;
  if (Array.isArray(output)) {
    return output
      .map((item) => {
        const itemRecord = item as Record<string, unknown>;
        if (typeof itemRecord.content === "string") return itemRecord.content;
        if (Array.isArray(itemRecord.content)) return itemRecord.content.map(textFromContentPart).join("");
        return textFromContentPart(itemRecord);
      })
      .join("");
  }

  if (Array.isArray(record.content)) return record.content.map(textFromContentPart).join("");
  if (record.content) return textFromContentPart(record.content);
  return "";
}

function looksLikeCodexEventStream(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("event:") || trimmed.startsWith("data:");
}

export function extractCodexEventStreamText(text: string): string {
  const events = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n"),
    )
    .filter((data) => data.length > 0 && data !== "[DONE]")
    .flatMap((data) => {
      try {
        return [JSON.parse(data) as unknown];
      } catch {
        return [];
      }
    });

  const deltaText = events
    .map((event) => {
      if (!event || typeof event !== "object") return "";
      const record = event as Record<string, unknown>;
      return typeof record.delta === "string" ? record.delta : "";
    })
    .join("");

  return deltaText.length > 0 ? deltaText : events.map(extractResponseText).join("");
}

export async function readCodexResponseText(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text().catch(() => "");

  if (contentType.includes("text/event-stream") || looksLikeCodexEventStream(bodyText)) {
    return extractCodexEventStreamText(bodyText);
  }

  try {
    return extractResponseText(JSON.parse(bodyText));
  } catch {
    return "";
  }
}

export function parseOpenAICodexAssistantMessage(rawText: string): { text: string; sourceTagSuggestion?: string } {
  const lines = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index].trim();
    if (!line) continue;

    const match = /^IDETIC_SOURCE_TAG:\s*(.*)$/i.exec(line);
    if (!match) break;

    lines.splice(index, 1);
    const sourceTagSuggestion = normalizeTagToken(match[1]);
    return {
      text: lines.join("\n").trim(),
      sourceTagSuggestion: sourceTagSuggestion || undefined,
    };
  }

  return { text: rawText.trim() };
}

export async function sendOpenAICodexChat(
  request: OpenAICodexChatRequest,
  options: OpenAICodexRuntimeOptions = {},
): Promise<OpenAICodexChatResponse> {
  const message = request.message.trim();
  if (!message) throw new OpenAICodexError("OpenAI/Codex chat message is empty", "failed");

  const credentials = await loadValidOpenAICodexCredentials(options);
  const context = request.context ?? request.conversation.context;
  const content: Array<Record<string, string>> = [{ type: "input_text", text: requestText({ ...request, message, context }) }];
  if (context?.screenshotDataUrl) content.push({ type: "input_image", image_url: context.screenshotDataUrl });

  const body = {
    model: OPENAI_CODEX_MODEL,
    store: false,
    stream: true,
    instructions: IDETIC_AI_INSTRUCTIONS,
    input: [{ role: "user", content }],
    text: { verbosity: "low" },
  };

  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(CODEX_RESPONSES_URL, {
      method: "POST",
      headers: codexHeaders(credentials),
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new OpenAICodexError(`OpenAI/Codex request failed: ${safeErrorDetail(error)}`, "failed", error);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new OpenAICodexError(`OpenAI/Codex request failed with HTTP ${response.status}: ${safeErrorDetail(errorText)}`, "failed");
  }

  const messageBody = parseOpenAICodexAssistantMessage(await readCodexResponseText(response));
  if (!messageBody.text) throw new OpenAICodexError("OpenAI/Codex response was empty or could not be parsed", "failed");

  return { ...messageBody, model: OPENAI_CODEX_MODEL };
}
