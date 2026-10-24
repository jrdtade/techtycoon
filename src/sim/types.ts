import type { ProductTypeId, SegmentId, TechId } from '../data/types';
import type { ProjectScope } from './config';
import type { RngState } from './rng';

export type { ProductTypeId, SegmentId, TechId, ProjectScope, RngState };

export type Id = string;
/** Absolute week index; week 0 = first week of January 1970. */
export type Week = number;

export type GameStatus = 'playing' | 'bankrupt' | 'finished';

export interface Skills {
  coding: number;
  design: number;
  testing: number;
}
export type SkillName = keyof Skills;

export interface Company {
  name: string;
  cash: number;
  /** 0–100 */
  reputation: number;
  lifetimeRevenue: number;
  peakCash: number;
}

export interface Employee {
  id: Id;
  name: string;
  /** Annual salary in dollars. */
  salary: number;
  hiredWeek: Week;
  isFounder: boolean;
  /** 0–100, fractional; grows with experience. */
  skills: Skills;
  weeksWorked: number;
  /** What the employee is doing. At most one of these is set. */
  projectId: Id | null;
  contractId: Id | null;
}

export interface Candidate {
  id: Id;
  name: string;
  role: string;
  salary: number;
  skills: Skills;
}

/** Sliders 0–100. Features and polish split the team's output; speed is a modifier, not a share. */
export interface Focus {
  features: number;
  polish: number;
  speed: number;
}

export interface Project {
  id: Id;
  name: string;
  productTypeId: ProductTypeId;
  segmentId: SegmentId;
  scope: ProjectScope;
  focus: Focus;
  weeklyBudget: number;
  workRequired: number;
  workDone: number;
  featurePts: number;
  polishPts: number;
  bugs: number;
  startedWeek: Week;
  status: 'inDevelopment' | 'readyToLaunch';
}

export interface Product {
  id: Id;
  name: string;
  productTypeId: ProductTypeId;
  segmentId: SegmentId;
  launchWeek: Week;
  price: number;
  marketingWeekly: number;
  /** 0–1, fixed at launch. */
  quality: number;
  /** 1–10 */
  reviewScore: number;
  bugs: number;
  unitsSold: number;
  revenue: number;
  /** Fractional units carried between weeks so low-volume products still sell. */
  unitCarry: number;
  /** Weekly units sold, oldest → newest, capped at CONFIG.history.recentWeeklyUnits. */
  recentWeeklyUnits: number[];
  status: 'onSale' | 'retired';
  retiredWeek: Week | null;
}

export interface ContractOffer {
  id: Id;
  client: string;
  job: string;
  weeks: number;
  staffRequired: number;
  /** Minimum average coding skill of the assigned staff. */
  minSkill: number;
  fee: number;
}

export interface Contract extends ContractOffer {
  employeeIds: Id[];
  weeksLeft: number;
  startedWeek: Week;
}

export interface DemandModifier {
  sourceId: string;
  segments: SegmentId[] | 'all';
  multiplier: number;
  untilWeek: Week;
}

export type IncomeCategory = 'sales' | 'contracts';
export type ExpenseCategory = 'salaries' | 'rent' | 'devBudget' | 'marketing' | 'unitCosts' | 'hiring' | 'severance';

export interface Ledger {
  income: Record<IncomeCategory, number>;
  expenses: Record<ExpenseCategory, number>;
}

export interface MonthlyReport extends Ledger {
  year: number;
  month: number;
  net: number;
  cashEnd: number;
}

/** Older monthly reports are folded into one of these per year. */
export interface AnnualSummary {
  year: number;
  income: number;
  expenses: number;
  net: number;
}

export interface FinanceState {
  /** Accumulates the current week, including money moved by commands between ticks. */
  thisWeek: Ledger;
  /** The last completed week. */
  lastWeek: Ledger;
  thisMonth: Ledger;
  reports: MonthlyReport[];
  annual: AnnualSummary[];
  monthsInRed: number;
}

export type LogKind =
  | 'launch'
  | 'project'
  | 'milestone'
  | 'era'
  | 'tech'
  | 'finance'
  | 'staff'
  | 'contract'
  | 'product'
  | 'info';

export interface LogEntry {
  /** Monotonic sequence number; survives log trimming so the UI can detect new entries. */
  seq: number;
  week: Week;
  kind: LogKind;
  text: string;
  /** Important entries auto-pause the game. */
  important: boolean;
}

export interface GameStats {
  productsLaunched: number;
  contractsCompleted: number;
  peakEmployees: number;
  bestReview: number;
  bestProductName: string | null;
  totalSalesRevenue: number;
  totalContractRevenue: number;
}

export interface GameState {
  schemaVersion: number;
  seed: number;
  rng: RngState;
  week: Week;
  status: GameStatus;
  company: Company;
  employees: Employee[];
  candidates: Candidate[];
  contractOffers: ContractOffer[];
  contracts: Contract[];
  projects: Project[];
  products: Product[];
  unlockedTech: TechId[];
  firedEvents: string[];
  milestonesReached: string[];
  modifiers: DemandModifier[];
  finance: FinanceState;
  log: LogEntry[];
  stats: GameStats;
  nextId: number;
  nextLogSeq: number;
}

export type Command =
  | {
      type: 'startProject';
      name: string;
      productTypeId: ProductTypeId;
      segmentId: SegmentId;
      scope: ProjectScope;
      focus: Focus;
      weeklyBudget: number;
      employeeIds: Id[];
    }
  | { type: 'assignEmployee'; employeeId: Id; projectId: Id | null }
  | { type: 'setProjectBudget'; projectId: Id; weeklyBudget: number }
  | { type: 'cancelProject'; projectId: Id }
  | { type: 'launchProduct'; projectId: Id; productName: string; price: number; marketingWeekly: number }
  | { type: 'setPrice'; productId: Id; price: number }
  | { type: 'setMarketing'; productId: Id; weekly: number }
  | { type: 'retireProduct'; productId: Id }
  | { type: 'hireEmployee'; candidateId: Id }
  | { type: 'fireEmployee'; employeeId: Id }
  | { type: 'acceptContract'; offerId: Id; employeeIds: Id[] }
  | { type: 'abandonContract'; contractId: Id };

export type CommandType = Command['type'];

export type DispatchResult = { ok: true; state: GameState } | { ok: false; error: string };
