/**
 * Shop offer generation and pricing helpers.
 */
export function randIntInclusiveSystem(min, max) {
  const lo = Math.floor(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export function pickRarityByWeightsSystem(weights) {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const w of weights) {
    acc += Number(w.weight) || 0;
    if (roll < acc) return w.rarity;
  }
  return weights[weights.length - 1]?.rarity ?? 'common';
}

export function getShopCardPriceByRaritySystem({ rarity, PROBABILITY_CONFIG }) {
  const range = PROBABILITY_CONFIG.shop.cardPriceByRarity[rarity] ?? PROBABILITY_CONFIG.shop.cardPriceByRarity.common;
  return randIntInclusiveSystem(range.min, range.max);
}

export function getShopRelicPriceByRaritySystem({ rarity, PROBABILITY_CONFIG }) {
  const range = PROBABILITY_CONFIG.shop.relicPriceByRarity[rarity] ?? PROBABILITY_CONFIG.shop.relicPriceByRarity.common;
  return randIntInclusiveSystem(range.min, range.max);
}

export function buildShopCardOffersSystem({ state, TEMPLATES, PROBABILITY_CONFIG, SHOP_CONFIG }) {
  const pool = state.runRewardPoolTemplateIds
    .map((id) => TEMPLATES[id])
    .filter((t) => t && (t.category ?? 'normal') === 'normal');
  const byRarity = {
    common: pool.filter((c) => (c.rarity ?? 'common') === 'common'),
    uncommon: pool.filter((c) => (c.rarity ?? 'common') === 'uncommon'),
    rare: pool.filter((c) => (c.rarity ?? 'common') === 'rare'),
  };
  const offers = [];
  const used = new Set();
  const weights = PROBABILITY_CONFIG.shop.cardRarityWeights;
  const count = Number(SHOP_CONFIG.inventory.cardOfferCount ?? 4);
  for (let i = 0; i < count; i += 1) {
    let picked = null;
    for (let tries = 0; tries < 6 && !picked; tries += 1) {
      const rarity = pickRarityByWeightsSystem(weights);
      const candidates = (byRarity[rarity] || []).filter((c) => !used.has(c.id));
      if (candidates.length > 0) picked = candidates[Math.floor(Math.random() * candidates.length)];
    }
    if (!picked) {
      const fallback = pool.filter((c) => !used.has(c.id));
      if (fallback.length > 0) picked = fallback[Math.floor(Math.random() * fallback.length)];
    }
    if (!picked) break;
    used.add(picked.id);
    const rarity = picked.rarity ?? 'common';
    offers.push({
      templateId: picked.id,
      upgraded: false,
      rarity,
      price: getShopCardPriceByRaritySystem({ rarity, PROBABILITY_CONFIG }),
    });
  }
  return offers;
}

export function buildShopRelicOffersSystem({ state, RELIC_DEFS, PROBABILITY_CONFIG, SHOP_CONFIG }) {
  const owned = new Set((state.relics || []).map((r) => r.id));
  const candidateIds = (state.runRelicPoolIds || []).filter((id) => !owned.has(id) && !!RELIC_DEFS[id]);
  const byRarity = {
    common: candidateIds.filter((id) => (RELIC_DEFS[id]?.rarity ?? 'common') === 'common'),
    uncommon: candidateIds.filter((id) => (RELIC_DEFS[id]?.rarity ?? 'common') === 'uncommon'),
    rare: candidateIds.filter((id) => (RELIC_DEFS[id]?.rarity ?? 'common') === 'rare'),
  };
  const offers = [];
  const used = new Set();
  const weights = PROBABILITY_CONFIG.shop.relicRarityWeights;
  const count = Number(SHOP_CONFIG.inventory.relicOfferCount ?? 3);
  for (let i = 0; i < count; i += 1) {
    let pickedId = null;
    for (let tries = 0; tries < 6 && !pickedId; tries += 1) {
      const rarity = pickRarityByWeightsSystem(weights);
      const candidates = (byRarity[rarity] || []).filter((id) => !used.has(id));
      if (candidates.length > 0) pickedId = candidates[Math.floor(Math.random() * candidates.length)];
    }
    if (!pickedId) {
      const fallback = candidateIds.filter((id) => !used.has(id));
      if (fallback.length > 0) pickedId = fallback[Math.floor(Math.random() * fallback.length)];
    }
    if (!pickedId) break;
    used.add(pickedId);
    const rarity = RELIC_DEFS[pickedId]?.rarity ?? 'common';
    offers.push({
      relicId: pickedId,
      rarity,
      price: getShopRelicPriceByRaritySystem({ rarity, PROBABILITY_CONFIG }),
    });
  }
  return offers;
}

export function getShopServiceCostSystem({ kind, state, SHOP_CONFIG }) {
  const base = kind === 'upgrade' ? SHOP_CONFIG.services.upgradeBaseCost : SHOP_CONFIG.services.purgeBaseCost;
  const usage = Number(state.shopServiceUsage?.[kind] ?? 0);
  const step = Number(SHOP_CONFIG.services.costIncreasePerUse ?? 25);
  return Number(base) + usage * step;
}
