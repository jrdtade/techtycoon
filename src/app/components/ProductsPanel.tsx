import { useState } from 'react';
import { expectedWeeklyUnits, getProductType, getSegment } from '../../sim';
import { int, money } from '../format';
import { useGame } from '../store';

function NumberCell(props: { value: number; onCommit: (v: number) => void; step: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) {
      const n = Number(draft);
      if (Number.isFinite(n)) props.onCommit(n);
      setDraft(null);
    }
  };
  return (
    <input
      type="number"
      className="cell-input"
      step={props.step}
      min={0}
      value={draft ?? props.value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
}

export function ProductsPanel() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [showRetired, setShowRetired] = useState(false);
  const onSale = game.products.filter((p) => p.status === 'onSale');
  const retired = game.products.filter((p) => p.status === 'retired');
  const expected = expectedWeeklyUnits(game);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Products on sale</h2>
        {retired.length > 0 && (
          <button className="small" onClick={() => setShowRetired(!showRetired)}>
            {showRetired ? 'Hide' : 'Show'} {retired.length} retired
          </button>
        )}
      </div>
      {onSale.length === 0 ? (
        <div className="empty">No products on sale yet.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Review</th>
              <th className="num">Price</th>
              <th className="num">Marketing/wk</th>
              <th className="num" title="Expected units per week right now">Units/wk</th>
              <th className="num">Units sold</th>
              <th className="num">Revenue</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {onSale.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <div className="muted small-text">
                    {getProductType(p.productTypeId).name} · {getSegment(p.segmentId).name}
                  </div>
                </td>
                <td className={p.reviewScore >= 7 ? 'good' : p.reviewScore < 5 ? 'bad' : ''}>{p.reviewScore.toFixed(1)}</td>
                <td className="num">
                  <NumberCell value={p.price} step={p.price >= 1000 ? 100 : 1} onCommit={(v) => dispatch({ type: 'setPrice', productId: p.id, price: v })} />
                </td>
                <td className="num">
                  <NumberCell value={p.marketingWeekly} step={50} onCommit={(v) => dispatch({ type: 'setMarketing', productId: p.id, weekly: v })} />
                </td>
                <td className="num">{(expected.get(p.id) ?? 0).toFixed((expected.get(p.id) ?? 0) < 10 ? 2 : 0)}</td>
                <td className="num">{int(p.unitsSold)}</td>
                <td className="num">{money(p.revenue)}</td>
                <td>
                  <button
                    className="small danger"
                    onClick={() => window.confirm(`Withdraw ${p.name} from sale?`) && dispatch({ type: 'retireProduct', productId: p.id })}
                  >
                    Retire
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showRetired && retired.length > 0 && (
        <table className="table retired">
          <tbody>
            {retired.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="muted">{getSegment(p.segmentId).name}</td>
                <td>{p.reviewScore.toFixed(1)}</td>
                <td className="num">{int(p.unitsSold)} units</td>
                <td className="num">{money(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
