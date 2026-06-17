export type Mode = "normal" | "insert" | "command" | "help";

export type View = "card" | "chat";

export type CardField = "front" | "back" | "tags";

export type ChatField = "input" | "messages" | "context";

export interface CardDraft {
  front: string;
  back: string;
  tags: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export interface BrowserContext {
  screenshotDataUrl: string;
  title: string;
  domain: string;
  capturedAt: string;
}

export interface ActiveConversation {
  turns: ChatTurn[];
  context?: BrowserContext;
  sourceTagSuggestion?: string;
}

export type ConnectionKind = "checking" | "connected" | "disconnected" | "error";

export interface ConnectionStatus {
  kind: ConnectionKind;
  label: string;
  detail?: string;
}

export interface AppState {
  mode: Mode;
  view: View;
  cardSelection: CardField;
  chatSelection: ChatField;
  cardDraft: CardDraft;
  activeConversation: ActiveConversation;
  anki: ConnectionStatus;
  ai: ConnectionStatus;
  statusLine: string;
}

export const EMPTY_CARD_DRAFT: CardDraft = {
  front: "",
  back: "",
  tags: "",
};

export const EMPTY_CONVERSATION: ActiveConversation = {
  turns: [],
};

export function createInitialAppState(): AppState {
  return {
    mode: "normal",
    view: "chat",
    cardSelection: "front",
    chatSelection: "input",
    cardDraft: { ...EMPTY_CARD_DRAFT },
    activeConversation: { ...EMPTY_CONVERSATION, turns: [] },
    anki: { kind: "checking", label: "anki" },
    ai: { kind: "checking", label: "ai" },
    statusLine: "",
  };
}
