// Balance configuration. EVERY number in this file is a balance guess unless a comment says
// otherwise; tune them with the headless run (tests/headless.test.ts) rather than burying
// magic numbers in logic.

export const CONFIG = {
  start: {
    year: 1970, // fixed by design
    cash: 25_000,
    reputation: 10,
    founderSalary: 6_000, // annual
    founderSkills: { coding: 45, design: 35, testing: 30 },
  },

  calendar: {
    weeksPerYear: 52, // fixed by design: one tick = one week
    endYear: 1985, // the game ends when 1985 is over (fixed by design)
  },

  economy: {
    /** Annual growth of salaries, contract fees and office rent. */
    wageInflationPerYear: 0.05,
  },

  development: {
    scopeMultiplier: { small: 0.5, medium: 1, large: 2, epic: 3.5 },
    /** Base progress per employee per week; scaled by coding skill (see progressSkillWeight). */
    progressPerEmployee: 1,
    /** progress = base × (progressSkillBase + progressSkillWeight × coding/100). */
    progressSkillBase: 0.7,
    progressSkillWeight: 0.6,
    /** Team-size diminishing returns: total progress × teamSize^-teamPenaltyExponent. */
    teamPenaltyExponent: 0.1,
    /** Weekly budget per assigned employee that gives budgetBoostAtReference. */
    budgetReferencePerHead: 150,
    /** budgetBoost = 1 + budgetBoostAtReference × sqrt(budget / reference), capped at budgetBoostMax. */
    budgetBoostAtReference: 0.5,
    budgetBoostMax: 2,
    /** Feature points per progress unit = featureShare × coding / skillPointDivisor (same for design/polish). */
    skillPointDivisor: 50,
    /** workRequired × (1 − speedWorkReduction × speedShare). */
    speedWorkReduction: 0.4,
    /** Bugs per progress unit = bugsPerWork × (1 + speedBugFactor × speedShare) × (bugSkillBase − coding/100). */
    bugsPerWork: 0.35,
    speedBugFactor: 1.5,
    bugSkillBase: 1.4,
    /** Weekly bug-fix fraction = bugFixBase + bugFixTestingWeight × avgTesting/100. */
    bugFixBase: 0.03,
    bugFixTestingWeight: 0.12,
  },

  quality: {
    /** Points expected for full quality = baseWork × expectationBase × (1 + growth)^(year − 1970). */
    expectationBase: 1,
    expectationGrowthPerYear: 0.06,
    featureWeight: 0.6,
    polishWeight: 0.4,
    /** sat(x) = 1 − e^(−saturation·x): diminishing returns on points beyond expectation. */
    saturation: 1.6,
    /** bugPenalty = min(bugPenaltyMax, bugPenaltyPerDensity × bugs / workRequired). */
    bugPenaltyPerDensity: 0.5,
    bugPenaltyMax: 0.35,
  },

  market: {
    /** The "everyone else" baseline appeal is per segment (src/data/segments.ts). It grows as categories mature: × (1 + growth)^(years since segment opened). */
    baselineAppealGrowthPerYear: 0.04,
    qualityExponent: 1.5,
    priceFactorMin: 0.05,
    priceFactorMax: 3,
    /** repFactor = reputationBase + reputation/100. */
    reputationBase: 0.5,
    /** marketingFactor = 1 + marketingStrength × ln(1 + spend / reference). */
    marketingStrength: 0.3,
    launchRampWeeks: 4,
    /** Uniform weekly noise on expected units: × (1 ± salesNoise). */
    salesNoise: 0.1,
    /** Products are auto-retired once their lifecycle factor drops below this. */
    autoRetireLifecycle: 0.05,
  },

  reputation: {
    min: 0,
    max: 100,
    /** Δrep at launch = (reviewScore − 5) × launchDeltaPerPoint. */
    launchDeltaPerPoint: 4,
    /** Weekly drift toward the target set by products on sale. */
    driftPerWeek: 0.01,
    /** Drift target = (average review − targetReviewOffset) × targetPerReviewPoint. A 6.9 review → ~41, 9 → 70. */
    targetReviewOffset: 4,
    targetPerReviewPoint: 14,
    /** Target when nothing is on sale. */
    idleTarget: 10,
    contractCompleted: 0.5,
    contractFailed: -3,
  },

  staff: {
    candidatesPerRefresh: 4,
    candidateSkillMin: 10,
    candidateSkillMax: 70,
    /** Annual salary = (base + perPrimarySkill × primary + perOtherSkill × others) × inflation. */
    salaryBase: 4_000,
    salaryPerPrimarySkill: 140,
    salaryPerOtherSkill: 40,
    hireFeeWeeks: 2, // recruiting fee, in weeks of salary
    severanceWeeks: 4,
    officeRentPerEmployeeWeekly: 25,
    /** Weekly skill growth while working = rate × (1 − skill/100). */
    skillGrowthPerWeek: 0.3,
    contractSkillGrowthFactor: 0.5,
    skillMax: 100,
  },

  contracts: {
    offersPerRefresh: 3,
    weeksMin: 4,
    weeksMax: 12,
    staffMax: 3,
    minSkillMin: 15,
    minSkillMax: 60,
    /** fee = staff × weeks × feePerStaffWeek × (1 + minSkill/100) × (1 ± feeNoise) × inflation. */
    feePerStaffWeek: 330,
    feeNoise: 0.2,
  },

  finance: {
    /** Consecutive month-ends with negative cash before bankruptcy. */
    monthsInRedForBankruptcy: 3,
  },

  /** End-of-game score = Σ weight × metric. Balance guess; only used for the summary screen. */
  score: {
    perDollarCash: 0.001,
    perDollarLifetimeRevenue: 0.0005,
    perReputationPoint: 20,
    perProductLaunched: 50,
    bankruptcyMultiplier: 0.5,
    ranks: [
      { min: 0, title: 'Garage Tinkerer' },
      { min: 1_000, title: 'Small Software House' },
      { min: 5_000, title: 'Regional Player' },
      { min: 25_000, title: 'Industry Contender' },
      { min: 100_000, title: 'Valley Titan' },
    ],
  },

  history: {
    maxLogEntries: 200,
    maxMonthlyReports: 24, // older months are folded into annual summaries
    recentWeeklyUnits: 26,
  },
} as const;

export type ProjectScope = keyof typeof CONFIG.development.scopeMultiplier;
export const SCOPES = Object.keys(CONFIG.development.scopeMultiplier) as ProjectScope[];
