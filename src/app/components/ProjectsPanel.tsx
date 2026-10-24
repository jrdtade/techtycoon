import { useState } from 'react';
import { computeQuality, getProductType, getSegment, projectTeam, weeksRemaining } from '../../sim';
import type { Project } from '../../sim';
import { int } from '../format';
import { useGame } from '../store';
import { ProgressBar } from './ProgressBar';

/** Review the project would get if its current rate of points carried through to completion. */
function projectedReview(project: Project, week: number): number | null {
  if (project.workDone <= 0) return null;
  const k = project.workRequired / project.workDone;
  return computeQuality({ ...project, featurePts: project.featurePts * k, polishPts: project.polishPts * k }, week).reviewScore;
}

function ProjectCard({ project }: { project: Project }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const openModal = useGame((s) => s.openModal);
  const [showTeam, setShowTeam] = useState(false);
  const team = projectTeam(game, project.id);
  const eta = weeksRemaining(game, project);
  const ready = project.status === 'readyToLaunch';
  const idle = game.employees.filter((e) => e.projectId === null && e.contractId === null);
  const review = projectedReview(project, game.week + (eta ?? 0));

  return (
    <div className={`project-card ${ready ? 'ready' : ''}`}>
      <div className="project-title">
        <strong>{project.name}</strong>
        <span className="muted small-text">
          {getProductType(project.productTypeId).name} · {getSegment(project.segmentId).name} · {project.scope}
        </span>
        <span className="spacer" />
        {ready ? (
          <button className="primary small" onClick={() => openModal({ kind: 'launch', projectId: project.id })}>
            Launch…
          </button>
        ) : (
          <span className={eta === null ? 'bad small-text' : 'small-text'}>{eta === null ? 'On hold: no staff' : `~${eta} wk left`}</span>
        )}
      </div>
      <ProgressBar value={project.workDone / project.workRequired} tone={ready ? 'good' : 'accent'} />
      <div className="project-stats">
        <span title="Feature points">F {project.featurePts.toFixed(0)}</span>
        <span title="Polish points">P {project.polishPts.toFixed(0)}</span>
        <span title="Open bugs" className={project.bugs > project.workRequired * 0.2 ? 'bad' : ''}>
          Bugs {int(project.bugs)}
        </span>
        {review !== null && <span title="Projected review if the current pace holds">≈ {review.toFixed(1)}/10</span>}
        <button className="link" onClick={() => setShowTeam(!showTeam)}>
          Team ({team.length}) {showTeam ? '▴' : '▾'}
        </button>
        <span className="spacer" />
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
        <button
          className="link danger"
          onClick={() => window.confirm(`Cancel ${project.name}? All work is lost.`) && dispatch({ type: 'cancelProject', projectId: project.id })}
        >
          Cancel
        </button>
      </div>
      {showTeam && (
        <div className="project-team">
          {team.map((e) => (
            <span key={e.id} className="chip">
              {e.name}
              <button className="chip-x" title="Remove from project" onClick={() => dispatch({ type: 'assignEmployee', employeeId: e.id, projectId: null })}>
                ×
              </button>
            </span>
          ))}
          {idle.length > 0 && (
            <select value="" onChange={(e) => e.target.value && dispatch({ type: 'assignEmployee', employeeId: e.target.value, projectId: project.id })}>
              <option value="">+ Assign…</option>
              {idle.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectsPanel() {
  const projects = useGame((s) => s.game!.projects);
  const idleCount = useGame((s) => s.game!.employees.filter((e) => e.projectId === null && e.contractId === null).length);
  const openModal = useGame((s) => s.openModal);
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>
          Projects in development {idleCount > 0 && <span className="muted small-text">· {idleCount} idle staff</span>}
        </h2>
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
