import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { AxisScores, Debate, Side } from './types';

const SIDE_LABEL: Record<Side, string> = {
  defender: 'Proposition (defender)',
  opposer: 'Opposition (opposer)',
};

const AXIS_LABEL: Record<keyof AxisScores, string> = {
  reasoning: 'Reasoning',
  engagement: 'Engagement',
  burdenOfProof: 'Burden of proof',
};

const BODY_SPACING = { after: 180, line: 276 };
const HEADING_SPACING = { before: 280, after: 140 };

type Heading = (typeof HeadingLevel)[keyof typeof HeadingLevel];

function body(text: string): Paragraph {
  return new Paragraph({ text, spacing: BODY_SPACING });
}

function heading(text: string, level: Heading): Paragraph {
  return new Paragraph({ text, heading: level, spacing: HEADING_SPACING, keepNext: true });
}

export function buildDebateDocument(debate: Debate): Document {
  const children: Paragraph[] = [
    new Paragraph({
      text: debate.topic,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      keepNext: true,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Proposition (defender): ${debate.sides.defender}` }),
        new TextRun({ text: `Opposition (opposer): ${debate.sides.opposer}`, break: 1 }),
        new TextRun({
          text: `${debate.rounds} ${debate.rounds === 1 ? 'round' : 'rounds'} · Jev ${
            debate.jevEnabled ? 'on' : 'off'
          }`,
          break: 1,
        }),
      ],
      spacing: { after: 120, line: 276 },
    }),
  ];

  for (const turn of debate.turns) {
    children.push(
      heading(`Round ${turn.round} — ${SIDE_LABEL[turn.side]} (${turn.modelId})`, HeadingLevel.HEADING_2),
    );
    for (const block of turn.text.split(/\n+/)) {
      if (block.trim()) {
        children.push(body(block));
      }
    }
  }

  if (debate.verdict) {
    children.push(heading('Jev’s verdict', HeadingLevel.HEADING_1));
    const verdict = debate.verdict;

    if (verdict.plainText || !verdict.scores) {
      children.push(body(verdict.crystallization));
    } else {
      children.push(
        body(
          `Stronger side: ${
            verdict.strongerSide === 'defender' ? 'Proposition (defender)' : 'Opposition (opposer)'
          }`,
        ),
      );

      for (const axis of Object.keys(AXIS_LABEL) as (keyof AxisScores)[]) {
        children.push(
          body(
            `${AXIS_LABEL[axis]}: defender ${verdict.scores.defender[axis]} · opposer ${verdict.scores.opposer[axis]}`,
          ),
        );
      }

      if (verdict.tieBreakApplied) {
        children.push(
          body('Scores were level, so the tie went to the opposition (burden of proof).'),
        );
      }

      if (verdict.decisiveTurns.length > 0) {
        children.push(body(`Decisive turns: ${verdict.decisiveTurns.join(', ')}`));
      }

      children.push(body(verdict.crystallization));
    }
  }

  return new Document({ sections: [{ children }] });
}

export function debateFilename(debate: Debate): string {
  const slug =
    debate.topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'debate';
  return `dialektika-${slug}.docx`;
}

export async function downloadDebateDocx(debate: Debate): Promise<void> {
  const blob = await Packer.toBlob(buildDebateDocument(debate));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = debateFilename(debate);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
