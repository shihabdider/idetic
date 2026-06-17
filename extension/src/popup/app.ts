import { resolveCommand } from "../core/commands";
import { nextCardField, previousCardField, toggleViewFromAnyMode } from "../core/modal";
import type { ActiveConversation, AppState, CardField, ChatField, ConnectionStatus, Mode } from "../core/types";
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

interface RuntimeResponse<T> {
  ok: boolean;
  error?: string;
  anki?: { status: ConnectionStatus; tags: string[] };
  ai?: ConnectionStatus;
  context?: T;
  conversation?: ActiveConversation;
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

function contextLine(): string {
  const context = state.activeConversation.context;
  if (!context) return "context none";
  const captured = new Date(context.capturedAt).toLocaleTimeString();
  const source = context.domain || context.title || "unknown";
  return `context ${source} ${captured}`;
}

function defaultStatusLine(): string {
  const draft = state.cardDraft;
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

function renderChatView(): string {
  const turns = state.activeConversation.turns.map((turn) => `${turn.role}> ${turn.text}`).join("\n\n");
  return `
    <section class="view" data-view="chat">
      <div class="context">${escapeHtml(contextLine())}</div>
      <div class="chat-log">${escapeHtml(turns || "")}</div>
      <div class="field selected">
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
    });

    element.addEventListener("focus", () => {
      const field = element.dataset.field;
      if (field === "front" || field === "back" || field === "tags") state.cardSelection = field;
      if (field === "chat-input") state.chatSelection = "input";
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

function focusSelectedIfInsert(): void {
  if (state.mode !== "insert") return;
  const selector = state.view === "card" ? `[data-field="${state.cardSelection}"]` : `[data-field="chat-input"]`;
  const element = app.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (!element) return;
  element.focus();
  const caret = element.value.length;
  element.setSelectionRange(caret, caret);
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
    knownTags = response.anki.tags;
  }
  if (response.ai) state.ai = response.ai;
  state.statusLine = "status refreshed";
  render();
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

async function sendChatDraft(): Promise<void> {
  const text = chatDraft.trim();
  if (!text) return;
  if (!state.activeConversation.context) await captureContext();
  state.activeConversation = {
    ...state.activeConversation,
    turns: [...state.activeConversation.turns, { role: "user", text, createdAt: new Date().toISOString() }],
  };
  chatDraft = "";
  state.statusLine = "AI spike pending";
  await Promise.all([saveActiveConversation(state.activeConversation), saveChatDraft(chatDraft)]);
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
  if (command === "refresh") await captureContext();
  if (command === "clear") {
    state.activeConversation = await clearConversationOnly();
    chatDraft = "";
    await clearChatDraft();
    state.statusLine = "conversation cleared";
  }
  if (command === "send") await sendChatDraft();
  if (command === "sync") state.statusLine = "Anki sync spike pending";
  if (command === "write") state.statusLine = "Anki write spike pending";
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
      state.statusLine = knownTags.length === 0 ? "no tag candidate" : "tag autocomplete spike pending";
      render();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      if (state.view === "chat") {
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
