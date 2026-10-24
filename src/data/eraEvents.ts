import type { EraEventDef } from './types';

// Scripted history. Modifier sizes and durations are balance guesses.
export const ERA_EVENTS: readonly EraEventDef[] = [
  {
    id: 'i404',
    title: 'Integrated Electronics unveils the i404',
    text: 'A whole processor on one chip. Industry veterans call it a toy.',
    arrives: { year: 1971, month: 11 },
    important: false,
    effects: [],
  },
  {
    id: 'paddleBall',
    title: 'Paddle Ball is a bar-room hit',
    text: 'Atavist\'s coin-op tennis game draws crowds. Computers can be fun, apparently.',
    arrives: { year: 1972, month: 11 },
    important: false,
    effects: [{ kind: 'demandModifier', segments: ['academic'], multiplier: 1.1, durationWeeks: 52 }],
  },
  {
    id: 'oilShock',
    title: 'Oil shock',
    text: 'An oil embargo sends prices soaring. Businesses freeze computer budgets for a year.',
    arrives: { year: 1973, month: 10 },
    important: true,
    effects: [{ kind: 'demandModifier', segments: ['mainframe', 'minicomputer'], multiplier: 0.8, durationWeeks: 52 }],
  },
  {
    id: 'homebrewClub',
    title: 'The Homebrew Circuit Club meets',
    text: 'Hobbyists swap schematics and tapes in a Menlo Park garage. Word of mouth spreads fast.',
    arrives: { year: 1975, month: 3 },
    important: false,
    effects: [{ kind: 'demandModifier', segments: ['hobbyist'], multiplier: 1.2, durationWeeks: 52 }],
  },
  {
    id: 'monolithPc',
    title: 'Monolith Business Machines launches the Monolith PC',
    text: 'Big Blue enters the micro market. Every purchasing department now has permission to buy a PC.',
    arrives: { year: 1981, month: 8 },
    important: true,
    effects: [{ kind: 'demandModifier', segments: ['officePc'], multiplier: 1.3, durationWeeks: 104 }],
  },
  {
    id: 'recession1982',
    title: 'Recession',
    text: 'Interest rates bite and the economy contracts. Corporate buyers delay purchases.',
    arrives: { year: 1982, month: 1 },
    important: true,
    effects: [
      { kind: 'demandModifier', segments: ['mainframe', 'minicomputer'], multiplier: 0.8, durationWeeks: 52 },
      { kind: 'demandModifier', segments: ['officePc', 'home'], multiplier: 0.9, durationWeeks: 52 },
    ],
  },
  {
    id: 'cartridgeCrash',
    title: 'The Great Cartridge Crash',
    text: 'A glut of bad console games sours families on home entertainment.',
    arrives: { year: 1983, month: 12 },
    important: true,
    effects: [{ kind: 'demandModifier', segments: ['home'], multiplier: 0.75, durationWeeks: 52 }],
  },
  {
    id: 'panes',
    title: 'Panes 1.0 ships',
    text: 'A graphical shell for the Monolith PC finally ships, two years late. Reviewers are unconvinced.',
    arrives: { year: 1985, month: 11 },
    important: false,
    effects: [],
  },
];
