# Tech Tycoon: Design & Development Plan

Oct 24, 2026 · @Jordan

## Overview

A browser-based tech industry tycoon sim running from 1970 to 2024, in which the player grows a garage startup into a Microsoft-, Apple- or Sony-scale company. It takes Game Dev Tycoon's product loop and expands it into a full industry: software, hardware, platforms, services, finance, competition and a simulated economy.

**Platform:** desktop browser first. No mobile layout for now. Desktop/Steam packaging (Electron or Tauri) stays possible later from the same codebase.

**Design pillars**

- **Timing is everything.** Being early, late or right on time to a platform shift decides fortunes, as it did historically.
- **Platforms win.** The path to dominance runs through owning ecosystems: install base, developers, lock-in.
- **The forces feel real.** Recessions hurt, funding dries up, regulators notice monopolies, component costs fall. The model is an abstraction, not an econometric simulation.
- **Attention scales with the company.** The player micromanages products early and steers a conglomerate late, through delegation.
- **History is the stage, not the script.** Real-world eras and shocks arrive on schedule; which companies win is up to play.
- **Every phase ships something playable.** Scope is the main risk, so each build phase ends in a game you can play.

## Core loop

Three nested loops run at once; the player's attention moves outward from the product loop to the industry loop as the company grows.

### 1. Product loop (weeks to months)

The Game Dev Tycoon heartbeat, generalised to any product.

1. Pick a product type and target market (business software, an OS, a chip, a console, a SaaS tool).
2. Allocate team, budget and time; set design trade-offs (features, performance, polish, unit cost).
3. Develop, with progress, bugs and mid-cycle decisions (delay, cut features, crunch, ship).
4. Launch: price, marketing spend, distribution channel.
5. Market response: reviews, sales, adoption, support costs, press.
6. Results feed money, reputation, staff experience and research points back into the company.

### 2. Company loop (quarters to years)

- Hire, train, retain and lose staff (salaries, equity, culture, poaching).
- Research technologies and file patents.
- Open divisions: software, hardware, services, games.
- Fund the company: bootstrapping, loans, angels, VC rounds, IPO.
- React to competitors: price wars, partnerships, lawsuits, acquisitions.
- Delegate: division heads run product loops, so late-game play is strategy, not clicking.

### 3. Industry loop (eras)

- Platform shifts: mainframes, minicomputers, PCs, GUIs, internet, mobile, cloud, AI.
- Economic cycles: 1970s oil shocks, early-1980s recession, dotcom crash, 2008, 2020.
- Regulation: antitrust, privacy law, export controls.
- The player rides these waves or, as a platform owner, shapes them.

### Time and pacing

- Base tick of one in-game week, with pause and several speeds.
- The game pauses on major decisions and events.
- A full 1970–2024 run should be completable in a long session or a few sittings; exact pacing is set during balancing.

## Major systems

Nine systems make up the sim; each build phase below adds or deepens some of them.

| System | What it covers | First phase |
| --- | --- | --- |
| Products | Software (business apps, dev tools, OS, consumer, games, web, SaaS, mobile, AI), hardware (chips, PCs, peripherals, consoles, phones, networking, servers), services (online, app stores, cloud, ads) | 1 (software), 3 (hardware) |
| Market | Segments with size and S-curve adoption; enterprise, consumer and government buyers; price elasticity; brand loyalty | 1 (simple), 2 (full) |
| Macro economy | Interest rates, inflation, recessions, funding climate that sets how easy money is to raise | 2 |
| Platforms and ecosystems | Install base, third-party developers, network effects, licensing fees, standards battles, lock-in | 3 |
| Hardware production | Falling component costs (Moore's law), own factories vs outsourcing, yield, inventory risk, supply shocks | 3 |
| Competitors | AI rival companies with strategies and parody names, founded across eras; can grow, fail, merge, be bought or buy you | 2 |
| Company and staff | Hiring, skills, salaries, equity, culture, offices, divisions, managers, delegation | 1 (basic), 4 (divisions) |
| Finance and control | Loans, angels, VC, dilution, board seats, IPO, stock price, shareholder pressure, M&A | 2 (basic), 4 (full) |
| Legal and regulatory | Patents, lawsuits, antitrust scrutiny when dominant, privacy and data law in later eras | 5 |

**History vs agency.** Real-world forces arrive on schedule: recessions, the internet, mobile becoming possible. Company outcomes are dynamic, so even the Apple analogue is not guaranteed to win. Player research can pull a technology forward, within limits.

## Studio/IP layer

Games are a division the player founds or acquires, opening a dedicated Game Dev Tycoon-style screen inside the larger sim.

- **Production:** pick genre, platform, budget, team and scope; develop and launch games.
- **IP ownership:** franchises gain value with each successful entry; sequels, spin-offs, remasters, ports.
- **Licensing and adaptations:** film, TV and merchandise deals arrive as offers to negotiate (fee, royalty, creative control). Hollywood itself is not simulated.
- **Platform synergy:** owning a console and a studio enables exclusives, which drive hardware sales. This is the hook back into the main sim.
- **Studio acquisition:** rival studios are bought like any company, bringing their staff and IPs.

Because it plugs into existing systems rather than defining them, it can be built late without rework.

## Technical architecture

The simulation is a pure, UI-free TypeScript module; the interface only reads state and sends player commands.

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript (strict) | The sim has many interlocking types; the compiler catches balance-breaking bugs early |
| Build | Vite | Fast dev server, simple static build for hosting |
| UI | React (or Svelte) | Dashboards, menus, tech trees and charts are UI work |
| State | Zustand or a plain store over the sim state | Keeps UI reactive without owning the sim |
| Office scene | PixiJS, added later | Only needed for the animated office; not in Phase 1 |
| Charts | A light charting library (e.g. Recharts) | Sales, market share, stock price |
| Saves | IndexedDB (via idb or Dexie), plus export/import to a file | localStorage caps around 5MB; browser storage can be cleared |
| Tests | Vitest | Unit tests for sim maths; scripted headless runs for balance |
| Later packaging | Electron or Tauri | Steam/desktop release from the same code |

**Rules for the codebase**

- **Sim/UI separation.** `sim/` has no imports from React or the DOM. It can run headless in tests, in a Web Worker, or in a balance script.
- **Deterministic simulation.** A seeded random number generator; the same seed and inputs give the same history. This makes bugs reproducible and balance testable.
- **Fixed tick.** One tick = one in-game week. Speed changes how often ticks run, never what a tick does.
- **Data-driven content.** Eras, technologies, product types, market segments, events and competitor archetypes live in typed data files, not code.
- **Versioned saves.** Every save carries a schema version with migrations, so long-running saves survive updates.
- **Background tabs.** Pause when the tab is hidden, since browsers throttle timers there.

## Development phases

Eight phases, each ending in a playable build; a phase is done only when its exit criteria are met.

&#91;embedded content: build roadmap · 8 phases\]

Phase 1 is the critical gate: if the product loop isn't fun by 1985, nothing later fixes it.

### Phase 0: Design and paper model

**Goal:** prove the economy produces interesting decisions before writing game code.

- Design doc (this one) refined into system specs
- Spreadsheet model of one market segment: adoption curve, pricing, two competing products
- First pass at era data for 1970–1985: technologies, product types, segments

**Exit criteria**

- [ ] The spreadsheet shows a meaningful trade-off between price, quality and launch timing
- [ ] Era data for 1970–1985 drafted

### Phase 1: Vertical slice (1970–1985, software only)

**Goal:** answer one question — is the core product loop fun for an hour?

- Project scaffold: TypeScript, Vite, React, Vitest, sim/UI separation
- Time system: weekly tick, pause, speeds, seeded RNG
- Product loop: choose product type and segment, assign staff and budget, develop, launch, sell
- Simple market: a few segments with adoption curves and price sensitivity
- Staff: hire, salaries, skills that improve with experience
- Money: cash, revenue, expenses, bankruptcy
- Event log and notifications; save/load to IndexedDB with file export

**Exit criteria**

- [ ] A new player can found a company in 1970 and play to 1985
- [ ] Different product decisions lead to visibly different results
- [ ] Saves load correctly; the sim runs headless in tests

### Phase 2: Economy and competition

**Goal:** the world pushes back.

- Full market model: enterprise, consumer and government buyers; brand loyalty; segment growth and decline
- Macro economy: interest rates, inflation, recessions, funding climate
- AI competitors with strategies, product launches, failures and mergers
- Basic finance: bank loans, angel investment, equity and dilution
- Reputation, press reviews, marketing

**Exit criteria**

- [ ] Competitors can beat the player and go bankrupt themselves
- [ ] A recession is felt in sales and funding
- [ ] Headless runs show no runaway money or market-share exploits

### Phase 3: Hardware and platforms

**Goal:** the game becomes more than Game Dev Tycoon.

- Research tree spanning software and hardware
- Hardware products with bill of materials, falling component costs, manufacturing, yield, inventory
- Own factories vs outsourcing; supply shocks
- Platform ownership: install base, third-party developers, licensing fees, standards battles
- Animated office scene (PixiJS) that grows with the company

**Exit criteria**

- [ ] A player can build a computer platform that third parties develop for
- [ ] Overproducing hardware can sink the company
- [ ] A standards battle can be won or lost

### Phase 4: Scaling and corporate

**Goal:** a big company stays playable.

- Divisions with managers who run product loops on delegated budgets and goals
- VC rounds, board seats, losing control, IPO
- Stock price and shareholder expectations
- Mergers and acquisitions of competitors, patents and talent
- Company-wide dashboards replacing per-product micromanagement

**Exit criteria**

- [ ] A 5,000-employee company takes no more clicks per year than a 50-person one
- [ ] The player can go public, be pressured by shareholders, and be forced out

### Phase 5: Full timeline (1985–2024)

**Goal:** the whole 54-year arc plays end to end.

- Eras: GUIs, internet, dotcom, mobile, cloud, social, AI
- Historical shocks: dotcom crash, 2008, 2020
- Regulation: antitrust once dominant, privacy and data law
- Patents and lawsuits
- Endgame: 2024 wrap-up with legacy score; optional continue in sandbox

**Exit criteria**

- [ ] A full run from 1970 to 2024 completes without breaking
- [ ] Each era offers a distinct opportunity a player can catch or miss

### Phase 6: Studio/IP sub-sim

**Goal:** games become a strategic division.

- Found or acquire studios; dedicated game production screen
- IP ownership, franchise value, sequels, remasters
- Adaptation and licensing deal offers
- Console exclusives tied to the platform system

**Exit criteria**

- [ ] A franchise can carry a console platform
- [ ] A studio can be run profitably as its own business

### Phase 7: Polish and release

**Goal:** ready for other people.

- Tutorial and onboarding; difficulty settings; sandbox and custom start dates
- Balance passes using headless simulation runs
- Performance, accessibility, UI polish, sound
- Optional desktop build (Electron or Tauri) for Steam

**Exit criteria**

- [ ] Playtesters finish a run without outside help
- [ ] No known save-breaking bugs

## Risks and open decisions

**Risks**

- **Scope.** The full design is years of solo work. Mitigation: playable build at the end of every phase; cut features before cutting quality.
- **Realism vs fun.** Simulating too much turns the game into a spreadsheet. Mitigation: model forces, not every variable; playtest from Phase 1.
- **Balance across 54 years.** Strategies that break the economy will appear. Mitigation: deterministic sim plus headless balance runs.
- **Late-game tedium.** Large companies become click-heavy. Mitigation: delegation in Phase 4 is non-negotiable.
- **Real names.** Real companies and products bring legal risk. Mitigation: parody names throughout.

**Open decisions**

- [ ] Game title
- [ ] React or Svelte for the UI
- [ ] Art style: pixel art, flat vector, or minimal UI-only
- [ ] Start options: fixed 1970 start, or choice of start year
- [ ] Founder character: stats and background, or none
- [ ] Failure: game over on bankruptcy, or restart as a new founder
- [ ] Target length of a full 1970–2024 run
