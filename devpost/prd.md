---
doc: prd
status: approved
---

# Dialektika — Product Requirements

A local web app that puts two strong AI models in one arena to debate a topic — one defending, one opposing — round by round, with an adjudicator that weighs the arguments and crystallizes where the standpoints landed. For anyone who holds a belief and wants it pressure-tested.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey

1. Open Dialektika. It **always starts on an empty setup screen** — nothing restored, even if past debates are saved.
2. Pick **Model A** and **Model B** from searchable dropdowns of OpenRouter's models (names shown only).
3. Assign roles: which model is the **defender** (Proposition) and which is the **opposer** (Opposition).
4. Type the debate **topic**.
5. Set options: a **Jev on/off toggle**, and the **number of rounds** (default **3**).
6. Press **Start**.
7. The **arena** opens: two columns head-to-head — defender on the left, opposer on the right. Turns **stream in live**, each labeled with model · role · round. The **defender opens**, and the sides alternate.
8. When the final round ends, the **Jev panel** appears (if enabled): scores, the stronger side, the decisive arguments, and a crystallization of the standpoints.
9. The completed debate is **saved to local storage** and appears in the **history** area.
10. From history, **open a past debate to re-read it**, or **download it as a .docx**.

## Screens and Layout

- **Setup screen** — two model pickers, role assignment, topic input, Jev toggle, rounds selector (default 3), a Start button, and a **history area** listing past debates.
- **Arena screen** — two columns side by side; each column has a sticky header with the model name and role; turns are cards within the column; round dividers span both columns; auto-scrolls to the active turn; replies stream live.
- **Jev panel** — a distinct full-width panel below the columns, visually set apart from the turn stream.
- **History / re-read view** — a saved debate opened in full; a Download as .docx action.

## Look and Feel

*Direction proposed by the agent at the learner's request — easy to change at review.*

- **Dark, focused arena theme** — near-black / slate background; card-based turns with subtle borders and generous spacing.
- **Two side accents** so the clash reads at a glance: a **cool blue for the defender**, a **warm amber for the opposer**.
- **Jev** gets its own distinct **neutral-violet accent**, set apart like a judge's bench below the arena.
- **Clean modern sans-serif**; sharp but readable. Labels (round number, model name, role) small and unobtrusive.
- Live streaming is the visual centerpiece — the evolving back-and-forth is what makes it feel alive.

## Features and Behavior

### Setup and model selection
- Both models chosen from a **searchable dropdown of OpenRouter models**, displaying **names only**.
- The learner assigns which side is defender and which is opposer.
- Topic entered as free text.

### The debate
- The **defender opens** (mirroring the Proposition's burden of proof), and the two sides **alternate** each turn.
- **Rounds** run per the selector, default **3**.
- Replies **stream token-by-token** as they arrive, not dumped complete.
- The view **auto-scrolls to the active turn**.

### Jev's adjudication (when enabled)
- Jev scores **both sides on three axes**: **strength of reasoning**, **engagement / rebuttal**, and **burden of proof**.
- Reports a **score per axis** (1–10) for each side, so the comparison is visible.
- Names **the stronger side**.
- **Cites the actual turns** that decided it — generic praise doesn't count.
- Closes with the **crystallization**: where the standpoints actually landed.
- **Tie-break convention:** if it's a draw, the **opposition wins**, because the defender failed to meet the burden of proof.

### History and export
- Every completed debate is **saved to local storage**.
- Past debates are listed in the history area and can be **re-opened to re-read** in full.
- Any saved debate can be **downloaded as a .docx** file.

## States and Boundaries

- **First use / empty** — the setup screen with nothing selected; Start is unavailable until both models and a topic are present.
- **Normal use** — setup → arena → verdict → saved.
- **Error — API key** — `OPENROUTER_API_KEY` missing or invalid: the app surfaces a clear message instead of failing silently.
- **Error — model call fails mid-debate** — the failed turn is surfaced rather than leaving the arena stuck.
- **Jev disabled** — the debate runs and saves normally, with no verdict.
- **Persistence** — completed debates persist in local storage; the app still **always starts empty**.

## Product Decisions

- **Local, single user, no auth** — nothing to log into; keeps the PoC on the kernel.
- **Jev is optional** (toggle) — you can watch a raw debate without adjudication.
- **Rounds default to 3**, adjustable per debate.
- **The defender opens** and sides alternate — matches competitive debate convention and settles scope's open item.
- **Rubric: reasoning, engagement, burden of proof** — makes the verdict defensible and citable rather than subjective.
- **History + re-read are in** — a debate you can't revisit teaches nothing.
- **Export as .docx is in** — opens cleanly in Word or Google Docs, no auth needed.
- **Always start empty** — no auto-restore; history is available, but the app never resumes silently.

## What We're Building

Everything the proof of concept must do: the empty setup screen with searchable model selection, role assignment, topic entry, Jev toggle and rounds; the two-column live-streaming arena with the defender opening and sides alternating; Jev's three-axis scored verdict with cited arguments and crystallization; local-storage history with re-read; and .docx export.

## Deferred From the POC

- **Direct Google Docs integration** — needs Google sign-in, which the no-auth boundary rules out; .docx covers the re-read need.
- **A richer history UI** — search, tags, sorting beyond a simple list.
- **Configurable debate depth** — beyond the round count, e.g. speech types or timed phases.

## Possible Later Enhancements

- Tournament brackets or more than two sides.
- Model-vs-model comparison across debates.
- Sharing a debate as a link.

## Non-Goals

- **Accounts / login** — the learner is the only user; adds no proof of the kernel.
- **Model leaderboards / comparison stats** — scope creep past the debate loop.
- **A human joining the debate** — complicates the core loop for no kernel gain.
- **Deployment / hosting** — optional for this hackathon; local run plus demo video suffices.

## Open Questions

- Exact wording of the API-key and mid-debate error messages — a build-time detail, not blocking.
- Whether Start is disabled outright (recommended) versus clickable-then-error — non-blocking; leans disabled.
