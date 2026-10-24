import { segmentOverview } from '../../sim';
import { int, money, pct } from '../format';
import { useGame } from '../store';

function compact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return int(n);
}

export function MarketPanel() {
  const game = useGame((s) => s.game)!;
  const rows = segmentOverview(game);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Market</h2>
        <span className="muted small-text">Buyers follow S-curves; a segment's growth is your timing signal</span>
      </div>
      <table className="table compact">
        <thead>
          <tr>
            <th>Segment</th>
            <th className="num">Buyers</th>
            <th className="num" title="Software purchases per week, all categories">Sales/wk</th>
            <th className="num" title="Buyer growth over the last year">Growth</th>
            <th className="num">Ref. price</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={r.open ? '' : 'muted'} title={r.description}>
              <td>
                {r.name}
                {!r.open && <div className="small-text">Opens with {r.opensWith}</div>}
                {r.open && r.modifier !== 1 && (
                  <div className={`small-text ${r.modifier < 1 ? 'bad' : 'good'}`}>
                    Era effect {r.modifier > 1 ? '+' : ''}
                    {pct(r.modifier - 1)}
                  </div>
                )}
              </td>
              <td className="num">{r.open ? compact(r.buyers) : '—'}</td>
              <td className="num">{r.open ? compact(r.weeklyDemand) : '—'}</td>
              <td className={`num ${r.growth > 0.25 ? 'good' : ''}`}>{r.open ? `+${pct(r.growth)}` : '—'}</td>
              <td className="num">{money(r.referencePrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
