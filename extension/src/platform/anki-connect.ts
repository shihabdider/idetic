import type { ConnectionStatus } from "../core/types";

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

  const payload = (await response.json()) as Partial<AnkiConnectResponse<T>>;
  if (typeof payload.error === "string" && payload.error.length > 0) {
    throw new AnkiConnectError(payload.error, action, "anki-error");
  }
  return payload.result as T;
}

export interface AnkiReadiness {
  status: ConnectionStatus;
  version?: number;
  deckAll: boolean;
  basicModel: boolean;
  tags: string[];
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
      status: {
        kind: ready ? "connected" : "error",
        label: "anki",
        detail: ready ? `AnkiConnect ${version}` : "missing deck all or Basic model",
      },
      version,
      deckAll,
      basicModel,
      tags,
    };
  } catch (error) {
    return {
      status: {
        kind: error instanceof AnkiConnectError && error.kind === "unavailable" ? "disconnected" : "error",
        label: "anki",
        detail: error instanceof Error ? error.message : "Anki unavailable",
      },
      deckAll: false,
      basicModel: false,
      tags: [],
    };
  }
}
