# Iteration

## Current Slice

Spike direct OpenAI/Codex from the MV3 service worker.

## Goal

Verify the riskiest AI boundary before building the full popup workflow: exported Skim OpenAI/Codex credentials should let the MV3 service worker make a direct plain-text AI request, or the project should explicitly route to the native-host/local-gateway fallback.

## Completed

- Autocode theory, DSL, architecture, todos, and iteration artifacts are present.
- Legacy app was archived by committing the alignment state and creating `archive/legacy-react-express-mongo`.
- The active main worktree was replaced with a Bun + TypeScript MV3 extension scaffold.
- Popup UI was polished toward the warm Vim-like TUI direction with a bottom status bar.
- Status badges use full lowercase `anki` and `ai` labels aligned right.
- Card draft input persists across popup close.
- Chat draft input now persists across popup close and clears on send or `:cl[ear]`.
- `bun run verify` passes.
- `bun run check:no-secrets` passes.

## Scope

- Use the committed placeholder credentials module as the safe default.
- Export local Skim OpenAI/Codex credentials only for local testing and do not commit real credentials.
- Verify service-worker status can classify AI credentials as connected, disconnected, expired, or failed.
- Verify the service worker can call the required Codex endpoint directly and parse a plain-text response.
- Keep broad popup workflow implementation deferred until the AI and Anki external seams are understood.
- Preserve architecture watchpoints: no content scripts, no Markdown/LaTeX rendering, no Anki metadata beyond Front/Back/Tags.

## Acceptance Signals

- `bun run export:skim-creds` can seed local extension credentials from Skim.
- `bun run check:no-secrets` detects if real generated credentials would be committed.
- The unpacked extension reports `ai` connected when valid exported credentials are present.
- A service-worker AI spike produces one plain-text response from Codex, or fails with enough detail to choose the native-host/local-gateway fallback.
- Any changed hidden decision is routed back through `.ac/architecture.md` before broad implementation.

## Fresh Session Start

- Read `.ac/theory.md`, `.ac/dsl.md`, `.ac/architecture.md`, `.ac/todos.md`, and this file.
- Check `git status --short --branch`; the MV3 scaffold and UI polish are currently uncommitted in the active worktree.
- Run `bun run verify` and `bun run check:no-secrets` before continuing.
- Begin I07, the direct OpenAI/Codex MV3 spike.

## First Customer-Facing Checkpoint

Load the unpacked extension, open the popup with `MacCtrl+Shift+I`, see a plain TUI Card view with connection badges, switch to Chat with `Tab`, ask an AI question about captured visible-browser context, manually fill Front/Back/Tags, run `:w`, create a Basic note in Anki deck `all`, sync, and see Front/Back clear while Tags remain.

## Status

Popup scaffold, UI polish, and draft persistence are complete. Current focus is the direct OpenAI/Codex MV3 risk spike.
