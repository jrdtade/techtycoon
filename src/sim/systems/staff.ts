import { FIRST_NAMES, LAST_NAMES } from '../../data';
import { CONFIG } from '../config';
import { fractionalYear } from '../calendar';
import type { Rng } from '../rng';
import type { Candidate, GameState, SkillName, Skills } from '../types';
import { inflation, newId, roundTo } from '../util';

const S = CONFIG.staff;

const ROLES: { role: string; primary: SkillName | null }[] = [
  { role: 'Programmer', primary: 'coding' },
  { role: 'Programmer', primary: 'coding' },
  { role: 'Designer', primary: 'design' },
  { role: 'Tester', primary: 'testing' },
  { role: 'Generalist', primary: null },
];

/** Annual salary asked for a given skill set at a given week. */
export function askingSalary(skills: Skills, week: number): number {
  const values = [skills.coding, skills.design, skills.testing];
  const primary = Math.max(...values);
  const others = values.reduce((a, b) => a + b, 0) - primary;
  const base = S.salaryBase + S.salaryPerPrimarySkill * primary + S.salaryPerOtherSkill * others;
  return roundTo(base * inflation(fractionalYear(week)), 100);
}

function uniqueName(state: GameState, rng: Rng): string {
  const taken = new Set([...state.employees.map((e) => e.name), ...state.candidates.map((c) => c.name)]);
  for (let i = 0; i < 20; i++) {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    if (!taken.has(name)) return name;
  }
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)} ${state.nextId}`;
}

export function generateCandidate(state: GameState, rng: Rng): Candidate {
  const { role, primary } = rng.pick(ROLES);
  const roll = () => rng.int(S.candidateSkillMin, S.candidateSkillMax);
  const skills: Skills = { coding: roll(), design: roll(), testing: roll() };
  if (primary) {
    // Specialists: strong primary skill, weaker others.
    skills[primary] = Math.min(S.skillMax, Math.max(skills[primary], rng.int(35, S.candidateSkillMax + 10)));
    for (const k of ['coding', 'design', 'testing'] as const) if (k !== primary) skills[k] = Math.round(skills[k] * 0.6);
  }
  return { id: newId(state, 'cand'), name: uniqueName(state, rng), role, salary: askingSalary(skills, state.week), skills };
}

/** Replaces the candidate pool (called monthly). */
export function refreshCandidates(state: GameState, rng: Rng): void {
  state.candidates = [];
  for (let i = 0; i < S.candidatesPerRefresh; i++) state.candidates.push(generateCandidate(state, rng));
}

export function hireFee(salary: number): number {
  return Math.round((salary / CONFIG.calendar.weeksPerYear) * S.hireFeeWeeks);
}

export function severance(salary: number): number {
  return Math.round((salary / CONFIG.calendar.weeksPerYear) * S.severanceWeeks);
}
