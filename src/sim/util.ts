import { CONFIG } from './config';
import type { GameState, Id, LogKind } from './types';

export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

/** Deep copy of plain JSON state. GameState is always JSON-serialisable. */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function newId(state: GameState, prefix: string): Id {
  const id = `${prefix}_${state.nextId}`;
  state.nextId += 1;
  return id;
}

export function addLog(state: GameState, kind: LogKind, text: string, important = false): void {
  state.log.push({ seq: state.nextLogSeq, week: state.week, kind, text, important });
  state.nextLogSeq += 1;
  const excess = state.log.length - CONFIG.history.maxLogEntries;
  if (excess > 0) state.log.splice(0, excess);
}

/** Push to a capped history array, dropping the oldest values. */
export function pushCapped<T>(arr: T[], value: T, cap: number): void {
  arr.push(value);
  if (arr.length > cap) arr.splice(0, arr.length - cap);
}

export function roundTo(x: number, step: number): number {
  return Math.round(x / step) * step;
}

/** Cumulative wage/fee inflation factor for a given (fractional) year. */
export function inflation(year: number): number {
  return Math.pow(1 + CONFIG.economy.wageInflationPerYear, year - CONFIG.start.year);
}

/** Locale-independent "$12,345" formatting for log messages. */
export function fmtMoney(n: number): string {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${n < 0 ? '-' : ''}$${s}`;
}
