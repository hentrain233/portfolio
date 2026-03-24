/**
 * 概率与随机权重配置（集中可改）。
 * 所有值都用 0~1 概率或权重数值表示。
 */

export const PROBABILITY_CONFIG = {
  map: {
    // 随机节点权重（不含固定节点）
    routeNodeWeights: [
      { type: 'event', weight: 50 },
      { type: 'normal', weight: 15 },
      { type: 'camp', weight: 10 },
      { type: 'elite', weight: 25 },
    ],
    // 事件节点改为小怪战的概率
    eventTurnsIntoBattleChance: 0.30,
  },

  rewards: {
    rarityWeights: {
      normal: [
        { rarity: 'common', weight: 65 },
        { rarity: 'uncommon', weight: 25 },
        { rarity: 'rare', weight: 10 },
      ],
      elite: [
        { rarity: 'common', weight: 55 },
        { rarity: 'uncommon', weight: 30 },
        { rarity: 'rare', weight: 15 },
      ],
      boss: [{ rarity: 'rare', weight: 100 }],
    },
    upgradedChoiceChance: 0.1,
  },

  events: {
    rareEventChance: 0.3,
    wellFailChance: 0.7,
  },

  shop: {
    // 商店卡牌稀有度概率（默认与普通战斗掉落一致）
    cardRarityWeights: [
      { rarity: 'common', weight: 65 },
      { rarity: 'uncommon', weight: 25 },
      { rarity: 'rare', weight: 10 },
    ],
    // 商店遗物稀有度概率（暂与卡牌一致）
    relicRarityWeights: [
      { rarity: 'common', weight: 65 },
      { rarity: 'uncommon', weight: 25 },
      { rarity: 'rare', weight: 10 },
    ],
    cardPriceByRarity: {
      common: { min: 30, max: 60 },
      uncommon: { min: 50, max: 90 },
      rare: { min: 100, max: 180 },
    },
    relicPriceByRarity: {
      common: { min: 100, max: 140 },
      uncommon: { min: 140, max: 180 },
      rare: { min: 180, max: 300 },
    },
  },
};

