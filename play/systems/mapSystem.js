/**
 * Map node calculation helpers.
 */

export function getMapNodeLabelSystem({
  isBoss,
  isCamp,
  isBlessing,
  isEvent,
  isElite,
  isShop,
}) {
  if (isBoss) return 'BOSS';
  if (isCamp) return '🔥';
  if (isBlessing) return '✨';
  if (isShop) return '🛒';
  if (isElite) return '☠';
  if (isEvent) return '❓';
  return '⚔';
}

export function buildMapNodeClassSystem({
  isBoss,
  isCamp,
  isBlessing,
  isEvent,
  isElite,
  isShop,
  state,
  index,
}) {
  let cls = 'map-node';
  if (isBoss) cls += ' map-node--boss';
  if (isCamp) cls += ' map-node--camp';
  if (isBlessing) cls += ' map-node--blessing';
  if (isShop) cls += ' map-node--shop';
  if (isElite) cls += ' map-node--elite';
  if (isEvent) cls += ' map-node--event';

  if (state.phase === 'playing') {
    if (index < state.battleFloor) cls += ' map-node--done';
    else if (index === state.battleFloor) cls += ' map-node--current';
    else cls += ' map-node--locked';
  } else if (state.phase === 'victory') {
    if (index < state.nextEncounterFloor) cls += ' map-node--done';
    else if (index === state.nextEncounterFloor) cls += ' map-node--next';
    else cls += ' map-node--locked';
  } else {
    cls += ' map-node--locked';
  }

  if (state.debugMode) cls += ' map-node--clickable';
  return cls.trim();
}

