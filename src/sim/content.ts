import { PRODUCT_TYPES, SEGMENTS, TECHNOLOGIES } from '../data';
import type { ProductTypeDef, SegmentDef, TechDef } from '../data/types';
import type { GameState, ProductTypeId, SegmentId, TechId } from './types';

const segmentById = new Map(SEGMENTS.map((s) => [s.id, s]));
const productTypeById = new Map(PRODUCT_TYPES.map((p) => [p.id, p]));
const techById = new Map(TECHNOLOGIES.map((t) => [t.id, t]));

export function getSegment(id: SegmentId): SegmentDef {
  const s = segmentById.get(id);
  if (!s) throw new Error(`Unknown segment ${id}`);
  return s;
}

export function getProductType(id: ProductTypeId): ProductTypeDef {
  const p = productTypeById.get(id);
  if (!p) throw new Error(`Unknown product type ${id}`);
  return p;
}

export function getTech(id: TechId): TechDef {
  const t = techById.get(id);
  if (!t) throw new Error(`Unknown technology ${id}`);
  return t;
}

export function hasTech(state: GameState, tech: TechId | undefined): boolean {
  return tech === undefined || state.unlockedTech.includes(tech);
}

export function isSegmentOpen(state: GameState, id: SegmentId): boolean {
  return hasTech(state, getSegment(id).requiresTech);
}

export function isProductTypeAvailable(state: GameState, id: ProductTypeId): boolean {
  return hasTech(state, getProductType(id).requiresTech);
}

/** Segments this product type can target right now. */
export function targetableSegments(state: GameState, id: ProductTypeId): SegmentDef[] {
  const type = getProductType(id);
  return SEGMENTS.filter((s) => (type.segmentDemand[s.id] ?? 0) > 0 && isSegmentOpen(state, s.id));
}
