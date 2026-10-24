import { useMemo, useState } from 'react';
import { PRODUCT_TYPES } from '../../data';
import {
  CONFIG,
  SCOPES,
  categoryWeeklyDemand,
  computeQuality,
  focusShares,
  isProductTypeAvailable,
  targetableSegments,
  teamProgress,
  workRequiredFor,
} from '../../sim';
import type { Focus, ProductTypeId, ProjectScope, SegmentId } from '../../sim';
import { money } from '../format';
import { useGame } from '../store';
import { Modal } from './Modal';

export function NewProjectModal() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const close = useGame((s) => s.closeModal);

  const types = PRODUCT_TYPES.filter((t) => isProductTypeAvailable(game, t.id));
  const [typeId, setTypeId] = useState<ProductTypeId>(types[0]!.id);
  const segments = targetableSegments(game, typeId);
  const [segmentPick, setSegmentId] = useState<SegmentId | null>(null);
  const segmentId = segments.some((s) => s.id === segmentPick) ? segmentPick! : segments[0]!.id;
  const [scope, setScope] = useState<ProjectScope>('medium');
  const [focus, setFocus] = useState<Focus>({ features: 60, polish: 40, speed: 0 });
  const [budget, setBudget] = useState(100);
  const idle = game.employees.filter((e) => e.projectId === null && e.contractId === null);
  const [team, setTeam] = useState<string[]>(idle.length > 0 ? [idle[0]!.id] : []);
  const [name, setName] = useState('');

  const type = PRODUCT_TYPES.find((t) => t.id === typeId)!;
  const members = game.employees.filter((e) => team.includes(e.id));
  const work = workRequiredFor(typeId, scope, focus);
  const progress = teamProgress(members, budget);
  const weeks = progress > 0 ? Math.ceil(work / progress) : null;
  const salaryPerWeek = members.reduce((s, e) => s + e.salary, 0) / CONFIG.calendar.weeksPerYear;
  const shares = focusShares(focus);

  // Rough quality estimate from current skills, ignoring bugs and skill growth.
  const estimate = useMemo(() => {
    if (members.length === 0) return null;
    const avg = (k: 'coding' | 'design') => members.reduce((s, e) => s + e.skills[k], 0) / members.length;
    return computeQuality(
      {
        productTypeId: typeId,
        featurePts: (work * shares.featureShare * avg('coding')) / CONFIG.development.skillPointDivisor,
        polishPts: (work * shares.polishShare * avg('design')) / CONFIG.development.skillPointDivisor,
        bugs: 0,
        workRequired: work,
      },
      game.week + (weeks ?? 0),
    );
  }, [members, typeId, work, shares.featureShare, shares.polishShare, game.week, weeks]);

  const submit = () => {
    const ok = dispatch({
      type: 'startProject',
      name: name.trim() || `${type.name} ${game.stats.productsLaunched + game.projects.length + 1}`,
      productTypeId: typeId,
      segmentId,
      scope,
      focus,
      weeklyBudget: budget,
      employeeIds: team,
    });
    if (ok) close();
  };

  const slider = (key: keyof Focus, label: string, hint: string) => (
    <label className="slider">
      <span>
        {label} <span className="muted">{hint}</span>
      </span>
      <input type="range" min={0} max={100} value={focus[key]} onChange={(e) => setFocus({ ...focus, [key]: Number(e.target.value) })} />
      <span className="num">{focus[key]}</span>
    </label>
  );

  return (
    <Modal
      title="New project"
      onClose={close}
      wide
      footer={
        <>
          <button onClick={close}>Cancel</button>
          <button className="primary" disabled={team.length === 0} onClick={submit}>
            Start development
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="form-col">
          <label>
            Working title
            <input value={name} placeholder={`${type.name} ${game.stats.productsLaunched + game.projects.length + 1}`} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </label>
          <label>
            Product type
            <select value={typeId} onChange={(e) => setTypeId(e.target.value as ProductTypeId)}>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="muted small-text">{type.description}</span>
          </label>
          <div className="field">
            <span className="field-label">Target market</span>
            {segments.map((s) => (
              <label key={s.id} className={`radio-card ${s.id === segmentId ? 'selected' : ''}`}>
                <input type="radio" name="segment" checked={s.id === segmentId} onChange={() => setSegmentId(s.id)} />
                <span>
                  <strong>{s.name}</strong>
                  <span className="muted small-text">
                    {' '}
                    ~{categoryWeeklyDemand(game, typeId, s.id).toFixed(1)} sales/wk across the market · typical price{' '}
                    {money(type.suggestedPrice[s.id] ?? s.referencePrice)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-col">
          <div className="field">
            <span className="field-label">Scope</span>
            <div className="segmented">
              {SCOPES.map((s) => (
                <button key={s} className={s === scope ? 'active' : ''} onClick={() => setScope(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Trade-offs</span>
            {slider('features', 'Features', 'coding → feature points')}
            {slider('polish', 'Polish', 'design → polish points')}
            {slider('speed', 'Speed to market', 'less work, more bugs')}
          </div>
          <label>
            Weekly budget (equipment, computer time)
            <input type="number" min={0} step={50} value={budget} onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <div className="field">
            <span className="field-label">Team</span>
            {idle.length === 0 && <span className="muted">Everyone is busy.</span>}
            {idle.map((e) => (
              <label key={e.id} className="check">
                <input
                  type="checkbox"
                  checked={team.includes(e.id)}
                  onChange={() => setTeam((t) => (t.includes(e.id) ? t.filter((x) => x !== e.id) : [...t, e.id]))}
                />
                {e.name}{' '}
                <span className="muted">
                  C{Math.round(e.skills.coding)} D{Math.round(e.skills.design)} T{Math.round(e.skills.testing)}
                </span>
              </label>
            ))}
          </div>
          <div className="estimate">
            <div>
              Work: <strong>{work.toFixed(0)}</strong> units · ETA: <strong>{weeks === null ? '—' : `${weeks} weeks`}</strong>
            </div>
            <div>
              Cost: <strong>{money(budget + salaryPerWeek)}</strong>/wk incl. salaries
              {weeks !== null && <> · ~{money((budget + salaryPerWeek) * weeks)} total</>}
            </div>
            {estimate && (
              <div>
                Expected review before bugs: <strong>~{estimate.reviewScore.toFixed(1)}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
