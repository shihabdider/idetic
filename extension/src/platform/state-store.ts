import type { ActiveConversation, BrowserContext, CardDraft } from "../core/types";
import { EMPTY_CARD_DRAFT, EMPTY_CONVERSATION } from "../core/types";

const CARD_DRAFT_KEY = "idetic.cardDraft";
const CHAT_DRAFT_KEY = "idetic.chatDraft";
const ACTIVE_CONVERSATION_KEY = "idetic.activeConversation";

async function storageGet<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] ?? fallback) as T;
}

async function storageSet<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function loadCardDraft(): Promise<CardDraft> {
  return storageGet<CardDraft>(CARD_DRAFT_KEY, { ...EMPTY_CARD_DRAFT });
}

export async function saveCardDraft(draft: CardDraft): Promise<void> {
  await storageSet(CARD_DRAFT_KEY, draft);
}

export async function loadChatDraft(): Promise<string> {
  return storageGet<string>(CHAT_DRAFT_KEY, "");
}

export async function saveChatDraft(draft: string): Promise<void> {
  await storageSet(CHAT_DRAFT_KEY, draft);
}

export async function clearChatDraft(): Promise<void> {
  await storageSet(CHAT_DRAFT_KEY, "");
}

export async function loadActiveConversation(): Promise<ActiveConversation> {
  return storageGet<ActiveConversation>(ACTIVE_CONVERSATION_KEY, { ...EMPTY_CONVERSATION, turns: [] });
}

export async function saveActiveConversation(conversation: ActiveConversation): Promise<void> {
  await storageSet(ACTIVE_CONVERSATION_KEY, conversation);
}

export async function replaceBrowserContext(context: BrowserContext): Promise<ActiveConversation> {
  const conversation = await loadActiveConversation();
  const updated = { ...conversation, context };
  await saveActiveConversation(updated);
  return updated;
}

export async function clearConversationOnly(): Promise<ActiveConversation> {
  const empty = { ...EMPTY_CONVERSATION, turns: [] };
  await saveActiveConversation(empty);
  return empty;
}
