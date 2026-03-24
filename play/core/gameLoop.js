/**
 * Core game loop orchestration.
 * Uses dependency injection to avoid circular imports during refactor.
 */
export function createGameLoop(deps) {
  const {
    state,
    PLAYER_MAX_HP,
    MAP_FLOOR_COUNT,
    FLOOR_TYPES,
    createStartingRunDeck,
    resetAppleBorerState,
    finishCardDrag,
    // overlays
    closeBlessingOverlay,
    closeCampOverlay,
    closeDiscardOverlay,
    closeEventOverlay,
    closeCardRewardOverlay,
    closeShopOverlay,
    openBlessingOverlay,
    openCampOverlay,
    openEventOverlay,
    openShopOverlay,
    openCharacterSelectOverlay,
    closeResultOverlays,
    refreshUI,
    onStartNewRun,
    shouldEventTurnIntoBattle,
    // battle start (still in game.js for incremental refactor)
    startBattleCore,
  } = deps;

  function startNewRun() {
    state.runDeck = createStartingRunDeck();
    state.nextEncounterFloor = 0;
    state.relics = [];
    state.runBattleStrengthBonus = 0;
    state.runEnergyBonus = 0;
    state.tempEnergyBonusValue = 0;
    state.tempEnergyBonusBattlesLeft = 0;
    state.coins = 99;
    state.playerMaxHp = PLAYER_MAX_HP;
    state.playerHp = PLAYER_MAX_HP;
    state.phase = 'playing';
    state.hand = [];
    state.drawPile = [];
    state.discardPile = [];
    state.exhaustPile = [];
    state.enemyHp = 0;
    state.enemyMaxHp = 0;
    state.awaitingHandDiscard = false;
    state.seenNormalEnemyIds = [];
    state.seenEliteEnemyIds = [];
    state.seenBossEnemyIds = [];
    state.inEvent = false;
    state.inShop = false;
    state.activeEventId = null;
    state.eventFloorIndex = null;
    state.eventWellAttempts = 0;
    state.eventWellUpgradesDone = 0;
    state.eventWellUpgradedCardNames = [];
    state.eventThornChestAttempts = 0;
    state.eventBattleTag = null;
    state.inCharacterSelect = false;
    state.awaitingCardRewardChoice = false;
    state.pendingCardRewardChoices = [];
    state.awaitingBattleLootChoice = false;
    state.pendingBattleLootSourceType = null;
    state.pendingRelicRewardId = null;
    state.pendingPlayerWeakOnNextTurn = 0;
    state.runRewardPoolTemplateIds = [];
    state.runRelicPoolIds = [];
    state.shopCardOffers = [];
    state.shopRelicOffers = [];
    state.shopServiceUsage = { purge: 0, upgrade: 0 };
    state.debugForcedEnemyByFloor = {};
    state.selectedCharacterId = null;
    state.battleExitNextEncounterFloorOverride = null;
    state.relicFirstDamageNegateAvailable = false;
    state.relicChargeBatteryPending = false;
    state.playerThorns = 0;
    state.relicYinYangTriggeredThisBattle = false;
    state.relicEnlightenmentTriggeredThisTurn = false;
    state.playedAttackThisTurn = false;
    state.playedCardsThisTurn = 0;
    state.moltingSnakeGuardNextDamage = false;
    state.moltingSnakeMolted = false;
    state.moltingSnakePostMoltingStep = 0;
    state.moltingSnakeRewardClaimed = false;
    state.inEliteBattle = false;
    state.enemyDamageTakenThisTurn = 0;
    state.lihuabirdPendingHeal = 0;
    state.lihuabirdThresholdTriggeredThisTurn = false;
    state.witheredToadCycleStep = 0;
    state.witheredToadSeedCount = 3;
    state.chestMimicEscaped = false;
    state.chestMimicStolenCoins = 0;
    resetAppleBorerState(false);
    finishCardDrag();
    if (deps.els?.enemyNameLabel) deps.els.enemyNameLabel.textContent = '敌人';
    closeBlessingOverlay(true);
    closeCampOverlay(true);
    closeDiscardOverlay(true);
    if (deps.els?.eventOverlay) closeEventOverlay(true);
    if (typeof closeShopOverlay === 'function') closeShopOverlay(true);
    if (typeof closeCardRewardOverlay === 'function') closeCardRewardOverlay();
    if (typeof openCharacterSelectOverlay === 'function') {
      if (typeof onStartNewRun === 'function') onStartNewRun();
      openCharacterSelectOverlay();
      refreshUI();
      return;
    }
    if (typeof onStartNewRun === 'function') onStartNewRun();
    startNextEncounter();
  }

  function startNextEncounter() {
    if (state.nextEncounterFloor >= MAP_FLOOR_COUNT) return;
    if (typeof closeResultOverlays === 'function') closeResultOverlays();
    state.battleFloor = state.nextEncounterFloor;
    const ft = (state.runFloorTypes && state.runFloorTypes.length ? state.runFloorTypes : FLOOR_TYPES)[state.nextEncounterFloor];
    if (ft === 'blessing') {
      openBlessingOverlay();
      refreshUI();
      return;
    }
    if (ft === 'camp') {
      openCampOverlay();
      refreshUI();
      return;
    }
    if (ft === 'event') {
      if (typeof shouldEventTurnIntoBattle === 'function' && shouldEventTurnIntoBattle()) {
        startBattleCore(false, { forceNormalEnemy: true });
        return;
      }
      openEventOverlay();
      refreshUI();
      return;
    }
    if (ft === 'shop') {
      openShopOverlay();
      refreshUI();
      return;
    }
    startBattleCore(false);
  }

  return { startNewRun, startNextEncounter };
}

