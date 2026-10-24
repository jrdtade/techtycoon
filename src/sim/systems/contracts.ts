import { CONTRACT_CLIENTS, CONTRACT_JOBS } from '../../data';
import { CONFIG } from '../config';
import { fractionalYear } from '../calendar';
import type { Rng } from '../rng';
import type { Contract, GameState } from '../types';
import { addLog, fmtMoney, inflation, newId, roundTo } from '../util';
import { growSkill } from './development';
import { earn } from './finance';
import { changeReputation } from './reputation';

const C = CONFIG.contracts;

/** Replaces the current contract offers with a fresh batch (called monthly). */
export function refreshContractOffers(state: GameState, rng: Rng): void {
  const infl = inflation(fractionalYear(state.week));
  state.contractOffers = [];
  for (let i = 0; i < C.offersPerRefresh; i++) {
    // The first offer is always a one-person job a starting founder can take.
    const staffRequired = i === 0 ? 1 : rng.int(1, C.staffMax);
    const minSkill = i === 0 ? rng.int(C.minSkillMin, 40) : rng.int(C.minSkillMin, C.minSkillMax);
    const weeks = rng.int(C.weeksMin, C.weeksMax);
    const fee =
      staffRequired * weeks * C.feePerStaffWeek * (1 + minSkill / 100) * rng.range(1 - C.feeNoise, 1 + C.feeNoise) * infl;
    state.contractOffers.push({
      id: newId(state, 'off'),
      client: rng.pick(CONTRACT_CLIENTS),
      job: rng.pick(CONTRACT_JOBS),
      weeks,
      staffRequired,
      minSkill,
      fee: roundTo(fee, 100),
    });
  }
}

function releaseStaff(state: GameState, contract: Contract): void {
  for (const e of state.employees) if (e.contractId === contract.id) e.contractId = null;
}

export function failContract(state: GameState, contract: Contract, reason: string): void {
  releaseStaff(state, contract);
  state.contracts = state.contracts.filter((c) => c.id !== contract.id);
  changeReputation(state, CONFIG.reputation.contractFailed);
  addLog(state, 'contract', `Contract for ${contract.client} abandoned: ${reason}. Your reputation suffers.`);
}

export function advanceContracts(state: GameState): void {
  for (const contract of [...state.contracts]) {
    for (const e of state.employees) {
      if (e.contractId !== contract.id) continue;
      e.weeksWorked += 1;
      growSkill(e, 'coding', CONFIG.staff.contractSkillGrowthFactor);
    }
    contract.weeksLeft -= 1;
    if (contract.weeksLeft > 0) continue;
    releaseStaff(state, contract);
    state.contracts = state.contracts.filter((c) => c.id !== contract.id);
    earn(state, 'contracts', contract.fee);
    state.stats.totalContractRevenue += contract.fee;
    state.stats.contractsCompleted += 1;
    changeReputation(state, CONFIG.reputation.contractCompleted);
    addLog(state, 'contract', `Contract complete: ${contract.job} for ${contract.client}. Paid ${fmtMoney(contract.fee)}.`);
  }
}
