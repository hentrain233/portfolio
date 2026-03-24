# Roguelike Card Game: Scalable Dev Architecture

This document defines the long-term development mode for this project.
Goal: add future content fast with low regression risk.

## 1) Development Principles (for all future features)

- Data first, behavior second, UI last.
- No new feature logic directly in `game.js`.
- `game.js` remains orchestration + dependency wiring only.
- New content should be addable by editing content files, not core flow files.
- Keep all random rules in dedicated systems (testable, replaceable).

## 2) Current Layer Model (already in place)

- `data/*`: ids, pools, content definitions.
- `core/*`: state factory and run loop orchestration.
- `systems/*`: deterministic rules and runtime mutations.
- `ui/*`: DOM caching, rendering helpers, overlay composition.
- `game.js`: assembly layer (injects state + systems + ui).

This baseline is now good enough to support larger feature growth.

## 3) Future Feature Targets and Required Structure

### A. Status/Curse Cards (temporary vs persistent)

#### Required card extension fields

Add these fields to card templates (data-level contract):

- `category`: `normal | status | curse`
- `persistence`: `battleOnly | runPersistent`
- `statusAutoExhaustOnDiscard`: boolean
- `onDrawEffects`: list of effects (for curse trigger-on-draw)
- `onTurnEndEffects`: optional
- `onExhaustEffects`: optional

#### Behavioral ownership

- Card lifecycle rules -> `systems/cardLifecycleSystem.js`
- Trigger execution (`onDraw`, `onDiscard`, `onExhaust`) -> `systems/cardTriggerSystem.js`
- Enemy adds status to hand/discard -> `systems/enemySystem.js` only calls system API
- Visual style mapping (status gray, curse black-purple gradient) -> `ui/render.js` via card category

#### Persistence rules

- `battleOnly` cards are removed at battle end.
- `runPersistent` cards stay in `state.runDeck`.
- End-of-battle cleanup must be centralized in one system function.

---

### B. Post-Battle Card Rewards (3 picks)

#### Required reward model

- Reward source: `normal | elite/eventBattle | boss`
- Reward count: default 3
- Rarity weights:
  - normal/elite/eventBattle: `common 65 / uncommon 25 / rare 10`
  - boss: fixed rare-only pool

#### Behavioral ownership

- Candidate generation and rarity roll -> `systems/rewardSystem.js`
- Reward UI overlay -> `ui/rewardUI.js`
- Accept/reject one card -> `systems/deckSystem.js`
- Entry points:
  - normal/boss victory -> existing victory flow hook
  - event battle victory -> event flow hook

#### Rule requirement

- Reward generation must be pure given `(seed/random, characterId, source)`.
- No hardcoded rarity logic in UI.

---

### C. Multi-Character Architecture + Shared/Character Relic Pools

#### Required run meta

Add run-level state:

- `selectedCharacterId`
- `characterCardPoolId`
- `characterRelicPoolId`

#### Content split

- `data/characters.js`: character definitions and starter decks
- `data/cardPools.js`: per-character card pools
- `data/relicPools.js`: `shared` + `characterSpecific` pools

#### Behavioral ownership

- Character select and run bootstrap -> `core/gameLoop.js` + `systems/runSetupSystem.js`
- Reward card candidate filter by character pool -> `systems/rewardSystem.js`
- Relic drop resolution by shared/specific pool -> `systems/relicDropSystem.js`

#### Key constraint

- Character-specific rules cannot branch all over `game.js`.
- They must be represented as selected pool/context injected into systems.

## 4) Minimal Coding Standard for New Features

- Add/modify content in `data/*` first.
- Add deterministic logic in `systems/*`.
- Add or update UI composition in `ui/*`.
- Wire dependencies in `game.js` only.
- Never duplicate string ids; define constants in data files.

## 5) Suggested Next Milestones (implementation order)

1. Introduce unified card metadata fields (`category`, `persistence`, trigger fields).
2. Add battle-end cleanup system for temporary status cards.
3. Add reward generation system + reward overlay.
4. Add character select + character-scoped pools.
5. Add relic drop system with shared + character pools.

## 6) Definition of Done for Each Future Feature

- No new hardcoded ids in `game.js`.
- Feature logic is in `systems/*` with clear single ownership.
- UI only renders data provided by systems.
- Lints pass and core flow replay works:
  - start run
  - battle
  - victory/defeat
  - event path
  - next node progression

