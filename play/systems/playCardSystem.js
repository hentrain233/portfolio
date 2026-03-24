/**
 * Card play entry flow: validation, cost consumption, and hand removal.
 * Effect resolution is delegated to an injected callback.
 */

export function canPlayUnderDecisiveBattleSystem({ state, card }) {
  if (!state.decisiveBattleActive) return true;
  return card.kind === 'attack';
}

export function playFromHandSystem({
  state,
  handIndex,
  targetIndex = null,
  viaDrag = false,
  isAppleBorerEncounter,
  getAppleBorerTargetIndex,
  canPlayUnderDecisiveBattle,
  canPayArcaneKindling,
  payArcaneKindling,
  normalizeCardBeforePlay,
  losePlayerHp,
  onAfterPayCost,
  applyCardEffects,
  log,
}) {
  if (state.phase !== 'playing' || state.awaitingHandDiscard) return false;
  if (handIndex < 0 || handIndex >= state.hand.length) return false;

  const rawCard = state.hand[handIndex];
  const card = typeof normalizeCardBeforePlay === 'function'
    ? normalizeCardBeforePlay(rawCard, state.hand)
    : rawCard;
  if (isAppleBorerEncounter() && card.kind === 'attack') {
    const validTarget = getAppleBorerTargetIndex(targetIndex);
    if (!viaDrag || validTarget === null) {
      log(`「${card.name}」需要拖拽到存活的目标单位上。`);
      return false;
    }
  }
  if (card.cannotPlay) {
    log(`「${card.name}」无法被直接打出。`);
    return false;
  }

  const isXCostCard = !!card.xCostConsumeAllEnergy;
  const cost = isXCostCard
    ? Math.max(0, Math.min(99, Number(state.energy ?? 0)))
    : Number(card.cost ?? 0);
  if (!state.debugMode && !isXCostCard && state.energy < cost) {
    log(`费用不足：打出「${card.name}」需要 ${cost} 点，当前 ${state.energy} 点。`);
    return false;
  }
  if (!canPlayUnderDecisiveBattle(card)) {
    log(`决战已发动：只能打出攻击牌，无法打出「${card.name}」。`);
    return false;
  }
  let resolvedHandIndex = handIndex;
  if (card.arcaneKindlingRequireFuel) {
    const canPay = typeof canPayArcaneKindling === 'function'
      ? canPayArcaneKindling(resolvedHandIndex)
      : false;
    if (!canPay) {
      log(`无法打出「${card.name}」：奥术薪柴需要先消耗一张“虚无/状态/诅咒”手牌。`);
      return false;
    }
    const paidResult = typeof payArcaneKindling === 'function'
      ? payArcaneKindling(resolvedHandIndex)
      : false;
    const paid = paidResult === true || !!paidResult?.paid;
    if (!paid) {
      log(`无法打出「${card.name}」：未能完成奥术薪柴代价。`);
      return false;
    }
    const fuelIndex = Number(paidResult?.fuelIndex);
    if (Number.isInteger(fuelIndex) && fuelIndex >= 0 && fuelIndex < resolvedHandIndex) {
      resolvedHandIndex -= 1;
    }
  }

  if (!state.debugMode) {
    if (isXCostCard) state.energy = 0;
    else state.energy -= cost;
  }
  if (typeof onAfterPayCost === 'function') {
    onAfterPayCost({ card, cost, state });
  }

  const hasFractureInHand = state.hand.some((c) => c?.templateId === 'fracture');
  const [removed] = state.hand.splice(resolvedHandIndex, 1);
  const played = {
    ...(card || removed),
    uid: removed?.uid ?? card?.uid,
    xSpentEnergy: isXCostCard ? cost : 0,
  };
  state.playedCardsThisTurn = Number(state.playedCardsThisTurn ?? 0) + 1;
  if (played?.kind === 'attack') state.playedAttackThisTurn = true;
  log(state.debugMode ? `打出「${played.name}」（DEBUG：不消耗能量）。` : `打出「${played.name}」（消耗 ${cost} 能量）。`);
  if (hasFractureInHand && typeof losePlayerHp === 'function') {
    const lost = losePlayerHp(1);
    log(`诅咒「骨折」：你失去 ${lost} 点生命。`);
  }

  return applyCardEffects({ played, targetIndex });
}

