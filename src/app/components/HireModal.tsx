import { CONFIG, hireFee } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';
import { Modal } from './Modal';

export function HireModal() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = useGame((s) => s.closeModal);

  return (
    <Modal title="Hire staff" onClose={close} wide footer={<button onClick={close}>Done</button>}>
      <p className="muted">
        New candidates arrive every month. Coding drives progress and feature points, design drives polish, testing removes bugs. Skills grow
        with experience. Recruiting costs {CONFIG.staff.hireFeeWeeks} weeks of salary; firing costs {CONFIG.staff.severanceWeeks}.
      </p>
      {game.candidates.length === 0 ? (
        <div className="empty">No candidates this month.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th className="num">Coding</th>
              <th className="num">Design</th>
              <th className="num">Testing</th>
              <th className="num">Salary/yr</th>
              <th className="num">Fee</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {game.candidates.map((c) => {
              const fee = hireFee(c.salary);
              return (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <div className="muted small-text">{c.role}</div>
                  </td>
                  <td className="num">{c.skills.coding}</td>
                  <td className="num">{c.skills.design}</td>
                  <td className="num">{c.skills.testing}</td>
                  <td className="num">{money(c.salary)}</td>
                  <td className="num">{money(fee)}</td>
                  <td>
                    <button className="primary small" disabled={game.company.cash < fee} onClick={() => dispatch({ type: 'hireEmployee', candidateId: c.id })}>
                      Hire
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
