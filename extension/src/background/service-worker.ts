import type { CardDraft, ConnectionStatus } from "../core/types";
import { readAnkiReadiness, saveBasicNoteAndSync, syncAnki } from "../platform/anki-connect";
import { captureVisibleContext } from "../platform/browser-context";
import {
  completeOpenAICodexOAuthConnection,
  createOpenAICodexOAuthSession,
  openAICodexErrorStatus,
  parseOpenAICodexOAuthCallbackUrl,
  readOpenAICodexReadiness,
  sendOpenAICodexChat,
} from "../platform/openai-codex";
import { loadActiveConversation, replaceBrowserContext, saveActiveConversation } from "../platform/state-store";

type RuntimeMessage =
  | { type: "idetic.status" }
  | { type: "idetic.capture-visible-context" }
  | { type: "idetic.anki-sync" }
  | { type: "idetic.anki-write"; card: CardDraft }
  | { type: "idetic.ai-connect" }
  | { type: "idetic.ai-chat"; text: string };

const OPENAI_CODEX_PENDING_CONNECTION_KEY = "idetic.openaiCodexPendingConnection";

interface PendingOpenAICodexConnection {
  tabId?: number;
  state: string;
  verifier: string;
}

let pendingOpenAICodexConnection: PendingOpenAICodexConnection | undefined;
let lastOpenAICodexConnectStatus: ConnectionStatus | undefined;

function isPendingOpenAICodexConnection(value: unknown): value is PendingOpenAICodexConnection {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<PendingOpenAICodexConnection>;
  return (
    (record.tabId === undefined || typeof record.tabId === "number") &&
    typeof record.state === "string" &&
    record.state.length > 0 &&
    typeof record.verifier === "string" &&
    record.verifier.length > 0
  );
}

function pendingConnectionStorage() {
  return chrome.storage?.session ?? chrome.storage?.local;
}

async function readPendingOpenAICodexConnection(): Promise<PendingOpenAICodexConnection | undefined> {
  const storage = pendingConnectionStorage();
  if (!storage) return pendingOpenAICodexConnection;

  try {
    const result = await storage.get(OPENAI_CODEX_PENDING_CONNECTION_KEY);
    const stored = result?.[OPENAI_CODEX_PENDING_CONNECTION_KEY] as unknown;
    if (isPendingOpenAICodexConnection(stored)) {
      pendingOpenAICodexConnection = stored;
      return stored;
    }
  } catch {
    // Fall back to the in-memory copy if extension session storage is temporarily unavailable.
  }

  return pendingOpenAICodexConnection;
}

async function writePendingOpenAICodexConnection(pending: PendingOpenAICodexConnection): Promise<void> {
  pendingOpenAICodexConnection = pending;
  await pendingConnectionStorage()?.set({ [OPENAI_CODEX_PENDING_CONNECTION_KEY]: pending });
}

async function clearPendingOpenAICodexConnection(): Promise<void> {
  pendingOpenAICodexConnection = undefined;
  await pendingConnectionStorage()?.remove(OPENAI_CODEX_PENDING_CONNECTION_KEY);
}

async function aiStatusWithOpenAICodexConnectOverride(status: ConnectionStatus): Promise<ConnectionStatus> {
  if (await readPendingOpenAICodexConnection()) {
    return { kind: "checking", label: "ai", detail: "OpenAI login pending" };
  }
  if (lastOpenAICodexConnectStatus?.kind === "error" && status.kind !== "connected") return lastOpenAICodexConnectStatus;
  return status;
}

async function startOpenAICodexConnection(): Promise<unknown> {
  lastOpenAICodexConnectStatus = undefined;
  const session = await createOpenAICodexOAuthSession();
  const pending: PendingOpenAICodexConnection = { state: session.state, verifier: session.verifier };
  await writePendingOpenAICodexConnection(pending);

  try {
    const tab = await chrome.tabs.create({ url: session.authUrl, active: true });
    if (typeof tab?.id === "number") {
      pending.tabId = tab.id;
      await writePendingOpenAICodexConnection(pending);
    }
    return {
      ok: true,
      authUrl: session.authUrl,
      ai: { kind: "checking", label: "ai", detail: "OpenAI login tab opened" },
    };
  } catch (error) {
    await clearPendingOpenAICodexConnection();
    throw error;
  }
}

async function removeTabIfPossible(tabId: number): Promise<void> {
  try {
    await chrome.tabs.remove(tabId);
  } catch {
    // The login tab may already be closed or may not be removable in a test/browser edge case.
  }
}

async function completeOpenAICodexConnectionFromTab(tabId: number, url: string | undefined): Promise<void> {
  const pending = await readPendingOpenAICodexConnection();
  if (!pending) return;
  if (pending.tabId !== undefined && pending.tabId !== tabId) return;

  const callback = parseOpenAICodexOAuthCallbackUrl(url, pending.state);
  if (!callback) return;

  await clearPendingOpenAICodexConnection();
  if (callback.kind === "error") {
    lastOpenAICodexConnectStatus = { kind: "error", label: "ai", detail: callback.error };
    return;
  }

  try {
    await completeOpenAICodexOAuthConnection(callback.code, pending.verifier);
    lastOpenAICodexConnectStatus = { kind: "connected", label: "ai", detail: "OpenAI/Codex connected" };
    await removeTabIfPossible(tabId);
  } catch (error) {
    lastOpenAICodexConnectStatus = {
      kind: "error",
      label: "ai",
      detail: error instanceof Error ? error.message : "OpenAI OAuth connection failed",
    };
  }
}

chrome.tabs.onUpdated.addListener((tabId: number, changeInfo: { url?: string }, tab: { url?: string }) => {
  void completeOpenAICodexConnectionFromTab(tabId, changeInfo.url ?? tab.url);
});

chrome.tabs.onRemoved.addListener((tabId: number) => {
  void (async () => {
    const pending = await readPendingOpenAICodexConnection();
    if (pending?.tabId === tabId) {
      await clearPendingOpenAICodexConnection();
      lastOpenAICodexConnectStatus = { kind: "disconnected", label: "ai", detail: "OpenAI login tab closed" };
    }
  })();
});

async function conversationWithContext() {
  const conversation = await loadActiveConversation();
  if (conversation.context) return conversation;
  const context = await captureVisibleContext();
  return replaceBrowserContext(context);
}

async function handleMessage(message: RuntimeMessage): Promise<unknown> {
  if (message.type === "idetic.status") {
    const [anki, ai] = await Promise.all([readAnkiReadiness(), readOpenAICodexReadiness()]);
    return { ok: true, anki, ai: await aiStatusWithOpenAICodexConnectOverride(ai.status) };
  }

  if (message.type === "idetic.capture-visible-context") {
    const context = await captureVisibleContext();
    const conversation = await replaceBrowserContext(context);
    return { ok: true, context, conversation };
  }

  if (message.type === "idetic.anki-sync") {
    const sync = await syncAnki();
    return { ok: sync.kind === "synced", anki: { status: sync.status }, result: sync, error: sync.status.detail };
  }

  if (message.type === "idetic.anki-write") {
    const result = await saveBasicNoteAndSync(message.card);
    const ok = result.kind === "saved-and-synced" || result.kind === "saved-sync-failed";
    return { ok, anki: { status: result.status }, result, error: ok ? undefined : result.status.detail };
  }

  if (message.type === "idetic.ai-connect") {
    return startOpenAICodexConnection();
  }

  if (message.type === "idetic.ai-chat") {
    const text = message.text.trim();
    if (!text) return { ok: false, error: "empty AI message" };
    const conversation = await conversationWithContext();

    const conversationWithUser = {
      ...conversation,
      turns: [...conversation.turns, { role: "user" as const, text, createdAt: new Date().toISOString() }],
    };
    await saveActiveConversation(conversationWithUser);

    try {
      const answer = await sendOpenAICodexChat({ message: text, conversation });
      const updated = {
        ...conversationWithUser,
        sourceTagSuggestion: answer.sourceTagSuggestion ?? conversationWithUser.sourceTagSuggestion,
        turns: [...conversationWithUser.turns, { role: "assistant" as const, text: answer.text, createdAt: new Date().toISOString() }],
      };
      await saveActiveConversation(updated);
      return { ok: true, conversation: updated };
    } catch (error) {
      const ai = openAICodexErrorStatus(error);
      return {
        ok: false,
        error: ai.detail ?? "AI request failed",
        conversation: conversationWithUser,
        ai,
      };
    }
  }

  return { ok: false, error: "unknown message" };
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender: unknown, sendResponse: (response: unknown) => void) => {
  void handleMessage(message).then(
    (response) => sendResponse(response),
    (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "unknown error" }),
  );
  return true;
});
