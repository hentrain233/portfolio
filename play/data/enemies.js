export const ENEMIES = {
  grayRat: {
    id: 'grayRat',
    name: '灰鼠',
    maxHp: 55,
    behavior: {
      type: 'cycle',
      steps: [
        { type: 'attack', base: 6 },
        { type: 'buff', strength: 2, fortitude: 2 },
        { type: 'block', base: 9, scaleByFortitude: true },
      ],
    },
  },
  slime: {
    id: 'slime',
    name: '史莱姆',
    maxHp: 60,
    behavior: {
      type: 'cycle',
      steps: [
        { type: 'attack', base: 6 },
        { type: 'multiAttack', hits: 3, perHitBase: 2 },
        { type: 'healAndBuff', heal: 6, strength: 1 },
      ],
    },
  },
  appleBorerPair: {
    id: 'appleBorerPair',
    name: '苹果蛀虫（双体）',
    maxHp: 60,
    behavior: {
      type: 'pairActionBag',
      unitHp: 30,
      actions: ['debuff', 'attack', 'buff'],
      attackBase: 6,
      buffStrength: 2,
      debuffWeak: 1,
      debuffVulnerable: 1,
    },
  },
  chestMimic: {
    id: 'chestMimic',
    name: '宝箱怪',
    maxHp: 35,
    behavior: {
      type: 'chestMimic',
      steps: [
        { type: 'gainBlock', block: 30 },
        { type: 'blockStrikeAndSteal' },
        { type: 'escape' },
      ],
      eventKillBonusCoins: 100,
    },
  },
  goblinGang: {
    id: 'goblinGang',
    name: '小地精们',
    maxHp: 54,
    behavior: {
      type: 'tripleUnit',
      unitCount: 3,
      unitHpMin: 12,
      unitHpMax: 18,
      unitKinds: ['trickster', 'taunter', 'mage'],
      trickster: { attackBase: 4, gainStrengthPerTurn: 1 },
      taunter: { applyVulnerable: 1, applyFragile: 1 },
      mage: { addHandCardTemplateId: 'magicExplosion' },
    },
  },
  witheredToad: {
    id: 'witheredToad',
    name: '枯瘸蛙',
    maxHp: 130,
    behavior: {
      type: 'cycle',
      seedStart: 2,
      seedGrowthPerCycle: 1,
      steps: [
        { type: 'addStatusToDiscard', templateId: 'withered', amountFromState: 'witheredToadSeedCount' },
        { type: 'attack', base: 14 },
        { type: 'multiAttack', hits: 3, perHitBase: 3, postBuffStrength: 2 },
      ],
    },
  },
  lihuabird: {
    id: 'lihuabird',
    name: '离花鸟',
    maxHp: 80,
    behavior: {
      type: 'cycle',
      steps: [
        { type: 'multiAttack', hits: 4, perHitBase: 4 },
        { type: 'debuffAndAddHand', weak: 1, templateId: 'departingFlower' },
        { type: 'blockAndBuff', block: 12, strength: 1 },
      ],
    },
  },
  gargoyle: {
    id: 'gargoyle',
    name: '石像鬼',
    maxHp: 200,
    behavior: {
      type: 'gargoyle',
      slowPerCard: 0.1,
      steps: [
        { type: 'sleep' },
        { type: 'selfBuff', strength: 10 },
        { type: 'attack', base: 10 },
      ],
    },
  },
  moltingSnake: {
    id: 'moltingSnake',
    name: '蜕皮的蛇',
    maxHp: 80,
    behavior: {
      type: 'moltingSnake',
      preMolting: { attack: 8, gainStrength: 1 },
      postMolting: {
        step0Weak: 3,
        step1Fortitude: 1,
        step1Block: 9,
      },
    },
  },
  diablo: {
    id: 'diablo',
    name: '大菠萝',
    maxHp: 170,
    behavior: {
      type: 'diablo',
      sleepTurns: 3,
      sleepAddDiscardCard: 'drowsy',
      steps: [
        { type: 'attack', base: 16 },
        { type: 'debuff', weak: 2, vulnerable: 2 },
        { type: 'buffAndBlock', strength: 1, fortitude: 1, block: 20 },
        { type: 'multiAttack', hits: 5, perHitBase: 2 },
      ],
    },
  },
};

export const NORMAL_ENEMY_IDS = ['grayRat', 'slime', 'appleBorerPair', 'chestMimic', 'goblinGang'];
export const ELITE_ENEMY_IDS = ['lihuabird', 'gargoyle'];
export const BOSS_ENEMY_IDS = ['diablo', 'witheredToad'];

