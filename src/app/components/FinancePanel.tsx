import { formatMonth, ledgerExpenses, ledgerIncome } from '../../sim';
import type { Ledger } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';

const EXPENSE_LABELS: Record<keyof Ledger['expenses'], string> = {
  salaries: 'Salaries',
  rent: 'Office rent',
  devBudget: 'Dev budgets',
  marketing: 'Marketing',
  unitCosts: 'Media & distribution',
  hiring: 'Recruiting',
  severance: 'Severance',
};

function LedgerTable({ ledger }: { ledger: Ledger }) {
  const net = ledgerIncome(ledger) - ledgerExpenses(ledger);
  return (
    <table className="table compact ledger">
      <tbody>
        <tr>
          <td>Product sales</td>
          <td className="num good">{money(ledger.income.sales)}</td>
        </tr>
        <tr>
          <td>Contracts</td>
          <td className="num good">{money(ledger.income.contracts)}</td>
        </tr>
        {(Object.keys(EXPENSE_LABELS) as (keyof Ledger['expenses'])[])
          .filter((k) => ledger.expenses[k] > 0)
          .map((k) => (
            <tr key={k}>
              <td>{EXPENSE_LABELS[k]}</td>
              <td className="num bad">−{money(ledger.expenses[k])}</td>
            </tr>
          ))}
        <tr className="total">
          <td>Net</td>
          <td className={`num ${net < 0 ? 'bad' : 'good'}`}>{money(net)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function FinancePanel() {
  const game = useGame((s) => s.game)!;
  const openModal = useGame((s) => s.openModal);
  const f = game.finance;
  const lastMonth = f.reports.at(-1);
  const weeklyNet = ledgerIncome(f.lastWeek) - ledgerExpenses(f.lastWeek);
  const burn = lastMonth ? -lastMonth.net / 4.33 : -weeklyNet;
  const runway = burn > 0 && game.company.cash > 0 ? Math.floor(game.company.cash / burn) : null;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Finances</h2>
        <button className="small" onClick={() => openModal({ kind: 'reports' })} disabled={f.reports.length === 0}>
          Monthly reports…
        </button>
      </div>
      {f.monthsInRed > 0 && (
        <div className="alert">
          Cash was negative at {f.monthsInRed} month-end{f.monthsInRed > 1 ? 's' : ''} in a row. Get back in the black before the next one.
        </div>
      )}
      <div className="finance-summary">
        <div>
          <span className="muted">Runway</span>
          <strong>{runway === null ? (burn <= 0 ? 'Profitable' : '—') : `${runway} wk`}</strong>
        </div>
        <div>
          <span className="muted">Lifetime revenue</span>
          <strong>{money(game.company.lifetimeRevenue)}</strong>
        </div>
      </div>
      <h3 className="subhead">Last week</h3>
      <LedgerTable ledger={f.lastWeek} />
      {lastMonth && (
        <>
          <h3 className="subhead">{formatMonth(lastMonth.year, lastMonth.month)}</h3>
          <LedgerTable ledger={lastMonth} />
        </>
      )}
    </section>
  );
}
