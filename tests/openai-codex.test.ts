import { describe, expect, test } from "bun:test";

import {
  extractCodexEventStreamText,
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

describe("OpenAI Codex adapter", () => {
  test("classifies missing exported credentials as disconnected", async () => {
    const readiness = await readOpenAICodexReadiness({ credentials: null, now: () => 0 });

    expect(readiness.credentialState).toBe("disconnected");
    expect(readiness.status).toMatchObject({ kind: "disconnected", label: "ai" });
  });

  test("classifies expired credentials when refresh fails", async () => {
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
    expect(body.input[0].content).toContainEqual({ type: "input_image", image_url: "data:image/png;base64,abc123" });
  });
});
