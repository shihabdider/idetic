export type CommandName =
  | "send"
  | "sync"
  | "write"
  | "card"
  | "chat"
  | "refresh"
  | "clear"
  | "status"
  | "help"
  | "quit";

export interface CommandSpec {
  name: CommandName;
  summary: string;
}

export const COMMANDS: readonly CommandSpec[] = [
  { name: "send", summary: "send chat draft" },
  { name: "sync", summary: "retry Anki sync" },
  { name: "write", summary: "create card and sync" },
  { name: "card", summary: "switch to card view" },
  { name: "chat", summary: "switch to chat view" },
  { name: "refresh", summary: "replace browser context" },
  { name: "clear", summary: "clear conversation context" },
  { name: "status", summary: "refresh connection status" },
  { name: "help", summary: "show help" },
  { name: "quit", summary: "close popup" },
] as const;

export type CommandResolution =
  | { kind: "empty" }
  | { kind: "unknown"; input: string }
  | { kind: "ambiguous"; input: string; matches: CommandName[] }
  | { kind: "resolved"; command: CommandSpec };

export function normalizeCommandInput(input: string): string {
  return input.trim().replace(/^:/, "").toLowerCase();
}

export function resolveCommand(input: string, commands: readonly CommandSpec[] = COMMANDS): CommandResolution {
  const normalized = normalizeCommandInput(input);
  if (normalized.length === 0) return { kind: "empty" };

  const exact = commands.find((command) => command.name === normalized);
  if (exact) return { kind: "resolved", command: exact };

  const matches = commands.filter((command) => command.name.startsWith(normalized));
  if (matches.length === 0) return { kind: "unknown", input: normalized };
  if (matches.length === 1) return { kind: "resolved", command: matches[0] };

  return { kind: "ambiguous", input: normalized, matches: matches.map((match) => match.name) };
}
