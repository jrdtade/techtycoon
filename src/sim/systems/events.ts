import { ERA_EVENTS, MILESTONES, TECHNOLOGIES } from '../../data';
import type { MilestoneMetric } from '../../data/types';
import { weekOf } from '../calendar';
import type { GameState } from '../types';
import { addLog } from '../util';

/** Unlocks technologies and fires era events whose date has arrived; expires old modifiers. */
export function runScheduledEvents(state: GameState): void {
  state.modifiers = state.modifiers.filter((m) => m.untilWeek > state.week);

  for (const tech of TECHNOLOGIES) {
    if (state.unlockedTech.includes(tech.id)) continue;
    if (weekOf(tech.arrives.year, tech.arrives.month) > state.week) continue;
    state.unlockedTech.push(tech.id);
    // Technologies available at the start are not news.
    if (state.week > 0) addLog(state, 'tech', `New technology: ${tech.name}. ${tech.description}`, true);
  }

  for (const ev of ERA_EVENTS) {
    if (state.firedEvents.includes(ev.id)) continue;
    if (weekOf(ev.arrives.year, ev.arrives.month) > state.week) continue;
    state.firedEvents.push(ev.id);
    addLog(state, 'era', `${ev.title}. ${ev.text}`, ev.important);
    for (const effect of ev.effects) {
      if (effect.kind === 'demandModifier') {
        state.modifiers.push({
          sourceId: ev.id,
          segments: effect.segments === 'all' ? 'all' : [...effect.segments],
          multiplier: effect.multiplier,
          untilWeek: state.week + effect.durationWeeks,
        });
      }
    }
  }
}

function metricValue(state: GameState, metric: MilestoneMetric): number {
  switch (metric) {
    case 'lifetimeRevenue':
      return state.company.lifetimeRevenue;
    case 'cash':
      return state.company.cash;
    case 'employees':
      return state.employees.length;
    case 'productsLaunched':
      return state.stats.productsLaunched;
    case 'reputation':
      return state.company.reputation;
  }
}

export function checkMilestones(state: GameState): void {
  for (const m of MILESTONES) {
    if (state.milestonesReached.includes(m.id)) continue;
    if (metricValue(state, m.metric) < m.threshold) continue;
    state.milestonesReached.push(m.id);
    addLog(state, 'milestone', m.text, m.important);
  }
}
