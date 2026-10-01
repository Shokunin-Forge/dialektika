---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Two models debate live in one arena**
  Becomes usable: A running app where you enter a topic and two model ids, press Start, and watch the defender open and the opposer rebut it live, turn by turn, in a two-column arena.
  Why now: This is the unique kernel — the referee loop that runs the models one after another and merges their turns into one stream. It carries bootstrapping (scaffold, deps, config), so it proves the whole path end to end and retires the spec's one unfamiliar risk: merging sequentially streamed turns into a single ordered browser stream.
  PRD ref: `prd.md > The Core Journey` (steps 1-8), `prd.md > Features and Behavior > The debate`
  Spec ref: `spec.md > Components`, `spec.md > Data Model` (the live stream), `spec.md > File Structure`, `spec.md > Decisions and Open Issues` (the agreed merged-stream check)
  Build: Scaffold the Next.js (App Router, TypeScript) project per the spec's file structure and install dependencies (`ai`, `@openrouter/ai-sdk-provider`, `zod`, `docx`; dev: `typescript`, `vitest`, eslint) with `npm run dev|test|lint|typecheck`. Add `lib/types.ts`, the pure `lib/orchestrator.ts` (defender opens, sides alternate, stop after the rounds), `lib/stream-protocol.ts` (tagged events + serialize/parse), `lib/openrouter.ts` (provider from `OPENROUTER_API_KEY`, server-only), `lib/debate-runner.ts` (run a turn, tag and forward chunks, append), and `app/api/debate/route.ts` (validate, run the loop, stream NDJSON, clear error if the key is missing). Minimal setup on `app/page.tsx` (topic, two model ids, defender/opposer assignment, rounds default 3, Jev off) and the arena `app/debate/[id]/page.tsx` with `Arena.tsx` + `TurnCard.tsx` (two columns, side accents, auto-scroll, live streaming) following `spec.md > Look and Feel`. Add `lib/__tests__/orchestrator.test.ts` and `stream-protocol.test.ts`.
  Verify (mechanical): `npm run test` passes — orchestrator turn-order/round/role tests, stream-protocol round-trip, and an integration test that chains two sequential `streamText` calls through the runner and asserts the merged chunks keep turn order and side/round boundaries. `npm run lint` and `npm run typecheck` are clean. `npm run dev` boots with no errors; then run one debate against a small/cheap model and read the NDJSON: `turn-start`/`turn-chunk`/`turn-end` alternate defender→opposer in order, then `done`.
  Learner check: Open http://localhost:3000 (set `OPENROUTER_API_KEY` first), enter a topic and two model ids (e.g. a Claude and a GPT model), press Start, and watch the defender open and the opposer rebut it live in the two columns. Does the back-and-forth read as a real debate?
  Commit: `Add live two-model debate arena`

- [ ] **2. Pick models by name from a searchable list**
  Becomes usable: Instead of typing model ids, you pick both models by name from searchable dropdowns of OpenRouter's list, and if the list can't be fetched you can still type an id by hand.
  Why now: The kernel is already proven with manual ids, so the model-list fetch — the one external call with unverified response fields — now sits on a working app and can fail safely into the manual fallback.
  PRD ref: `prd.md > Features and Behavior > Setup and model selection`
  Spec ref: `spec.md > Components > Models API`, `spec.md > External Services and Dependencies` (OpenRouter list models), `spec.md > Important Failure Modes` (model list fetch fails)
  Build: Add `app/api/models/route.ts` proxying `GET https://openrouter.ai/api/v1/models` and returning `{ id, name }[]`, cached in memory and mirrored to local storage; add `components/ModelPicker.tsx` (searchable) and `components/DebateSetup.tsx`; replace the manual id inputs with the pickers, keeping manual-id entry as the fallback when the fetch fails. Confirm at build start whether the request needs the auth header and which fields are present, and pin versions.
  Verify (mechanical): `npm run test` passes a model-list parse + manual-fallback unit test; `npm run lint`/`typecheck` clean. Start the dev server and hit `GET /api/models` — confirm it returns `{ id, name }[]` and that a failed fetch falls back to manual entry.
  Learner check: Open the setup screen, search and pick both models by name, and confirm the names display and the selection sticks.
  Commit: `Add searchable OpenRouter model pickers`

- [ ] **3. Jev weighs the debate**
  Becomes usable: With Jev toggled on, a finished debate ends with a verdict panel — per-axis scores for both sides, the stronger side, the cited decisive turns, and the crystallization.
  Why now: The debate loop works and is flexible, so the judge can now consume a full, real debate; the structured-output API is the next unfamiliar surface to pin down and test.
  PRD ref: `prd.md > Features and Behavior > Jev's adjudication`
  Spec ref: `spec.md > Components > Judge`, `spec.md > Data Model` (Verdict), `spec.md > Stack` (AI SDK structured output), `spec.md > Decisions and Open Issues`
  Build: Add `lib/judge.ts` — build the prompt from the full debate, request structured output against a Zod schema, map to the `Verdict` shape, apply the opposition tie-break (verify the exact current structured-output API name before writing it); expose `judge()` in `lib/openrouter.ts`; add the Jev toggle to the setup; run the judge after the final round in `app/api/debate/route.ts` and stream a `verdict` event; add `components/JevPanel.tsx` and render it in the arena. Add `lib/__tests__/judge.test.ts`.
  Verify (mechanical): `npm run test` passes judge score-parsing and tie-break tests; `lint`/`typecheck` clean. Run a debate with Jev on and read the stream — a `verdict` event with both sides' axis scores, `strongerSide`, `decisiveTurns`, and `crystallization`, and a level score resolving to the opposer.
  Learner check: Toggle Jev on, run a short debate, and read the verdict panel. Do the scores, the named stronger side, the cited turns, and the crystallization give you a defensible call plus insight?
  Commit: `Add Jev adjudication and verdict panel`

- [ ] **4. Failures surface instead of hanging**
  Becomes usable: A missing or invalid API key is reported clearly, and a model call that fails mid-debate shows an inline error on that turn with a Retry that resumes the run.
  Why now: Live model calls, rate limits, and network hiccups are the realistic failure surface, and the arena is now worth protecting from silent stalls before history and export build on top of it.
  PRD ref: `prd.md > States and Boundaries` (error cases), `prd.md > Product Decisions`
  Spec ref: `spec.md > Important Failure Modes`
  Build: Surface a clear key message on the setup screen / Start when `OPENROUTER_API_KEY` is missing or rejected; emit an `error` stream event tagged with side/round when a turn fails, render it inline in `TurnCard` with a Retry action, and have Retry resume the same debate from the failed turn; make the judge retry once on a schema failure, then show a labeled plain-text verdict with no scores.
  Verify (mechanical): `npm run test` passes the error-event and judge-fallback unit tests; `lint`/`typecheck` clean. Manually force a failure (blank the key, then a bad model id) and confirm: a clear key message, an inline turn error, and a Retry that completes the run.
  Learner check: Force a failure — remove the key, then run a debate with a bad model id — and confirm you get a clear error and, mid-debate, a Retry that picks the run back up.
  Commit: `Handle API key and mid-debate failures`

- [ ] **5. Revisit a past debate**
  Becomes usable: Every completed debate is saved in the browser and listed on the setup screen; opening one re-reads the full debate in the arena, read-only.
  Why now: Only now is there a finished, correct debate worth persisting, so the storage shape is settled rather than speculative.
  PRD ref: `prd.md > Features and Behavior > History and export` (save + re-open), `prd.md > States and Boundaries` (persistence, always start empty)
  Spec ref: `spec.md > Components > Storage`, `spec.md > Data Model` (Debate record, where data lives)
  Build: Add `lib/storage.ts` saving/loading debates under the versioned key `dialektika.debates.v1`, write once on `done`, never auto-restore into setup; add `components/HistoryList.tsx` on the setup screen; opening an item routes to the arena in read-only mode (same view re-rendering from storage).
  Verify (mechanical): `npm run test` passes a storage save/load round-trip test; `lint`/`typecheck` clean. Run a debate, reload the setup screen, and confirm the debate is listed and re-reads fully; confirm the setup screen still starts empty.
  Learner check: Run a debate, then find it in the history list on the setup screen and open it to re-read the whole exchange.
  Commit: `Save debates and add history re-read`

- [ ] **6. Download a debate as .docx**
  Becomes usable: Any saved debate can be downloaded as a `.docx` and opened in Word or Google Docs.
  Why now: The debate record is stored and proven, so the export is a pure read of settled data — the last piece of the core journey, with no open dependencies.
  PRD ref: `prd.md > Features and Behavior > History and export`
  Spec ref: `spec.md > Components > Export`
  Build: Add `lib/export-docx.ts` building a document from the saved debate (topic, roles, every turn, Jev's verdict when present) and triggering the browser download; add a **Download as .docx** action per item in `HistoryList`.
  Verify (mechanical): `npm run test` passes a test that a `.docx` is built from a sample debate; `lint`/`typecheck` clean. Generate a file from a saved debate and confirm it opens as a valid document containing the topic, turns, and verdict.
  Learner check: From a saved debate, click Download as .docx and open the file in Word or Google Docs. Does it read cleanly?
  Commit: `Add .docx export`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after the live debate kernel (slice 1): does the two-column streaming debate feel right, and does it change what you want from the rest?
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions

- Split the debate system prompt out of `messages` into the AI SDK's `instructions` option, and surfaced model failures from `fullStream` — the build discovered that AI SDK v7 rejects a `system` message inside `messages`, and that consuming `textStream` silently swallows provider errors, so a failed turn looked like a successful empty turn.
