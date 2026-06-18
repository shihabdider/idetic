import { describe, expect, test } from "bun:test";

import {
  completeOpenAICodexOAuthConnection,
  createOpenAICodexAuthorizationUrl,
  extractCodexEventStreamText,
  parseOpenAICodexAssistantMessage,
  parseOpenAICodexOAuthCallbackUrl,
  readCodexResponseText,
  readOpenAICodexReadiness,
  sendOpenAICodexChat,
  type OpenAICodexCredentials,
} from "../extension/src/platform/openai-codex";

const FUTURE_CREDENTIALS: OpenAICodexCredentials = {
  access: "access-token",
  refresh: "refresh-token",
  expires: 1_000_000,
  accountId: "acct_test",
};

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function accessTokenWithAccount(accountId: string): string {
  return [
    base64UrlJson({ alg: "none" }),
    base64UrlJson({ "https://api.openai.com/auth": { chatgpt_account_id: accountId } }),
    "sig",
  ].join(".");
}

describe("OpenAI Codex adapter", () => {
  test("classifies missing stored credentials as disconnected", async () => {
    const readiness = await readOpenAICodexReadiness({ credentials: null, now: () => 0 });

    expect(readiness.credentialState).toBe("disconnected");
    expect(readiness.status).toMatchObject({ kind: "disconnected", label: "ai" });
  });

  test("classifies expired stored credentials when refresh fails", async () => {
    const fetchImpl = (async () => new Response("invalid refresh", { status: 401 })) as unknown as typeof fetch;

    const readiness = await readOpenAICodexReadiness({
      credentials: { ...FUTURE_CREDENTIALS, expires: 1 },
      fetchImpl,
      now: () => 2,
    });

    expect(readiness.credentialState).toBe("expired");
    expect(readiness.status.kind).toBe("error");
    expect(readiness.status.detail).toContain("expired");
  });

  test("refreshes near-expiry credentials and persists the refreshed token", async () => {
    const persisted: OpenAICodexCredentials[] = [];
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ access_token: "fresh-access", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;

    const readiness = await readOpenAICodexReadiness({
      credentials: { ...FUTURE_CREDENTIALS, expires: 61_000 },
      fetchImpl,
      now: () => 2_000,
      persistCredentials: async (credentials) => {
        persisted.push(credentials);
      },
    });

    expect(readiness.credentialState).toBe("connected");
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({ access: "fresh-access", refresh: "refresh-token", accountId: "acct_test" });
  });

  test("builds the Codex OAuth authorization URL", async () => {
    const url = new URL(await createOpenAICodexAuthorizationUrl("test-verifier", "state-123"));

    expect(`${url.origin}${url.pathname}`).toBe("https://auth.openai.com/oauth/authorize");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("app_EMoamEEZ73f0CkXaXp7hrann");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:1455/auth/callback");
    expect(url.searchParams.get("scope")).toBe("openid profile email offline_access");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")?.length).toBeGreaterThan(0);
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("codex_cli_simplified_flow")).toBe("true");
    expect(url.searchParams.get("originator")).toBe("pi");
  });

  test("parses the localhost OAuth callback URL", () => {
    expect(parseOpenAICodexOAuthCallbackUrl("http://localhost:1455/auth/callback?code=abc&state=s", "s")).toEqual({
      kind: "code",
      code: "abc",
    });
    expect(parseOpenAICodexOAuthCallbackUrl("https://example.com/callback?code=abc&state=s", "s")).toBeUndefined();
    expect(parseOpenAICodexOAuthCallbackUrl("http://localhost:1455/auth/callback?code=abc&state=other", "s")).toEqual({
      kind: "error",
      error: "OpenAI OAuth state mismatch",
    });
  });

  test("exchanges an OAuth authorization code and persists credentials", async () => {
    const persisted: OpenAICodexCredentials[] = [];
    let observedBody = "";
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      observedBody = String(init?.body);
      return new Response(
        JSON.stringify({ access_token: accessTokenWithAccount("acct_live"), refresh_token: "refresh-live", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const credentials = await completeOpenAICodexOAuthConnection("auth-code", "pkce-verifier", {
      fetchImpl,
      now: () => 1_000,
      persistCredentials: async (nextCredentials) => {
        persisted.push(nextCredentials);
      },
    });

    const body = new URLSearchParams(observedBody);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("client_id")).toBe("app_EMoamEEZ73f0CkXaXp7hrann");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("code_verifier")).toBe("pkce-verifier");
    expect(body.get("redirect_uri")).toBe("http://localhost:1455/auth/callback");
    expect(credentials).toMatchObject({ refresh: "refresh-live", expires: 3_601_000, accountId: "acct_live" });
    expect(persisted).toEqual([credentials]);
  });

  test("extracts delta text from Codex event streams without duplicating final responses", () => {
    const text = [
      'event: response.output_text.delta',
      'data: {"delta":"plain"}',
      '',
      'event: response.output_text.delta',
      'data: {"delta":" text"}',
      '',
      'event: response.completed',
      'data: {"response":{"output":[{"content":[{"text":"plain text"}]}]}}',
      '',
    ].join("\n");

    expect(extractCodexEventStreamText(text)).toBe("plain text");
  });

  test("reads JSON response text variants", async () => {
    const response = new Response(JSON.stringify({ output: [{ content: [{ text: "json text" }] }] }), {
      headers: { "content-type": "application/json" },
    });

    expect(await readCodexResponseText(response)).toBe("json text");
  });

  test("hides and normalizes the source-tag control line", () => {
    expect(parseOpenAICodexAssistantMessage("This is useful.\n\nIDETIC_SOURCE_TAG: Kahneman 2011")).toEqual({
      text: "This is useful.",
      sourceTagSuggestion: "kahneman_2011",
    });
    expect(parseOpenAICodexAssistantMessage("No source visible.\nIDETIC_SOURCE_TAG:")).toEqual({ text: "No source visible." });
  });

  test("sends visible-context chat to Codex and returns plain text", async () => {
    let observedUrl = "";
    let observedInit: RequestInit | undefined;
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      observedUrl = String(input);
      observedInit = init;
      return new Response('data: {"delta":"hello"}\n\ndata: {"delta":" learner"}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      });
    }) as unknown as typeof fetch;

    const response = await sendOpenAICodexChat(
      {
        message: "What am I seeing?",
        conversation: {
          turns: [],
          context: {
            screenshotDataUrl: "data:image/png;base64,abc123",
            title: "A Paper",
            domain: "example.org",
            capturedAt: "2026-06-17T00:00:00.000Z",
          },
        },
      },
      { credentials: FUTURE_CREDENTIALS, fetchImpl, now: () => 0 },
    );

    expect(response.text).toBe("hello learner");
    expect(observedUrl).toBe("https://chatgpt.com/backend-api/codex/responses");
    const headers = new Headers(observedInit?.headers);
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("chatgpt-account-id")).toBe("acct_test");

    const body = JSON.parse(String(observedInit?.body)) as Record<string, any>;
    expect(body.model).toBe("gpt-5.5");
    expect(body.stream).toBe(true);
    expect(body.instructions).toContain("Do not generate Anki cards");
    expect(body.instructions).toContain("IDETIC_SOURCE_TAG");
    expect(body.input[0].content).toContainEqual({ type: "input_image", image_url: "data:image/png;base64,abc123" });
  });

  test("returns a hidden source tag suggestion from Codex chat", async () => {
    const fetchImpl = (async () =>
      new Response('data: {"delta":"answer\\nIDETIC_SOURCE_TAG: Kahneman 2011"}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      })) as unknown as typeof fetch;

    const response = await sendOpenAICodexChat(
      {
        message: "Source?",
        conversation: { turns: [] },
      },
      { credentials: FUTURE_CREDENTIALS, fetchImpl, now: () => 0 },
    );

    expect(response).toMatchObject({ text: "answer", sourceTagSuggestion: "kahneman_2011" });
  });
});
