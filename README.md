# Tech Tycoon

A browser-based Silicon Valley tycoon sim. Grow a garage software startup from January 1970 onward.

This repository is at **Phase 1: vertical slice (1970–1985, software only)**. See
[`docs/Tech Tycoon Design & Development Plan.md`](docs/Tech%20Tycoon%20Design%20%26%20Development%20Plan.md)
for the full design.

## Running

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest unit tests + headless 16-year run
npm run typecheck  # app config + a DOM-free config for src/sim and src/data
npm run lint
npm run build      # static site in dist/
```

Desktop browsers only; there is no backend.

Balance tools (they run the sim headless with Node):

```bash
npx vite-node scripts/balance.ts                          # scripted strategies over 5 seeds
npx vite-node scripts/probe.ts games home medium 20 1979  # one founder-built product's lifetime
```

## How to play

Found your company in January 1970 with $25k and yourself. Take **contract work** to pay the bills,
start **projects** (product type + market segment + scope + feature/polish/speed trade-offs + team + budget),
**launch** finished projects at a price and marketing spend, and **hire** as cash allows. Watch the
**Market** panel: segments open as technologies arrive and grow along S-curves, so timing matters. Keep cash
above zero at month-end; three month-ends in the red in a row is bankruptcy. The game ends after December 1985.

Space pauses/resumes, 1–3 set the speed. The game auto-pauses on important events and when the tab is hidden.

## Architecture rules

1. **Sim/UI separation.** All game logic lives in `src/sim/` and imports nothing from React or the DOM.
   `tsconfig.sim.json` compiles `src/sim` and `src/data` without the DOM lib, and ESLint forbids
   UI imports, `Math.random`, `Date` and browser globals there.
2. **Deterministic.** A seeded RNG (sfc32) whose state lives inside `GameState`. Same seed + same commands
   = same history.
3. **Fixed tick.** One tick = one in-game week. Game speed changes how often ticks run, never what a tick
   does. The loop pauses when the tab is hidden.
4. **Command pattern.** The UI never mutates sim state; it dispatches commands that the sim validates and applies.
5. **Data-driven content.** Product types, segments, technologies and era events live in typed files in `src/data/`.
6. **Versioned saves.** Every save carries a schema version; migrations run on load.
7. **Fictional names only.** Parody companies and products, never real ones.

Balance numbers live in `src/sim/config.ts` and the content files in `src/data/`. Every number there is a
balance guess unless noted.

## Model notes

- **Development.** Each week every assigned employee adds progress `(0.7 + 0.6·coding/100) × budgetBoost`,
  with a team-size penalty `n^-0.1`. Progress becomes feature points (× coding/50) and polish points
  (× design/50) in the ratio of the features and polish sliders. **Speed is not a share of output:**
  all output goes to features and polish, and the speed slider instead cuts the work required (up to 40%)
  and raises the bug rate. Less work means fewer points, so speed costs quality without any output being
  discarded. Testing removes a fraction of open bugs every week, including while a finished project waits
  to launch.
- **Quality** compares points with an expectation that rises 6% a year, with diminishing returns, minus a
  bug penalty. The review score is `1 + 9 × quality`.
- **Sales.** Segment buyers follow a logistic S-curve; weekly category demand = buyers × purchase rate ×
  category share × era modifiers. Each product's appeal = quality^1.5 × price factor × reputation factor ×
  marketing factor × lifecycle (launch ramp, then exponential decline) × erosion from rising expectations.
  Products take a logit share against a per-segment "rest of market" baseline that grows each year
  (Phase 2 replaces it with real competitors). **Fractional units carry over** between weeks, so a
  mainframe package that sells 0.2 copies a week still sells one every five weeks.
- **Reputation** jumps toward a review-based target at each launch and drifts toward the average review of
  products on sale.
- **History stays bounded:** the log keeps the last 200 entries, finances keep 24 detailed months and fold
  older ones into yearly totals, and products keep 26 weeks of unit history.
- **Determinism:** `tests/headless.test.ts` replays a recorded command log on the same seed and checks that
  the history is byte-identical.

## Project layout

```
src/sim/          pure simulation (types, rng, commands, tick, systems/, save, config)
src/data/         typed content for 1970–1985
src/persistence/  IndexedDB saves and JSON export/import (browser only)
src/app/          React UI, Zustand store, game loop
tests/            Vitest unit tests, scripted strategies and the headless 16-year run
scripts/          balance probes (run with vite-node)
```

### Adding a save migration

Bump `SCHEMA_VERSION` in `src/sim/newGame.ts` and add `MIGRATIONS[oldVersion]` in `src/sim/save.ts` that
turns a version-N state into version N+1. Loading runs the chain from the save's version up to the current one.

## Deferred to later phases

- **Phase 2:** AI competitors (they replace the "rest of market" baseline appeal term), price-elastic total
  segment demand (Phase 1 prices only shift share, not the size of the segment), macro economy and
  recessions beyond scripted modifiers, loans/angels/equity, press reviews as a system, brand loyalty,
  enterprise/consumer/government buyer split.
- **Phase 3:** hardware, research tree, platforms and install bases, manufacturing, the PixiJS office scene.
- **Phase 4:** divisions and delegation, VC/IPO/stock market, M&A.
- **Phase 5:** 1985–2024 eras, regulation, patents and lawsuits.
- **Phase 6:** game-studio/IP layer.
- **Later:** proper charts, mobile/responsive layout, tutorial, sound, desktop packaging, salary raises and
  morale, mid-development decisions (crunch, cut features, ship early), sequels and product updates.
