# Next Chat Handoff

## Current Snapshot
- Browser card roguelike prototype with modular architecture:
  - runtime orchestration: `game.js`
  - state/loop: `core/state.js`, `core/gameLoop.js`
  - gameplay logic: `systems/*`
  - content/tuning: `data/*`
  - UI composition: `ui/*`, `styles.css`
- GitHub repo already created and pushed:
  - `https://github.com/hentrain233/slaythespire_cursorTest`

## Major Systems Implemented

### Route / Floor Flow
- Route length is now **10** nodes.
- Fixed nodes:
  - index 0: blessing
  - index 4: shop
  - index -2: camp
  - index -1: boss
- Event node can convert to normal battle via probability config.

### Battle / Reward Flow
- Battle victory enters unified loot frame in selection UI.
- Loot frame supports card reward and relic reward entry.
- Skip/continue flow is supported and routes to next node.
- Event rewards (at least part of event branches) now reuse reward UI path via `queueEventRewards(...)`.

### Shop System
- Shop node integrated.
- Offers:
  - 4 random cards
  - 3 random relics
  - paid upgrade service
  - paid purge service
- Service costs scale per use in run.
- Shop rules in `data/shopConfig.js`; rarity/price ranges in `data/probabilities.js`.

### Enemies
- Data-driven definitions in `data/enemies.js`.
- Pools currently include:
  - normal: includes `chestMimic` now
  - elite: includes `lihuabird`, `gargoyle`
  - boss: includes `diablo`, `witheredToad`
- New mechanics added:
  - Gargoyle (`gargoyle`) with `slowPerCard`
  - Chest mimic (`chestMimic`) block/strike-steal/escape behavior

### Events
- Event definitions now data-driven in `data/eventDefs.js` (title/desc/options/numbers).
- Existing + new events:
  - well
  - snake
  - blessing-coin-damage
  - thorn chest
  - cultist
- UI event rendering and branch handling in `ui/eventUI.js`.
- Runtime event calculations in `systems/eventRuntimeSystem.js`.

### Cards / Relics
- Cards and upgrades are centralized in `data/card-config.js`.
- Blessings + relics in `data/blessing-config.js`.
- Recently added:
  - curse `madness`
  - rare skill `polarBlessing`
  - relic `enlightenment`
- Relic runtime hooks expanded in `systems/relicSystem.js`.

### Debug Panel
- DEBUG reward pool expanded:
  - add 100 coins
  - full heal
  - list/buy all relics in debug
  - existing card pool debug still available

## Recent UX / UI Changes
- Custom tooltip system for relic/status hover (replaces native title for those areas).
- Bottom watermark `WennanZhang` added with breathing glow animation.
- README upgraded into external-facing showcase version.

## Important Recent Behavior Fixes
- Debuff timing fixed:
  - weak/vulnerable decrement moved to end turn timing so turn-end applied debuffs persist properly into next player turn.
- Chest mimic escape now enters a visible settlement frame with continue button (instead of feeling stuck).
- Event options now disable when HP is insufficient for specified risk cases (well/thorn chest).

## In-Progress (Not Yet Pushed At Time Of This Handoff)
- Files modified locally:
  - `game.js`
  - `styles.css`
  - `systems/turnSystem.js`
- These local edits include:
  - mobile white-flash mitigation attempt (blend-mode downgrade on mobile)
  - draw/discard fly-card animation scaffolding
  - moving draw/discard/exhaust pile buttons into battle frame corners
  - animation lock to disable End Turn during animation
- If next chat starts from GitHub version, **these three local changes may be missing unless committed/pushed first**.

## Key Data Files To Tune
- Global tuning: `data/tuning.js`
- Probabilities and shop pricing: `data/probabilities.js`
- Shop structure: `data/shopConfig.js`
- Events: `data/eventDefs.js`
- Enemies and pools: `data/enemies.js`
- Cards/upgrades: `data/card-config.js`
- Relics/blessings: `data/blessing-config.js`

## Known Caveats / Watch Areas
- `game.js` is still very large and continues to carry orchestration + residual mechanics.
- Some newer mechanics were integrated quickly; regression checks needed around:
  - event battle exit routing
  - chest mimic escape/kill outcomes
  - madness self-reflect edge cases
  - tooltip consistency (some legacy `title` may remain in non-core elements)

## Suggested Next Steps For Next Chat
- Finish/verify draw+discard animation end-to-end across desktop/mobile.
- Push pending local animation changes to GitHub after validation.
- Continue slimming `game.js` by extracting:
  - animation controller
  - battle settlement flow
  - special enemy post-action handlers

