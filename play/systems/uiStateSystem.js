/**
 * UI state derivation helpers (no DOM access).
 */

export function isInteractivePlayingStateSystem({ state }) {
  return (
    state.phase === 'playing' &&
    !state.inCamp &&
    !state.inBlessing &&
    !state.inEvent &&
    !state.inShop &&
    !state.awaitingHandDiscard &&
    !state.inCharacterSelect &&
    !state.awaitingCardRewardChoice &&
    !state.awaitingBattleLootChoice
  );
}

export function getNextBattleButtonTextSystem({ state, FLOOR_TYPES }) {
  if (!(state.phase === 'victory' && state.nextEncounterFloor < FLOOR_TYPES.length)) {
    return '下一场战斗';
  }
  const ft = FLOOR_TYPES[state.nextEncounterFloor];
  if (ft === 'camp') return '前往篝火';
  if (ft === 'blessing') return '前往祝福';
  if (ft === 'shop') return '前往商店';
  if (ft === 'event') return '前往事件';
  if (ft === 'elite') return '前往精英';
  return '下一场战斗';
}

export function getEnemyHpTextSystem({ state, isAppleBorerEncounter }) {
  if (isAppleBorerEncounter) {
    return (state.appleBorerUnitsHp || []).map((hp) => Math.max(0, Number(hp || 0))).join('+');
  }
  return String(state.enemyHp);
}

export function getEnemyMaxHpTextSystem({ state, isAppleBorerEncounter }) {
  if (isAppleBorerEncounter) {
    const maxArr = Array.isArray(state.appleBorerUnitsMaxHp) && state.appleBorerUnitsMaxHp.length > 0
      ? state.appleBorerUnitsMaxHp
      : (state.appleBorerUnitsHp || []).map(() => 30);
    return maxArr.map((hp) => Math.max(0, Number(hp || 0))).join('+');
  }
  return String(state.enemyMaxHp);
}

export function getPlayerBlockSuffixSystem({ state }) {
  if (state.playerBlock > 0) return { text: `+${state.playerBlock}`, hidden: false };
  return { text: '', hidden: true };
}

export function getEnemyBlockSuffixSystem({ state, isAppleBorerEncounter }) {
  if (isAppleBorerEncounter) return { text: '', hidden: true };
  if (state.enemyBlock > 0) return { text: `+${state.enemyBlock}`, hidden: false };
  return { text: '', hidden: true };
}

export function getBattleFlowUIStateSystem({ state, MAP_FLOOR_COUNT }) {
  const interactivePlaying = isInteractivePlayingStateSystem({ state });
  const canNextBattle =
    state.phase === 'victory'
    && state.nextEncounterFloor < MAP_FLOOR_COUNT
    && !state.awaitingCardRewardChoice
    && !state.awaitingBattleLootChoice;
  return {
    interactivePlaying,
    canNextBattle,
    hideNextBattleButton: state.phase === 'victory' && !canNextBattle,
    defeatRestartDisabled: state.phase !== 'defeat',
  };
}


