import type { BrowserContext } from "../core/types";

function domainFromUrl(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export async function captureVisibleContext(): Promise<BrowserContext> {
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = tabs[0] ?? {};
  const windowId = typeof tab.windowId === "number" ? tab.windowId : undefined;
  const screenshotDataUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "png" });

  return {
    screenshotDataUrl,
    title: typeof tab.title === "string" ? tab.title : "",
    domain: domainFromUrl(typeof tab.url === "string" ? tab.url : undefined),
    capturedAt: new Date().toISOString(),
  };
}
