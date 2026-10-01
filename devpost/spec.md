---
doc: spec
status: approved
---

# Dialektika — Technical Spec

## How This Works, In Plain Language

Dialektika is a small web app that runs on your own machine. There's no server you have to keep online and no database — the browser holds everything.

- **The setup screen** is a Next.js page. You pick two models, assign who defends and who opposes, type a topic, toggle Jev, and choose the number of rounds.
- When you press **Start**, the browser sends one request to a small **API route** that lives inside the same app. That route is the debate referee: it asks the first model to argue, streams the answer back to your browser as it's written, then hands that answer to the other model and asks it to rebut, and keeps going for the chosen number of rounds.
- The models themselves are reached through **OpenRouter** — one account and one key that reaches hundreds of models. The app talks to it using the **Vercel AI SDK**, which handles the streaming for us.
- **Jev** is the last step: the same route asks one more model to score both sides and write the crystallization, and streams that back too.
- Finished debates are saved in **local storage** — the browser's own sticky-note storage — so you can open the history and re-read them later, or download one as a `.docx`.

Why this shape, rather than something bigger: it's one app, one key, no login, and no hosting. The single clever piece is the referee loop that runs the models one after another and merges their answers into one continuous stream for the browser — everything else is ordinary.

## The Core Journey Through the System

Traced from `prd.md > The Core Journey`:

1. You open the app → the Next.js **setup page** renders empty (nothing restored).
2. It fetches the model list once from **`/api/models`** (which asks OpenRouter) and fills the two dropdowns.
3. You pick models, roles, topic, rounds, Jev → all in browser memory.
4. You press Start → the browser POSTs the setup to **`/api/debate`** and opens a stream.
5. The route's **orchestrator** decides the first speaker (the defender). It calls `streamText` (AI SDK → OpenRouter) for that model.
6. Each text chunk is **tagged with side + round** and forwarded down the stream; the browser drops each chunk into the matching column of the **arena**.
7. The finished turn text is appended to the history and passed to the *other* model as the next turn's context; the loop repeats for the chosen rounds.
8. If Jev is on, the route runs the **judge** — a structured call that returns scores, the stronger side, cited turns, and the crystallization — and streams it as the final event.
9. The assembled debate is written to **local storage** and appears in the **history** list.
10. Re-opening a saved debate re-reads it from local storage; a **Download as .docx** button generates the file in the browser.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript** — the app shell, the setup/arena pages, and the API routes. Carried forward from the learner's stated stack. Docs: https://nextjs.org/docs
- **Vercel AI SDK** — `ai` (the v7 line). Provides `streamText` and the structured-output API, and streams responses cleanly from a route handler. Docs: https://ai-sdk.dev/docs
- **OpenRouter provider** — `@openrouter/ai-sdk-provider` **v3** (supports `ai@^7`). Docs: https://ai-sdk.dev/v5/providers/community-providers/openrouter and https://openrouter.ai/docs/guides/community/vercel-ai-sdk
- **Zod** — validates the judge's structured output. Docs: https://zod.dev
- **`docx`** — builds the `.docx` file in the browser. Docs: https://docx.js.org
- **Vitest** — the test runner behind `npm run test` (unit tests for the orchestrator and parsing; fast, TypeScript-native). Docs: https://vitest.dev
- **ESLint** + **`tsc --noEmit`** — lint and typecheck, carried forward.

**Verify early in the build (versions move fast):** `@openrouter/ai-sdk-provider` v3 requires **Node 22+** and is **ESM-only**; `generateObject`/`streamObject` are being deprecated in favor of `generateText`/`streamText` with an `output` setting, so confirm the exact API name for the judge call before writing it. These were read from current docs at spec time, not executed.

## Where It Runs and How Someone Tries It

- **Runtime:** a local Next.js app; **Node 22 or newer** (required by the provider). No hosting, no database.
- **Environment:** `OPENROUTER_API_KEY` in `.env.local` (git-ignored). Never exposed to the browser — it's used only inside the API routes.
- **Start it:** `npm install`, then `npm run dev`, and open **http://localhost:3000**.
- **Tests:** `npm run test` (Vitest). Lint/typecheck: `npm run lint` and `npm run typecheck`.
- **Demo recording:** start the app, pick two models (e.g. Claude opposing, GPT defending), enter a topic like "Should humans build RSI?", press Start, let the arena stream a round or two, show Jev's verdict, then show the saved debate in history and the `.docx` download.
- **Submission:** a short demo video plus a **public GitHub repository**. **Deployment is optional and intentionally out of scope** — a recording of the local app is sufficient and is not replaced by any deploy.

## Look and Feel

Carried forward from `prd.md > Look and Feel`:

- **Dark arena theme** — near-black/slate background; turn "cards" with subtle borders; generous spacing.
- **Side accents:** cool **blue** for the defender, warm **amber** for the opposer — so the head-to-head reads instantly.
- **Jev** gets a distinct **neutral-violet** full-width panel below the columns, like a judge's bench.
- **Typography:** one clean modern sans-serif (system stack, or Inter if bundled); body text comfortable, labels (round/model/role) small and unobtrusive.
- **Live streaming is the centerpiece** — text appears as it's written, and the view auto-scrolls to the active turn.
- Implementation is plain CSS with Tailwind or CSS Modules — nothing here needs a component library; keep it lightweight.

## Components

### Setup screen (`app/page.tsx`)

The empty-every-time entry surface. Two **ModelPicker** dropdowns (searchable), role assignment, topic input, Jev toggle, rounds selector (default 3), a Start button, and the **HistoryList**. Start is disabled until both models and a topic are present.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Features and Behavior > Setup and model selection`.

### Debate arena (`app/debate/[id]/page.tsx`)

Two columns (defender left, opposer right). Consumes the debate stream and renders each **TurnCard** in its column, with round dividers and auto-scroll. The same view re-renders a saved debate from local storage in read-only mode.
PRD ref: `prd.md > Screens and Layout`, `prd.md > Features and Behavior > The debate`.

### TurnCard (`components/TurnCard.tsx`)

Renders one turn: the streamed text, and a small label (`model · role · Round N`). Shows a spinner while streaming and an inline error if the turn failed.
PRD ref: `prd.md > States and Boundaries`.

### JevPanel (`components/JevPanel.tsx`)

Renders the verdict: per-axis scores for each side, the named stronger side, the cited decisive turns, and the crystallization. Hidden when Jev is off.
PRD ref: `prd.md > Features and Behavior > Jev's adjudication`.

### HistoryList (`components/HistoryList.tsx`)

Lists saved debates from local storage; opening one routes to the arena in read-only mode; a **Download as .docx** action per item.
PRD ref: `prd.md > Features and Behavior > History and export`.

### Models API (`app/api/models/route.ts`)

`GET` — fetches OpenRouter's model list and returns `{ id, name }[]` for the dropdowns. Caches the result (in-memory, and mirrored to local storage) so the list isn't refetched on every visit. Falls back to a manual model-id entry if the fetch fails.
PRD ref: `prd.md > Features and Behavior > Setup and model selection`.

### Debate API (`app/api/debate/route.ts`)

`POST` — the referee. Validates the request, runs the orchestrator loop, streams tagged events, optionally runs the judge, and ends. Reads the API key server-side only.
PRD ref: `prd.md > Features and Behavior > The debate`.

### Orchestrator (`lib/orchestrator.ts`)

**Pure logic, the main unit-test target.** Given the debate config and the turns so far, it answers: *who speaks next, and what message history do we send them?* Encodes the rules — defender opens, sides alternate, stop after the chosen rounds, roles carry the burden of proof. No network, no framework.
PRD ref: `prd.md > Features and Behavior > The debate`.

### Debate runner (`lib/debate-runner.ts`)

The loop's plumbing: calls the orchestrator, invokes `streamText` for the next turn, forwards and accumulates chunks, appends the finished turn, and repeats. The thin layer around the pure orchestrator.
PRD ref: `prd.md > Features and Behavior > The debate`.

### Stream protocol (`lib/stream-protocol.ts`)

Defines the tagged event shapes sent to the browser (see **Data Model**) and their serialize/parse helpers. Keeping this in one tested module is what makes the merged stream reliable.
PRD ref: `prd.md > Features and Behavior > The debate`.

### Judge (`lib/judge.ts`)

Builds Jev's prompt from the full debate, requests structured output against a Zod schema, and maps it to the verdict shape. Applies the burden-of-proof tie-break if the scores are level.
PRD ref: `prd.md > Features and Behavior > Jev's adjudication`.

### OpenRouter client (`lib/openrouter.ts`)

Creates the AI SDK provider instance from `OPENROUTER_API_KEY`; exposes `streamTurn()` and `judge()`. The only place the key is read.
PRD ref: `prd.md > The Core Journey`.

### Storage (`lib/storage.ts`)

Saves and loads debates in local storage under one versioned key. Never auto-restores into the setup screen.
PRD ref: `prd.md > States and Boundaries`, `prd.md > Product Decisions`.

### Export (`lib/export-docx.ts`)

Builds a `.docx` from a saved debate (topic, roles, every turn, Jev's verdict) and triggers the browser download.
PRD ref: `prd.md > Features and Behavior > History and export`.

## Data Model

Everything lives in the browser; the only server-side data is transient (the models list).

**A `Debate` record** (local storage, key `dialektika.debates.v1`):

```
Debate {
  id: string
  topic: string
  createdAt: string
  rounds: number
  jevEnabled: boolean
  sides: { defender: string, opposer: string }   // OpenRouter model ids
  turns: Turn[]
  verdict: Verdict | null
}
```

**`Turn`:**

```
Turn { index: number, round: number, side: 'defender' | 'opposer', modelId: string, text: string }
```

**`Verdict`:**

```
Verdict {
  scores: { defender: AxisScores, opposer: AxisScores }   // reasoning, engagement, burdenOfProof (1–10 each)
  strongerSide: 'defender' | 'opposer'
  decisiveTurns: number[]
  crystallization: string
  tieBreakApplied: boolean
}
```

**The live stream** (route → browser) is newline-delimited JSON events, so the arena knows exactly where each turn fits:

```
{ type: 'turn-start', side, round, modelId }
{ type: 'turn-chunk', side, round, text }
{ type: 'turn-end',   side, round }
{ type: 'verdict',    verdict }
{ type: 'done' } | { type: 'error', side?, round?, message }
```

**Where data lives / how it updates / on return:**

- Model list: fetched per load, cached in memory + local storage.
- In-progress debate: browser memory only, assembled from stream events.
- Finished debate: written once to local storage at `done`.
- On reopen: the setup screen is always empty; saved debates are reached through history, never auto-loaded.

## File Structure

```
dialektika/
├── app/
│   ├── layout.tsx              # shell, fonts, global styles
│   ├── page.tsx                # setup screen
│   ├── globals.css
│   ├── debate/[id]/page.tsx    # arena (live) and read-only re-read
│   └── api/
│       ├── models/route.ts     # GET  → OpenRouter model list
│       └── debate/route.ts     # POST → run + stream a debate
├── components/
│   ├── ModelPicker.tsx         # searchable dropdown
│   ├── DebateSetup.tsx         # the setup form
│   ├── Arena.tsx               # two-column streaming view
│   ├── TurnCard.tsx            # one turn
│   ├── JevPanel.tsx            # the verdict
│   └── HistoryList.tsx         # saved debates + download
├── lib/
│   ├── orchestrator.ts         # pure: next speaker + messages   ← main test target
│   ├── debate-runner.ts        # runs turns into the stream
│   ├── stream-protocol.ts      # event types + serialize/parse
│   ├── openrouter.ts           # AI SDK provider client (key here)
│   ├── judge.ts                # Jev prompt + schema + tie-break
│   ├── storage.ts              # local-storage save/load
│   ├── export-docx.ts          # .docx generation
│   └── types.ts                # shared types
├── lib/__tests__/
│   ├── orchestrator.test.ts    # turn order, rounds, roles
│   ├── judge.test.ts           # score parsing + tie-break
│   └── stream-protocol.test.ts # event round-trip
├── devpost/                    # planning docs (this workspace)
├── .env.local                  # OPENROUTER_API_KEY (git-ignored)
├── package.json
└── next.config.ts
```

## External Services and Dependencies

**OpenRouter** — one key, many models. Docs: https://openrouter.ai/docs

- **List models:** `GET https://openrouter.ai/api/v1/models`. Returns `{ data: [ { id, name, ... } ] }`. Our `/api/models` proxies this and returns just `{ id, name }[]`. *(Verify at build start whether the call needs the auth header and which fields are present.)*
- **Chat completions:** `POST https://openrouter.ai/api/v1/chat/completions` — used under the hood by the AI SDK provider; `Authorization: Bearer <OPENROUTER_API_KEY>`, streaming supported. We never hand-write this call.
- **Key:** `OPENROUTER_API_KEY`, from the environment, server-side only.
- **Cost / limits:** usage is billed by OpenRouter per model; some models are free. Rate limits vary by model. *(Verify before a long run; prefer a small/cheap model for the first test debate to keep demo cost trivial.)*

**Dependencies:** `next`, `react`, `ai`, `@openrouter/ai-sdk-provider`, `zod`, `docx`; dev: `typescript`, `vitest`, `eslint` (+ Next config). Pin versions and confirm the AI SDK / provider exact API at the top of the build.

## Important Failure Modes

- **`OPENROUTER_API_KEY` missing or invalid** → the setup screen (or Start) shows a clear message; the debate does not start.
- **A model call fails mid-debate** (rate limit, model offline, network) → that turn shows an inline error in its column and the run pauses with a **Retry** action, rather than hanging or silently skipping.
- **Model list fetch fails** → the pickers fall back to **manual model-id entry**, so the app still works.
- **Judge structured output fails** (schema not satisfied) → retry once, then show a plain-text verdict with no scores, clearly labeled.
- **Nothing selected (first use)** → Start disabled until both models and a topic exist.

## What Was Simplified and Why

- **Local storage instead of a database** — single user, no backend state. A database would add infrastructure that proves nothing about the kernel.
- **No login or auth** — the learner is the only user; matches `scope.md > Explicitly Cut`.
- **`.docx` generated in the browser** — the debate already lives in local storage, so no server round-trip or file storage. Direct Google Docs integration would need Google sign-in, which the no-auth boundary rules out.
- **Model list cached** — fetched once and reused, rather than refetched per visit.
- **No deployment** — run locally and record; optional and out of scope per scope and PRD.

## Decisions and Open Issues

**Learner choices:**

- **One server route runs the whole debate (Option A)** — keeps the API key off the client and puts the loop in one testable place. Tradeoff: the browser holds one long streamed connection.
- **Vercel AI SDK with the OpenRouter provider** — less streaming/auth boilerplate, structured output for the judge; tradeoff is the fast-moving version surface.
- **Defender opens, sides alternate; rounds default 3** — competitive-debate convention.
- **Jev is an optional toggle**; scores reasoning, engagement, burden of proof; names the stronger side; tie goes to the opposition.
- **History + re-read, and `.docx` export, are in**; always start empty.

**Implementation details derived from those choices:** the NDJSON stream protocol; the Zod schema for the judge; Vitest as the `npm run test` runner; the `/api/models` proxy; the annotated file tree above.

**The one thing discussed as unfamiliar:** merging multiple sequentially-streamed model turns into one browser stream. **What clarified it:** each `streamText` call streams one turn; the runner tags every chunk with side/round so the arena can place it, and the pure orchestrator decides the sequence — which is what makes it testable. **Agreed check during the build:** a small spike/test that chains two sequential streamed calls and asserts the merged output preserves turn order and boundaries, before the full arena is built on it.

**Open issues to resolve early in the build (not blocking spec approval):**

- Confirm the exact current AI SDK / OpenRouter provider API (the `output`/`generateObject` situation) and pin versions.
- Confirm the OpenRouter `GET /models` response fields and whether auth is required.
- Confirm default rate limits and pick a cheap model for the first end-to-end test.
- Exact wording of the API-key and model-failure messages (build-time detail).
