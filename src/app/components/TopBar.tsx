import { formatDate } from '../../sim';
import { money } from '../format';
import type { Speed } from '../settings';
import { useGame } from '../store';

const SPEEDS: { speed: Speed; label: string; title: string }[] = [
  { speed: 0, label: '❚❚', title: 'Pause (Space)' },
  { speed: 1, label: '▶', title: 'Normal (1)' },
  { speed: 2, label: '▶▶', title: 'Fast (2)' },
  { speed: 3, label: '▶▶▶', title: 'Fastest (3)' },
];

export function TopBar() {
  const game = useGame((s) => s.game)!;
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  const openModal = useGame((s) => s.openModal);
  const playing = game.status === 'playing';

  return (
    <header className="topbar">
      <div className="topbar-company">{game.company.name}</div>
      <div className="topbar-date">{formatDate(game.week)}</div>
      <div className={`topbar-cash ${game.company.cash < 0 ? 'negative' : ''}`}>{money(game.company.cash)}</div>
      <div className="topbar-rep" title="Reputation">
        ★ {Math.round(game.company.reputation)}
      </div>
      <div className="speed-controls">
        {SPEEDS.map((s) => (
          <button
            key={s.speed}
            className={speed === s.speed ? 'active' : ''}
            title={s.title}
            disabled={!playing}
            onClick={() => setSpeed(s.speed)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button className="topbar-menu" onClick={() => openModal({ kind: 'saves' })}>
        Save / Load
      </button>
    </header>
  );
}
