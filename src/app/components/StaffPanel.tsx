import { useGame } from '../store';

export function StaffPanel() {
  const game = useGame((s) => s.game)!;
  const activity = (projectId: string | null, contractId: string | null) => {
    if (projectId) return game.projects.find((p) => p.id === projectId)?.name ?? 'Project';
    if (contractId) return `Contract: ${game.contracts.find((c) => c.id === contractId)?.client ?? ''}`;
    return 'Idle';
  };
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Staff ({game.employees.length})</h2>
      </div>
      <table className="table compact">
        <thead>
          <tr>
            <th>Name</th>
            <th className="num" title="Coding">C</th>
            <th className="num" title="Design">D</th>
            <th className="num" title="Testing">T</th>
            <th>Doing</th>
          </tr>
        </thead>
        <tbody>
          {game.employees.map((e) => (
            <tr key={e.id}>
              <td>{e.name}</td>
              <td className="num">{Math.round(e.skills.coding)}</td>
              <td className="num">{Math.round(e.skills.design)}</td>
              <td className="num">{Math.round(e.skills.testing)}</td>
              <td className={e.projectId || e.contractId ? '' : 'muted'}>{activity(e.projectId, e.contractId)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
