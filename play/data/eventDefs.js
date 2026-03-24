/**
 * 事件定义（文案、选项、数值）。
 * 后续迭代时优先在这里改，不要把数字和描述写回逻辑代码。
 */
export const EVENT_IDS = {
  WELL: 'eventWell',
  SNAKE: 'eventSnake',
  BLESSING_COIN_DAMAGE: 'eventBlessingCoinDamage',
  THORN_CHEST: 'eventThornChest',
  CULTIST: 'eventCultist',
};

export const EVENT_DEFS = {
  [EVENT_IDS.WELL]: {
    id: EVENT_IDS.WELL,
    title: '普通事件：水井',
    descBase: '你的必经之路上遇见了一个深不见底的水井，扔石子下去也没有回声。',
    descActiveSuffix: '你能听见水在很远处发出的轻响。',
    descDoneSuffix: '时间结束。',
    maxUpgradeCount: 2,
    failDamageBase: 3,
    options: {
      attempt: '尝试在水井里打水喝（失败受伤，成功升级一张牌）',
      leave: '离开（直接前往下一节点）',
    },
  },
  [EVENT_IDS.SNAKE]: {
    id: EVENT_IDS.SNAKE,
    title: '普通事件：巨蛇',
    description: '你遇见了一条比你身体还大的蛇，正想动手，见到它说话了：“给我你的血，我会给予你回报”。',
    snakeTrade: {
      maxHpLoss: 12,
      relicId: 'snakeSkin',
      optionText: '选项A：失去12点最大生命值，获得遗物[褪下的蛇皮]',
    },
    snakeBattle: {
      enemyId: 'moltingSnake',
      optionText: '选项B：与之一战（进入特殊战斗）',
    },
  },
  [EVENT_IDS.BLESSING_COIN_DAMAGE]: {
    id: EVENT_IDS.BLESSING_COIN_DAMAGE,
    title: '祝福事件',
    description: '你获得了一份祝福，但代价随之而来。',
    blessingCoinDamage: {
      gainCoins: 150,
      damage: 23,
    },
    options: {
      continue: '继续（前往下一节点）',
    },
  },
  [EVENT_IDS.THORN_CHEST]: {
    id: EVENT_IDS.THORN_CHEST,
    title: '普通事件：荆棘地宝箱',
    description: '你看到荆棘地的中央有一个装满金币的大宝箱！',
    thornChest: {
      maxAttemptsBeforeBattle: 4,
      damageMin: 2,
      damageMax: 5,
      coinsMin: 10,
      coinsMax: 20,
      enemyId: 'chestMimic',
      optionDeep: '选项A：深入荆棘地',
      optionLeave: '选项B：赶紧离开',
    },
  },
  [EVENT_IDS.CULTIST]: {
    id: EVENT_IDS.CULTIST,
    title: '稀有事件：异教徒',
    description: '你看到三名形态各异的异教徒在朝圣的路上，他们信奉的，居然是一只北极熊？？',
    cultist: {
      optionA: {
        text: '选项A：跟着他们一起信奉',
        gainCurseTemplateId: 'madness',
        gainRareTemplateId: 'polarBlessing',
      },
      optionB: {
        text: '选项B：嘲讽他们的信仰',
        damage: 23,
        relicId: 'enlightenment',
      },
      optionC: {
        text: '选项C：骑上北极熊',
        maxHpDamagePercent: 0.99,
        gainCoins: 699,
      },
    },
  },
};

export const EVENT_POOLS = {
  normal: [EVENT_IDS.WELL, EVENT_IDS.SNAKE, EVENT_IDS.THORN_CHEST],
  rare: [EVENT_IDS.BLESSING_COIN_DAMAGE, EVENT_IDS.CULTIST],
};

export function getEventTitle(eventId) {
  return EVENT_DEFS[eventId]?.title ?? '事件';
}

