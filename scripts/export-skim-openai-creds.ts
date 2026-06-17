import { access, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface SkimCredentials {
  access: string;
  refresh: string;
  expires: number;
  accountId: string;
}

const home = process.env.HOME;
if (!home) throw new Error("HOME is required to locate Skim credentials.");

const sourcePath = process.env.SKIM_OPENAI_CREDS_PATH ?? join(home, "projects", "skim", "data", "auth", "openai-codex.json");
const outputPath = "extension/src/private/openai-creds.generated.ts";

function parseCredentials(raw: string): SkimCredentials {
  const parsed = JSON.parse(raw) as Partial<SkimCredentials>;
  if (
    typeof parsed.access !== "string" ||
    typeof parsed.refresh !== "string" ||
    typeof parsed.expires !== "number" ||
    typeof parsed.accountId !== "string"
  ) {
    throw new Error(`Skim credentials at ${sourcePath} are missing required OpenAI/Codex fields.`);
  }
  return parsed as SkimCredentials;
}

try {
  await access(sourcePath);
} catch {
  console.error(`Skim OpenAI/Codex credentials were not found at ${sourcePath}.`);
  console.error("Run Skim's OpenAI/Codex connection flow first, or set SKIM_OPENAI_CREDS_PATH to an exported credentials JSON file.");
  process.exit(1);
}

const credentials = parseCredentials(await readFile(sourcePath, "utf8"));
const content = `import type { OpenAICodexCredentials } from "../platform/openai-codex";\n\n// Generated from local Skim credentials for local-only Idetic MVP testing.\n// Do not commit this file with real credentials.\nexport const OPENAI_CODEX_CREDENTIALS: OpenAICodexCredentials | undefined = ${JSON.stringify(credentials, null, 2)};\n`;

await writeFile(outputPath, content, "utf8");
console.log(`wrote ${outputPath} from ${sourcePath}`);
