# Architecture

## Requirement

Build a fresh Chrome MV3 Idetic extension that opens as a keyboard-first popup, lets the user ask AI about visible browser context, manually author a Basic Anki card, save it to deck `all`, and sync.

The old React/Express/Mongo app is not the architecture target. It stays untouched until archive-branch kickoff.

## Hidden Decisions and Owner Modules

### Runtime Shell

Hidden decision: how MV3 capabilities, popup lifetime, service worker lifetime, host permissions, and extension messaging are handled.

Stable surface:
- Open popup through `_execute_action` with `MacCtrl+Shift+I`.
- Provide service-worker operations for screenshot capture, AI calls, Anki calls, and status checks.
- Keep permissions minimal and expand only after spikes prove need.

Must not leak:
- OpenAI credentials into popup rendering code.
- Chrome API quirks into domain modules.
- Content scripts into MVP.

### Modal UI Model

Hidden decision: Vim-like interaction semantics.

Stable surface:
- Modes: Normal, Insert, Command, Help.
- Views: Card and Chat.
- `Tab` toggles Card/Chat from any mode and lands in Normal mode.
- `i` enters Insert.
- `Esc` in Normal closes popup.
- `?` shows current help only.
- Commands use unique-prefix matching.

Must not leak:
- Direct Anki or AI protocol details into UI event handling.
- Ambient shortcut hints into normal UI.

### Workflow Policy

Hidden decision: user-visible sequencing for chat, card writing, sync, clear, and errors.

Stable surface:
- First chat send captures context if none exists.
- `:w` creates Basic card then syncs.
- Duplicate card keeps draft intact.
- Create success plus sync failure still counts as saved.
- `:sy[nc]` retries sync.
- `:cl[ear]` clears conversation/context/source-tag suggestion only, not card draft or tags.

Must not leak:
- AnkiConnect result shapes directly into UI.
- AI source-tag prompting into card save policy.

### Persistent State Store

Hidden decision: how AC, BC, CD, ChD, ST suggestion, and screenshot bytes persist across popup closes and browser restarts.

Stable surface:
- Load and save one active conversation.
- Load and save one card draft.
- Load and save one chat draft.
- Load, replace, and clear one browser context screenshot.
- Persist until explicit clear.
- Hide whether screenshot bytes live in `chrome.storage.local` or IndexedDB.

Must not leak:
- Storage quotas or serialization details into UI/workflow modules.

### Browser Context Adapter

Hidden decision: how visible-tab screenshots and tab metadata are captured under MV3.

Stable surface:
- `captureVisibleContext` returns screenshot plus display-only title/domain/time.
- No DOM scraping.
- No content scripts.
- Capture active tab at send/refresh time, not popup-open time.

Must not leak:
- Tab URL/title metadata into Anki card fields.

### AI Provider Adapter

Hidden decision: OpenAI/Codex credential seeding, refresh, request format, response parsing, plain-text prompt policy, and source-tag extraction.

Stable surface:
- Report AI status.
- Send user message plus AC and BC.
- Return plain-text assistant message.
- Return optional hidden ST suggestion.
- Never generate unsolicited cards.

Must not leak:
- OAuth refresh tokens outside adapter/runtime shell.
- Markdown or LaTeX rendering assumptions into UI.

Fallback:
- If direct MV3 Codex calls fail, replace this adapter with native host or local gateway while preserving the same surface.

### Anki Gateway

Hidden decision: AnkiConnect protocol and Anki error classification.

Stable surface:
- Report Anki status.
- Verify deck `all` and model `Basic`.
- Fetch tags.
- Create Basic note with exact Front and Back fields.
- Reject duplicates.
- Sync.
- Classify create/sync partial failures.

Must not leak:
- AnkiConnect JSON RPC details into UI/workflow modules.
- `fastanki` assumptions into MVP.

### Tag Policy

Hidden decision: source tag format, normalization, autocomplete ranking, and candidate acceptance.

Stable surface:
- ST format is `firstauthor_YYYY_MM_DD`, shortened to available precision.
- Lowercase underscore normalization.
- Publication date, not watched date.
- AI must not invent missing precision.
- Candidates come from Anki tags plus hidden AI ST suggestion.
- `Ctrl+K` accepts highlighted autocomplete candidate.

Must not leak:
- Source URL/title/screenshot into card fields.

## Boundary Data

- AC: one active conversation with plain user/assistant turns.
- BC: one screenshot plus captured title/domain/time.
- CD: Front, Back, Tags.
- ChD: unsent chat input text.
- ST: one optional hidden source tag suggestion.
- Connection status: checking, connected, disconnected, error.
- Save result:
  - saved and synced
  - saved but sync failed
  - duplicate
  - Anki unavailable
  - invalid deck/model
  - validation error
  - unknown error

## Dependency Rules

- Popup UI may depend on Modal UI Model, Workflow Policy surface, State Store surface, and Tag Policy surface.
- Popup UI must not call OpenAI/Codex or AnkiConnect directly.
- Service worker/runtime shell owns external effects.
- AI Provider Adapter may depend on credential storage and fetch.
- Anki Gateway may depend on fetch to `127.0.0.1:8765`.
- Browser Context Adapter may depend on Chrome tabs/capture APIs.
- State Store hides Chrome storage and IndexedDB choices.

## Risk Spikes

### Direct AI from MV3

Verify:
- extension OAuth login can store OpenAI/Codex credentials
- service worker can call required Codex endpoint
- token refresh works or fails clearly
- plain text response can be parsed
- hidden ST suggestion can be produced

Fallback:
- native host or local gateway.

### AnkiConnect from MV3

Verify:
- extension can POST to `127.0.0.1:8765`
- `version`, deck/model checks, `getTags`, `addNote`, duplicate errors, and `sync` work
- failure states can be classified for the status line

### Screenshot context from popup flow

Verify:
- first chat send can capture active visible tab
- stored screenshot survives popup close/reopen
- refresh replaces old context
- context status shows captured tab/time clearly

## First Integrated Implementation Checkpoint

After archive and scaffold, the first full MVP checkpoint is:

- Load unpacked extension.
- Open popup with `MacCtrl+Shift+I`.
- See plain TUI Card view by default.
- See colored `anki` and `ai` badges.
- Toggle to Chat with `Tab`.
- Type in Insert mode and send with `Enter`.
- First send captures visible browser context.
- AI returns plain text.
- Hidden ST suggestion becomes tag autocomplete candidate.
- Toggle to Card.
- Fill Front, Back, Tags manually.
- Run `:w`.
- Create Basic note in deck `all`.
- Sync.
- Clear Front/Back and keep Tags.

## Change-Impact Checks

- If ST format changes, only Tag Policy and AI source-tag prompt should change.
- If direct MV3 Codex calls fail, only AI Provider Adapter and Runtime Shell should change.
- If screenshot storage exceeds quota, only Persistent State Store should change.
- If Anki deck/model policy changes, Workflow Policy and Anki Gateway should change, not UI fields.
- If lookup/CRUD is added later, add new Workflow Policy operations and Anki Gateway methods without changing MVP create semantics.

## Watchpoints

- Do not proceed with broad UI implementation before AI and Anki spikes.
- Do not add content scripts for MVP.
- Do not add Markdown/LaTeX rendering for MVP.
- Do not save URL/title/screenshot/conversation metadata to Anki cards.
- Do not delete legacy app before archive branch is created.
