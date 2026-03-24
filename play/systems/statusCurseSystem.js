import { CARD_CATEGORY, CARD_PERSISTENCE, CARD_DRAW_EFFECT } from '../data/cardMeta.js';
import { isVoidCardSystem } from './cardKeywordSystem.js';

export function normalizeCardMetaSystem(card) {
  return {
    ...card,
    category: card.category ?? CARD_CATEGORY.NORMAL,
    persistence: card.persistence ?? CARD_PERSISTENCE.RUN_PERSISTENT,
    statusAutoExhaustOnDiscard: !!card.statusAutoExhaustOnDiscard,
    onDrawEffects: Array.isArray(card.onDrawEffects) ? card.onDrawEffects : [],
  };
}

export function getCardCategoryClassSystem(card) {
  if (card.category === CARD_CATEGORY.STATUS) return 'card--category-status';
  if (card.category === CARD_CATEGORY.CURSE) return 'card--category-curse';
  return '';
}

export function shouldAutoExhaustOnDiscardSystem(card) {
  return card.category === CARD_CATEGORY.STATUS && !!card.statusAutoExhaustOnDiscard;
}

export function shouldAutoExhaustOnTurnEndInHandSystem(card) {
  return isVoidCardSystem(card);
}

export function resolveOnDrawCardEffectsSystem({ state, card, log, damagePlayerOutOfCombatLike, applyPlayerDebuff }) {
  if (!Array.isArray(card.onDrawEffects) || card.onDrawEffects.length === 0) return;

  card.onDrawEffects.forEach((eff) => {
    const type = eff?.type;
    const amount = Number(eff?.amount ?? 0);
    if (type === CARD_DRAW_EFFECT.SELF_DAMAGE && amount > 0) {
      const hurt = damagePlayerOutOfCombatLike(amount);
      log(`诅咒触发：抽到「${card.name}」，你受到 ${hurt} 点伤害。`);
      return;
    }
    if (type === CARD_DRAW_EFFECT.GAIN_WEAK && amount > 0) {
      if (typeof applyPlayerDebuff === 'function') {
        const gained = applyPlayerDebuff('weak', amount, card.name);
        if (gained > 0) log(`诅咒触发：抽到「${card.name}」，你获得 ${gained} 层虚弱。`);
      } else {
        state.playerWeakTurns += amount;
        log(`诅咒触发：抽到「${card.name}」，你获得 ${amount} 层虚弱。`);
      }
      return;
    }
    if (type === CARD_DRAW_EFFECT.GAIN_VULNERABLE && amount > 0) {
      if (typeof applyPlayerDebuff === 'function') {
        const gained = applyPlayerDebuff('vulnerable', amount, card.name);
        if (gained > 0) log(`诅咒触发：抽到「${card.name}」，你获得 ${gained} 层易伤。`);
      } else {
        state.playerVulnerableTurns += amount;
        log(`诅咒触发：抽到「${card.name}」，你获得 ${amount} 层易伤。`);
      }
    }
  });
}

