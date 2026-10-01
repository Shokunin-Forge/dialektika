---
doc: scope
status: approved
---

# Dialektika

One line: put two strong AI models in one arena to argue opposite sides of a claim — round by round, each rebutting the last — with a judge that weighs both sides and crystallizes where the standpoints actually land.

## The Unique Kernel

The models don't answer in parallel. They **debate**: model B directly rebuts what model A just said, model A responds to the rebuttal, and the argument evolves over rounds instead of sitting side by side. One screen does it all — no second tab, no hand-copying one model's reply into the other.

The judge, **Jev**, weighs the *standpoints* on a clear rubric, names which side made the stronger case, and crystallizes where the reasoning actually lands — so the result is a defensible call plus insight, not just a scoreboard.

## Who It's For

Someone who **holds a belief and has no way to test it**. The trigger is a thought like "I think I'm right because…" — and nothing pressure-tests the claim. The learner is the first user; the same person is a student defending a point, or anyone in an argument who wants the other side rather than one model nodding along.

What they do today: open two model tabs, copy-paste responses back and forth by hand across ChatGPT, Claude, Gemini — and still get one-sided agreement instead of a real clash.

## The Core Loop

Open Dialektika → pick Model A and Model B from OpenRouter → assign **defender** and **opposer** → type the topic → hit start. The defender opens; the two models then alternate turns in a single arena view, each labeled, each rebutting the previous turn, for the configured number of rounds (default 3). Then Jev weighs the arguments and crystallizes the standpoints.

They come back because it's the one place a claim gets genuinely tested rather than mirrored back.

## Inspiration & Identity

The framing is **a debate arena** — two assigned sides, opposing roles, a judge. The feel should be user-friendly and easy to follow. Visual references, tone, and aesthetic specifics are open for `3-prd`.

## Why This Matters to the Learner

The learner's own conviction: putting two strong models against each other produces a more **crystallized** point than asking one model, or comparing two answers. It's a tool for **constructive learning** — arguing a belief until you can see its real shape, rather than accepting the first model that agrees with you. It's also a chance to practice building interview-first, where the direction comes from the learner's own reasoning.

## What "Working" Looks Like

Concrete, showable in about a minute on a screen:

1. Open Dialektika on a fresh setup screen, pick Model A and Model B by name from a searchable OpenRouter list (e.g. Claude and GPT).
2. Assign defender and opposer (e.g. Claude opposes, GPT defends); rounds default to 3, and Jev is on or off by toggle.
3. Type the topic — "Should humans build RSI?"
4. Hit start. The defender opens, and the models debate in a two-column arena: A argues, B directly rebuts *that* argument, A responds to the rebuttal, and so on. Each turn streams in live, labeled with who's speaking.
5. After the final round, **Jev** (if enabled) weighs the arguments — scores, the stronger side, the decisive turns — and crystallizes where the standpoints land. The debate is saved to history.

**The "oh, that's cool" beat:** watching model B genuinely rebut what model A just said — a live, evolving argument, not a canned answer — then seeing Jev distill the whole clash into where the truth actually sits.

## The POC Boundary

In, stated tightly:

- Pick Model A and Model B by name from a searchable OpenRouter list — any model, free choice
- Assign defender and opposer up front; the **defender opens**
- Enter a debate topic
- Round-by-round debate in one **two-column arena view**: labeled turns streaming in live, each directly rebutting the previous, for the configured number of rounds (default 3)
- Optional **Jev** judge (toggle): scores the arguments, names the stronger side, cites the decisive turns, and crystallizes the standpoints
- Single local user — **no login, no auth**; the app **always starts empty**
- Completed debates saved to **local storage** with a history list to re-open and re-read
- **Download a saved debate as a .docx**
- OpenRouter API key read from the environment variable **`OPENROUTER_API_KEY`**

If it isn't needed to prove the kernel and the core loop, it isn't in.

## Later

Worth doing, just not now:

- Direct Google Docs integration (needs Google sign-in, which the no-auth boundary rules out; .docx covers the re-read need)
- A richer history UI — search, tags, sorting beyond the simple list
- Sharing a debate as a link
- Deeper debate configuration — speech types, timed phases beyond the round count
- More than two sides, or tournament brackets

## Explicitly Cut

Named, each with a real reason:

- **Accounts / login** — the learner is the only user; it adds no proof of the kernel
- **Model leaderboards or cross-model comparison stats** — scope creep past the debate loop
- **A human joining the debate** — complicates the core loop for no kernel gain
- **Deployment / hosting** — optional for this hackathon; a local run plus the demo video is enough

## Devpost Submission Blurb

Copy-paste-ready description, distilled from the scope. Pick the length that fits the box.

**One-liner:**

> Dialektika puts two strong AI models in one arena to argue opposite sides of a claim — round by round, each directly rebutting the last — with a judge that weighs both sides and crystallizes where the standpoints actually land.

**Short paragraph:**

> Dialektika is a tool for constructive learning: it tests a belief instead of agreeing with it. Today, if you want two AI models to stress-test an idea, you open ChatGPT, Claude, and Gemini in separate tabs, copy-paste each reply into the next, and still end up with two one-sided answers that never clash. Dialektika puts them in a single arena. Pick two models, assign one as the defender and one as the opposer, name a topic, and hit start. The models debate round by round — each turn directly rebutting the previous argument — so the argument genuinely evolves. Then a judge, Jev, weighs in — scoring the arguments on reasoning, engagement, and burden of proof, naming the stronger side, and crystallizing where the reasoning actually lands. It's built for anyone who thinks "I'm right because…" and has no way to pressure-test it.

**Caption for the demo video (optional):**

> Two strong models. One arena. No junk food answers — just a claim put to the test.

