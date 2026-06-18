import { resolveCommand } from "../core/commands";
import { nextCardField, previousCardField, toggleViewFromAnyMode } from "../core/modal";
import { applyTagAutocompleteCandidate, currentTagToken, tagAutocompleteCandidates } from "../core/tag-policy";
import type { ActiveConversation, AppState, CardField, ChatField, ChatTurn, ConnectionStatus, Mode } from "../core/types";
import { createInitialAppState } from "../core/types";
import {
  clearChatDraft,
  clearConversationOnly,
  loadActiveConversation,
  loadCardDraft,
  loadChatDraft,
  saveActiveConversation,
  saveCardDraft,
  saveChatDraft,
} from "../platform/state-store";

const appRoot = document.querySelector<HTMLElement>("#app");
if (!appRoot) throw new Error("Idetic popup root not found.");
const app: HTMLElement = appRoot;

let state: AppState = createInitialAppState();
let commandDraft = "";
let chatDraft = "";
let knownTags: string[] = [];
let modeBeforeHelp: Mode = "normal";
let assistantWaiting = false;

interface RuntimeResponse<T> {
  ok: boolean;
  error?: string;
  anki?: { status: ConnectionStatus; tags?: string[] };
  ai?: ConnectionStatus;
  context?: T;
  conversation?: ActiveConversation;
  result?: T;
}

interface AnkiSaveRuntimeResult {
  kind:
    | "saved-and-synced"
    | "saved-sync-failed"
    | "duplicate"
    | "invalid-deck-model"
    | "validation-error"
    | "unavailable"
    | "error";
  noteId?: number;
  status: ConnectionStatus;
  syncStatus?: ConnectionStatus;
}

interface AnkiSyncRuntimeResult {
  kind: "synced" | "unavailable" | "error";
  status: ConnectionStatus;
}

function sendRuntimeMessage<T>(message: unknown): Promise<RuntimeResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: RuntimeResponse<T> | undefined) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { ok: false, error: "empty extension response" });
    });
  });
}

function classForStatus(status: ConnectionStatus): string {
  return `badge ${status.kind}`;
}

function selectedCardClass(field: CardField): string {
  return state.cardSelection === field ? "field selected" : "field";
}

function selectedChatClass(selection: ChatField, baseClass: string): string {
  return state.chatSelection === selection ? `${baseClass} selected` : baseClass;
}

function contextLine(): string {
  const context = state.activeConversation.context;
  if (!context) return "context none";
  const captured = new Date(context.capturedAt).toLocaleTimeString();
  const source = context.domain || context.title || "unknown";
  return `context ${source} ${captured}`;
}

function selectedTagAutocompleteCandidate(): string | undefined {
  if (state.view !== "card" || state.cardSelection !== "tags") return undefined;
  const candidates = tagAutocompleteCandidates(state.cardDraft.tags, knownTags, state.activeConversation.sourceTagSuggestion);
  if (currentTagToken(state.cardDraft.tags).trim()) return candidates[0];
  if (!state.cardDraft.tags.trim() && state.activeConversation.sourceTagSuggestion) return candidates[0];
  return undefined;
}

function defaultStatusLine(): string {
  const draft = state.cardDraft;
  const tagCandidate = selectedTagAutocompleteCandidate();
  if (tagCandidate) return `tag ${tagCandidate}  ^K`;
  if (state.view === "card" && draft.front.trim() && draft.back.trim() && draft.tags.trim()) return "ready  :w";
  return state.statusLine;
}

function helpText(): string {
  return [
    "keys",
    "  Tab        toggle card/chat, land normal",
    "  i          insert selected field",
    "  Esc        normal closes popup; insert/command/help returns normal",
    "  ?          help",
    "  :          command",
    "  j k        move selection in normal mode",
    "  [ ]        scroll selected chat messages",
    "  Enter      chat insert sends; card insert advances field",
    "  Shift+Enter newline in insert",
    "  Ctrl+K     accept tag autocomplete candidate",
    "",
    "commands",
    "  :se[nd]    send chat draft",
    "  :sy[nc]    retry Anki sync",
    "  :w[rite]   create card and sync",
    "  :ca[rd]    card view",
    "  :ch[at]    chat view",
    "  :co[nnect] open OpenAI login",
    "  :r[efresh] replace context",
    "  :cl[ear]   clear conversation context",
    "  :st[atus]  refresh status",
    "  :h[elp]    help",
    "  :q[uit]    close popup",
  ].join("\n");
}

function activeSelection(): string {
  return state.view === "card" ? state.cardSelection : state.chatSelection;
}

function renderStatusLeft(overrideMode?: string): string {
  const mode = overrideMode ?? state.mode.toUpperCase();
  return `${mode}  ${state.view}  ${activeSelection()}`;
}

function renderStatusCenter(): string {
  if (state.mode !== "command") return `<span data-status-message>${escapeHtml(defaultStatusLine())}</span>`;
  return `<div class="command"><span>:</span><input data-command value="${escapeAttribute(commandDraft)}"></div>`;
}

function renderStatusRight(): string {
  return [
    `<span class="${classForStatus(state.anki)}">anki</span>`,
    `<span class="${classForStatus(state.ai)}">ai</span>`,
  ].join("  ");
}

function renderStatusBar(overrideMode?: string): string {
  return `
    <footer class="statusbar">
      <div class="status-left">${escapeHtml(renderStatusLeft(overrideMode))}</div>
      <div class="status-center" data-status-center>${renderStatusCenter()}</div>
      <div class="status-right">${renderStatusRight()}</div>
    </footer>
  `;
}

function renderCardView(): string {
  return `
    <section class="view" data-view="card">
      <div class="${selectedCardClass("front")}">
        <div class="label">Front</div>
        <textarea class="card-front" data-field="front">${escapeHtml(state.cardDraft.front)}</textarea>
      </div>
      <div class="${selectedCardClass("back")}">
        <div class="label">Back</div>
        <textarea class="card-back" data-field="back">${escapeHtml(state.cardDraft.back)}</textarea>
      </div>
      <div class="${selectedCardClass("tags")}">
        <div class="label">Tags</div>
        <input data-field="tags" value="${escapeAttribute(state.cardDraft.tags)}">
      </div>
    </section>
  `;
}

function chatTranscript(includeWaiting = true): string {
  const lines = state.activeConversation.turns.map((turn) => `${turn.role}> ${turn.text}`);
  if (includeWaiting && assistantWaiting) lines.push("assistant> Assistant is responding...");
  return lines.join("\n");
}

function renderChatTurn(turn: ChatTurn): string {
  return `
    <div class="chat-message ${turn.role}">
      <div class="chat-role">${turn.role}</div>
      <div class="chat-text">${escapeHtml(turn.text)}</div>
    </div>
  `;
}

function renderChatMessages(): string {
  const renderedTurns = state.activeConversation.turns.map(renderChatTurn).join("");
  const waiting = assistantWaiting
    ? `<div class="chat-message assistant pending"><div class="chat-role">assistant</div><div class="chat-text">Assistant is responding...</div></div>`
    : "";
  return renderedTurns || waiting ? `${renderedTurns}${waiting}` : `<div class="chat-empty">no messages</div>`;
}

function parseChatTranscript(value: string, existingTurns: ChatTurn[] = state.activeConversation.turns): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let role: ChatTurn["role"] | undefined;
  let textLines: string[] = [];
  const createdAt = new Date().toISOString();

  function flush(): void {
    if (!role) return;
    const text = textLines.join("\n").trim();
    if (text.length > 0) {
      turns.push({ role, text, createdAt: existingTurns[turns.length]?.createdAt ?? createdAt });
    }
    role = undefined;
    textLines = [];
  }

  for (const line of value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")) {
    const match = /^(user|assistant)>\s?(.*)$/.exec(line);
    if (match) {
      flush();
      role = match[1] as ChatTurn["role"];
      textLines = [match[2]];
      continue;
    }
    if (role) textLines.push(line);
  }
  flush();
  return turns;
}

function renderChatView(): string {
  const editingMessages = state.mode === "insert" && state.chatSelection === "messages" && !assistantWaiting;
  const messages = editingMessages
    ? `<textarea class="${selectedChatClass("messages", "chat-log")}" data-field="chat-messages" data-chat-log>${escapeHtml(chatTranscript(false))}</textarea>`
    : `<div class="${selectedChatClass("messages", "chat-log")}" data-chat-log>${renderChatMessages()}</div>`;
  return `
    <section class="view" data-view="chat">
      <div class="${selectedChatClass("context", "context")}">${escapeHtml(contextLine())}</div>
      ${messages}
      <div class="${selectedChatClass("input", "field")}">
        <div class="label">Chat</div>
        <textarea class="chat-input" data-field="chat-input">${escapeHtml(chatDraft)}</textarea>
      </div>
    </section>
  `;
}

function render(): void {
  if (state.mode === "help") {
    app.innerHTML = `
      <div class="shell">
        <section class="view help">${escapeHtml(helpText())}</section>
        ${renderStatusBar("HELP")}
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="shell">
      ${state.view === "card" ? renderCardView() : renderChatView()}
      ${renderStatusBar()}
    </div>
  `;

  bindInputs();
  scrollChatLogToBottom();
  focusSelectedIfInsert();
  if (state.mode === "command") focusCommandInput();
}

function bindInputs(): void {
  for (const element of app.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>("[data-field]")) {
    element.addEventListener("input", () => {
      const field = element.dataset.field;
      if (field === "front" || field === "back" || field === "tags") {
        state.cardDraft = { ...state.cardDraft, [field]: element.value };
        void saveCardDraft(state.cardDraft);
        updateRenderedStatusMessage();
      }
      if (field === "chat-input") {
        chatDraft = element.value;
        void saveChatDraft(chatDraft);
      }
      if (field === "chat-messages") {
        state.activeConversation = { ...state.activeConversation, turns: parseChatTranscript(element.value) };
        void saveActiveConversation(state.activeConversation);
      }
    });

    element.addEventListener("focus", () => {
      const field = element.dataset.field;
      if (field === "front" || field === "back" || field === "tags") state.cardSelection = field;
      if (field === "chat-input") state.chatSelection = "input";
      if (field === "chat-messages") state.chatSelection = "messages";
    });
  }

  const commandInput = app.querySelector<HTMLInputElement>("[data-command]");
  commandInput?.addEventListener("input", () => {
    commandDraft = commandInput.value;
  });
}

function updateRenderedStatusMessage(): void {
  if (state.mode === "command") return;
  const statusMessage = app.querySelector<HTMLElement>("[data-status-message]");
  if (statusMessage) statusMessage.textContent = defaultStatusLine();
}

function scrollChatLogToBottom(): void {
  const log = app.querySelector<HTMLElement>("[data-chat-log]");
  if (log) log.scrollTop = log.scrollHeight;
}

function scrollSelectedChatMessages(direction: 1 | -1): void {
  if (state.view !== "chat" || state.chatSelection !== "messages") return;
  const log = app.querySelector<HTMLElement>("[data-chat-log]");
  if (!log) return;
  log.scrollBy({ top: direction * 72, behavior: "smooth" });
}

function focusSelectedIfInsert(): void {
  if (state.mode !== "insert") return;
  const selector = state.view === "card"
    ? `[data-field="${state.cardSelection}"]`
    : state.chatSelection === "messages"
      ? `[data-field="chat-messages"]`
      : `[data-field="chat-input"]`;
  const element = app.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!element) return;
  element.focus();
  const caret = element.value.length;
  element.setSelectionRange(caret, caret);
  if (state.view === "chat" && state.chatSelection === "messages") element.scrollTop = element.scrollHeight;
}

function focusCommandInput(): void {
  app.querySelector<HTMLInputElement>("[data-command]")?.focus();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

async function refreshStatus(): Promise<void> {
  state.anki = { kind: "checking", label: "anki" };
  state.ai = { kind: "checking", label: "ai" };
  render();
  const response = await sendRuntimeMessage<unknown>({ type: "idetic.status" });
  if (!response.ok) {
    state.anki = { kind: "error", label: "anki", detail: response.error };
    state.ai = { kind: "error", label: "ai", detail: response.error };
    state.statusLine = response.error ?? "status failed";
    render();
    return;
  }
  if (response.anki) {
    state.anki = response.anki.status;
    if (response.anki.tags) knownTags = response.anki.tags;
  }
  if (response.ai) state.ai = response.ai;
  state.statusLine = "status refreshed";
  render();
}

function applyAnkiRuntimeResponse(response: RuntimeResponse<unknown>): void {
  if (!response.anki) return;
  state.anki = response.anki.status;
  if (response.anki.tags) knownTags = response.anki.tags;
}

async function captureContext(): Promise<void> {
  state.statusLine = "capturing context";
  render();
  const response = await sendRuntimeMessage<unknown>({ type: "idetic.capture-visible-context" });
  if (!response.ok || !response.conversation) {
    state.statusLine = response.error ?? "context capture failed";
    render();
    return;
  }
  state.activeConversation = response.conversation;
  state.statusLine = "context captured";
  render();
}

async function syncAnkiFromPopup(): Promise<void> {
  state.anki = { kind: "checking", label: "anki", detail: "syncing" };
  state.statusLine = "syncing Anki";
  render();

  const response = await sendRuntimeMessage<AnkiSyncRuntimeResult>({ type: "idetic.anki-sync" });
  applyAnkiRuntimeResponse(response as RuntimeResponse<unknown>);
  state.statusLine = response.ok ? "Anki synced" : response.error ?? response.result?.status.detail ?? "Anki sync failed";
  render();
}

async function writeCardToAnki(): Promise<void> {
  state.anki = { kind: "checking", label: "anki", detail: "writing" };
  state.statusLine = "writing Anki card";
  render();

  const response = await sendRuntimeMessage<AnkiSaveRuntimeResult>({ type: "idetic.anki-write", card: state.cardDraft });
  applyAnkiRuntimeResponse(response as RuntimeResponse<unknown>);

  const result = response.result;
  if (!result) {
    state.statusLine = response.error ?? "Anki write failed";
    render();
    return;
  }

  if (result.kind === "saved-and-synced" || result.kind === "saved-sync-failed") {
    state.cardDraft = { ...state.cardDraft, front: "", back: "" };
    await saveCardDraft(state.cardDraft);
    state.statusLine = result.kind === "saved-and-synced"
      ? "saved and synced"
      : `saved note ${result.noteId ?? ""}; sync failed`.trim();
    render();
    return;
  }

  const statusDetail = result.status.detail ?? response.error;
  if (result.kind === "duplicate") state.statusLine = "duplicate card; draft kept";
  if (result.kind === "invalid-deck-model") state.statusLine = statusDetail ?? "missing deck all or Basic model";
  if (result.kind === "validation-error") state.statusLine = statusDetail ?? "front and back are required";
  if (result.kind === "unavailable") state.statusLine = statusDetail ?? "Anki unavailable";
  if (result.kind === "error") state.statusLine = statusDetail ?? "Anki write failed";
  render();
}

async function connectAI(): Promise<void> {
  state.ai = { kind: "checking", label: "ai", detail: "opening OpenAI login" };
  state.statusLine = "opening OpenAI login";
  render();

  const response = await sendRuntimeMessage<unknown>({ type: "idetic.ai-connect" });
  if (response.ai) state.ai = response.ai;

  if (!response.ok) {
    state.ai = { kind: "error", label: "ai", detail: response.error };
    state.statusLine = response.error ?? "OpenAI login failed";
    render();
    return;
  }

  state.statusLine = "OpenAI login tab opened; reopen popup and :status after login";
  render();
}

async function sendChatDraft(): Promise<void> {
  if (assistantWaiting) {
    state.statusLine = "assistant still responding";
    render();
    return;
  }

  const text = chatDraft.trim();
  if (!text) return;

  chatDraft = "";
  assistantWaiting = true;
  state.activeConversation = {
    ...state.activeConversation,
    turns: [...state.activeConversation.turns, { role: "user", text, createdAt: new Date().toISOString() }],
  };
  state.statusLine = "Assistant is responding...";
  await saveChatDraft(chatDraft);
  render();

  const response = await sendRuntimeMessage<unknown>({ type: "idetic.ai-chat", text });
  assistantWaiting = false;
  if (response.conversation) state.activeConversation = response.conversation;
  if (response.ai) state.ai = response.ai;

  if (!response.ok) {
    state.statusLine = response.error ?? "AI request failed";
    render();
    return;
  }

  state.statusLine = state.activeConversation.sourceTagSuggestion
    ? `AI answered; tag ${state.activeConversation.sourceTagSuggestion}`
    : "AI answered";
  render();
}

async function executeCommand(input: string): Promise<void> {
  const resolution = resolveCommand(input);
  commandDraft = "";

  if (resolution.kind === "empty") {
    state.mode = "normal";
    render();
    return;
  }
  if (resolution.kind === "unknown") {
    state.mode = "normal";
    state.statusLine = `unknown command ${resolution.input}`;
    render();
    return;
  }
  if (resolution.kind === "ambiguous") {
    state.mode = "normal";
    state.statusLine = `ambiguous ${resolution.input}: ${resolution.matches.join(" ")}`;
    render();
    return;
  }

  const command = resolution.command.name;
  state.mode = "normal";
  if (command === "card") state.view = "card";
  if (command === "chat") state.view = "chat";
  if (command === "help") state.mode = "help";
  if (command === "quit") window.close();
  if (command === "status") await refreshStatus();
  if (command === "connect") await connectAI();
  if (command === "refresh") await captureContext();
  if (command === "clear") {
    state.activeConversation = await clearConversationOnly();
    chatDraft = "";
    await clearChatDraft();
    state.statusLine = "conversation cleared";
  }
  if (command === "send") await sendChatDraft();
  if (command === "sync") await syncAnkiFromPopup();
  if (command === "write") await writeCardToAnki();
  render();
}

function moveSelection(delta: 1 | -1): void {
  if (state.view === "card") {
    state.cardSelection = delta === 1 ? nextCardField(state.cardSelection) : previousCardField(state.cardSelection);
    render();
    return;
  }
  const order: ChatField[] = ["context", "messages", "input"];
  const current = order.indexOf(state.chatSelection);
  const next = Math.max(0, Math.min(order.length - 1, current + delta));
  state.chatSelection = order[next];
  render();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const next = toggleViewFromAnyMode({ mode: state.mode, view: state.view, cardSelection: state.cardSelection });
    state.mode = next.mode;
    state.view = next.view;
    state.cardSelection = next.cardSelection;
    render();
    return;
  }

  if (state.mode === "help") {
    if (event.key === "Escape") {
      event.preventDefault();
      state.mode = modeBeforeHelp === "help" ? "normal" : modeBeforeHelp;
      render();
    }
    return;
  }

  if (state.mode === "command") {
    if (event.key === "Escape") {
      event.preventDefault();
      commandDraft = "";
      state.mode = "normal";
      render();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      void executeCommand(commandDraft);
    }
    return;
  }

  if (state.mode === "insert") {
    if (event.key === "Escape") {
      event.preventDefault();
      state.mode = "normal";
      render();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      const candidate = selectedTagAutocompleteCandidate();
      if (!candidate) {
        state.statusLine = "no tag candidate";
        render();
        return;
      }
      state.cardDraft = { ...state.cardDraft, tags: applyTagAutocompleteCandidate(state.cardDraft.tags, candidate) };
      void saveCardDraft(state.cardDraft);
      state.statusLine = `tag ${candidate} accepted`;
      render();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      if (state.view === "chat" && state.chatSelection === "input") {
        event.preventDefault();
        void sendChatDraft();
        return;
      }
      if (state.view === "card") {
        event.preventDefault();
        state.cardSelection = nextCardField(state.cardSelection);
        state.mode = "insert";
        render();
        return;
      }
    }
    return;
  }

  if (state.mode === "normal") {
    if (event.key === "Escape") {
      event.preventDefault();
      window.close();
      return;
    }
    if (event.key === "i") {
      event.preventDefault();
      if (state.view === "chat" && state.chatSelection === "messages" && assistantWaiting) {
        state.statusLine = "assistant still responding";
        render();
        return;
      }
      if (state.view === "chat" && state.chatSelection === "context") state.chatSelection = "input";
      state.mode = "insert";
      render();
      return;
    }
    if (event.key === ":") {
      event.preventDefault();
      state.mode = "command";
      commandDraft = "";
      render();
      return;
    }
    if (event.key === "?") {
      event.preventDefault();
      modeBeforeHelp = state.mode;
      state.mode = "help";
      render();
      return;
    }
    if (event.key === "j") {
      event.preventDefault();
      moveSelection(1);
      return;
    }
    if (event.key === "k") {
      event.preventDefault();
      moveSelection(-1);
      return;
    }
    if (event.key === "[" || event.key === "]") {
      event.preventDefault();
      scrollSelectedChatMessages(event.key === "]" ? 1 : -1);
      return;
    }
  }
});

async function init(): Promise<void> {
  const [cardDraft, activeConversation, savedChatDraft] = await Promise.all([
    loadCardDraft(),
    loadActiveConversation(),
    loadChatDraft(),
  ]);
  state.cardDraft = cardDraft;
  state.activeConversation = activeConversation;
  chatDraft = savedChatDraft;
  render();
  await refreshStatus();
}

void init();
