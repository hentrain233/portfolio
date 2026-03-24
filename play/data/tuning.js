/**
 * 全局平衡参数（建议优先在这里调整数值）。
 */
export const GAME_TUNING = {
  player: {
    initialEnergyMax: 3,
    maxEnergyCap: 99,
    drawPerTurn: 5,
    maxHp: 80,
  },
  seed: {
    maxPlantPerTurn: 99,
  },
  debug: {
    energy: 999,
  },
  combat: {
    weakOutMultiplier: 0.75,
    vulnerableInMultiplier: 1.5,
    fragileCardBlockMultiplier: 0.5,
    strikeBaseDamage: 6,
    defendBaseBlock: 5,
    multiHitEffectGapMs: 580,
  },
  animation: {
    // 回合开始发牌：每张从抽牌堆飞到手牌的时间
    drawCardFlyDurationMs: 30,
    // 回合开始发牌：每张之间的额外间隔（可调成 0 变快）
    drawCardIntervalMs: 0,
    // 回合结束弃牌：每张从手牌飞到弃牌堆的时间
    discardCardFlyDurationMs: 30,
    // 回合结束弃牌：每张之间的额外间隔（可调成 0 变快）
    discardCardIntervalMs: 0,
  },
  map: {
    minNormalNodeCount: 2,
  },
  camp: {
    healRatio: 0.25,
  },
  rewards: {
    battleCoins: {
      normal: 25,
      boss: 100,
      eventMoltingSnake: 60,
    },
  },
};

