/**
 * Turn flow orchestration with optional card fly animations.
 * Keeps game.js focused on wiring and UI composition.
 */
export function createTurnFlowSystem({
  state,
  els,
  DEBUG_ENERGY,
  DRAW_PER_TURN,
  MAX_ENERGY_CAP = 99,
  MAX_SEEDS_PER_TURN = 99,
  drawCardFlyDurationMs,
  drawCardIntervalMs,
  discardCardFlyDurationMs,
  discardCardIntervalMs,
  reshuffleDiscardIntoDrawIfNeeded,
  resolveOnDrawCardEffects,
  applyPlayerDebuff,
  losePlayerHp,
  enterDefeat,
  applyTurnStartRelics,
  applyEndTurnRelicsAfterPlayer,
  applyEndTurnRelicsBeforeEnemy,
  executeEnemyTurn,
  resolveChestMimicEscape,
  tickPlayerDebuffsEndOfPlayerTurn,
  lockUiForAnimation,
  unlockUiForAnimation,
  refreshUI,
  log,
  spawnFlyingCard,
  buildHandInsertRect,
  sleepMs,
}) {
  function popOneDrawCardForAnimation() {
    reshuffleDiscardIntoDrawIfNeeded();
    if (state.drawPile.length <= 0) return null;
    return state.drawPile.pop() || null;
  }

  async function drawCardsToHandAnimated(n) {
    const drawCount = Math.max(0, Number(n) || 0);
    if (drawCount <= 0) return 0;
    const drawBtn = els.btnViewDraw;
    const handEl = els.hand;
    if (!drawBtn || !handEl) return 0;
    let drawn = 0;
    for (let i = 0; i < drawCount; i += 1) {
      const card = popOneDrawCardForAnimation();
      if (!card) {
        if (drawn <= 0) log('抽牌堆与弃牌堆均无牌可抽（可能全在手牌中）。');
        break;
      }
      const startRect = drawBtn.getBoundingClientRect();
      const endRect = buildHandInsertRect(state.hand.length);
      if (endRect) {
        await spawnFlyingCard({
          startRect,
          endRect,
          durationMs: drawCardFlyDurationMs,
          delayMs: 0,
          rotateStart: -8,
          rotateMid: 12,
        });
        if (drawCardIntervalMs > 0) await sleepMs(drawCardIntervalMs);
      }
      state.hand.push(card);
      if (card?.templateId === 'magicExplosion') {
        const seen = Number(card.magicExplosionDrawCount ?? 0);
        card.magicExplosionHitCount = Math.max(1, seen <= 0 ? 1 : (Number(card.magicExplosionHitCount ?? 1) * 2));
        card.magicExplosionDrawCount = seen + 1;
      }
      resolveOnDrawCardEffects({
        card,
        damagePlayerOutOfCombatLike: (amount) => {
          if (state.phase !== 'playing') return 0;
          const before = state.playerHp;
          state.playerHp = Math.max(0, state.playerHp - Math.max(0, Math.floor(amount)));
          if (state.playerHp <= 0) enterDefeat();
          return before - state.playerHp;
        },
      });
      refreshUI();
      const latest = els.hand?.lastElementChild;
      if (latest instanceof HTMLElement) {
        latest.classList.remove('card--draw-arrive');
        void latest.offsetWidth;
        latest.classList.add('card--draw-arrive');
      }
      drawn += 1;
    }
    return drawn;
  }

  async function discardEntireHandAnimated() {
    const n = state.hand.length;
    if (n <= 0) {
      log('回合结束：手牌为空。');
      return 0;
    }
    let exhaustedVoid = 0;
    let discardedCount = 0;
    const discardBtn = els.btnViewDiscard;
    while (state.hand.length > 0) {
      const card = state.hand[0];
      if (!card) {
        state.hand.shift();
        continue;
      }
      const effects = Array.isArray(card?.onTurnEndInHandEffects) ? card.onTurnEndInHandEffects : [];
      if (effects.length > 0) {
        effects.forEach((eff) => {
          if (eff?.type !== 'lihuabirdFarewell') return;
          applyPlayerDebuff('weak', 1, '离去的花');
          applyPlayerDebuff('vulnerable', 1, '离去的花');
          if (state.activeEnemyId === 'lihuabird' && state.phase === 'playing') state.enemyStrength += 2;
          log('「离去的花」未在本回合打出：你获得 1 层虚弱与 1 层易伤，离花鸟获得 2 点力量。');
          return;
        });
        effects.forEach((eff) => {
          if (eff?.type !== 'magicExplosionEndTurnDamage') return;
          const perHit = Math.max(0, Number(eff?.perHit ?? 6));
          const hits = Math.max(1, Number(card?.magicExplosionHitCount ?? 1));
          const total = perHit * hits;
          const lost = typeof losePlayerHp === 'function' ? losePlayerHp(total) : 0;
          log(`「魔法爆炸」在手牌中引爆：${perHit}×${hits}，你受到 ${lost || total} 点伤害。`);
        });
      }
      if (card?.templateId === 'drowsy') {
        state.pendingPlayerWeakOnNextTurn += 1;
        log('「困意」未在本回合打出：下回合开始时你将获得 1 层虚弱。');
      }
      if (
        card?.voidExhaustOnTurnEnd ||
        (Array.isArray(card?.keywords) && card.keywords.includes('void'))
      ) {
        state.hand.shift();
        state.exhaustPile.push(card);
        exhaustedVoid += 1;
        log(`虚无：回合结束时「${card.name}」自动消耗。`);
        refreshUI();
        continue;
      }
      const firstCardEl = els.hand?.querySelector('.card');
      const startRect = firstCardEl ? firstCardEl.getBoundingClientRect() : null;
      state.hand.shift();
      refreshUI();
      if (startRect && discardBtn) {
        await spawnFlyingCard({
          startRect,
          endRect: discardBtn.getBoundingClientRect(),
          durationMs: discardCardFlyDurationMs,
          delayMs: 0,
          rotateStart: 1,
          rotateMid: -10,
        });
        if (discardCardIntervalMs > 0) await sleepMs(discardCardIntervalMs);
      }
      state.discardPile.push(card);
      discardedCount += 1;
      refreshUI();
    }
    log(`回合结束：将 ${discardedCount} 张手牌弃入弃牌堆。`);
    if (exhaustedVoid > 0) log(`回合结束：另有 ${exhaustedVoid} 张虚无牌进入消耗牌堆。`);
    return discardedCount;
  }

  function onTurnBeginFlow() {
    if (Number(state.tempStrengthDeltaThisTurn ?? 0) !== 0) {
      const rollback = Number(state.tempStrengthDeltaThisTurn);
      state.strength -= rollback;
      state.tempStrengthDeltaThisTurn = 0;
      log(`临时力量结算：${rollback > 0 ? '-' : '+'}${Math.abs(rollback)}。`);
    }
    if (Number(state.tempFortitudeDeltaThisTurn ?? 0) !== 0) {
      const rollback = Number(state.tempFortitudeDeltaThisTurn);
      state.fortitude -= rollback;
      state.tempFortitudeDeltaThisTurn = 0;
      log(`临时坚固结算：${rollback > 0 ? '-' : '+'}${Math.abs(rollback)}。`);
    }
    if (state.pendingPlayerWeakOnNextTurn > 0) {
      const gained = applyPlayerDebuff('weak', state.pendingPlayerWeakOnNextTurn, '困意');
      if (gained > 0) log(`困意发作：你获得 ${gained} 层虚弱。`);
      state.pendingPlayerWeakOnNextTurn = 0;
    }
    state.enemyDamageTakenThisTurn = 0;
    state.lihuabirdThresholdTriggeredThisTurn = false;
    state.playedAttackThisTurn = false;
    state.playedCardsThisTurn = 0;
    state.relicEnlightenmentTriggeredThisTurn = false;
    state.playerBlock = 0;
    state.blockGainLockedThisTurn = false;
    state.tempAttackStrengthMultiplier = 1;
    state.championStrengthDoublingActive = false;
    state.plantedSeedsThisTurn = 0;
    const seedEnergyBonus = Math.max(0, Math.min(MAX_ENERGY_CAP, Number(state.pendingSeedEnergyNextTurn ?? 0)));
    const seedDrawBonus = Math.max(0, Number(state.pendingSeedDrawNextTurn ?? 0));
    state.pendingSeedEnergyNextTurn = 0;
    state.pendingSeedDrawNextTurn = 0;
    if (state.debugMode) {
      const debugEnergy = Math.min(MAX_ENERGY_CAP, DEBUG_ENERGY);
      state.energyMax = debugEnergy;
      state.energy = debugEnergy;
    } else {
      state.energy = Math.min(MAX_ENERGY_CAP, Number(state.energyMax ?? 0) + seedEnergyBonus);
    }
    applyTurnStartRelics();
    lockUiForAnimation();
    drawCardsToHandAnimated(DRAW_PER_TURN + seedDrawBonus).then((drawn) => {
      const energyLabel = state.debugMode ? '∞' : `${state.energy}/${state.energyMax}`;
      if (seedEnergyBonus > 0 || seedDrawBonus > 0) {
        log(`种子生效：本回合能量 +${seedEnergyBonus}，额外抽牌 +${seedDrawBonus}。`);
      }
      log(`第 ${state.turn} 回合开始：能量 ${energyLabel}，抽牌 ${DRAW_PER_TURN + seedDrawBonus} 张（实际抽到 ${drawn} 张）。`);
    }).finally(() => {
      unlockUiForAnimation();
    });
    return 0;
  }

  async function endTurnFlow() {
    if (state.phase !== 'playing' || state.awaitingHandDiscard) return;
    state.awaitingHandDiscard = true;
    lockUiForAnimation();
    tickPlayerDebuffsEndOfPlayerTurn();
    await discardEntireHandAnimated();
    applyEndTurnRelicsAfterPlayer();
    applyEndTurnRelicsBeforeEnemy();
    executeEnemyTurn();
    if (state.phase === 'playing' && state.activeEnemyId === 'chestMimic' && state.chestMimicEscaped) {
      resolveChestMimicEscape();
      state.awaitingHandDiscard = false;
      unlockUiForAnimation();
      refreshUI();
      return;
    }
    if (state.phase !== 'playing') {
      state.awaitingHandDiscard = false;
      unlockUiForAnimation();
      refreshUI();
      return;
    }
    state.turn += 1;
    onTurnBeginFlow();
    state.awaitingHandDiscard = false;
    unlockUiForAnimation();
    refreshUI();
  }

  return {
    onTurnBeginFlow,
    endTurnFlow,
    drawCardsToHandAnimatedFlow: drawCardsToHandAnimated,
    discardEntireHandAnimatedFlow: discardEntireHandAnimated,
  };
}
