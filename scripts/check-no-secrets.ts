import { readFile } from "node:fs/promises";

const path = "extension/src/private/openai-creds.generated.ts";
const content = await readFile(path, "utf8");
const hasRealCredentialShape = /["']?access["']?\s*:\s*"[^"]+"/.test(content) || /["']?refresh["']?\s*:\s*"[^"]+"/.test(content);

if (hasRealCredentialShape) {
  console.error(`${path} appears to contain real OpenAI/Codex credentials.`);
  console.error("Revert it to the placeholder before committing.");
  process.exit(1);
}

console.log("no generated OpenAI/Codex credentials detected");
