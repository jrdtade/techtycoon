import {
  computeQuality,
  expectedWeeklyUnits,
  priceFactor,
  segmentBuyers,
  segmentWeeklyDemand,
  weekOf,
} from '../src/sim';
import { lifecycleFactor, simulateSales } from '../src/sim/systems/market';
import { Rng } from '../src/sim/rng';
import { freshGame, makeProduct } from './helpers';

describe('segment adoption', () => {
  test('S-curve grows monotonically and approaches the ceiling', () => {
    let prev = 0;
    for (let y = 1970; y <= 1985; y += 0.5) {
      const b = segmentBuyers('home', y);
      expect(b).toBeGreaterThan(prev);
      prev = b;
    }
    expect(segmentBuyers('home', 2000)).toBeCloseTo(8_000_000, -4);
    expect(segmentBuyers('home', 1983)).toBeCloseTo(4_000_000, -3); // midpoint
  });

  test('PC-era segments dwarf mainframes by 1985', () => {
    const s = freshGame();
    s.week = weekOf(1985, 6);
    expect(segmentWeeklyDemand(s, 'officePc')).toBeGreaterThan(100 * segmentWeeklyDemand(s, 'mainframe'));
  });

  test('era modifiers scale demand', () => {
    const s = freshGame();
    const base = segmentWeeklyDemand(s, 'mainframe');
    s.modifiers.push({ sourceId: 'x', segments: ['mainframe'], multiplier: 0.5, untilWeek: 99 });
    expect(segmentWeeklyDemand(s, 'mainframe')).toBeCloseTo(base * 0.5);
  });
});

describe('quality', () => {
  const base = { productTypeId: 'accounting' as const, bugs: 0, workRequired: 30 };

  test('more points means higher quality, with diminishing returns', () => {
    const q1 = computeQuality({ ...base, featurePts: 9, polishPts: 6 }, 0).quality;
    const q2 = computeQuality({ ...base, featurePts: 18, polishPts: 12 }, 0).quality;
    const q3 = computeQuality({ ...base, featurePts: 36, polishPts: 24 }, 0).quality;
    expect(q2).toBeGreaterThan(q1);
    expect(q3).toBeGreaterThan(q2);
    expect(q3 - q2).toBeLessThan(q2 - q1);
    expect(q3).toBeLessThanOrEqual(1);
  });

  test('bugs reduce quality', () => {
    const clean = computeQuality({ ...base, featurePts: 18, polishPts: 12 }, 0);
    const buggy = computeQuality({ ...base, featurePts: 18, polishPts: 12, bugs: 15 }, 0);
    expect(buggy.quality).toBeLessThan(clean.quality);
    expect(buggy.bugPenalty).toBeGreaterThan(0);
  });

  test('the same product is worth less in a later year', () => {
    const p = { ...base, featurePts: 18, polishPts: 12 };
    expect(computeQuality(p, weekOf(1980, 1)).quality).toBeLessThan(computeQuality(p, 0).quality);
  });

  test('review score maps 0–1 quality onto 1–10', () => {
    expect(computeQuality({ ...base, featurePts: 0, polishPts: 0 }, 0).reviewScore).toBe(1);
    const r = computeQuality({ ...base, featurePts: 500, polishPts: 500 }, 0).reviewScore;
    expect(r).toBeGreaterThan(9.5);
    expect(r).toBeLessThanOrEqual(10);
  });
});

describe('sales', () => {
  test('price above reference lowers the price factor, more so in elastic segments', () => {
    expect(priceFactor('mainframe', 6000)).toBeCloseTo(1);
    expect(priceFactor('mainframe', 12000)).toBeLessThan(1);
    const mainframeDrop = priceFactor('mainframe', 12000);
    const homeDrop = priceFactor('home', 50); // also 2× reference
    expect(homeDrop).toBeLessThan(mainframeDrop);
  });

  test('better quality, reputation and marketing all sell more', () => {
    const s = freshGame();
    s.products = [makeProduct()];
    const base = expectedWeeklyUnits(s).get('prd_test')!;
    expect(base).toBeGreaterThan(0);

    s.products = [makeProduct({ quality: 0.9 })];
    expect(expectedWeeklyUnits(s).get('prd_test')!).toBeGreaterThan(base);

    s.products = [makeProduct({ marketingWeekly: 500 })];
    expect(expectedWeeklyUnits(s).get('prd_test')!).toBeGreaterThan(base);

    s.products = [makeProduct()];
    s.company.reputation = 80;
    expect(expectedWeeklyUnits(s).get('prd_test')!).toBeGreaterThan(base);
  });

  test('two of your products in one category split demand', () => {
    const s = freshGame();
    s.products = [makeProduct()];
    const alone = expectedWeeklyUnits(s).get('prd_test')!;
    s.products = [makeProduct(), makeProduct({ id: 'prd_two' })];
    const split = expectedWeeklyUnits(s);
    expect(split.get('prd_test')!).toBeLessThan(alone);
    expect(split.get('prd_test')!).toBeCloseTo(split.get('prd_two')!);
  });

  test('products decline with age', () => {
    expect(lifecycleFactor('home', 10)).toBeGreaterThan(lifecycleFactor('home', 60));
    expect(lifecycleFactor('home', 0)).toBeLessThan(lifecycleFactor('home', 4)); // launch ramp
  });

  test('low-volume products accumulate fractional units instead of rounding to zero', () => {
    const s = freshGame();
    s.products = [makeProduct({ marketingWeekly: 0 })];
    const perWeek = expectedWeeklyUnits(s).get('prd_test')!;
    expect(perWeek).toBeLessThan(1); // mainframe software sells less than one copy a week…
    const rng = new Rng(s.rng);
    for (let w = 0; w < 52; w++) {
      s.week = w;
      simulateSales(s, rng);
    }
    const p = s.products[0]!;
    expect(p.unitsSold).toBeGreaterThan(0); // …but still sells over a year
    expect(p.revenue).toBe(p.unitsSold * p.price);
    expect(p.recentWeeklyUnits.length).toBeLessThanOrEqual(26);
  });
});
