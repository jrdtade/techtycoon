// Balance report: runs the scripted strategies over several seeds. Run: npx vite-node scripts/balance.ts
import { newGame, summarize, formatDate } from '../src/sim';
import { contractsOnlyStrategy, productStrategy, runGame } from '../tests/strategy';
import type { Strategy } from '../tests/strategy';

const fmt = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${(n / 1e3).toFixed(0)}k`);

for (const [name, strat] of [['products', productStrategy], ['contracts', contractsOnlyStrategy]] as [string, Strategy][]) {
  console.log(`== ${name}`);
  for (const seed of [1, 2, 3, 4, 5]) {
    const yearly: string[] = [];
    const { state } = runGame(newGame({ companyName: 'Balance', seed }), strat, (s) => {
      if (s.week % 104 === 0) yearly.push(`${1970 + s.week / 52}:${fmt(s.company.cash)}/${s.employees.length}p`);
    });
    const sum = summarize(state);
    console.log(
      `seed ${seed}: ${sum.outcome} ${formatDate(state.week)} cash ${fmt(sum.finalCash)} rev ${fmt(sum.lifetimeRevenue)} ` +
        `(products ${fmt(sum.salesRevenue)}) launched ${sum.productsLaunched} staff ${sum.peakEmployees} rep ${sum.reputation.toFixed(0)} ` +
        `score ${sum.score} ${sum.rank} | best ${sum.bestReviewed?.review ?? '-'} top ${sum.topSeller?.name ?? '-'} ${fmt(sum.topSeller?.revenue ?? 0)}`,
    );
    console.log('   ', yearly.join(' '));
  }
}
