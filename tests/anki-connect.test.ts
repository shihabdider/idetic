import { describe, expect, test } from "bun:test";

import {
  ankiTagsFromInput,
  callAnkiConnect,
  readAnkiReadiness,
  saveBasicNoteAndSync,
  type AnkiSaveResult,
} from "../extension/src/platform/anki-connect";
import type { CardDraft } from "../extension/src/core/types";

function ankiResponse(result: unknown, error: string | null = null, status = 200): Response {
  return new Response(JSON.stringify({ result, error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function actionFetch(handler: (body: Record<string, any>) => { result?: unknown; error?: string | null; status?: number }): {
  fetchImpl: typeof fetch;
  calls: Record<string, any>[];
} {
  const calls: Record<string, any>[] = [];
  const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, any>;
    calls.push(body);
    const next = handler(body);
    return ankiResponse(next.result, next.error ?? null, next.status ?? 200);
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function standardAnkiHandler(body: Record<string, any>): { result?: unknown; error?: string | null; status?: number } {
  if (body.action === "version") return { result: 6 };
  if (body.action === "deckNames") return { result: ["all"] };
  if (body.action === "modelNames") return { result: ["Basic"] };
  if (body.action === "getTags") return { result: ["paper_tag"] };
  if (body.action === "addNote") return { result: 12345 };
  if (body.action === "sync") return { result: null };
  throw new Error(`unexpected action ${body.action}`);
}

const CARD: CardDraft = {
  front: " What is Idetic? ",
  back: " A browser-first Anki helper. ",
  tags: "Paper Tag paper-tag  ",
};

describe("AnkiConnect adapter", () => {
  test("sends AnkiConnect version 6 requests and returns results", async () => {
    const { fetchImpl, calls } = actionFetch((body) => {
      expect(body.action).toBe("version");
      expect(body.version).toBe(6);
      expect(body.params).toEqual({});
      return { result: 6 };
    });

    await expect(callAnkiConnect("version", {}, fetchImpl)).resolves.toBe(6);
    expect(calls).toHaveLength(1);
  });

  test("reports readiness with deck all, Basic model, and tags", async () => {
    const { fetchImpl } = actionFetch(standardAnkiHandler);

    const readiness = await readAnkiReadiness(fetchImpl);

    expect(readiness.status).toMatchObject({ kind: "connected", label: "anki" });
    expect(readiness.deckAll).toBe(true);
    expect(readiness.basicModel).toBe(true);
    expect(readiness.tags).toEqual(["paper_tag"]);
  });

  test("normalizes whitespace-separated Anki tags", () => {
    expect(ankiTagsFromInput("Paper Tag paper-tag  spaced/value")).toEqual(["paper", "tag", "paper_tag", "spaced_value"]);
  });

  test("creates a Basic note in deck all and syncs", async () => {
    const { fetchImpl, calls } = actionFetch(standardAnkiHandler);

    const result = await saveBasicNoteAndSync(CARD, fetchImpl);

    expect(result).toMatchObject({ kind: "saved-and-synced", noteId: 12345 });
    const addNote = calls.find((call) => call.action === "addNote");
    expect(addNote?.params.note).toEqual({
      deckName: "all",
      modelName: "Basic",
      fields: {
        Front: "What is Idetic?",
        Back: "A browser-first Anki helper.",
      },
      tags: ["paper", "tag", "paper_tag"],
    });
    expect(calls.map((call) => call.action)).toContain("sync");
  });

  test("classifies duplicate addNote errors and keeps sync unsent", async () => {
    const { fetchImpl, calls } = actionFetch((body) => {
      if (body.action === "addNote") return { result: null, error: "cannot create note because it is a duplicate" };
      return standardAnkiHandler(body);
    });

    const result = await saveBasicNoteAndSync(CARD, fetchImpl);

    expect(result.kind).toBe("duplicate");
    expect(calls.map((call) => call.action)).not.toContain("sync");
  });

  test("classifies missing deck or model before addNote", async () => {
    const { fetchImpl, calls } = actionFetch((body) => {
      if (body.action === "deckNames") return { result: [] };
      return standardAnkiHandler(body);
    });

    const result = await saveBasicNoteAndSync(CARD, fetchImpl);

    expect(result).toMatchObject({ kind: "invalid-deck-model" });
    expect(calls.map((call) => call.action)).not.toContain("addNote");
  });

  test("preserves created note id when sync fails", async () => {
    const { fetchImpl } = actionFetch((body) => {
      if (body.action === "sync") return { result: null, error: "sync failed" };
      return standardAnkiHandler(body);
    });

    const result = (await saveBasicNoteAndSync(CARD, fetchImpl)) as Extract<AnkiSaveResult, { kind: "saved-sync-failed" }>;

    expect(result.kind).toBe("saved-sync-failed");
    expect(result.noteId).toBe(12345);
    expect(result.syncStatus.detail).toBe("sync failed");
  });

  test("classifies AnkiConnect unavailable", async () => {
    const fetchImpl = (async () => {
      throw new Error("connection refused");
    }) as unknown as typeof fetch;

    const result = await saveBasicNoteAndSync(CARD, fetchImpl);

    expect(result).toMatchObject({ kind: "unavailable", status: { kind: "disconnected" } });
  });
});
