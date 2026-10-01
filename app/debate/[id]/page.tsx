'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Arena } from '@/components/Arena';
import { parseEvent, type StreamEvent } from '@/lib/stream-protocol';
import type { ArenaTurn, DebateConfig, Side, Verdict } from '@/lib/types';

export default function DebatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [turns, setTurns] = useState<ArenaTurn[]>([]);
  const [fatal, setFatal] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [finished, setFinished] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();

    function handleEvent(event: StreamEvent) {
      switch (event.type) {
        case 'done':
          setFinished(true);
          break;
        case 'verdict':
          setVerdict(event.verdict);
          break;
        case 'error': {
          const { side, round, message } = event;
          if (side === undefined) {
            setFatal(message);
          } else {
            setTurns((previous) => markTurnError(previous, side, round ?? 0, message));
          }
          break;
        }
        default:
          setTurns((previous) => reduceTurn(previous, event));
      }
    }

    async function run() {
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
          body: JSON.stringify(parsed),
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
      } catch (error) {
        if (!controller.signal.aborted) {
          setFatal(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void run();

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns]);

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
      <h1 className="title">{config?.topic ?? 'Debate'}</h1>
      <p className="subtitle">
        {config
          ? `${config.sides.defender} (defender) vs ${config.sides.opposer} (opposer) · ${config.rounds} rounds${finished ? ' · complete' : ''}`
          : 'Loading…'}
      </p>
      {config ? <Arena config={config} turns={turns} verdict={verdict} /> : null}
      <div ref={bottomRef} />
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
