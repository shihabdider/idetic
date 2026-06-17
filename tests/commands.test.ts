import { describe, expect, test } from "bun:test";
import { resolveCommand } from "../extension/src/core/commands";

describe("resolveCommand", () => {
  test("resolves unique prefixes", () => {
    expect(resolveCommand(":w")).toEqual({ kind: "resolved", command: { name: "write", summary: "create card and sync" } });
    expect(resolveCommand("se")).toEqual({ kind: "resolved", command: { name: "send", summary: "send chat draft" } });
    expect(resolveCommand("sy")).toEqual({ kind: "resolved", command: { name: "sync", summary: "retry Anki sync" } });
    expect(resolveCommand("co")).toEqual({ kind: "resolved", command: { name: "connect", summary: "connect OpenAI/Codex" } });
  });

  test("reports ambiguous vim-style prefixes", () => {
    expect(resolveCommand("s")).toEqual({ kind: "ambiguous", input: "s", matches: ["send", "sync", "status"] });
    expect(resolveCommand("c")).toEqual({ kind: "ambiguous", input: "c", matches: ["card", "chat", "connect", "clear"] });
  });

  test("reports unknown and empty commands", () => {
    expect(resolveCommand(":" )).toEqual({ kind: "empty" });
    expect(resolveCommand("nope")).toEqual({ kind: "unknown", input: "nope" });
  });
});
