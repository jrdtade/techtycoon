// Typed content definitions. Data files contain no logic; the sim reads them.

export type SegmentId = 'mainframe' | 'minicomputer' | 'academic' | 'hobbyist' | 'home' | 'officePc';

export type ProductTypeId =
  | 'accounting'
  | 'devTools'
  | 'games'
  | 'database'
  | 'wordProcessor'
  | 'spreadsheet'
  | 'graphics';

export type TechId =
  | 'timeSharing'
  | 'relationalModel'
  | 'microprocessor'
  | 'screenEditors'
  | 'homeComputers'
  | 'floppyDisk'
  | 'electronicWorksheet'
  | 'graphicalInterfaces';

/** A point in the calendar. month is 1–12. */
export interface YearMonth {
  year: number;
  month: number;
}

export interface SegmentDef {
  id: SegmentId;
  name: string;
  description: string;
  /** Segment is closed until this technology is unlocked (undefined = open from the start). */
  requiresTech?: TechId;
  /** Logistic adoption: buyers(t) = maxBuyers / (1 + e^(-steepness·(t - midpointYear))). */
  adoption: { maxBuyers: number; midpointYear: number; steepness: number };
  /** Software packages an average buyer purchases per year, across all categories. */
  purchasesPerBuyerPerYear: number;
  /** Price at which the price factor is 1. */
  referencePrice: number;
  /** Exponent in (referencePrice / price)^elasticity. Higher = more price sensitive. */
  priceElasticity: number;
  /** Media, manuals and distribution cost per unit sold. */
  unitCost: number;
  /** Weekly marketing spend at which marketing has a "typical" effect. */
  marketingReference: number;
  /** Product lifecycle decay constant in weeks (appeal × e^(-age/lifeWeeks)). */
  productLifeWeeks: number;
}

export interface ProductTypeDef {
  id: ProductTypeId;
  name: string;
  description: string;
  requiresTech?: TechId;
  /** Work units for a medium-scope project. One average employee produces about 1 unit per week. */
  baseWork: number;
  /** Share of a segment's software purchases that go to this category. Missing = cannot target. */
  segmentDemand: Partial<Record<SegmentId, number>>;
  /** Suggested launch price per segment (UI hint only). */
  suggestedPrice: Partial<Record<SegmentId, number>>;
}

export interface TechDef {
  id: TechId;
  name: string;
  description: string;
  arrives: YearMonth;
}

export type EraEffect = {
  kind: 'demandModifier';
  segments: SegmentId[] | 'all';
  multiplier: number;
  durationWeeks: number;
};

export interface EraEventDef {
  id: string;
  title: string;
  text: string;
  arrives: YearMonth;
  important: boolean;
  effects: EraEffect[];
}

export type MilestoneMetric = 'lifetimeRevenue' | 'cash' | 'employees' | 'productsLaunched' | 'reputation';

export interface MilestoneDef {
  id: string;
  metric: MilestoneMetric;
  threshold: number;
  text: string;
  important: boolean;
}
