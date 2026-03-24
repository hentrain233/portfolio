/**
 * Deck runtime utilities.
 */

export function upgradeRandomRunDeckCardSystem({ state, TEMPLATES, rng = Math.random }) {
  const candidates = state.runDeck.filter((c) => !c.upgraded);
  if (!candidates.length) return null;
  const pick = candidates[Math.floor(rng() * candidates.length)];
  pick.upgraded = true;
  return TEMPLATES[pick.templateId]?.name ?? pick.templateId;
}

