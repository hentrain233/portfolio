# Status and Curse Card Architecture

This project now has a base architecture for status/curse cards, ready for content expansion.

## Data Contract (card template fields)

Cards can now define optional metadata:

- `category`: `normal | status | curse`
- `persistence`: `battleOnly | runPersistent`
- `statusAutoExhaustOnDiscard`: boolean
- `onDrawEffects`: array of draw-trigger effects

Draw-trigger effect schema:

- `{ type: 'selfDamage', amount: number }`
- `{ type: 'gainWeak', amount: number }`
- `{ type: 'gainVulnerable', amount: number }`

## Implemented Runtime Hooks

- On card instantiate, metadata is normalized:
  - `systems/statusCurseSystem.js`
  - `normalizeCardMetaSystem()`
- On draw, card draw triggers resolve:
  - `game.js::drawOne()` calls `resolveOnDrawCardEffectsSystem()`
- On card leaving hand to discard, status auto-exhaust is supported:
  - `systems/playCardEffectsSystem.js` uses `shouldAutoExhaustOnDiscard`

## UI/Visual Hooks

- Card class now supports category classes:
  - `card--category-status`
  - `card--category-curse`
- Implemented in:
  - `ui/render.js::buildCardClassName()`
  - `styles.css` category styles

## How to Add New Status or Curse Cards

1. Add card template in `data/card-config.js` (or default templates) with metadata fields.
2. For curse on-draw penalties, define `onDrawEffects`.
3. For temporary battle-only status cards:
   - set `category: 'status'`
   - set `persistence: 'battleOnly'`
   - optional `statusAutoExhaustOnDiscard: true`
4. For persistent curse cards:
   - set `category: 'curse'`
   - set `persistence: 'runPersistent'`

## Next Suggested Step (when implementing full feature)

Add battle-end cleanup system:

- Remove cards with `persistence === 'battleOnly'` from run/deck piles at battle end.
- Keep `runPersistent` cards for next nodes.

This is intentionally not auto-applied yet to avoid changing existing gameplay unexpectedly.

