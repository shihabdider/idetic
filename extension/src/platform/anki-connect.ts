import type { CardDraft, ConnectionStatus } from "../core/types";
import { normalizeTagToken } from "../core/tag-policy";

const ANKI_CONNECT_URL = "http://127.0.0.1:8765";
const DECK_ALL = "all";
const BASIC_MODEL = "Basic";

export class AnkiConnectError extends Error {
  constructor(
    message: string,
    readonly action: string,
    readonly kind: "unavailable" | "protocol" | "anki-error" = "protocol",
  ) {
    super(message);
    this.name = "AnkiConnectError";
  }
}

interface AnkiConnectResponse<T> {
  result: T;
  error: string | null;
}

export interface AnkiReadiness {
  status: ConnectionStatus;
  version?: number;
  deckAll: boolean;
  basicModel: boolean;
  tags: string[];
}

export interface AnkiSyncResult {
  kind: "synced" | "unavailable" | "error";
  status: ConnectionStatus;
}

export type AnkiSaveResult =
  | { kind: "saved-and-synced"; noteId: number; status: ConnectionStatus }
  | { kind: "saved-sync-failed"; noteId: number; status: ConnectionStatus; syncStatus: ConnectionStatus }
  | { kind: "duplicate"; status: ConnectionStatus }
  | { kind: "invalid-deck-model"; status: ConnectionStatus }
  | { kind: "validation-error"; status: ConnectionStatus }
  | { kind: "unavailable"; status: ConnectionStatus }
  | { kind: "error"; status: ConnectionStatus };

interface AnkiNotePayload {
  deckName: string;
  modelName: string;
  fields: {
    Front: string;
    Back: string;
  };
  tags: string[];
}

export async function callAnkiConnect<T>(
  action: string,
  params: Record<string, unknown> = {},
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchImpl(ANKI_CONNECT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
  } catch (error) {
    throw new AnkiConnectError(error instanceof Error ? error.message : "AnkiConnect unavailable", action, "unavailable");
  }

  if (!response.ok) {
    throw new AnkiConnectError(`AnkiConnect HTTP ${response.status}`, action, "protocol");
  }

  let payload: Partial<AnkiConnectResponse<T>>;
  try {
    payload = (await response.json()) as Partial<AnkiConnectResponse<T>>;
  } catch (error) {
    throw new AnkiConnectError(error instanceof Error ? error.message : "Invalid AnkiConnect JSON response", action, "protocol");
  }

  if (typeof payload.error === "string" && payload.error.length > 0) {
    throw new AnkiConnectError(payload.error, action, "anki-error");
  }
  return payload.result as T;
}

function ankiStatus(kind: ConnectionStatus["kind"], detail: string): ConnectionStatus {
  return { kind, label: "anki", detail };
}

function statusFromError(error: unknown): ConnectionStatus {
  if (error instanceof AnkiConnectError && error.kind === "unavailable") {
    return ankiStatus("disconnected", error.message);
  }
  return ankiStatus("error", error instanceof Error ? error.message : "Anki unavailable");
}

function isDuplicateAnkiError(error: unknown): boolean {
  return error instanceof AnkiConnectError && /\bduplicate\b/i.test(error.message);
}

function invalidDeckModelStatus(readiness: AnkiReadiness): ConnectionStatus {
  if (!readiness.deckAll && !readiness.basicModel) return ankiStatus("error", "missing deck all and Basic model");
  if (!readiness.deckAll) return ankiStatus("error", "missing deck all");
  return ankiStatus("error", "missing Basic model");
}

export function ankiTagsFromInput(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of input.split(/\s+/)) {
    const normalized = normalizeTagToken(part);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    tags.push(normalized);
  }
  return tags;
}

function basicNotePayload(card: CardDraft): AnkiNotePayload {
  return {
    deckName: DECK_ALL,
    modelName: BASIC_MODEL,
    fields: {
      Front: card.front.trim(),
      Back: card.back.trim(),
    },
    tags: ankiTagsFromInput(card.tags),
  };
}

function isValidCardDraft(card: CardDraft): boolean {
  return card.front.trim().length > 0 && card.back.trim().length > 0;
}

export async function readAnkiReadiness(fetchImpl: typeof fetch = fetch): Promise<AnkiReadiness> {
  try {
    const version = await callAnkiConnect<number>("version", {}, fetchImpl);
    const [deckNames, modelNames, tags] = await Promise.all([
      callAnkiConnect<string[]>("deckNames", {}, fetchImpl),
      callAnkiConnect<string[]>("modelNames", {}, fetchImpl),
      callAnkiConnect<string[]>("getTags", {}, fetchImpl),
    ]);

    const deckAll = deckNames.includes(DECK_ALL);
    const basicModel = modelNames.includes(BASIC_MODEL);
    const ready = deckAll && basicModel;
    return {
      status: ready ? ankiStatus("connected", `AnkiConnect ${version}`) : invalidDeckModelStatus({
        status: ankiStatus("error", "missing deck all or Basic model"),
        version,
        deckAll,
        basicModel,
        tags,
      }),
      version,
      deckAll,
      basicModel,
      tags,
    };
  } catch (error) {
    return {
      status: statusFromError(error),
      deckAll: false,
      basicModel: false,
      tags: [],
    };
  }
}

export async function syncAnki(fetchImpl: typeof fetch = fetch): Promise<AnkiSyncResult> {
  try {
    await callAnkiConnect<null>("sync", {}, fetchImpl);
    return { kind: "synced", status: ankiStatus("connected", "Anki synced") };
  } catch (error) {
    const status = statusFromError(error);
    return { kind: status.kind === "disconnected" ? "unavailable" : "error", status };
  }
}

export async function createBasicNote(card: CardDraft, fetchImpl: typeof fetch = fetch): Promise<number> {
  const noteId = await callAnkiConnect<number | null>("addNote", { note: basicNotePayload(card) }, fetchImpl);
  if (typeof noteId !== "number" || !Number.isFinite(noteId)) {
    throw new AnkiConnectError("AnkiConnect addNote returned no note id", "addNote", "anki-error");
  }
  return noteId;
}

export async function saveBasicNoteAndSync(card: CardDraft, fetchImpl: typeof fetch = fetch): Promise<AnkiSaveResult> {
  if (!isValidCardDraft(card)) {
    return { kind: "validation-error", status: ankiStatus("error", "front and back are required") };
  }

  const readiness = await readAnkiReadiness(fetchImpl);
  if (readiness.status.kind === "disconnected") {
    return { kind: "unavailable", status: readiness.status };
  }
  if (!readiness.deckAll || !readiness.basicModel) {
    return { kind: "invalid-deck-model", status: invalidDeckModelStatus(readiness) };
  }
  if (readiness.status.kind === "error") {
    return { kind: "error", status: readiness.status };
  }

  let noteId: number;
  try {
    noteId = await createBasicNote(card, fetchImpl);
  } catch (error) {
    if (isDuplicateAnkiError(error)) return { kind: "duplicate", status: ankiStatus("error", "duplicate card") };
    const status = statusFromError(error);
    return { kind: status.kind === "disconnected" ? "unavailable" : "error", status };
  }

  const syncResult = await syncAnki(fetchImpl);
  if (syncResult.kind !== "synced") {
    return {
      kind: "saved-sync-failed",
      noteId,
      status: ankiStatus("error", `saved note ${noteId}; sync failed`),
      syncStatus: syncResult.status,
    };
  }

  return { kind: "saved-and-synced", noteId, status: ankiStatus("connected", `saved note ${noteId} and synced`) };
}
