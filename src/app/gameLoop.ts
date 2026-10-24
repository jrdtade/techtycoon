import { MS_PER_WEEK } from './settings';
import { useGame } from './store';

const FRAME_MS = 50;

/**
 * Drives the sim in real time. Accumulates elapsed time and runs at most one tick per frame,
 * so a slow frame never causes a burst of weeks. Pauses when the tab is hidden.
 */
export function startGameLoop(): () => void {
  let last = performance.now();
  let acc = 0;

  const interval = window.setInterval(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    const { speed, tick } = useGame.getState();
    if (speed === 0) {
      acc = 0;
      return;
    }
    acc += dt;
    const ms = MS_PER_WEEK[speed];
    if (acc >= ms) {
      acc = Math.min(acc - ms, ms);
      tick();
    }
  }, FRAME_MS);

  const onVisibility = () => {
    if (document.hidden) useGame.getState().setSpeed(0);
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    const s = useGame.getState();
    if (!s.game || s.modal) return;
    if (e.code === 'Space') {
      e.preventDefault();
      s.togglePause();
    } else if (e.key === '1' || e.key === '2' || e.key === '3') {
      if (s.game.status === 'playing') s.setSpeed(Number(e.key) as 1 | 2 | 3);
    }
  };
  window.addEventListener('keydown', onKey);

  return () => {
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('keydown', onKey);
  };
}
