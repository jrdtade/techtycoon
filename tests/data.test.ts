import { ERA_EVENTS, PRODUCT_TYPES, SEGMENTS, TECHNOLOGIES } from '../src/data';

describe('content data', () => {
  const segmentIds = new Set(SEGMENTS.map((s) => s.id));
  const techIds = new Set(TECHNOLOGIES.map((t) => t.id));

  test('ids are unique', () => {
    for (const list of [SEGMENTS, PRODUCT_TYPES, TECHNOLOGIES, ERA_EVENTS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('4–6 market segments', () => {
    expect(SEGMENTS.length).toBeGreaterThanOrEqual(4);
    expect(SEGMENTS.length).toBeLessThanOrEqual(6);
  });

  test('references point at existing content', () => {
    for (const s of SEGMENTS) if (s.requiresTech) expect(techIds.has(s.requiresTech)).toBe(true);
    for (const p of PRODUCT_TYPES) {
      if (p.requiresTech) expect(techIds.has(p.requiresTech)).toBe(true);
      for (const seg of Object.keys(p.segmentDemand)) expect(segmentIds.has(seg as never)).toBe(true);
      for (const seg of Object.keys(p.suggestedPrice)) expect(p.segmentDemand).toHaveProperty(seg);
    }
    for (const e of ERA_EVENTS)
      for (const eff of e.effects)
        if (eff.segments !== 'all') for (const seg of eff.segments) expect(segmentIds.has(seg)).toBe(true);
  });

  test('dates fall inside 1970–1985', () => {
    for (const x of [...TECHNOLOGIES, ...ERA_EVENTS]) {
      expect(x.arrives.year).toBeGreaterThanOrEqual(1970);
      expect(x.arrives.year).toBeLessThanOrEqual(1985);
      expect(x.arrives.month).toBeGreaterThanOrEqual(1);
      expect(x.arrives.month).toBeLessThanOrEqual(12);
    }
  });
});
