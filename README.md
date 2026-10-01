# Dialektika

> Two strong AI models. One arena. A claim put to the test.

Dialektika puts two AI models in a single arena to argue opposite sides of a claim — round by round, each directly rebutting the last — with a judge, **Jev**, that weighs both sides and crystallizes where the standpoints actually land.

Instead of opening ChatGPT, Claude, and Gemini in separate tabs and copy-pasting replies by hand (and still getting one-sided agreement), you pick two models, assign a **defender** and an **opposer**, name a topic, and watch a real, evolving debate stream in live.

## Features

- **Pick models by name** — searchable dropdowns of OpenRouter's model list, with a manual model-id fallback if the list can't be fetched.
- **A live two-column arena** — defender on the left, opposer on the right. The defender opens, the sides alternate, and every turn streams in token by token.
- **Jev, the optional judge** — scores each side 1–10 on reasoning, engagement, and burden of proof, names the stronger side, cites the decisive turns, and closes with a crystallization. On a level score, the opposition wins (the defender failed its burden of proof).
- **History** — completed debates are saved in the browser and can be re-opened to re-read in full. The app always starts on an empty setup screen.
- **Export as `.docx`** — download any saved debate as a Word/Google Docs-compatible document.
- **Failures surface** — a missing API key or a failed model call shows a clear message (and, mid-debate, an inline error with **Retry**), instead of hanging silently.

## How it works

Dialektika is one local Next.js app with no database and no server to keep online. The browser holds the finished debates; the only server-side state is a transient model-list cache.

1. The setup screen (`app/page.tsx`) fetches the model list once from `GET /api/models` and fills the pickers.
2. On **Start**, the browser POSTs the config to `/api/debate` and opens a stream.
3. That route is the referee: it runs the debate loop, asks the next model to argue via the Vercel AI SDK → OpenRouter, and streams each turn back tagged with its side and round.
4. The arena places each chunk into the matching column of the two-column view.
5. When the final round ends, the judge runs (if Jev is on) and streams a verdict.
6. The finished debate is written to `localStorage` under `dialektika.debates.v1`.

The one clever piece is the referee loop in `lib/debate-runner.ts` that runs the models one after another and merges their turns into a single ordered stream — the sequencing rules live in the pure, tested `lib/orchestrator.ts`.

## Requirements

- **Node.js 22 or newer** (required by `@openrouter/ai-sdk-provider` v3)
- An **[OpenRouter](https://openrouter.ai/) API key** — one account and one key reach hundreds of models

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
#    Create .env.local and add:
#    OPENROUTER_API_KEY=sk-or-v1-...

# 3. Start the dev server
npm run dev
```

Open **http://localhost:3000**, pick two models, assign the sides, enter a topic, toggle Jev, choose the rounds, and press **Start**.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | Yes | — | Reaches OpenRouter. Read server-side only, never exposed to the browser. |
| `JUDGE_MODEL` | No | `openai/gpt-4o-mini` | The model Jev uses to adjudicate. Set it to any OpenRouter model id. |

`.env` and `.env.*` are git-ignored, so your key stays out of the repository.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run test` | Run the Vitest suite |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Project structure

```
dialektika/
├── app/
│   ├── page.tsx                 # setup screen + history
│   ├── debate/[id]/page.tsx      # arena (live) and read-only re-read
│   └── api/
│       ├── models/route.ts       # GET  → OpenRouter model list
│       └── debate/route.ts       # POST → run + stream a debate (NDJSON)
├── components/
│   ├── DebateSetup.tsx           # the setup form
│   ├── ModelPicker.tsx           # searchable dropdown
│   ├── Arena.tsx                 # two-column streaming view
│   ├── TurnCard.tsx              # one turn
│   ├── JevPanel.tsx              # the verdict
│   └── HistoryList.tsx           # saved debates + .docx download
├── lib/
│   ├── orchestrator.ts           # pure: next speaker + message history
│   ├── debate-runner.ts          # runs turns into the stream
│   ├── stream-protocol.ts        # tagged event types + serialize/parse
│   ├── openrouter.ts             # AI SDK provider client (the only place the key is read)
│   ├── judge.ts                  # Jev's prompt, Zod schema, tie-break
│   ├── storage.ts                # localStorage save/load
│   ├── export-docx.ts            # .docx generation
│   ├── model-cache.ts            # client-side model-list cache
│   ├── models.ts                 # OpenRouter model-list fetch + filtering
│   └── types.ts                  # shared types
├── devpost/                      # planning documents (scope, PRD, spec, checklist)
└── .env.local                    # OPENROUTER_API_KEY (git-ignored)
```

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Vercel AI SDK** (`ai` v7) with the **OpenRouter provider** (`@openrouter/ai-sdk-provider` v3) for streaming and structured output
- **Zod** for the judge's structured output schema
- **`docx`** for browser-side `.docx` export
- **Vitest** for tests; **ESLint** + `tsc` for lint and typecheck

## Notes and scope

Dialektika is a proof of concept: a single local user, no login, no hosting, and no database. Debates live in your browser's local storage. Deployment is intentionally out of scope — running it locally is enough.

The planning behind the build lives in [`devpost/`](devpost/): the scope, PRD, technical spec, and the build checklist.

## License

[MIT](LICENSE) © 2026 Shokunin Forge
