import { PROBABILITY_CONFIG } from '../data/probabilities.js';
import { CHARACTER_IDS } from '../data/characters.js';

export function buildRewardPoolTemplateIdsSystem({
  templateIds,
  excludedTemplateIds,
  templates = {},
  selectedCharacterId = null,
}) {
  const excluded = new Set(excludedTemplateIds);
  return templateIds.filter((id) => {
    if (excluded.has(id)) return false;
    const t = templates[id];
    if (!t) return false;
    if ((t.category ?? 'normal') !== 'normal') return false;
    if (t.rewardPoolExcluded) return false;
    if (t.sharedAllCharacters) return true;
    const exclusive = t.exclusiveToCharacterId ?? null;
    if (exclusive && selectedCharacterId && exclusive !== selectedCharacterId) return false;
    // Default rule: normal reward cards are warrior-only unless explicitly shared/exclusive.
    if (!exclusive && selectedCharacterId && selectedCharacterId !== CHARACTER_IDS.WARRIOR) return false;
    return true;
  });
}

function pickRarity(rng, weights) {
  const roll = rng() * 100;
  let acc = 0;
  for (const w of weights) {
    acc += w.weight;
    if (roll < acc) return w.rarity;
  }
  return weights[weights.length - 1].rarity;
}

function pickOne(arr, rng) {
  if (!arr.length) return null;
  return arr[Math.floor(rng() * arr.length)];
}

export function generateCardRewardChoicesSystem({
  rewardPoolTemplateIds,
  templates,
  sourceType,
  rng = Math.random,
}) {
  const pool = rewardPoolTemplateIds
    .map((id) => templates[id])
    .filter(Boolean);
  const byRarity = {
    common: pool.filter((c) => (c.rarity ?? 'common') === 'common'),
    uncommon: pool.filter((c) => (c.rarity ?? 'common') === 'uncommon'),
    rare: pool.filter((c) => (c.rarity ?? 'common') === 'rare'),
  };

  const choices = [];
  const used = new Set();
  const weights = sourceType === 'boss'
    ? PROBABILITY_CONFIG.rewards.rarityWeights.boss
    : sourceType === 'elite'
      ? PROBABILITY_CONFIG.rewards.rarityWeights.elite
      : PROBABILITY_CONFIG.rewards.rarityWeights.normal;

  for (let i = 0; i < 3; i += 1) {
    let picked = null;
    for (let tries = 0; tries < 6 && !picked; tries += 1) {
      const rarity = pickRarity(rng, weights);
      const candidates = byRarity[rarity].filter((c) => !used.has(c.id));
      picked = pickOne(candidates, rng);
    }
    if (!picked) {
      const fallback = pool.filter((c) => !used.has(c.id));
      picked = pickOne(fallback, rng);
    }
    if (!picked) break;
    used.add(picked.id);
    choices.push({ templateId: picked.id, upgraded: false });
  }

  if (choices.length > 0 && rng() < PROBABILITY_CONFIG.rewards.upgradedChoiceChance) {
    const idx = Math.floor(rng() * choices.length);
    choices[idx] = { ...choices[idx], upgraded: true };
  }

  return choices;
}

