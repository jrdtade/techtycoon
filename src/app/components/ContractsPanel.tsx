import { useState } from 'react';
import type { ContractOffer } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';

function OfferRow({ offer }: { offer: ContractOffer }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [picked, setPicked] = useState<string[]>([]);
  const idle = game.employees.filter((e) => e.projectId === null && e.contractId === null);
  const avg = picked.length ? picked.reduce((s, id) => s + (game.employees.find((e) => e.id === id)?.skills.coding ?? 0), 0) / picked.length : 0;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="offer">
      <div>
        <strong>{offer.client}</strong>: {offer.job}
        <div className="muted small-text">
          {offer.weeks} weeks · {offer.staffRequired} {offer.staffRequired === 1 ? 'person' : 'people'} · coding ≥ {offer.minSkill} · pays{' '}
          <strong>{money(offer.fee)}</strong> on completion
        </div>
      </div>
      <div className="offer-staff">
        {idle.map((e) => (
          <label key={e.id} className="check">
            <input type="checkbox" checked={picked.includes(e.id)} onChange={() => toggle(e.id)} />
            {e.name} <span className="muted">({Math.round(e.skills.coding)})</span>
          </label>
        ))}
        {idle.length === 0 && <span className="muted">Nobody is free.</span>}
        <button
          className="small"
          disabled={picked.length !== offer.staffRequired || avg < offer.minSkill}
          onClick={() => dispatch({ type: 'acceptContract', offerId: offer.id, employeeIds: picked.filter((id) => idle.some((e) => e.id === id)) })}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

export function ContractsPanel() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Contract work</h2>
        <span className="muted">New offers every month</span>
      </div>
      {game.contracts.map((c) => (
        <div key={c.id} className="contract-active">
          <span>
            <strong>{c.client}</strong>: {c.job} · {c.weeksLeft} wk left · {money(c.fee)} ·{' '}
            {game.employees.filter((e) => e.contractId === c.id).map((e) => e.name).join(', ')}
          </span>
          <button
            className="small danger"
            onClick={() => window.confirm('Abandon this contract? You will not be paid and your reputation will suffer.') && dispatch({ type: 'abandonContract', contractId: c.id })}
          >
            Abandon
          </button>
        </div>
      ))}
      {game.contractOffers.length === 0 ? (
        <div className="empty">No offers right now.</div>
      ) : (
        game.contractOffers.map((o) => <OfferRow key={o.id} offer={o} />)
      )}
    </section>
  );
}
