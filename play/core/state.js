/**
 * Core state factory.
 * Keep this as a pure initializer (no DOM access, no side effects).
 *
 * @param {{
 *   createStartingRunDeck: () => any[]
 *   INITIAL_ENERGY_MAX: number
 *   PLAYER_MAX_HP: number
 * }} deps
 */
export function createState({ createStartingRunDeck, INITIAL_ENERGY_MAX, PLAYER_MAX_HP }) {
  return {
    /** @type {any[]} 本局可用牌组（升级/清理对后续战斗生效） */
    runDeck: createStartingRunDeck(),
    /** @type {any[]} */
    drawPile: [],
    /** @type {any[]} */
    discardPile: [],
    /** @type {any[]} */
    hand: [],
    /** @type {any[]} 消耗牌堆（仅展示真正的消耗牌，不含能力牌） */
    exhaustPile: [],
    /** 当前可用能量 */
    energy: INITIAL_ENERGY_MAX,
    /** 费用上限 */
    energyMax: INITIAL_ENERGY_MAX,
    /** 当前回合数（对战开始后从 1 计） */
    turn: 1,
    /** 决战已发动：打击双倍伤害，且只能打出攻击牌 */
    decisiveBattleActive: false,
    /** 力量：每张攻击牌每段伤害的基础值 +力量 */
    strength: 0,
    /** 攻击结算用临时力量倍率（如冠军之力） */
    tempAttackStrengthMultiplier: 1,
    /** 本回合是否打出过攻击牌（供遗物等结算） */
    playedAttackThisTurn: false,
    /** 本回合已打出牌数（用于石像鬼迟缓等） */
    playedCardsThisTurn: 0,
    /** 本回合是否启用“每打出攻击牌力量再翻倍” */
    championStrengthDoublingActive: false,
    /** 坚固：每张防御牌基础格挡 +坚固 */
    fortitude: 0,
    /** 玩家格挡（抵消敌人造成的伤害；新回合开始时清空） */
    playerBlock: 0,
    /** 本回合是否无法再获得格挡 */
    blockGainLockedThisTurn: false,
    /** 当前是否处于篝火阶段 */
    inCamp: false,
    /** 当前是否处于祝福阶段 */
    inBlessing: false,
    /** 当前是否处于事件阶段 */
    inEvent: false,
    /** 当前是否处于商店阶段 */
    inShop: false,
    /** 是否等待手牌弃牌选择 */
    awaitingHandDiscard: false,
    /** 调试：无限能量、路线节点可跳转 */
    debugMode: false,
    /** 当前货币（金币） */
    coins: 99,
    /** 若为特殊战斗，则在胜利后跳转到该层 */
    battleExitNextEncounterFloorOverride: null,
    /** 当前事件所在层索引（用于离开事件后前往下一节点） */
    eventFloorIndex: null,
    /** 当前事件 id */
    activeEventId: null,
    /** 事件：水井尝试次数（用于伤害递增） */
    eventWellAttempts: 0,
    /** 事件：水井已成功升级的张数 */
    eventWellUpgradesDone: 0,
    /** 事件：水井已成功升级的牌名（用于 UI 提示） */
    eventWellUpgradedCardNames: [],
    /** 事件：荆棘地已深入次数 */
    eventThornChestAttempts: 0,
    /** 事件战斗标记（用于特殊结算） */
    eventBattleTag: null,
    /** 遗物：本战斗抵消第一次受到伤害（一次性） */
    relicFirstDamageNegateAvailable: false,
    /** 遗物：回合开始额外 +1 能量（充能电池，不叠加） */
    relicChargeBatteryPending: false,
    /** 遗物：荆棘层数（每次受伤反弹） */
    playerThorns: 0,
    /** 遗物：阴阳调和本战触发标记 */
    relicYinYangTriggeredThisBattle: false,
    /** 遗物：开悟本回合是否已触发 */
    relicEnlightenmentTriggeredThisTurn: false,
    /** 已获得遗物（占位） */
    relics: [],
    /** 本局永久加成：每场战斗初始力量 */
    runBattleStrengthBonus: 0,
    /** 本局永久加成：每场战斗能量上限加成 */
    runEnergyBonus: 0,
    /** 临时能量加成值 */
    tempEnergyBonusValue: 0,
    /** 临时能量加成剩余战斗数 */
    tempEnergyBonusBattlesLeft: 0,
    /** @type {'playing' | 'victory' | 'defeat'} */
    phase: 'playing',
    playerHp: PLAYER_MAX_HP,
    playerMaxHp: PLAYER_MAX_HP,
    enemyHp: 60,
    enemyMaxHp: 60,
    /** @type {'grayRat' | 'slime' | 'diablo' | 'appleBorerPair' | 'goblinGang' | 'moltingSnake' | 'witheredToad' | 'lihuabird' | 'gargoyle' | 'chestMimic'} */
    activeEnemyId: 'grayRat',
    /** 当前路线进度：下一场要打的层索引 0..MAP_FLOOR_COUNT-1；胜利后 +1 */
    nextEncounterFloor: 0,
    /** 本局路线节点类型（长度固定为 MAP_FLOOR_COUNT） */
    runFloorTypes: [],
    /** 本场战斗开始时的层索引（用于地图高亮） */
    battleFloor: 0,
    /** 玩家虚弱剩余回合（造成伤害降低；回合结束递减） */
    playerWeakTurns: 0,
    /** 玩家易伤剩余回合（受到伤害增加；回合结束递减） */
    playerVulnerableTurns: 0,
    /** 玩家脆弱剩余回合（仅卡牌获得的格挡降低） */
    playerFragileTurns: 0,
    /** 敌人虚弱剩余回合 */
    enemyWeakTurns: 0,
    /** 敌人易伤剩余回合 */
    enemyVulnerableTurns: 0,
    /** 敌人回合循环步 0–2（每步对应一种行动，结束后 +1 模 3） */
    enemyCycleStep: 0,
    /** 大菠萝：苏醒前剩余「敌方行动」次数 */
    diabloSleepRemaining: 0,
    /** 大菠萝：是否已结束睡眠（自然醒或累计伤害惊醒） */
    diabloAwake: false,
    /** 大菠萝：四步循环当前步 0–3 */
    diabloCycleStep: 0,
    /** 大菠萝：睡眠期间累计对生命值造成的伤害（用于 20% 惊醒） */
    diabloSleepHpDamageTotal: 0,
    /** 大菠萝：惊醒后下一次敌方行动为眩晕（不行动），再进入四步循环 */
    diabloPostWakeStun: false,
    /** 敌人力量（加在攻击基础值上） */
    enemyStrength: 0,
    /** 敌人坚固（加在获得的格挡上） */
    enemyFortitude: 0,
    /** 敌人格挡（吸收玩家造成的伤害） */
    enemyBlock: 0,
    /** 蜕皮的蛇：下一次受到伤害将被抵挡 */
    moltingSnakeGuardNextDamage: false,
    /** 蜕皮的蛇：已完成蜕皮 */
    moltingSnakeMolted: false,
    /** 蜕皮的蛇：蜕皮后流程步（0=第一回合，1=第二回合，2=第三回合） */
    moltingSnakePostMoltingStep: 0,
    /** 蜕皮的蛇：奖励是否已领取（避免重复加金币/遗物） */
    moltingSnakeRewardClaimed: false,
    /** 本轮已遇见过的普通怪（用于优先遭遇未遇见怪） */
    seenNormalEnemyIds: [],
    /** 本轮已遇见过的精英怪（用于优先遭遇未遇见精英） */
    seenEliteEnemyIds: [],
    /** 本轮已遇见过的 BOSS（用于优先遭遇未遇见 BOSS） */
    seenBossEnemyIds: [],
    /** 苹果蛀虫：两只单位的生命 */
    appleBorerUnitsHp: [0, 0],
    /** 苹果蛀虫：两只单位的力量（影响各自攻击） */
    appleBorerUnitsStrength: [0, 0],
    /** 苹果蛀虫：两只单位的虚弱剩余回合（影响各自输出伤害） */
    appleBorerUnitsWeakTurns: [0, 0],
    /** 苹果蛀虫：两只单位的易伤剩余回合（影响各自被打入的伤害倍率） */
    appleBorerUnitsVulnerableTurns: [0, 0],
    /** 苹果蛀虫：两只单位各自的三行动随机不重复袋 */
    appleBorerUnitsActionBags: [[], []],
    /** 多单位战：每个单位的最大生命 */
    appleBorerUnitsMaxHp: [30, 30],
    /** 多单位战：每个单位的类型（如地精） */
    appleBorerUnitKinds: [],
    /** 苹果蛀虫：下一次拖拽攻击牌的手牌索引 */
    pendingAttackDragHandIndex: null,
    /** 当前选择的角色 */
    selectedCharacterId: null,
    /** 是否在角色选择界面 */
    inCharacterSelect: false,
    /** 战斗结算卡牌奖励是否待选择 */
    awaitingCardRewardChoice: false,
    /** 当前三选一卡牌奖励项 */
    pendingCardRewardChoices: [],
    /** 战后奖励总览是否待选择 */
    awaitingBattleLootChoice: false,
    /** 战后奖励来源（normal/elite/boss） */
    pendingBattleLootSourceType: null,
    /** 战后待领取遗物 id（可跳过） */
    pendingRelicRewardId: null,
    /** 下回合开始时施加给玩家的虚弱层数 */
    pendingPlayerWeakOnNextTurn: 0,
    /** 下回合开始时额外获得的能量（来自种子） */
    pendingSeedEnergyNextTurn: 0,
    /** 下回合开始时额外抽牌数（来自种子） */
    pendingSeedDrawNextTurn: 0,
    /** 本回合已播种数量（用于限制单回合上限） */
    plantedSeedsThisTurn: 0,
    /** 本局可掉落卡池（templateId） */
    runRewardPoolTemplateIds: [],
    /** 本局可掉落遗物池（每个遗物最多获得一次） */
    runRelicPoolIds: [],
    /** 商店：当前可购买卡牌 */
    shopCardOffers: [],
    /** 商店：当前可购买遗物 */
    shopRelicOffers: [],
    /** 商店：本局服务使用次数（用于涨价） */
    shopServiceUsage: { purge: 0, upgrade: 0 },
    /** DEBUG：按层强制遇敌（floorIndex -> enemyId） */
    debugForcedEnemyByFloor: {},
    /** 当前战斗是否精英战 */
    inEliteBattle: false,
    /** 敌人本玩家回合累计受伤（用于离花鸟阈值判定） */
    enemyDamageTakenThisTurn: 0,
    /** 离花鸟：下回合待回复生命值 */
    lihuabirdPendingHeal: 0,
    /** 离花鸟：本回合阈值是否已触发 */
    lihuabirdThresholdTriggeredThisTurn: false,
    /** 枯瘸蛙循环步（0/1/2） */
    witheredToadCycleStep: 0,
    /** 枯瘸蛙每轮首步塞牌数量 */
    witheredToadSeedCount: 3,
    /** 宝箱怪：是否已逃走 */
    chestMimicEscaped: false,
    /** 宝箱怪：累计偷走金币 */
    chestMimicStolenCoins: 0,
    /** 本场战斗结束时额外恢复生命（由能力牌累积） */
    battleEndHealBonus: 0,
    /** 本场战斗结束时额外获得金币（由能力牌累积） */
    battleEndBonusCoins: 0,
    /** 本回合内临时力量修正（下回合开始时撤销） */
    tempStrengthDeltaThisTurn: 0,
    /** 本回合内临时坚固修正（下回合开始时撤销） */
    tempFortitudeDeltaThisTurn: 0,
  };
}

