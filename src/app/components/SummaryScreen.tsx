import { summarize } from '../../sim';
import { int, money } from '../format';
import { useGame } from '../store';

export function SummaryScreen() {
  const game = useGame((s) => s.game)!;
  const quit = useGame((s) => s.quitToMenu);
  const dismissed = useGame((s) => s.summaryDismissed);
  const setDismissed = useGame((s) => s.setSummaryDismissed);
  if (game.status === 'playing' || dismissed) return null;
  const s = summarize(game);

  return (
    <div className="modal-backdrop">
      <div className="modal wide summary">
        <div className="modal-header">
          <h2>{s.outcome === 'bankrupt' ? `${game.company.name} has gone bankrupt` : `${game.company.name}: 1970–1985`}</h2>
        </div>
        <div className="modal-body">
          <p className="summary-rank">
            {s.rank} <span className="muted">· score {int(s.score)}</span>
          </p>
          <p className="muted">
            {s.outcome === 'bankrupt'
              ? `The doors closed in ${s.endDate}, after ${s.yearsInBusiness} years in business.`
              : 'The 1985 books are closed. The PC era is in full swing, and the next chapter is for another phase.'}
          </p>
          <div className="summary-grid">
            <Stat label="Final cash" value={money(s.finalCash)} />
            <Stat label="Peak cash" value={money(s.peakCash)} />
            <Stat label="Lifetime revenue" value={money(s.lifetimeRevenue)} />
            <Stat label="From products" value={money(s.salesRevenue)} />
            <Stat label="From contracts" value={money(s.contractRevenue)} />
            <Stat label="Reputation" value={`${Math.round(s.reputation)} / 100`} />
            <Stat label="Products shipped" value={int(s.productsLaunched)} />
            <Stat label="Contracts completed" value={int(s.contractsCompleted)} />
            <Stat label="Staff (peak)" value={`${s.finalEmployees} (${s.peakEmployees})`} />
            <Stat label="Best reviewed" value={s.bestReviewed ? `${s.bestReviewed.name} · ${s.bestReviewed.review.toFixed(1)}` : '—'} />
            <Stat label="Top seller" value={s.topSeller ? `${s.topSeller.name} · ${money(s.topSeller.revenue)}` : '—'} />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => setDismissed(true)}>Look around</button>
          <button className="primary" onClick={quit}>
            New game
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="muted small-text">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
