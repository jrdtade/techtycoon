import { formatMonth, ledgerExpenses, ledgerIncome } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';
import { Modal } from './Modal';

export function ReportsModal() {
  const game = useGame((s) => s.game)!;
  const close = useGame((s) => s.closeModal);
  const reports = [...game.finance.reports].reverse();
  const maxAbs = Math.max(1, ...game.finance.reports.map((r) => Math.abs(r.net)));

  return (
    <Modal title="Financial reports" onClose={close} wide footer={<button onClick={close}>Close</button>}>
      <div className="net-chart" title="Monthly net profit">
        {game.finance.reports.map((r) => (
          <div key={`${r.year}-${r.month}`} className="net-bar-slot" title={`${formatMonth(r.year, r.month)}: ${money(r.net)}`}>
            <div
              className={`net-bar ${r.net < 0 ? 'neg' : 'pos'}`}
              style={{ height: `${(Math.abs(r.net) / maxAbs) * 50}%` }}
            />
          </div>
        ))}
      </div>
      <table className="table compact">
        <thead>
          <tr>
            <th>Month</th>
            <th className="num">Sales</th>
            <th className="num">Contracts</th>
            <th className="num">Salaries</th>
            <th className="num">Dev</th>
            <th className="num">Marketing</th>
            <th className="num">Other</th>
            <th className="num">Net</th>
            <th className="num">Cash</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => {
            const other = r.expenses.rent + r.expenses.unitCosts + r.expenses.hiring + r.expenses.severance;
            return (
              <tr key={`${r.year}-${r.month}`}>
                <td>{formatMonth(r.year, r.month)}</td>
                <td className="num">{money(r.income.sales)}</td>
                <td className="num">{money(r.income.contracts)}</td>
                <td className="num">{money(r.expenses.salaries)}</td>
                <td className="num">{money(r.expenses.devBudget)}</td>
                <td className="num">{money(r.expenses.marketing)}</td>
                <td className="num">{money(other)}</td>
                <td className={`num ${r.net < 0 ? 'bad' : 'good'}`}>{money(r.net)}</td>
                <td className="num">{money(r.cashEnd)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {game.finance.annual.length > 0 && (
        <>
          <h3>Earlier years</h3>
          <table className="table compact">
            <thead>
              <tr>
                <th>Year</th>
                <th className="num">Income</th>
                <th className="num">Expenses</th>
                <th className="num">Net</th>
              </tr>
            </thead>
            <tbody>
              {[...game.finance.annual].reverse().map((a) => (
                <tr key={a.year}>
                  <td>{a.year}</td>
                  <td className="num">{money(a.income)}</td>
                  <td className="num">{money(a.expenses)}</td>
                  <td className={`num ${a.net < 0 ? 'bad' : 'good'}`}>{money(a.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p className="muted small-text">
        The last {game.finance.reports.length} months are kept in detail; older months are folded into yearly totals. This month so far: income{' '}
        {money(ledgerIncome(game.finance.thisMonth))}, expenses {money(ledgerExpenses(game.finance.thisMonth))}.
      </p>
    </Modal>
  );
}
