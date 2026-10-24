// UI-side settings. Game speed changes only how often ticks run, never what a tick does.
export type Speed = 0 | 1 | 2 | 3;

/** Real milliseconds per in-game week at each speed (balance guess for feel). */
export const MS_PER_WEEK: Record<Exclude<Speed, 0>, number> = { 1: 1000, 2: 400, 3: 150 };
