import { CARD_CATEGORY, CARD_KEYWORD } from '../data/cardMeta.js';

export function hasKeywordSystem(card, keyword) {
  return Array.isArray(card?.keywords) && card.keywords.includes(keyword);
}

export function isVoidCardSystem(card) {
  return hasKeywordSystem(card, CARD_KEYWORD.VOID) || !!card?.voidExhaustOnTurnEnd;
}

export function isArcaneKindlingFuelCardSystem(card) {
  if (!card) return false;
  if (isVoidCardSystem(card)) return true;
  return card.category === CARD_CATEGORY.STATUS || card.category === CARD_CATEGORY.CURSE;
}

export function collectArcaneKindlingFuelIndexesSystem({ hand, skipHandIndex }) {
  const indexes = [];
  for (let i = 0; i < hand.length; i += 1) {
    if (i === skipHandIndex) continue;
    if (isArcaneKindlingFuelCardSystem(hand[i])) indexes.push(i);
  }
  return indexes;
}

export function canPayArcaneKindlingSystem({ hand, playHandIndex }) {
  return collectArcaneKindlingFuelIndexesSystem({ hand, skipHandIndex: playHandIndex }).length > 0;
}

export function payArcaneKindlingSystem({
  state,
  playHandIndex,
  chooseFuelIndex,
  log,
}) {
  const candidates = collectArcaneKindlingFuelIndexesSystem({
    hand: state.hand,
    skipHandIndex: playHandIndex,
  });
  if (!candidates.length) return false;

  let selected = null;
  if (typeof chooseFuelIndex === 'function') {
    selected = chooseFuelIndex(candidates, state.hand.slice(), playHandIndex);
  }
  if (!candidates.includes(selected)) selected = candidates[0];

  const [fuelCard] = state.hand.splice(selected, 1);
  if (!fuelCard) return false;
  state.exhaustPile.push(fuelCard);
  log(`奥术薪柴：消耗「${fuelCard.name}」作为打出代价。`);
  return { paid: true, fuelIndex: selected, fuelCard };
}

export function moveVoidCardsFromHandToExhaustSystem({ state, log }) {
  if (!Array.isArray(state.hand) || state.hand.length <= 0) return 0;
  const kept = [];
  let exhausted = 0;
  state.hand.forEach((card) => {
    if (isVoidCardSystem(card)) {
      state.exhaustPile.push(card);
      exhausted += 1;
      if (typeof log === 'function') {
        log(`虚无：回合结束时「${card.name}」自动消耗。`);
      }
      return;
    }
    kept.push(card);
  });
  state.hand = kept;
  return exhausted;
}

