import type { ProductTypeDef } from './types';

// segmentDemand values are balance guesses: the share of a segment's software purchases
// that go to each category.
export const PRODUCT_TYPES: readonly ProductTypeDef[] = [
  {
    id: 'accounting',
    name: 'Accounting & Payroll',
    description: 'Ledgers, payroll and invoicing for businesses that already pay for computers.',
    baseWork: 30,
    segmentDemand: { mainframe: 0.35, minicomputer: 0.3, officePc: 0.2, hobbyist: 0.03 },
    suggestedPrice: { mainframe: 6_000, minicomputer: 1_500, officePc: 300, hobbyist: 40 },
  },
  {
    id: 'devTools',
    name: 'Programming Tools',
    description: 'Compilers, assemblers and debuggers for people who write software themselves.',
    baseWork: 35,
    segmentDemand: { mainframe: 0.25, minicomputer: 0.3, academic: 0.35, hobbyist: 0.35, home: 0.08, officePc: 0.12 },
    suggestedPrice: { mainframe: 5_000, minicomputer: 1_200, academic: 400, hobbyist: 35, home: 30, officePc: 200 },
  },
  {
    id: 'games',
    name: 'Simple Games',
    description: 'Text adventures, strategy and arcade-style diversions.',
    baseWork: 15,
    segmentDemand: { academic: 0.15, minicomputer: 0.03, hobbyist: 0.3, home: 0.55, officePc: 0.04 },
    suggestedPrice: { academic: 150, minicomputer: 300, hobbyist: 20, home: 20, officePc: 40 },
  },
  {
    id: 'database',
    name: 'Database Manager',
    description: 'Store, query and report on records. Businesses run on it.',
    requiresTech: 'relationalModel',
    baseWork: 40,
    segmentDemand: { mainframe: 0.25, minicomputer: 0.2, officePc: 0.15, hobbyist: 0.05 },
    suggestedPrice: { mainframe: 8_000, minicomputer: 2_000, officePc: 400, hobbyist: 50 },
  },
  {
    id: 'wordProcessor',
    name: 'Word Processor',
    description: 'Type, edit and print documents on a screen instead of a typewriter.',
    requiresTech: 'screenEditors',
    baseWork: 30,
    segmentDemand: { minicomputer: 0.15, hobbyist: 0.15, home: 0.12, officePc: 0.25 },
    suggestedPrice: { minicomputer: 1_500, hobbyist: 40, home: 30, officePc: 300 },
  },
  {
    id: 'spreadsheet',
    name: 'Spreadsheet',
    description: 'An electronic worksheet that recalculates itself. A reason to buy a computer.',
    requiresTech: 'electronicWorksheet',
    baseWork: 35,
    segmentDemand: { minicomputer: 0.08, hobbyist: 0.12, home: 0.1, officePc: 0.3 },
    suggestedPrice: { minicomputer: 1_200, hobbyist: 60, home: 40, officePc: 350 },
  },
  {
    id: 'graphics',
    name: 'Graphics & Paint',
    description: 'Draw and paint with a mouse on a bitmapped screen.',
    requiresTech: 'graphicalInterfaces',
    baseWork: 40,
    segmentDemand: { home: 0.12, officePc: 0.1 },
    suggestedPrice: { home: 40, officePc: 250 },
  },
];
