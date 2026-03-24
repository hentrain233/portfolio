/**
 * Turn lifecycle helpers: draw/discard, turn begin, player debuff ticking.
 * Returns small values (like drawn count) and uses injected `log` for messages.
 */
import { CARD_KEYWORD } from '../data/cardMeta.js';

export function tickPlayerDebuffsEndOfPlayerTurnSystem({ state }) {
  if (state.playerWeakTurns > 0) state.playerWeakTurns -= 1;
  if (state.playerVulnerableTurns > 0) state.playerVulnerableTurns -= 1;
  if (state.playerFragileTurns > 0) state.playerFragileTurns -= 1;
}

export function reshuffleDiscardIntoDrawIfNeededSystem({ state, shuffleFn, log, onCardShuffledIntoDraw }) {
  if (state.drawPile.length > 0) return;
  if (state.discardPile.length === 0) return;
  const n = state.discardPile.length;
  const moved = state.discardPile.slice();
  state.drawPile = shuffleFn(state.discardPile);
  state.discardPile = [];
  log(`抽牌堆已空：将弃牌堆 ${n} 张洗牌后作为新抽牌堆。`);
  if (typeof onCardShuffledIntoDraw === 'function') {
    moved.forEach((card) => onCardShuffledIntoDraw(card));
  }
}

export function drawOneSystem({ state, shuffleFn, log, onCardShuffledIntoDraw }) {
  reshuffleDiscardIntoDrawIfNeededSystem({ state, shuffleFn, log, onCardShuffledIntoDraw });
  if (state.drawPile.length === 0) {
    log('抽牌堆与弃牌堆均无牌可抽（可能全在手牌中）。');
    return false;
  }
  const card = state.drawPile.pop();
  if (card) state.hand.push(card);
  return !!card;
}

export function drawCardsSystem({ state, n, shuffleFn, log, onCardShuffledIntoDraw }) {
  let got = 0;
  for (let i = 0; i < n; i++) {
    if (drawOneSystem({ state, shuffleFn, log, onCardShuffledIntoDraw })) got += 1;
    else break;
  }
  return got;
}

export function discardEntireHandSystem({ state, log, onCardStayedInHandAtTurnEnd }) {
  const n = state.hand.length;
  if (n > 0) {
    // 虚无：回合结束仍在手牌则直接消耗，不进入弃牌堆。
    const kept = [];
    let exhaustedVoid = 0;
    state.hand.forEach((card) => {
      if (
        card?.voidExhaustOnTurnEnd ||
        (Array.isArray(card?.keywords) && card.keywords.includes(CARD_KEYWORD.VOID))
      ) {
        state.exhaustPile.push(card);
        exhaustedVoid += 1;
        log(`虚无：回合结束时「${card.name}」自动消耗。`);
        return;
      }
      const effects = Array.isArray(card?.onTurnEndInHandEffects) ? card.onTurnEndInHandEffects : [];
      if (effects.length > 0 && typeof onCardStayedInHandAtTurnEnd === 'function') {
        onCardStayedInHandAtTurnEnd(card);
      }
      kept.push(card);
    });
    state.hand = kept;
    const discardCount = state.hand.length;
    state.discardPile.push(...state.hand);
    state.hand = [];
    log(`回合结束：将 ${discardCount} 张手牌弃入弃牌堆。`);
    if (exhaustedVoid > 0) log(`回合结束：另有 ${exhaustedVoid} 张虚无牌进入消耗牌堆。`);
  } else {
    log('回合结束：手牌为空。');
  }
}

export function onTurnBeginSystem({
  state,
  DEBUG_ENERGY,
  DRAW_PER_TURN,
  DEBUG_ENERGY_DISPLAY = '∞',
  INITIAL_ENERGY_MAX,
  drawCardsFn,
  log,
}) {
  state.playerBlock = 0;
  state.blockGainLockedThisTurn = false;
  state.tempAttackStrengthMultiplier = 1;
  state.championStrengthDoublingActive = false;

  if (state.debugMode) {
    state.energyMax = DEBUG_ENERGY;
    state.energy = DEBUG_ENERGY;
  } else {
    state.energy = state.energyMax;
  }

  const drawn = drawCardsFn(DRAW_PER_TURN);
  const energyLabel = state.debugMode ? DEBUG_ENERGY_DISPLAY : `${state.energy}/${state.energyMax}`;
  log(`第 ${state.turn} 回合开始：能量 ${energyLabel}，抽牌 ${DRAW_PER_TURN} 张（实际抽到 ${drawn} 张）。`);
  return drawn;
}

