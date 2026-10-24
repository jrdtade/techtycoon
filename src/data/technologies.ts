import type { TechDef } from './types';

// Phase 1 has no research tree: technologies arrive on a historical schedule.
export const TECHNOLOGIES: readonly TechDef[] = [
  {
    id: 'timeSharing',
    name: 'Time-Sharing Systems',
    description: 'Many users share one big computer through terminals.',
    arrives: { year: 1970, month: 1 },
  },
  {
    id: 'relationalModel',
    name: 'The Relational Model',
    description: 'A paper from a Monolith research lab shows data can be organised as tables. Database Managers can now be built.',
    arrives: { year: 1974, month: 6 },
  },
  {
    id: 'microprocessor',
    name: 'The Microprocessor Kit',
    description: 'The Altamira 8800 kit puts a whole computer on a hobbyist\'s table. The Hobbyist segment opens.',
    arrives: { year: 1975, month: 1 },
  },
  {
    id: 'screenEditors',
    name: 'Screen Editors',
    description: 'Video terminals make full-screen editing practical. Word Processors can now be built.',
    arrives: { year: 1976, month: 4 },
  },
  {
    id: 'homeComputers',
    name: 'Ready-Made Home Computers',
    description: 'The Fruit ][, the PAT 2001 and the Tandem TRX-80 ship fully assembled. The Home segment opens.',
    arrives: { year: 1977, month: 6 },
  },
  {
    id: 'floppyDisk',
    name: 'The Floppy Disk Drive',
    description: 'Cheap disk storage turns micros into serious office machines. The Office PC segment opens.',
    arrives: { year: 1978, month: 6 },
  },
  {
    id: 'electronicWorksheet',
    name: 'The Electronic Worksheet',
    description: 'A grid of cells that recalculates itself. Spreadsheets can now be built.',
    arrives: { year: 1979, month: 10 },
  },
  {
    id: 'graphicalInterfaces',
    name: 'Graphical Interfaces',
    description: 'The Fruit Mackerel brings windows, icons and a mouse to the masses. Graphics & Paint can now be built.',
    arrives: { year: 1984, month: 1 },
  },
];
