// Balance probe: prints how one simple product performs. Run: npx vite-node scripts/probe.ts
import { dispatch, newGame, step, formatDate } from '../src/sim';
import type { GameState, Command, ProductTypeId, SegmentId, ProjectScope } from '../src/sim';

function must(s: GameState, c: Command): GameState {
  const r = dispatch(s, c);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

const [type, seg, scope, price, startYear] = (process.argv.slice(2).length ? process.argv.slice(2) : ['accounting', 'mainframe', 'medium', '6000', '1970']) as [ProductTypeId, SegmentId, ProjectScope, string, string];
let s = newGame({ companyName: 'Probe', seed: 1 });
s.company.cash = 1e7;
while (s.week < (Number(startYear) - 1970) * 52) s = step(s);
s = must(s, { type: 'startProject', name: 'P', productTypeId: type, segmentId: seg, scope, focus: { features: 60, polish: 40, speed: 0 }, weeklyBudget: 150, employeeIds: [s.employees[0]!.id] });
const start = s.week;
while (s.projects[0]!.status !== 'readyToLaunch') s = step(s);
const pr = s.projects[0]!;
console.log(`dev weeks ${s.week - start}, work ${pr.workRequired.toFixed(1)}, F ${pr.featurePts.toFixed(1)} P ${pr.polishPts.toFixed(1)} bugs ${pr.bugs.toFixed(1)}`);
s = must(s, { type: 'launchProduct', projectId: pr.id, productName: 'X', price: Number(price), marketingWeekly: 0 });
const p0 = s.products[0]!;
console.log(`quality ${p0.quality.toFixed(2)} review ${p0.reviewScore}`);
let peak = 0;
for (let w = 0; w < 400 && s.products[0]!.status === 'onSale'; w++) {
  const before = s.products[0]!.revenue;
  s = step(s);
  peak = Math.max(peak, s.products[0]!.revenue - before);
  if (w % 26 === 0) console.log(formatDate(s.week), 'units', s.products[0]!.unitsSold, 'rev', Math.round(s.products[0]!.revenue));
}
const p = s.products[0]!;
console.log(`life: ${p.status} at ${p.retiredWeek ? formatDate(p.retiredWeek) : '-'}; units ${p.unitsSold}; revenue ${Math.round(p.revenue)}; peak week ${peak}`);
