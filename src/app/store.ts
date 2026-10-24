import { create } from 'zustand';
import { dispatch as simDispatch, newGame, step } from '../sim';
import type { Command, GameState } from '../sim';
import type { Speed } from './settings';

export type Modal =
  | { kind: 'newProject' }
  | { kind: 'launch'; projectId: string }
  | { kind: 'hire' }
  | { kind: 'contracts' }
  | { kind: 'saves' }
  | { kind: 'reports' };

interface GameStore {
  game: GameState | null;
  speed: Speed;
  /** Speed to resume at after a pause. */
  resumeSpeed: Exclude<Speed, 0>;
  /** Highest log seq the player has been shown; newer important entries auto-pause. */
  lastSeenSeq: number;
  toast: string | null;
  modal: Modal | null;
  /** The end-of-game summary was closed so the player can look at the final dashboard. */
  summaryDismissed: boolean;

  startNewGame(companyName: string, seed?: number): void;
  loadGame(state: GameState): void;
  quitToMenu(): void;
  tick(): void;
  setSpeed(speed: Speed): void;
  togglePause(): void;
  /** Sends a command to the sim. Returns false (and shows a toast) if it was rejected. */
  dispatch(cmd: Command): boolean;
  openModal(modal: Modal): void;
  closeModal(): void;
  showToast(text: string | null): void;
  setSummaryDismissed(v: boolean): void;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

export const useGame = create<GameStore>((set, get) => ({
  game: null,
  speed: 0,
  resumeSpeed: 1,
  lastSeenSeq: 0,
  toast: null,
  modal: null,
  summaryDismissed: false,

  startNewGame(companyName, seed = randomSeed()) {
    const game = newGame({ companyName, seed });
    set({ game, speed: 0, lastSeenSeq: game.nextLogSeq - 1, modal: null, toast: null, summaryDismissed: false });
  },

  loadGame(game) {
    set({ game, speed: 0, lastSeenSeq: game.nextLogSeq - 1, modal: null, toast: null, summaryDismissed: false });
  },

  quitToMenu() {
    set({ game: null, speed: 0, modal: null });
  },

  tick() {
    const { game, lastSeenSeq } = get();
    if (!game || game.status !== 'playing') return;
    const next = step(game);
    const important = next.log.some((e) => e.important && e.seq > lastSeenSeq);
    const ended = next.status !== 'playing';
    set({
      game: next,
      lastSeenSeq: next.nextLogSeq - 1,
      ...(important || ended ? { speed: 0 as Speed } : {}),
    });
  },

  setSpeed(speed) {
    if (speed === 0) set({ speed });
    else set({ speed, resumeSpeed: speed });
  },

  togglePause() {
    const { speed, resumeSpeed, game } = get();
    if (!game || game.status !== 'playing') return;
    set({ speed: speed === 0 ? resumeSpeed : 0 });
  },

  dispatch(cmd) {
    const { game } = get();
    if (!game) return false;
    const result = simDispatch(game, cmd);
    if (!result.ok) {
      set({ toast: result.error });
      return false;
    }
    set({ game: result.state, lastSeenSeq: result.state.nextLogSeq - 1 });
    return true;
  },

  openModal(modal) {
    set({ modal, speed: 0, resumeSpeed: get().speed || get().resumeSpeed });
  },
  closeModal() {
    set({ modal: null });
  },
  showToast(toast) {
    set({ toast });
  },
  setSummaryDismissed(summaryDismissed) {
    set({ summaryDismissed });
  },
}));
