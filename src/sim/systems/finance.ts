import { CONFIG } from '../config';
import { dateOf, formatMonth } from '../calendar';
import type { ExpenseCategory, FinanceState, GameState, IncomeCategory, Ledger, MonthlyReport } from '../types';
import { addLog } from '../util';

export function emptyLedger(): Ledger {
  return {
    income: { sales: 0, contracts: 0 },
    expenses: { salaries: 0, rent: 0, devBudget: 0, marketing: 0, unitCosts: 0, hiring: 0, severance: 0 },
  };
}

export function initialFinance(): FinanceState {
  return { lastWeek: emptyLedger(), thisMonth: emptyLedger(), reports: [], annual: [], monthsInRed: 0 };
}

export function ledgerIncome(l: Ledger): number {
  return l.income.sales + l.income.contracts;
}

export function ledgerExpenses(l: Ledger): number {
  const e = l.expenses;
  return e.salaries + e.rent + e.devBudget + e.marketing + e.unitCosts + e.hiring + e.severance;
}

/** Records income in the current week/month ledgers and adds it to cash. */
export function earn(state: GameState, category: IncomeCategory, amount: number): void {
  if (amount === 0) return;
  state.company.cash += amount;
  state.company.lifetimeRevenue += amount;
  state.finance.lastWeek.income[category] += amount;
  state.finance.thisMonth.income[category] += amount;
}

/** Records an expense in the current week/month ledgers and removes it from cash. */
export function spend(state: GameState, category: ExpenseCategory, amount: number): void {
  if (amount === 0) return;
  state.company.cash -= amount;
  state.finance.lastWeek.expenses[category] += amount;
  state.finance.thisMonth.expenses[category] += amount;
}

/** Weekly running costs: salaries and office rent. */
export function payWeeklyCosts(state: GameState, inflationFactor: number): void {
  const wpy = CONFIG.calendar.weeksPerYear;
  let salaries = 0;
  for (const e of state.employees) salaries += e.salary / wpy;
  spend(state, 'salaries', salaries);
  spend(state, 'rent', state.employees.length * CONFIG.staff.officeRentPerEmployeeWeekly * inflationFactor);
}

/**
 * Closes the month that ended just before `state.week`: stores a report, folds old reports into
 * annual summaries, and applies the bankruptcy rule.
 */
export function closeMonth(state: GameState): void {
  const prev = dateOf(state.week - 1);
  const f = state.finance;
  const report: MonthlyReport = {
    year: prev.year,
    month: prev.month,
    income: { ...f.thisMonth.income },
    expenses: { ...f.thisMonth.expenses },
    net: ledgerIncome(f.thisMonth) - ledgerExpenses(f.thisMonth),
    cashEnd: state.company.cash,
  };
  f.reports.push(report);
  while (f.reports.length > CONFIG.history.maxMonthlyReports) {
    const old = f.reports.shift()!;
    let summary = f.annual.find((a) => a.year === old.year);
    if (!summary) {
      summary = { year: old.year, income: 0, expenses: 0, net: 0 };
      f.annual.push(summary);
    }
    summary.income += ledgerIncome(old);
    summary.expenses += ledgerExpenses(old);
    summary.net += old.net;
  }
  f.thisMonth = emptyLedger();

  if (state.company.cash < 0) {
    f.monthsInRed += 1;
    const limit = CONFIG.finance.monthsInRedForBankruptcy;
    if (f.monthsInRed >= limit) {
      state.status = 'bankrupt';
      addLog(state, 'finance', `Bankrupt: cash stayed negative for ${limit} month-ends. The creditors take the keys.`, true);
    } else {
      addLog(
        state,
        'finance',
        `Warning: cash is negative at the end of ${formatMonth(prev.year, prev.month)}. ` +
          `${limit - f.monthsInRed} more month-end(s) in the red means bankruptcy.`,
        true,
      );
    }
  } else {
    f.monthsInRed = 0;
  }
}
