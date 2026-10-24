import { Rng, seedRng } from '../src/sim/rng';

describe('seeded RNG', () => {
  test('same seed gives the same sequence', () => {
    const a = new Rng(seedRng(42));
    const b = new Rng(seedRng(42));
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  test('different seeds diverge', () => {
    const a = new Rng(seedRng(1));
    const b = new Rng(seedRng(2));
    expect(a.next()).not.toBe(b.next());
  });

  test('values stay in range and look uniform', () => {
    const rng = new Rng(seedRng(7));
    let sum = 0;
    for (let i = 0; i < 10_000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
    }
    expect(sum / 10_000).toBeCloseTo(0.5, 1);
    for (let i = 0; i < 1000; i++) {
      const n = rng.int(3, 5);
      expect([3, 4, 5]).toContain(n);
    }
  });

  test('state round-trips through JSON', () => {
    const state = seedRng(99);
    const rng = new Rng(state);
    rng.next();
    const copy = JSON.parse(JSON.stringify(state));
    expect(new Rng(copy).next()).toBe(rng.next());
  });
});
