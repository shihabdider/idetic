# Iteration

## Current Slice

Prepare implementation kickoff for archiving the legacy app and scaffolding the fresh Idetic MV3 extension.

## Goal

Move from approved alignment and architecture into the first safe implementation step without losing the legacy React/Express/Mongo app.

## Scope

- Treat `.ac/theory.md`, `.ac/dsl.md`, and `.ac/architecture.md` as the approved product and architecture context.
- Keep implementation bounded by the architecture module boundaries and watchpoints.
- Make the next implementation action explicit: archive the legacy app before deleting or replacing it.
- Do not modify or delete app code during this preparation slice.

## Acceptance Signals

- `.ac/todos.md` marks architecture complete and shows archive as the next implementation dependency.
- The next action is clear: create branch `archive/legacy-react-express-mongo`, commit the current legacy app there, then return to main.
- The old React/Express/Mongo app remains untouched until the archive step begins.
- No `.htdp` artifacts are created or used.

## First Implementation Checkpoint After Archive

After the archive branch exists, scaffold a fresh Bun + TypeScript MV3 extension monorepo. The first risk-reducing work should verify direct MV3 OpenAI/Codex calls using exported Skim credentials and verify MV3 AnkiConnect calls to `127.0.0.1:8765`.

## First Customer-Facing Checkpoint

Load the unpacked extension, open the popup with `MacCtrl+Shift+I`, see a plain TUI Card view with connection badges, switch to Chat with `Tab`, ask an AI question about captured visible-browser context, manually fill Front/Back/Tags, run `:w`, create a Basic note in Anki deck `all`, sync, and see Front/Back clear while Tags remain.

## Status

Theory, DSL, and architecture are approved. Implementation gates are clean. Current focus is kickoff preparation before archive and scaffold.
