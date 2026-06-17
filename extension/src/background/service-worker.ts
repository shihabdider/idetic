import { readAnkiReadiness } from "../platform/anki-connect";
import { captureVisibleContext } from "../platform/browser-context";
import { openAICredentialStatus } from "../platform/openai-codex";
import { replaceBrowserContext } from "../platform/state-store";

type RuntimeMessage =
  | { type: "idetic.status" }
  | { type: "idetic.capture-visible-context" };

async function handleMessage(message: RuntimeMessage): Promise<unknown> {
  if (message.type === "idetic.status") {
    const anki = await readAnkiReadiness();
    const ai = openAICredentialStatus();
    return { ok: true, anki, ai };
  }

  if (message.type === "idetic.capture-visible-context") {
    const context = await captureVisibleContext();
    const conversation = await replaceBrowserContext(context);
    return { ok: true, context, conversation };
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
