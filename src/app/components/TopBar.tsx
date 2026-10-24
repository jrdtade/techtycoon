import { formatDate, ledgerExpenses, ledgerIncome } from '../../sim';
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
  const pauseMonthly = useGame((s) => s.pauseMonthly);
  const setPauseMonthly = useGame((s) => s.setPauseMonthly);
  const playing = game.status === 'playing';
  const net = ledgerIncome(game.finance.lastWeek) - ledgerExpenses(game.finance.lastWeek);

  return (
    <header className="topbar">
      <div className="topbar-company">{game.company.name}</div>
      <div className="topbar-date">{formatDate(game.week)}</div>
      <div className={`topbar-cash ${game.company.cash < 0 ? 'negative' : ''}`}>{money(game.company.cash)}</div>
      <div className={`topbar-net ${net < 0 ? 'negative' : 'positive'}`} title="Net cash flow last week">
        {net >= 0 ? '+' : ''}
        {money(net)}/wk
      </div>
      <div className="topbar-rep" title="Reputation">
        ★ {Math.round(game.company.reputation)}
      </div>
      <label className="topbar-option" title="Pause at the start of every month">
        <input type="checkbox" checked={pauseMonthly} onChange={(e) => setPauseMonthly(e.target.checked)} />
        Pause monthly
      </label>
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
