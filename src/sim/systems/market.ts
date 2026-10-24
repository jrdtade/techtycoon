import { CONFIG } from '../config';
import { fractionalYear } from '../calendar';
import { SEGMENTS } from '../../data';
import { getProductType, getSegment, getTech, isSegmentOpen } from '../content';
import type { Rng } from '../rng';
import type { GameState, Product, ProductTypeId, SegmentId, Week } from '../types';
import { addLog, clamp, pushCapped } from '../util';
import { earn, spend } from './finance';

const M = CONFIG.market;

/** Logistic S-curve: number of buyers in a segment at a (fractional) year. */
export function segmentBuyers(segmentId: SegmentId, year: number): number {
  const { maxBuyers, midpointYear, steepness } = getSegment(segmentId).adoption;
  return maxBuyers / (1 + Math.exp(-steepness * (year - midpointYear)));
}

/** Product of all active era modifiers for a segment. */
export function demandMultiplier(state: GameState, segmentId: SegmentId): number {
  let m = 1;
  for (const mod of state.modifiers) {
    if (mod.segments === 'all' || mod.segments.includes(segmentId)) m *= mod.multiplier;
  }
  return m;
}

/** Software purchases per week across the whole segment. */
export function segmentWeeklyDemand(state: GameState, segmentId: SegmentId, week: Week = state.week): number {
  const seg = getSegment(segmentId);
  const buyers = segmentBuyers(segmentId, fractionalYear(week));
  return (buyers * seg.purchasesPerBuyerPerYear * demandMultiplier(state, segmentId)) / CONFIG.calendar.weeksPerYear;
}

/** Purchases per week of one product category in one segment. */
export function categoryWeeklyDemand(state: GameState, typeId: ProductTypeId, segmentId: SegmentId): number {
  return segmentWeeklyDemand(state, segmentId) * (getProductType(typeId).segmentDemand[segmentId] ?? 0);
}

/** Points a product needs for "full" quality at a given week. Rises every year. */
export function qualityExpectation(typeId: ProductTypeId, week: Week): number {
  const years = fractionalYear(week) - CONFIG.start.year;
  return (
    getProductType(typeId).baseWork *
    CONFIG.quality.expectationBase *
    Math.pow(1 + CONFIG.quality.expectationGrowthPerYear, years)
  );
}

function saturate(x: number): number {
  return 1 - Math.exp(-CONFIG.quality.saturation * Math.max(0, x));
}

export interface QualityInput {
  productTypeId: ProductTypeId;
  featurePts: number;
  polishPts: number;
  bugs: number;
  workRequired: number;
}

export interface QualityResult {
  quality: number;
  reviewScore: number;
  featureScore: number;
  polishScore: number;
  bugPenalty: number;
}

/** Quality (0–1) and review score (1–10) of a finished project launched at `week`. */
export function computeQuality(p: QualityInput, week: Week): QualityResult {
  const Q = CONFIG.quality;
  const expected = qualityExpectation(p.productTypeId, week);
  const featureScore = saturate(p.featurePts / (expected * Q.featureWeight));
  const polishScore = saturate(p.polishPts / (expected * Q.polishWeight));
  const density = p.workRequired > 0 ? p.bugs / p.workRequired : 0;
  const bugPenalty = Math.min(Q.bugPenaltyMax, Q.bugPenaltyPerDensity * density);
  const quality = clamp(Q.featureWeight * featureScore + Q.polishWeight * polishScore - bugPenalty, 0, 1);
  const reviewScore = Math.round((1 + 9 * quality) * 10) / 10;
  return { quality, reviewScore, featureScore, polishScore, bugPenalty };
}

/** Year a segment became available (its tech's arrival, or the start year). */
export function segmentOpenYear(segmentId: SegmentId): number {
  const tech = getSegment(segmentId).requiresTech;
  return tech ? getTech(tech).arrives.year : CONFIG.start.year;
}

/** Appeal of "everyone else" selling in this category. Phase 2 competitors replace this term. */
export function baselineAppeal(segmentId: SegmentId, week: Week): number {
  const years = Math.max(0, fractionalYear(week) - segmentOpenYear(segmentId));
  return getSegment(segmentId).baselineAppeal * Math.pow(1 + M.baselineAppealGrowthPerYear, years);
}

export function priceFactor(segmentId: SegmentId, price: number): number {
  const seg = getSegment(segmentId);
  if (price <= 0) return M.priceFactorMax;
  return clamp(Math.pow(seg.referencePrice / price, seg.priceElasticity), M.priceFactorMin, M.priceFactorMax);
}

export function reputationFactor(reputation: number): number {
  return M.reputationBase + reputation / 100;
}

export function marketingFactor(segmentId: SegmentId, weekly: number): number {
  return 1 + M.marketingStrength * Math.log(1 + Math.max(0, weekly) / getSegment(segmentId).marketingReference);
}

/** Launch ramp then exponential decline. */
export function lifecycleFactor(segmentId: SegmentId, ageWeeks: number): number {
  const ramp = Math.min(1, (ageWeeks + 1) / M.launchRampWeeks);
  return ramp * Math.exp(-ageWeeks / getSegment(segmentId).productLifeWeeks);
}

/** Launch quality eroded by rising expectations since launch. */
export function effectiveQuality(product: Product, week: Week): number {
  const years = Math.max(0, (week - product.launchWeek) / CONFIG.calendar.weeksPerYear);
  return product.quality / Math.pow(1 + CONFIG.quality.expectationGrowthPerYear, years);
}

export interface AppealBreakdown {
  quality: number;
  price: number;
  reputation: number;
  marketing: number;
  lifecycle: number;
  appeal: number;
}

export function productAppeal(state: GameState, product: Product, week: Week = state.week): AppealBreakdown {
  const quality = Math.pow(effectiveQuality(product, week), M.qualityExponent);
  const price = priceFactor(product.segmentId, product.price);
  const reputation = reputationFactor(state.company.reputation);
  const marketing = marketingFactor(product.segmentId, product.marketingWeekly);
  const lifecycle = lifecycleFactor(product.segmentId, week - product.launchWeek);
  return { quality, price, reputation, marketing, lifecycle, appeal: quality * price * reputation * marketing * lifecycle };
}

/** Expected (pre-noise) weekly units for every product on sale, keyed by product id. */
export function expectedWeeklyUnits(state: GameState): Map<string, number> {
  const result = new Map<string, number>();
  const groups = new Map<string, Product[]>();
  for (const p of state.products) {
    if (p.status !== 'onSale') continue;
    const key = `${p.productTypeId}|${p.segmentId}`;
    const g = groups.get(key);
    if (g) g.push(p);
    else groups.set(key, [p]);
  }
  for (const group of groups.values()) {
    const first = group[0]!;
    const demand = categoryWeeklyDemand(state, first.productTypeId, first.segmentId);
    const appeals = group.map((p) => productAppeal(state, p).appeal);
    const total = baselineAppeal(first.segmentId, state.week) + appeals.reduce((a, b) => a + b, 0);
    group.forEach((p, i) => result.set(p.id, (demand * appeals[i]!) / total));
  }
  return result;
}

/** One week of sales for every product on sale. */
export function simulateSales(state: GameState, rng: Rng): void {
  const expected = expectedWeeklyUnits(state);
  for (const p of state.products) {
    if (p.status !== 'onSale') continue;
    const noisy = (expected.get(p.id) ?? 0) * (1 + rng.range(-M.salesNoise, M.salesNoise));
    // Fractional units accumulate so a mainframe package selling 0.2/week still sells one every ~5 weeks.
    p.unitCarry += noisy;
    const units = Math.floor(p.unitCarry);
    p.unitCarry -= units;
    pushCapped(p.recentWeeklyUnits, units, CONFIG.history.recentWeeklyUnits);
    if (units > 0) {
      const revenue = units * p.price;
      p.unitsSold += units;
      p.revenue += revenue;
      state.stats.totalSalesRevenue += revenue;
      earn(state, 'sales', revenue);
      spend(state, 'unitCosts', units * getSegment(p.segmentId).unitCost);
    }
    spend(state, 'marketing', p.marketingWeekly);

    if (lifecycleFactor(p.segmentId, state.week - p.launchWeek) < M.autoRetireLifecycle) {
      retireProduct(state, p, `${p.name} has run its course and is withdrawn from sale.`);
    }
  }
}

export function retireProduct(state: GameState, p: Product, message: string): void {
  p.status = 'retired';
  p.retiredWeek = state.week;
  p.marketingWeekly = 0;
  p.unitCarry = 0;
  p.recentWeeklyUnits = [];
  addLog(state, 'product', message);
}

export interface LaunchPreview extends QualityResult {
  /** Expected units per week at full lifecycle (a few weeks after launch). */
  weeklyUnits: number;
  weeklyRevenue: number;
  weeklyProfit: number;
}

/** What launching a finished project at this price and marketing would look like. Pure. */
export function previewLaunch(state: GameState, projectId: string, price: number, marketingWeekly: number): LaunchPreview | null {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const q = computeQuality(project, state.week);
  const ramped = state.week - M.launchRampWeeks + 1; // pretend the launch ramp is complete
  const probe: Product = {
    id: '__preview__', name: project.name, productTypeId: project.productTypeId, segmentId: project.segmentId,
    launchWeek: ramped, price: Math.max(1, price), marketingWeekly: Math.max(0, marketingWeekly),
    quality: q.quality, reviewScore: q.reviewScore, bugs: project.bugs, unitsSold: 0, revenue: 0, unitCarry: 0,
    recentWeeklyUnits: [], status: 'onSale', retiredWeek: null,
  };
  const units = expectedWeeklyUnits({ ...state, products: [...state.products, probe] }).get(probe.id) ?? 0;
  const revenue = units * probe.price;
  const profit = revenue - units * getSegment(project.segmentId).unitCost - probe.marketingWeekly;
  return { ...q, weeklyUnits: units, weeklyRevenue: revenue, weeklyProfit: profit };
}

export interface SegmentOverview {
  id: SegmentId;
  name: string;
  description: string;
  open: boolean;
  /** For a closed segment: what opens it, and when. */
  opensWith: string | null;
  buyers: number;
  /** Software purchases per week across all categories. */
  weeklyDemand: number;
  /** Year-on-year growth of the buyer base. */
  growth: number;
  /** Active era modifier on demand (1 = none). */
  modifier: number;
  referencePrice: number;
}

export function segmentOverview(state: GameState): SegmentOverview[] {
  const year = fractionalYear(state.week);
  return SEGMENTS.map((seg) => {
    const open = isSegmentOpen(state, seg.id);
    const tech = seg.requiresTech ? getTech(seg.requiresTech) : null;
    return {
      id: seg.id,
      name: seg.name,
      description: seg.description,
      open,
      opensWith: open || !tech ? null : tech.name,
      buyers: segmentBuyers(seg.id, year),
      weeklyDemand: segmentWeeklyDemand(state, seg.id),
      growth: segmentBuyers(seg.id, year) / segmentBuyers(seg.id, year - 1) - 1,
      modifier: demandMultiplier(state, seg.id),
      referencePrice: seg.referencePrice,
    };
  });
}
