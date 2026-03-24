/**
 * Debug mode helpers.
 */

export function syncEnergyAfterDebugToggleSystem({
  state,
  DEBUG_ENERGY,
  INITIAL_ENERGY_MAX,
  MAX_ENERGY_CAP = 99,
}) {
  if (state.phase !== 'playing') return;
  if (state.debugMode) {
    const v = Math.min(MAX_ENERGY_CAP, DEBUG_ENERGY);
    state.energyMax = v;
    state.energy = v;
  } else {
    state.energyMax = Math.min(MAX_ENERGY_CAP, INITIAL_ENERGY_MAX);
    state.energy = Math.min(state.energy, state.energyMax);
  }
}

export function classifyFloorTypeSystem({ floorType }) {
  if (floorType === 'boss') return 'BOSS';
  if (floorType === 'camp') return '篝火';
  if (floorType === 'event') return '事件';
  if (floorType === 'shop') return '商店';
  if (floorType === 'elite') return '精英';
  if (floorType === 'blessing') return '祝福';
  return '普通';
}

export function validateDebugJumpFloorSystem({
  state,
  floorIndex,
  MAP_FLOOR_COUNT,
}) {
  if (!state.debugMode) return false;
  if (floorIndex < 0 || floorIndex >= MAP_FLOOR_COUNT) return false;
  return true;
}

