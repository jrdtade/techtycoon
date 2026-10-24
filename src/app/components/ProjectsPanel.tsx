import { getProductType, getSegment, projectTeam, weeksRemaining } from '../../sim';
import type { Project } from '../../sim';
import { int, money } from '../format';
import { useGame } from '../store';
import { ProgressBar } from './ProgressBar';

function ProjectCard({ project }: { project: Project }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useGame((s) => s.openModal);
  const team = projectTeam(game, project.id);
  const eta = weeksRemaining(game, project);
  const ready = project.status === 'readyToLaunch';
  const idle = game.employees.filter((e) => e.projectId === null && e.contractId === null);

  return (
    <div className={`project-card ${ready ? 'ready' : ''}`}>
      <div className="project-title">
        <strong>{project.name}</strong>
        <span className="muted">
          {getProductType(project.productTypeId).name} · {getSegment(project.segmentId).name} · {project.scope}
        </span>
      </div>
      <ProgressBar value={project.workDone / project.workRequired} tone={ready ? 'good' : 'accent'} />
      <div className="project-stats">
        <span>{ready ? 'Ready to launch' : eta === null ? 'On hold: no staff' : `~${eta} wk left`}</span>
        <span title="Feature points">F {project.featurePts.toFixed(1)}</span>
        <span title="Polish points">P {project.polishPts.toFixed(1)}</span>
        <span title="Open bugs" className={project.bugs > project.workRequired * 0.2 ? 'bad' : ''}>
          Bugs {int(project.bugs)}
        </span>
        <label className="inline">
          Budget/wk
          <input
            type="number"
            min={0}
            step={50}
            value={project.weeklyBudget}
            onChange={(e) => dispatch({ type: 'setProjectBudget', projectId: project.id, weeklyBudget: Number(e.target.value) || 0 })}
          />
        </label>
      </div>
      <div className="project-team">
        {team.map((e) => (
          <span key={e.id} className="chip">
            {e.name}
            <button
              className="chip-x"
              title="Remove from project"
              onClick={() => dispatch({ type: 'assignEmployee', employeeId: e.id, projectId: null })}
            >
              ×
            </button>
          </span>
        ))}
        {idle.length > 0 && (
          <select
            value=""
            onChange={(e) => e.target.value && dispatch({ type: 'assignEmployee', employeeId: e.target.value, projectId: project.id })}
          >
            <option value="">+ Assign…</option>
            {idle.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="project-actions">
        {ready && (
          <button className="primary" onClick={() => openModal({ kind: 'launch', projectId: project.id })}>
            Launch…
          </button>
        )}
        <button
          className="danger small"
          onClick={() => window.confirm(`Cancel ${project.name}? All work is lost.`) && dispatch({ type: 'cancelProject', projectId: project.id })}
        >
          Cancel project
        </button>
        <span className="muted">Spending {money(project.weeklyBudget)}/wk while staffed</span>
      </div>
    </div>
  );
}

export function ProjectsPanel() {
  const projects = useGame((s) => s.game!.projects);
  const openModal = useGame((s) => s.openModal);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Projects in development</h2>
        <button className="primary" onClick={() => openModal({ kind: 'newProject' })}>
          New project…
        </button>
      </div>
      {projects.length === 0 ? (
        <div className="empty">Nothing in development. Start a project, or take contract work to pay the bills.</div>
      ) : (
        projects.map((p) => <ProjectCard key={p.id} project={p} />)
      )}
    </section>
  );
}
