'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Arena } from '@/components/Arena';
import { getDebate, saveDebate } from '@/lib/storage';
import { parseEvent, type StreamEvent } from '@/lib/stream-protocol';
import type { ArenaTurn, DebateConfig, Side, Turn, Verdict } from '@/lib/types';

export default function DebatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [turns, setTurns] = useState<ArenaTurn[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [stuck, setStuck] = useState(false);

  const turnsRef = useRef<ArenaTurn[]>([]);
  const verdictRef = useRef<Verdict | null>(null);
  const priorTurnsRef = useRef<Turn[]>([]);
  const doneRef = useRef(false);
  const stickyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();

    function commitTurns(updater: (previous: ArenaTurn[]) => ArenaTurn[]) {
      turnsRef.current = updater(turnsRef.current);
      setTurns(turnsRef.current);
    }

    function handleEvent(event: StreamEvent) {
      switch (event.type) {
        case 'done':
          doneRef.current = true;
          setFinished(true);
          break;
        case 'verdict':
          verdictRef.current = event.verdict;
          setVerdict(event.verdict);
          break;
        case 'error': {
          const { side, round, message } = event;
          if (side === undefined) {
            setFatal(message);
          } else {
            commitTurns((previous) => markTurnError(previous, side, round ?? 0, message));
          }
          break;
        }
        default:
          commitTurns((previous) => reduceTurn(previous, event));
      }
    }

    async function run() {
      const saved = getDebate(id);
      if (saved) {
        const savedTurns: ArenaTurn[] = saved.turns.map((turn) => ({ ...turn, status: 'done' }));
        turnsRef.current = savedTurns;
        verdictRef.current = saved.verdict;
        setConfig({
          id: saved.id,
          topic: saved.topic,
          rounds: saved.rounds,
          jevEnabled: saved.jevEnabled,
          sides: saved.sides,
        });
        setTurns(savedTurns);
        setVerdict(saved.verdict);
        setReadOnly(true);
        setFinished(true);
        return;
      }

      const raw = sessionStorage.getItem(`dialektika.pending.${id}`);
      if (!raw) {
        setFatal('This debate is no longer available in this tab. Start a new one.');
        return;
      }

      let parsed: DebateConfig;
      try {
        parsed = JSON.parse(raw) as DebateConfig;
      } catch {
        setFatal('Could not read this debate’s settings. Start a new one.');
        return;
      }
      setConfig(parsed);

      try {
        const response = await fetch('/api/debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parsed, priorTurns: priorTurnsRef.current }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          setFatal(data?.error ?? 'Could not start the debate.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const event = parseEvent(line);
            if (event) {
              handleEvent(event);
            }
          }
        }

        buffer += decoder.decode();
        const last = parseEvent(buffer);
        if (last) {
          handleEvent(last);
        }

        if (doneRef.current) {
          saveDebate({
            id: parsed.id,
            topic: parsed.topic,
            createdAt: new Date().toISOString(),
            rounds: parsed.rounds,
            jevEnabled: parsed.jevEnabled,
            sides: parsed.sides,
            turns: turnsRef.current.map((turn) => ({
              index: turn.index,
              round: turn.round,
              side: turn.side,
              modelId: turn.modelId,
              text: turn.text,
            })),
            verdict: verdictRef.current,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setFatal(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void run();

    return () => controller.abort();
  }, [id, attempt]);

  useEffect(() => {
    const element = stickyRef.current;
    if (!element) {
      return;
    }

    let frame = 0;

    function update() {
      frame = 0;
      const node = stickyRef.current;
      if (!node) {
        return;
      }
      setStuck(node.getBoundingClientRect().top <= 0.5);
    }

    function schedule() {
      if (frame) {
        return;
      }
      frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  function retry() {
    priorTurnsRef.current = turnsRef.current
      .filter((turn) => turn.status === 'done')
      .map((turn) => ({
        index: turn.index,
        round: turn.round,
        side: turn.side,
        modelId: turn.modelId,
        text: turn.text,
      }));

    const next = turnsRef.current.filter((turn) => turn.status !== 'error');
    turnsRef.current = next;
    setTurns(next);
    setVerdict(null);
    verdictRef.current = null;
    setFinished(false);
    setFatal(null);
    setAttempt((value) => value + 1);
  }

  if (fatal) {
    return (
      <main className="shell">
        <p className="brand">Dialektika</p>
        <div className="notice">{fatal}</div>
        <Link className="btn" href="/">
          Back to setup
        </Link>
      </main>
    );
  }

  return (
    <main className="shell">
      <p className="brand">Dialektika · arena</p>

      {readOnly ? (
        <div className="readonly-note">
          <Link className="readonly-link" href="/">
            <svg className="readonly-icon" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M9.5 3.75 L5.25 8 L9.5 12.25" />
            </svg>
            Back
          </Link>
          <span className="readonly-tag">
            <svg className="readonly-icon" viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3.25" y="7" width="9.5" height="6.25" rx="1.5" />
              <path d="M5.25 7 V5.25 A2.75 2.75 0 0 1 10.75 5.25 V7" />
            </svg>
            Saved debate — read-only
          </span>
        </div>
      ) : null}

      <div ref={stickyRef} className={`debate-sticky${stuck ? ' is-stuck' : ''}`}>
        <h1 className="title">{config?.topic ?? 'Debate'}</h1>
        <p className="subtitle">
          {config ? (
            <>
              <span className="model-defender">{config.sides.defender}</span> (defender) vs{' '}
              <span className="model-opposer">{config.sides.opposer}</span> (opposer) ·{' '}
              {config.rounds} rounds
              {finished ? ' · complete' : ''}
            </>
          ) : (
            'Loading…'
          )}
        </p>
      </div>

      {config ? (
        <Arena config={config} turns={turns} verdict={verdict} onRetry={readOnly ? undefined : retry} />
      ) : null}
    </main>
  );
}

function reduceTurn(turns: ArenaTurn[], event: StreamEvent): ArenaTurn[] {
  switch (event.type) {
    case 'turn-start':
      return upsertTurn(turns, event.side, event.round, () => ({
        index: (event.round - 1) * 2 + (event.side === 'defender' ? 0 : 1),
        round: event.round,
        side: event.side,
        modelId: event.modelId,
        text: '',
        status: 'streaming',
      }));
    case 'turn-chunk':
      return turns.map((turn) =>
        turn.round === event.round && turn.side === event.side
          ? { ...turn, text: turn.text + event.text }
          : turn,
      );
    case 'turn-end':
      return turns.map((turn) =>
        turn.round === event.round && turn.side === event.side
          ? { ...turn, status: 'done' }
          : turn,
      );
    default:
      return turns;
  }
}

function upsertTurn(
  turns: ArenaTurn[],
  side: Side,
  round: number,
  make: () => ArenaTurn,
): ArenaTurn[] {
  if (turns.some((turn) => turn.round === round && turn.side === side)) {
    return turns.map((turn) => (turn.round === round && turn.side === side ? make() : turn));
  }
  return [...turns, make()];
}

function markTurnError(
  turns: ArenaTurn[],
  side: Side,
  round: number,
  message: string,
): ArenaTurn[] {
  return turns.map((turn) =>
    turn.round === round && turn.side === side
      ? { ...turn, status: 'error', error: message }
      : turn,
  );
}
