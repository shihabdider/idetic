# Iteration

## Current Slice

Implement first integrated MVP.

## Goal

Finish the end-to-end browser-to-Anki loop: the popup should let the learner ask AI about visible browser context, manually fill Front/Back/Tags, run `:w`, create a Basic note in Anki deck `all`, sync, and leave clear status feedback while preserving the right draft state.

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
- AnkiConnect readiness is implemented through the Anki Gateway: `version`, deck `all`, model `Basic`, and `getTags`.
- AnkiConnect write/sync boundary is implemented and tested: Basic `addNote`, duplicate classification, missing deck/model classification, sync success, sync failure after save, and unavailable Anki.
- A live local AnkiConnect spike created a temporary Basic note in deck `all`, observed duplicate classification, synced, deleted the temporary note, and synced again.
- Popup `:w` writes the current card through the Anki Gateway and clears Front/Back on saved results while keeping Tags.
- Popup `:sync` retries Anki sync through the Anki Gateway.
- `bun run verify` passes.
- OpenAI/Codex credentials are no longer stored in generated source modules.

## Scope

- Complete MVP workflow polish around the already wired Chat and Anki boundaries.
- Keep direct Anki protocol details inside the Anki Gateway and service-worker runtime shell.
- Keep direct OpenAI/Codex details inside the AI Provider Adapter and service-worker runtime shell.
- Ensure `:w` creates a Basic note with exact Front and Back fields, syncs, and distinguishes duplicate, validation, unavailable Anki, invalid deck/model, saved-and-synced, and saved-but-sync-failed states.
- Finish hidden source-tag suggestion and tag autocomplete only if needed for the first integrated MVP feedback loop.
- Preserve architecture watchpoints: no content scripts, no Markdown/LaTeX rendering, no URL/title/screenshot metadata saved to Anki cards.

## Acceptance Signals

- The unpacked extension reports `anki` connected when AnkiConnect is available with deck `all` and model `Basic`.
- The unpacked extension reports `ai` connected after `:connect` login.
- First chat send captures visible-browser context and receives a plain-text AI answer.
- Card view lets the learner manually fill Front/Back/Tags.
- `:w` creates a Basic note in deck `all`, syncs, clears Front/Back, and keeps Tags.
- Duplicate card keeps the draft intact and reports duplicate clearly.
- Create success plus sync failure still counts as saved and clears Front/Back while reporting sync failure.
- `:sync` retries sync and reports success/failure clearly.
- `bun run verify` passes.
- OpenAI/Codex credentials are stored only in local Chrome extension storage.

## Fresh Session Start

- Read `.ac/theory.md`, `.ac/dsl.md`, `.ac/architecture.md`, `.ac/todos.md`, and this file.
- Check `git status --short --branch`.
- Run `bun run verify` before continuing.
- Begin I09, the first integrated MVP feedback slice.

## First Customer-Facing Checkpoint

Load the unpacked extension, open the popup with `MacCtrl+Shift+I`, see Chat view by default with connection badges, ask an AI question about captured visible-browser context, manually fill Front/Back/Tags, run `:w`, create a Basic note in Anki deck `all`, sync, and see Front/Back clear while Tags remain.

## Status

I08 is complete. Current focus is I09, the first integrated MVP feedback slice.
