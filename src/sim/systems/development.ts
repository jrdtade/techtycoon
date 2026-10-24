import { CONFIG } from '../config';
import { getProductType } from '../content';
import type { Employee, Focus, GameState, ProductTypeId, Project, ProjectScope, SkillName } from '../types';
import { addLog } from '../util';
import { spend } from './finance';

const D = CONFIG.development;

export interface FocusShares {
  /** Share of output that becomes feature points (features + polish = 1). */
  featureShare: number;
  polishShare: number;
  /** Speed is NOT a share of output. It shortens the project and adds bugs instead. */
  speedShare: number;
}

/**
 * Speed is excluded from the output split on purpose: all output becomes feature or polish
 * points, and the speed slider instead cuts workRequired (and raises the bug rate). Fewer work
 * units means fewer points in total, so speed costs quality without any output being discarded
 * or double-counted.
 */
export function focusShares(f: Focus): FocusShares {
  const total = f.features + f.polish + f.speed;
  const speedShare = total > 0 ? f.speed / total : 0;
  const fp = f.features + f.polish;
  const featureShare = fp > 0 ? f.features / fp : 0.5;
  return { featureShare, polishShare: 1 - featureShare, speedShare };
}

export function workRequiredFor(typeId: ProductTypeId, scope: ProjectScope, focus: Focus): number {
  const { speedShare } = focusShares(focus);
  return getProductType(typeId).baseWork * D.scopeMultiplier[scope] * (1 - D.speedWorkReduction * speedShare);
}

export function budgetBoost(weeklyBudget: number, teamSize: number): number {
  if (teamSize === 0 || weeklyBudget <= 0) return 1;
  const reference = D.budgetReferencePerHead * teamSize;
  return Math.min(D.budgetBoostMax, 1 + D.budgetBoostAtReference * Math.sqrt(weeklyBudget / reference));
}

export function employeeProgress(e: Employee): number {
  return D.progressPerEmployee * (D.progressSkillBase + (D.progressSkillWeight * e.skills.coding) / 100);
}

/** Expected weekly progress of a team on a project (before clamping to the work remaining). */
export function teamProgress(team: Employee[], weeklyBudget: number): number {
  if (team.length === 0) return 0;
  const raw = team.reduce((sum, e) => sum + employeeProgress(e), 0);
  return raw * budgetBoost(weeklyBudget, team.length) * Math.pow(team.length, -D.teamPenaltyExponent);
}

function average(team: Employee[], skill: SkillName): number {
  return team.length === 0 ? 0 : team.reduce((s, e) => s + e.skills[skill], 0) / team.length;
}

export function growSkill(e: Employee, skill: SkillName, weight: number): void {
  const cur = e.skills[skill];
  e.skills[skill] = Math.min(CONFIG.staff.skillMax, cur + CONFIG.staff.skillGrowthPerWeek * weight * (1 - cur / 100));
}

export function projectTeam(state: GameState, projectId: string): Employee[] {
  return state.employees.filter((e) => e.projectId === projectId);
}

/** Estimated weeks to finish at the current team and budget, or null if nobody is assigned. */
export function weeksRemaining(state: GameState, project: Project): number | null {
  const progress = teamProgress(projectTeam(state, project.id), project.weeklyBudget);
  if (progress <= 0) return null;
  return Math.ceil(Math.max(0, project.workRequired - project.workDone) / progress);
}

export function advanceProject(state: GameState, project: Project): void {
  const team = projectTeam(state, project.id);
  if (team.length === 0) return; // an unstaffed project is on hold and costs nothing
  spend(state, 'devBudget', project.weeklyBudget);

  const { featureShare, polishShare, speedShare } = focusShares(project.focus);
  const avgCoding = average(team, 'coding');
  const avgTesting = average(team, 'testing');

  if (project.status === 'inDevelopment') {
    const expected = teamProgress(team, project.weeklyBudget);
    const progress = Math.min(expected, project.workRequired - project.workDone);
    const scale = expected > 0 ? progress / expected : 0;
    const boost = budgetBoost(project.weeklyBudget, team.length) * Math.pow(team.length, -D.teamPenaltyExponent);

    // Each person turns their share of the progress into points using their own skills.
    for (const e of team) {
      const p = employeeProgress(e) * boost * scale;
      project.featurePts += (p * featureShare * e.skills.coding) / D.skillPointDivisor;
      project.polishPts += (p * polishShare * e.skills.design) / D.skillPointDivisor;
    }
    project.bugs +=
      progress * D.bugsPerWork * (1 + D.speedBugFactor * speedShare) * Math.max(0.1, D.bugSkillBase - avgCoding / 100);
    project.workDone += progress;
  }

  // Testing removes a fraction of open bugs every week, including while waiting to launch.
  project.bugs -= project.bugs * (D.bugFixBase + (D.bugFixTestingWeight * avgTesting) / 100);

  for (const e of team) {
    e.weeksWorked += 1;
    if (project.status === 'inDevelopment') {
      growSkill(e, 'coding', 0.5 + featureShare);
      growSkill(e, 'design', polishShare * 1.5);
    }
    growSkill(e, 'testing', 0.5);
  }

  if (project.status === 'inDevelopment' && project.workDone >= project.workRequired - 1e-9) {
    project.workDone = project.workRequired;
    project.status = 'readyToLaunch';
    addLog(
      state,
      'project',
      `${project.name} is finished and ready to launch. The team keeps fixing bugs until you ship it.`,
      true,
    );
  }
}

export function advanceProjects(state: GameState): void {
  for (const project of state.projects) advanceProject(state, project);
}
