# Iteration

## Current Slice

Spike AnkiConnect from the MV3 service worker.

## Goal

Verify the Anki boundary before building the full save workflow: the MV3 service worker should be able to reach AnkiConnect at `127.0.0.1:8765`, classify readiness, verify deck `all` and model `Basic`, fetch tags, create a Basic note, classify duplicates, and sync.

## Completed

- Autocode theory, DSL, architecture, todos, and iteration artifacts are present.
- Legacy app was archived by committing the alignment state and creating `archive/legacy-react-express-mongo`.
- The active main worktree was replaced with a Bun + TypeScript MV3 extension scaffold.
- Popup UI was polished into a keyboard-first TUI shell with bottom status bar and full `anki` and `ai` badges.
- Card draft and chat draft persistence are implemented.
- Chat is now the default popup entry view.
- The Idetic pink brain/circuit icon was restored for the MV3 extension and popup favicon.
- The popup theme now uses light gray flat colors with pink/teal/yellow accents from the icon.
- Direct OpenAI/Codex calls from the service worker are implemented through the AI Provider Adapter.
- OpenAI/Codex service-worker calls were verified locally with a live plain-text `gpt-5.5` response.
- Extension `:connect` OpenAI login is verified and stores credentials in Chrome extension storage.
- AI readiness classifies credentials as connected, disconnected, expired, or failed.
- The chat UI clears input immediately on send, shows the sent user message, displays a waiting assistant message, supports editable chat transcript mode, and has normal-mode message scrolling.
- `bun run verify` passes.
- OpenAI/Codex credentials are no longer stored in generated source modules.

## Scope

- Keep direct Anki protocol details inside the Anki Gateway and service-worker runtime shell.
- Verify MV3 can POST to `http://127.0.0.1:8765`.
- Verify AnkiConnect `version`, `deckNames`, `modelNames`, `getTags`, `addNote`, duplicate classification, and `sync` behavior.
- Keep broad card-save workflow implementation deferred until the Anki seam is understood.
- Preserve architecture watchpoints: no content scripts, no Markdown/LaTeX rendering, no URL/title/screenshot metadata saved to Anki cards.

## Acceptance Signals

- The unpacked extension reports `anki` connected when AnkiConnect is available with deck `all` and model `Basic`.
- Anki unavailable, missing deck/model, duplicate note, create success, sync success, and sync failure are distinguishable enough for workflow status messages.
- A local spike can create one Basic note in deck `all` through AnkiConnect and sync it, or fails with enough detail to choose a fallback or revise scope.
- `bun run verify` passes.
- OpenAI/Codex credentials are stored only in local Chrome extension storage.

## Fresh Session Start

- Read `.ac/theory.md`, `.ac/dsl.md`, `.ac/architecture.md`, `.ac/todos.md`, and this file.
- Check `git status --short --branch`.
- Run `bun run verify` before continuing.
- Begin I08, the AnkiConnect MV3 spike.

## First Customer-Facing Checkpoint

Load the unpacked extension, open the popup with `MacCtrl+Shift+I`, see Chat view by default with connection badges, ask an AI question about captured visible-browser context, manually fill Front/Back/Tags, run `:w`, create a Basic note in Anki deck `all`, sync, and see Front/Back clear while Tags remain.

## Status

I07 is complete. Current focus is the AnkiConnect MV3 risk spike.
