// Public API of the simulation. The UI imports from here only.
export * from './types';
export { CONFIG, SCOPES } from './config';
export { newGame, SCHEMA_VERSION } from './newGame';
export type { NewGameOptions } from './newGame';
export { step, stepMany } from './tick';
export { dispatch } from './commands';
export * from './calendar';
export * from './content';
export {
  segmentBuyers,
  segmentWeeklyDemand,
  categoryWeeklyDemand,
  qualityExpectation,
  computeQuality,
  productAppeal,
  expectedWeeklyUnits,
  baselineAppeal,
  priceFactor,
  previewLaunch,
  lifecycleFactor,
} from './systems/market';
export type { LaunchPreview, AppealBreakdown } from './systems/market';
export { focusShares, teamProgress, weeksRemaining, workRequiredFor, projectTeam } from './systems/development';
export { ledgerIncome, ledgerExpenses } from './systems/finance';
export { askingSalary, hireFee, severance } from './systems/staff';
export { summarize } from './summary';
export type { GameSummary } from './summary';
export { createSave, saveToJson, loadSave, migrateState, SAVE_FORMAT } from './save';
export type { SaveFile, LoadResult } from './save';
