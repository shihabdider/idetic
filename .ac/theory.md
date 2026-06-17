# Theory

## Purpose

Idetic removes friction between browser-based learning, AI-assisted understanding, and Anki review.

The browser is the primary place for consuming text, video, and other media. Idetic should let the user ask about what they are seeing, manually author useful Anki cards, save them to Anki, and sync immediately without switching applications.

## Problem

Today, useful cards often never get created because the workflow requires switching from the browser to an LLM, then to Anki, then back. That friction blocks incremental card creation.

The user wants Anki to function as a personal knowledge base, but the MVP focuses on creation rather than lookup or full CRUD.

## Product Principles

- The user authors cards manually because making the card is part of learning.
- AI assists understanding; it does not auto-generate cards or bulk-suggest cards.
- Saving to Anki and syncing are part of the core workflow.
- Source provenance is represented only by tags, not URL/title/screenshot metadata on cards.
- The UI is keyboard-first, Vim-like, and plain TUI-style.
- The app should show connection state clearly instead of trying to launch Anki or hide failures.

## MVP Outcome

From Chrome, the user can open Idetic with `MacCtrl+Shift+I`, ask an AI question about the current visible browser context, manually fill a Basic Anki card, save it to deck `all`, and sync.

## MVP Constraints

- Chrome Manifest V3 extension.
- Popup UI, not side panel.
- Vanilla TypeScript/JavaScript and CSS.
- No React.
- No content scripts.
- Anki integration through AnkiConnect at `127.0.0.1:8765`.
- AI integration through direct MV3 OpenAI/Codex calls seeded from exported Skim credentials.
- Basic note model only.
- Deck is always `all`.

## Deferred

- Anki lookup and full CRUD.
- Cloze cards.
- Custom note models.
- Markdown rendering.
- LaTeX rendering.
- Transcript extraction.
- DOM scraping.
- Brave search or agentic browsing.
- Native host or local AI gateway unless direct MV3 Codex calls fail.

## Validation Signal

The first useful demo succeeds when a card can be created from the popup, saved into Anki deck `all`, synced, and later reviewed from another device.
