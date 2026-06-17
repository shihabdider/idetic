# Todos

## Iteration DAG

- [x] I01 — Capture product theory
  - depends on: none
  - artifact: `.ac/theory.md`

- [x] I02 — Capture project DSL
  - depends on: I01
  - artifact: `.ac/dsl.md`

- [x] I03 — Derive architecture
  - depends on: I02
  - artifact: `.ac/architecture.md`
  - outcome: module boundaries, hidden decisions, risk spikes, and first implementation slice are explicit

- [x] I04 — Prepare implementation kickoff
  - depends on: I03
  - artifacts: `.ac/iteration.md`, `.ac/todos.md`
  - outcome: active slice is ready for implementation but code is not changed yet

- [x] I05 — Archive legacy app
  - depends on: I04
  - outcome: create branch `archive/legacy-react-express-mongo`, commit current legacy app there, return to main

- [x] I06 — Scaffold fresh MV3 monorepo
  - depends on: I05
  - outcome: replace legacy active tree with Bun + TypeScript MV3 extension skeleton

- [x] I06a — Polish popup shell and persist drafts
  - depends on: I06
  - outcome: warm Vim-like bottom status bar, full right-aligned `anki` and `ai` labels, card draft persistence, chat draft persistence, and checks passing

- [ ] I07 — Spike direct OpenAI/Codex from MV3
  - depends on: I06a
  - outcome: verify exported Skim OAuth credentials can support direct service-worker AI calls, or route to native-host/local-gateway fallback

- [ ] I08 — Spike AnkiConnect from MV3
  - depends on: I06a
  - outcome: verify status, deck/model checks, tags, duplicate behavior, addNote, and sync through `127.0.0.1:8765`

- [ ] I09 — Implement first integrated MVP
  - depends on: I07, I08
  - outcome: popup supports Card/Chat views, modal UI, persisted state, screenshot context, AI chat, Basic card save, sync, and status feedback

## Notes

- Do not use `.htdp`.
- Legacy app is preserved on `archive/legacy-react-express-mongo`.
- Keep implementation bounded by `.ac/architecture.md`.
- Use `autocode isolate` before independent worktree implementation.
