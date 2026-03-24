/**
 * Battle setup helpers (state initialization).
 * Keeps DOM and overlay control in game.js; only mutates state here.
 */

export function initializeBattleStateSystem({
  state,
  enemyId,
  def,
  resetPlayerHp,
  DEBUG_ENERGY,
  INITIAL_ENERGY_MAX,
  MAX_ENERGY_CAP,
  PLAYER_MAX_HP,
  shuffleFn,
  instantiateRunDeckCard,
  resetAppleBorerState,
  applyBattleStartRelics,
  treatAppleBorerAsPair,
  moltingGuardOnStart,
}) {
  state.activeEnemyId = enemyId;

  const instances = state.runDeck.map((card) => instantiateRunDeckCard(card));
  state.hand = [];
  state.discardPile = [];
  state.exhaustPile = [];
  state.drawPile = shuffleFn(instances);
  state.turn = 1;

  const tempEnergy = state.tempEnergyBonusBattlesLeft > 0 ? state.tempEnergyBonusValue : 0;
  state.energyMax = state.debugMode
    ? Math.min(MAX_ENERGY_CAP, DEBUG_ENERGY)
    : Math.min(MAX_ENERGY_CAP, INITIAL_ENERGY_MAX + state.runEnergyBonus + tempEnergy);
  state.decisiveBattleActive = false;
  state.strength = state.runBattleStrengthBonus;
  state.tempAttackStrengthMultiplier = 1;
  state.playedAttackThisTurn = false;
  state.playedCardsThisTurn = 0;
  state.championStrengthDoublingActive = false;
  state.tempStrengthDeltaThisTurn = 0;
  state.tempFortitudeDeltaThisTurn = 0;
  state.fortitude = 0;
  state.phase = 'playing';

  if (resetPlayerHp) {
    state.playerMaxHp = PLAYER_MAX_HP;
    state.playerHp = PLAYER_MAX_HP;
  }

  state.playerWeakTurns = 0;
  state.playerVulnerableTurns = 0;
  state.enemyWeakTurns = 0;
  state.enemyVulnerableTurns = 0;

  state.enemyMaxHp = def.maxHp;
  state.enemyHp = def.maxHp;

  if ((enemyId === 'appleBorerPair' || enemyId === 'goblinGang') && treatAppleBorerAsPair) {
    resetAppleBorerState(true, enemyId, def);
    state.enemyMaxHp = (state.appleBorerUnitsMaxHp || []).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
    state.enemyHp = (state.appleBorerUnitsHp || []).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
  } else {
    resetAppleBorerState(false, enemyId, def);
  }

  state.moltingSnakeGuardNextDamage = !!moltingGuardOnStart;
  state.moltingSnakeMolted = false;
  state.moltingSnakePostMoltingStep = 0;
  state.moltingSnakeRewardClaimed = false;

  state.enemyCycleStep = 0;
  state.enemyStrength = 0;
  state.enemyFortitude = 0;
  state.enemyBlock = 0;
  state.playerBlock = 0;
  state.blockGainLockedThisTurn = false;
  state.awaitingHandDiscard = false;
  state.pendingSeedEnergyNextTurn = 0;
  state.pendingSeedDrawNextTurn = 0;
  state.plantedSeedsThisTurn = 0;

  if (enemyId === 'diablo') {
    state.diabloSleepRemaining = Number(def?.behavior?.sleepTurns ?? 3);
    state.diabloAwake = false;
    state.diabloCycleStep = 0;
    state.diabloSleepHpDamageTotal = 0;
    state.diabloPostWakeStun = false;
  } else {
    state.diabloSleepRemaining = 0;
    state.diabloAwake = false;
    state.diabloCycleStep = 0;
    state.diabloSleepHpDamageTotal = 0;
    state.diabloPostWakeStun = false;
  }

  applyBattleStartRelics();
}

