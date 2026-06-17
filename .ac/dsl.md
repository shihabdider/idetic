# DSL

Abbreviations are shared glossary shortcuts, not mandatory code symbol names. Prefer abbreviations of 2 to 4 characters.

## Project Terms

- Full name: Idetic
  - Abbr: IDT
  - Meaning: The Chrome MV3 extension for browser-based AI-assisted learning and manual Anki card creation.

- Full name: Browser context
  - Abbr: BC
  - Meaning: The visible browser viewport captured as a screenshot for the active conversation.

- Full name: Context capture
  - Abbr: CC
  - Meaning: The first screenshot capture for a conversation.

- Full name: Context refresh
  - Abbr: CR
  - Meaning: Replacing the active conversation screenshot with a new visible-tab screenshot.

- Full name: Active conversation
  - Abbr: AC
  - Meaning: The one persisted AI conversation in MVP.

- Full name: Card draft
  - Abbr: CD
  - Meaning: The persisted manual Basic card form containing Front, Back, and Tags.

- Full name: Chat draft
  - Abbr: ChD
  - Meaning: The persisted unsent chat input text.

- Full name: Source tag
  - Abbr: ST
  - Meaning: The sole provenance marker saved on cards.

- Full name: Card view
  - Abbr: CV
  - Meaning: The popup view that shows Front, Back, and Tags together.

- Full name: Chat view
  - Abbr: ChV
  - Meaning: The popup view for asking AI about the active browser context.

- Full name: Normal mode
  - Abbr: NM
  - Meaning: Vim-like navigation and command mode.

- Full name: Insert mode
  - Abbr: IM
  - Meaning: Text-entry mode for chat input or card fields.

- Full name: Command mode
  - Abbr: CM
  - Meaning: Vim-style `:` command entry with unique-prefix matching.

- Full name: Help screen
  - Abbr: HS
  - Meaning: The `?` screen showing only currently implemented keys and commands.

- Full name: Status line
  - Abbr: SL
  - Meaning: Bottom message area for operation feedback, readiness, and errors.

- Full name: Connection badge
  - Abbr: CB
  - Meaning: Plain colored text label such as `anki` or `ai` showing connection state.

## External Systems

- Full name: AnkiConnect
  - Abbr: AKC
  - Meaning: The Anki add-on HTTP API at `http://127.0.0.1:8765`.

- Full name: Anki deck all
  - Abbr: DA
  - Meaning: The only Anki deck Idetic writes to.

- Full name: Basic note
  - Abbr: BN
  - Meaning: The Anki model used by MVP, with exactly Front and Back fields.

- Full name: OpenAI/Codex credentials
  - Abbr: OC
  - Meaning: OAuth credentials exported from Skim into a gitignored/generated extension module for MVP AI calls.

## General Abbreviations

- Full name: Chrome Manifest V3
  - Abbr: MV3
  - Meaning: The Chrome extension platform version used by Idetic.

- Full name: Minimum viable product
  - Abbr: MVP
  - Meaning: Ask AI, manually author a Basic card, save to Anki, and sync.

- Full name: Create, read, update, delete
  - Abbr: CRUD
  - Meaning: Full Anki card management. MVP includes create only.

- Full name: Text user interface
  - Abbr: TUI
  - Meaning: Plain keyboard-first interface style with minimal color and no decoration.
