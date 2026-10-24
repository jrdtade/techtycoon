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

Balance numbers live in `src/sim/config.ts`. Every number there is a balance guess unless noted.

## Project layout

```
src/sim/          pure simulation (types, rng, commands, tick, systems/, save, config)
src/data/         typed content for 1970–1985
src/persistence/  IndexedDB saves and JSON export/import (browser only)
src/app/          React UI, Zustand store, game loop
tests/            Vitest unit tests and the headless run
```

## Deferred to later phases

- **Phase 2:** AI competitors (they replace the "rest of market" baseline appeal term), price-elastic total
  segment demand (Phase 1 prices only shift share, not the size of the segment), macro economy and
  recessions beyond scripted modifiers, loans/angels/equity, press reviews as a system, brand loyalty,
  enterprise/consumer/government buyer split.
- **Phase 3:** hardware, research tree, platforms and install bases, manufacturing, the PixiJS office scene.
- **Phase 4:** divisions and delegation, VC/IPO/stock market, M&A.
- **Phase 5:** 1985–2024 eras, regulation, patents and lawsuits.
- **Phase 6:** game-studio/IP layer.
- **Later:** charts, mobile/responsive layout, tutorial, sound, desktop packaging.
