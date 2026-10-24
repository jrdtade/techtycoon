import { formatDate } from './calendar';
import { SCHEMA_VERSION } from './newGame';
import type { GameState } from './types';

// Versioned save format. Pure: the browser layer (src/persistence) decides where saves live.

export const SAVE_FORMAT = 'techtycoon-save';

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  schemaVersion: number;
  /** ISO timestamp supplied by the caller (the sim never reads the wall clock). */
  savedAt: string;
  companyName: string;
  gameDate: string;
  state: GameState;
}

/** Migrates raw state from version N to N+1. Add an entry here whenever SCHEMA_VERSION goes up. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Migration = (state: any) => any;
export const MIGRATIONS: Record<number, Migration> = {
  // 1: (s) => ({ ...s, schemaVersion: 2, newField: defaultValue }),
};

export function createSave(state: GameState, savedAt: string): SaveFile {
  return {
    format: SAVE_FORMAT,
    schemaVersion: state.schemaVersion,
    savedAt,
    companyName: state.company.name,
    gameDate: formatDate(state.week),
    state: JSON.parse(JSON.stringify(state)) as GameState,
  };
}

export function saveToJson(state: GameState, savedAt: string): string {
  return JSON.stringify(createSave(state, savedAt));
}

export type LoadResult = { ok: true; state: GameState; migratedFrom: number | null } | { ok: false; error: string };

/** Applies migrations in order until the state reaches `target`. */
export function migrateState(
  raw: unknown,
  fromVersion: number,
  migrations: Record<number, Migration> = MIGRATIONS,
  target: number = SCHEMA_VERSION,
): unknown {
  let state = raw;
  for (let v = fromVersion; v < target; v++) {
    const m = migrations[v];
    if (!m) throw new Error(`No migration from save version ${v} to ${v + 1}.`);
    state = m(state);
  }
  return state;
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Structural check: enough to reject garbage files without re-implementing the type system. */
function validateState(s: unknown): string | null {
  if (!isObject(s)) return 'state is not an object';
  for (const key of ['schemaVersion', 'seed', 'week', 'nextId', 'nextLogSeq'] as const)
    if (typeof s[key] !== 'number' || !Number.isFinite(s[key])) return `${key} is not a number`;
  if (!Array.isArray(s.rng) || s.rng.length !== 4) return 'rng state is malformed';
  if (!['playing', 'bankrupt', 'finished'].includes(s.status as string)) return 'status is invalid';
  if (!isObject(s.company) || typeof s.company.cash !== 'number') return 'company is malformed';
  for (const key of ['employees', 'candidates', 'contractOffers', 'contracts', 'projects', 'products', 'unlockedTech', 'firedEvents', 'milestonesReached', 'modifiers', 'log'] as const)
    if (!Array.isArray(s[key])) return `${key} is not a list`;
  if (!isObject(s.finance) || !isObject(s.stats)) return 'finance or stats missing';
  return null;
}

/** Parses a save (object or JSON text), migrates it to the current schema and validates it. */
export function loadSave(input: unknown): LoadResult {
  let raw = input;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return { ok: false, error: 'This file is not valid JSON.' };
    }
  }
  if (!isObject(raw) || raw.format !== SAVE_FORMAT) return { ok: false, error: 'This is not a Tech Tycoon save file.' };
  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1)
    return { ok: false, error: 'The save has no valid schema version.' };
  if (version > SCHEMA_VERSION) return { ok: false, error: 'This save comes from a newer version of the game.' };

  let state: unknown;
  try {
    state = migrateState(raw.state, version);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Migration failed.' };
  }
  const problem = validateState(state);
  if (problem) return { ok: false, error: `The save is damaged: ${problem}.` };
  const s = state as GameState;
  s.schemaVersion = SCHEMA_VERSION;
  return { ok: true, state: s, migratedFrom: version === SCHEMA_VERSION ? null : version };
}
