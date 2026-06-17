# Idetic

Idetic is a local-first Chrome Manifest V3 extension for browser-based AI-assisted learning and manual Anki card creation.

The MVP opens as a keyboard-first TUI popup, lets the user ask AI about the current visible browser context, manually author a Basic Anki card, save it to Anki deck `all`, and sync immediately.

## Current direction

The old React/Express/Mongo PDF reader has been archived on `archive/legacy-react-express-mongo`. The active project is a fresh Bun + TypeScript MV3 extension.

## Development

```bash
bun install
bun run verify
```

Build the unpacked extension:

```bash
bun run build
```

Load `extension/` as an unpacked Chrome extension.

## MVP constraints

- Chrome MV3 action popup, not side panel.
- Vanilla TypeScript/JavaScript and CSS.
- No React.
- No content scripts.
- Anki through AnkiConnect at `http://127.0.0.1:8765`.
- AI through direct MV3 OpenAI/Codex calls authenticated by extension OAuth login.
- Basic Anki model only, deck `all` only.
- Cards contain exactly Front and Back; provenance is only a source tag.

## OpenAI/Codex login

Idetic connects to an OpenAI/Codex subscription from inside the extension. Load the unpacked extension, open the popup, run `:connect` (or `:co`), and complete the OpenAI login tab. Tokens are stored locally in Chrome extension storage and refreshed automatically.
