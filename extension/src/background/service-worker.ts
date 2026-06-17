import { readAnkiReadiness } from "../platform/anki-connect";
import { captureVisibleContext } from "../platform/browser-context";
import { openAICodexErrorStatus, readOpenAICodexReadiness, sendOpenAICodexChat } from "../platform/openai-codex";
import { loadActiveConversation, replaceBrowserContext, saveActiveConversation } from "../platform/state-store";

type RuntimeMessage =
  | { type: "idetic.status" }
  | { type: "idetic.capture-visible-context" }
  | { type: "idetic.ai-chat"; text: string };

async function conversationWithContext() {
  const conversation = await loadActiveConversation();
  if (conversation.context) return conversation;
  const context = await captureVisibleContext();
  return replaceBrowserContext(context);
}

async function handleMessage(message: RuntimeMessage): Promise<unknown> {
  if (message.type === "idetic.status") {
    const [anki, ai] = await Promise.all([readAnkiReadiness(), readOpenAICodexReadiness()]);
    return { ok: true, anki, ai: ai.status };
  }

  if (message.type === "idetic.capture-visible-context") {
    const context = await captureVisibleContext();
    const conversation = await replaceBrowserContext(context);
    return { ok: true, context, conversation };
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
