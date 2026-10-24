import { CONFIG, severance } from '../../sim';
import type { Employee } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';

function SkillBar({ value, label }: { value: number; label: string }) {
  return (
    <span className="skill" title={`${label} ${Math.round(value)}`}>
      <span className="skill-fill" style={{ width: `${value}%` }} />
      <span className="skill-num">{Math.round(value)}</span>
    </span>
  );
}

export function StaffPanel() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useGame((s) => s.openModal);
  const payroll = game.employees.reduce((s, e) => s + e.salary, 0) / CONFIG.calendar.weeksPerYear;

  const activity = (e: Employee) => {
    if (e.projectId) return game.projects.find((p) => p.id === e.projectId)?.name ?? 'Project';
    if (e.contractId) return `Contract: ${game.contracts.find((c) => c.id === e.contractId)?.client ?? ''}`;
    return 'Idle';
  };

  const fire = (e: Employee) => {
    if (window.confirm(`Let ${e.name} go? Severance is ${money(severance(e.salary))}.`)) dispatch({ type: 'fireEmployee', employeeId: e.id });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          Staff ({game.employees.length}) <span className="muted small-text">· payroll {money(payroll)}/wk</span>
        </h2>
        <button className="small" onClick={() => openModal({ kind: 'hire' })}>
          Hire…
        </button>
      </div>
      <div className="scroll-box">
      <table className="table compact staff-table">
        <thead>
          <tr>
            <th>Name</th>
            <th title="Coding">Code</th>
            <th title="Design">Design</th>
            <th title="Testing">Test</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {game.employees.map((e) => (
            <tr key={e.id}>
              <td>
                {e.name}
                <div className={`small-text ${e.projectId || e.contractId ? '' : 'muted'}`}>
                  {activity(e)} · {money(e.salary)}/yr
                </div>
              </td>
              <td>
                <SkillBar value={e.skills.coding} label="Coding" />
              </td>
              <td>
                <SkillBar value={e.skills.design} label="Design" />
              </td>
              <td>
                <SkillBar value={e.skills.testing} label="Testing" />
              </td>
              <td>
                {!e.isFounder && (
                  <button className="chip-x" title="Fire" onClick={() => fire(e)}>
                    ×
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
