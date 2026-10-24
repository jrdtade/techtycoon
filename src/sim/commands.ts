import { retireProduct } from './systems/market';
import type { Command, DispatchResult, GameState } from './types';
import { cloneState } from './util';

type Handler<C extends Command> = (state: GameState, cmd: C) => string | null;

/** Each handler validates first and returns an error string, or mutates the (cloned) state and returns null. */
const handlers: { [K in Command['type']]?: Handler<Extract<Command, { type: K }>> } = {
  setPrice(state, cmd) {
    const p = state.products.find((x) => x.id === cmd.productId && x.status === 'onSale');
    if (!p) return 'No such product on sale.';
    if (!Number.isFinite(cmd.price) || cmd.price <= 0) return 'Price must be positive.';
    p.price = Math.round(cmd.price);
    return null;
  },

  setMarketing(state, cmd) {
    const p = state.products.find((x) => x.id === cmd.productId && x.status === 'onSale');
    if (!p) return 'No such product on sale.';
    if (!Number.isFinite(cmd.weekly) || cmd.weekly < 0) return 'Marketing spend cannot be negative.';
    p.marketingWeekly = Math.round(cmd.weekly);
    return null;
  },

  retireProduct(state, cmd) {
    const p = state.products.find((x) => x.id === cmd.productId && x.status === 'onSale');
    if (!p) return 'No such product on sale.';
    retireProduct(state, p, `${p.name} is withdrawn from sale.`);
    return null;
  },
};

/**
 * The only way the UI changes the game. Validates and applies a command, returning a new state.
 * The input state is never mutated.
 */
export function dispatch(state: GameState, cmd: Command): DispatchResult {
  if (state.status !== 'playing') return { ok: false, error: 'The game is over.' };
  const handler = handlers[cmd.type] as Handler<Command> | undefined;
  if (!handler) return { ok: false, error: `Command ${cmd.type} is not available yet.` };
  const next = cloneState(state);
  const error = handler(next, cmd);
  if (error) return { ok: false, error };
  return { ok: true, state: next };
}
