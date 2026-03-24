/**
 * 肉鸽卡牌原型：抽牌堆 / 弃牌堆 / 手牌，费用与回合。
 */

/** @typedef {'attack' | 'defend' | 'skill' | 'power'} CardKind */

/**
 * @typedef {Object} CardTemplate
 * @property {string} id
 * @property {string} name
 * @property {CardKind} kind
 * @property {string} desc
 * @property {number} cost
 * @property {number} [draw] skill：额外抽牌张数
 * @property {number} [discard] skill：选择弃牌张数
 * @property {number} [damage] 攻击：单次基础伤害
 * @property {{ count: number, perHit: number }} [multiHit] 攻击：多段伤害
 * @property {number} [block] 防御：基础格挡
 * @property {boolean} [exhaust] 打出后进入消耗牌堆，本场战斗不再可见于抽/弃
 * @property {number} [strengthGain] 能力：力量
 * @property {number} [fortitudeGain] 能力：坚固
 * @property {'common' | 'uncommon' | 'rare'} [rarity] 卡牌稀有度
 * @property {number} [vulnerable] 施加易伤层数（按持续回合计）
 * @property {boolean} [ignoreTargetVulnerable] 本次伤害不吃目标易伤（仍会受自身虚弱影响）
 * @property {number} [gainEnergy] 额外获得能量
 * @property {boolean} [lockBlockGainThisTurn] 本回合不能再获得格挡
 */

/**
 * @typedef {Object} CardInstance
 * @property {string} uid
 * @property {string} templateId
 * @property {string} name
 * @property {CardKind} kind
 * @property {string} desc
 * @property {number} cost
 * @property {number} [draw]
 * @property {number} [discard]
 * @property {number} [damage]
 * @property {{ count: number, perHit: number }} [multiHit]
 * @property {number} [block]
 * @property {boolean} [exhaust]
 * @property {number} [strengthGain]
 * @property {number} [fortitudeGain]
 * @property {'common' | 'uncommon' | 'rare'} [rarity]
 * @property {number} [vulnerable]
 * @property {boolean} [ignoreTargetVulnerable]
 * @property {number} [gainEnergy]
 * @property {boolean} [lockBlockGainThisTurn]
 */

import { shuffle } from './data/rng.js';
import { EVENT_IDS, EVENT_DEFS, EVENT_POOLS, getEventTitle } from './data/eventDefs.js';
import { CHARACTER_IDS, CHARACTER_DEFS } from './data/characters.js';
import { ENEMIES, NORMAL_ENEMY_IDS, ELITE_ENEMY_IDS, BOSS_ENEMY_IDS } from './data/enemies.js';
import { PROBABILITY_CONFIG } from './data/probabilities.js';
import { SHOP_CONFIG } from './data/shopConfig.js';
import { GAME_TUNING } from './data/tuning.js';
import { cacheEls } from './ui/dom.js';
import { escapeHtml, renderCardViewHtml, renderCardFaceHtml, buildCardClassName } from './ui/render.js';
import { bindOverlayDismiss } from './ui/overlays.js';
import {
  createCardFilterState,
  renderCardFilterControls,
  filterAndSortCardItems,
} from './ui/cardFilter.js';
import { createEventUI } from './ui/eventUI.js';
import { createShopUI } from './ui/shopUI.js';
import { createState } from './core/state.js';
import { createGameLoop } from './core/gameLoop.js';
import {
  resolveStrikeLikeDamageSystem,
  resolveMultiHitDamageSystem,
  applyPlayerOutgoingDamageSystem,
  applyEnemyOutgoingDamageSystem,
} from './systems/combatSystem.js';
import { instantiateCardSystem, instantiateRunDeckCardSystem } from './systems/cardSystem.js';
import {
  addRelicByIdSystem,
  applyIncomingPlayerDebuffWithRelicSystem,
  applyBattleStartRelicsSystem,
  applyBattleStartRoundOneRelicsSystem,
  applyBattleEndRelicsSystem,
  applyEndTurnRelicsBeforeEnemySystem,
  applyEndTurnRelicsAfterPlayerSystem,
  applyTurnStartRelicsSystem,
} from './systems/relicSystem.js';
import {
  isAppleBorerEncounterSystem,
  anyAppleBorerAliveSystem,
  pickNormalEnemyIdSystem,
  pickEliteEnemyIdSystem,
  pickBossEnemyIdSystem,
  getAppleBorerTargetIndexSystem,
  createAppleBorerActionBagSystem,
  resetAppleBorerStateSystem,
  executeEnemyTurnSystem,
} from './systems/enemySystem.js';
import { buildEnemyIntentHTML, buildMultiUnitIntentHtmlSystem } from './systems/enemyIntentSystem.js';
import { pickRandomEventIdSystem } from './systems/eventSystem.js';
import {
  prepareEventStateSystem,
  applyBlessingCoinDamageEventSystem,
  applySnakeTradeOptionSystem,
  buildWellDescriptionSystem,
  resolveWellAttemptSystem,
  resolveThornChestAttemptSystem,
} from './systems/eventRuntimeSystem.js';
import {
  pickRandomBlessingsSystem,
  takeDamageOutOfCombatSystem,
  applyBlessingSystem,
} from './systems/blessingSystem.js';
import { upgradeRandomRunDeckCardSystem } from './systems/deckSystem.js';
import { getPileOverlayTitleSystem, groupDrawPileForDisplaySystem } from './systems/pileSystem.js';
import { buildRewardPoolTemplateIdsSystem, generateCardRewardChoicesSystem } from './systems/rewardSystem.js';
import {
  shouldAutoExhaustOnDiscardSystem,
  resolveOnDrawCardEffectsSystem,
} from './systems/statusCurseSystem.js';
import { initializeBattleStateSystem } from './systems/battleSetupSystem.js';
import { applyCardEffectsSystem } from './systems/playCardEffectsSystem.js';
import { canPlayUnderDecisiveBattleSystem, playFromHandSystem } from './systems/playCardSystem.js';
import {
  canPayArcaneKindlingSystem,
  payArcaneKindlingSystem,
  collectArcaneKindlingFuelIndexesSystem,
} from './systems/cardKeywordSystem.js';
import {
  syncEnergyAfterDebugToggleSystem,
  classifyFloorTypeSystem,
  validateDebugJumpFloorSystem,
} from './systems/debugSystem.js';
import { getMapNodeLabelSystem, buildMapNodeClassSystem } from './systems/mapSystem.js';
import { buildRunFloorTypesSystem } from './systems/mapRouteSystem.js';
import {
  getNextBattleButtonTextSystem,
  getEnemyHpTextSystem,
  getEnemyMaxHpTextSystem,
  getPlayerBlockSuffixSystem,
  getEnemyBlockSuffixSystem,
  getBattleFlowUIStateSystem,
} from './systems/uiStateSystem.js';
import { buildPlayerBuffChipsSystem, buildEnemyBuffChipsSystem } from './systems/buffSystem.js';
import {
  spawnFlyingCardSystem,
  buildHandInsertRectSystem,
  sleepMsSystem,
} from './systems/cardFlyAnimationSystem.js';
import { createTurnFlowSystem } from './systems/turnFlowSystem.js';
import {
  buildShopCardOffersSystem,
  buildShopRelicOffersSystem,
  getShopServiceCostSystem,
} from './systems/shopSystem.js';
import {
  tickPlayerDebuffsEndOfPlayerTurnSystem,
  reshuffleDiscardIntoDrawIfNeededSystem,
  drawCardsSystem,
} from './systems/turnSystem.js';

const INITIAL_ENERGY_MAX = GAME_TUNING.player.initialEnergyMax;
const MAX_ENERGY_CAP = Number(GAME_TUNING.player.maxEnergyCap ?? 99);
/** DEBUG 模式下的能量显示为 ∞，内部用足够大的数值 */
const DEBUG_ENERGY = GAME_TUNING.debug.energy;
const DRAW_PER_TURN = GAME_TUNING.player.drawPerTurn;
const MAX_SEEDS_PER_TURN = Number(GAME_TUNING.seed?.maxPlantPerTurn ?? 99);
const PLAYER_MAX_HP = GAME_TUNING.player.maxHp;
/** 路线节点固定为 10：首层祝福，第 5 层商店，末层 BOSS，倒数第二层篝火 */
const MAP_FLOOR_COUNT = Number(SHOP_CONFIG.route.nodeCount ?? 10);
const SHOP_FLOOR_INDEX = Number(SHOP_CONFIG.route.fixedShopIndex ?? 4);
const FALLBACK_FLOOR_TYPES = ['blessing', 'normal', 'event', 'normal', 'shop', 'event', 'normal', 'elite', 'camp', 'boss'];
const ROUTE_WEIGHTED_TYPES = PROBABILITY_CONFIG.map.routeNodeWeights;
/** 虚弱：造成伤害 ×0.75（向下取整），叠层延长持续回合 */
const WEAK_OUT_MULT = GAME_TUNING.combat.weakOutMultiplier;
/** 易伤：受到伤害 ×1.5（向下取整），叠层延长持续回合 */
const VULNERABLE_IN_MULT = GAME_TUNING.combat.vulnerableInMultiplier;

/** 抽牌堆展示顺序：攻击 → 防御 → 能力 → 技能 */
const KIND_ORDER_FOR_DECK_VIEW = { attack: 0, defend: 1, power: 2, skill: 3 };
/** 打击默认基础伤害（可被卡牌 damage 覆盖） */
const STRIKE_BASE_DAMAGE = GAME_TUNING.combat.strikeBaseDamage;
/** 防御默认基础格挡 */
const DEFEND_BASE_BLOCK = GAME_TUNING.combat.defendBaseBlock;
/** 脆弱：仅卡牌提供的格挡按该倍率结算 */
const FRAGILE_CARD_BLOCK_MULT = Number(GAME_TUNING.combat.fragileCardBlockMultiplier ?? 0.5);
/** 多段攻击：每段红光/受击间隔（毫秒），略大于单次动画时长 */
const MULTI_HIT_EFFECT_GAP_MS = GAME_TUNING.combat.multiHitEffectGapMs;
const DRAW_CARD_FLY_DURATION_MS = Number(GAME_TUNING.animation?.drawCardFlyDurationMs ?? 430);
const DRAW_CARD_INTERVAL_MS = Number(GAME_TUNING.animation?.drawCardIntervalMs ?? 0);
const DISCARD_CARD_FLY_DURATION_MS = Number(GAME_TUNING.animation?.discardCardFlyDurationMs ?? 330);
const DISCARD_CARD_INTERVAL_MS = Number(GAME_TUNING.animation?.discardCardIntervalMs ?? 0);

/** 牌面定义（默认值） */
const DEFAULT_TEMPLATES = {
  strike: {
    id: 'strike',
    name: '打击',
    kind: 'attack',
    cost: 1,
    damage: 6,
    rarity: 'common',
    desc: '造成 6 点基础伤害（受力量加成；决战发动后打击部分翻倍）。',
  },
  comboSlash: {
    id: 'comboSlash',
    name: '连斩',
    kind: 'attack',
    cost: 1,
    multiHit: { count: 3, perHit: 2 },
    rarity: 'common',
    desc: '对敌方单体造成 3 次 2 点伤害（每次独立受力量加成）。',
  },
  armorBreak: {
    id: 'armorBreak',
    name: '破甲',
    kind: 'attack',
    cost: 2,
    damage: 8,
    vulnerable: 2,
    exhaust: true,
    ignoreTargetVulnerable: true,
    rarity: 'common',
    desc: '【消耗】造成 8 点伤害并施加 2 层易伤（此次伤害不受易伤加成）。',
  },
  defend: {
    id: 'defend',
    name: '防御',
    kind: 'defend',
    cost: 1,
    block: 5,
    rarity: 'common',
    desc: '获得 5 点基础格挡（受坚固加成）。',
  },
  insight: {
    id: 'insight',
    name: '洞察',
    kind: 'skill',
    cost: 1,
    desc: '抽 3 张牌。',
    draw: 3,
    rarity: 'uncommon',
  },
  acrobatics: {
    id: 'acrobatics',
    name: '杂技',
    kind: 'skill',
    cost: 1,
    draw: 2,
    discard: 1,
    rarity: 'uncommon',
    desc: '抽取 2 张牌，选择丢弃 1 张牌。',
  },
  adrenalineLock: {
    id: 'adrenalineLock',
    name: '透支',
    kind: 'skill',
    cost: 0,
    gainEnergy: 2,
    lockBlockGainThisTurn: true,
    exhaust: true,
    rarity: 'uncommon',
    desc: '【消耗】获得 2 点能量，本回合不能再获得格挡。',
  },
  decisiveBattle: {
    id: 'decisiveBattle',
    name: '决战',
    kind: 'power',
    cost: 1,
    rarity: 'rare',
    desc: '本场战斗：打击双倍伤害；之后只能打出攻击牌。',
  },
  crescendo: {
    id: 'crescendo',
    name: '渐强',
    kind: 'power',
    cost: 1,
    strengthGain: 1,
    fortitudeGain: 1,
    rarity: 'rare',
    desc: '本场战斗获得 1 点力量与 1 点坚固。',
  },
  withered: {
    id: 'withered',
    name: '枯萎',
    kind: 'skill',
    cost: 1,
    rarity: 'common',
    category: 'status',
    keywords: ['void'],
    desc: '【状态】【虚无】被洗入抽牌堆时，你受到 2 点伤害。',
    onShuffleIntoDrawSelfDamage: 2,
  },
  departingFlower: {
    id: 'departingFlower',
    name: '离去的花',
    kind: 'skill',
    cost: 1,
    rarity: 'common',
    category: 'status',
    exhaust: true,
    desc: '【状态】【消耗】若回合结束时仍在手中：你获得 1 层易伤与 1 层虚弱，离花鸟获得 2 点力量。',
    onTurnEndInHandEffects: [{ type: 'lihuabirdFarewell' }],
  },
  drowsy: {
    id: 'drowsy',
    name: '困意',
    kind: 'skill',
    cost: 1,
    rarity: 'common',
    category: 'status',
    desc: '【状态】若回合结束时仍在手中：下回合开始后你获得 1 层虚弱。',
  },
};

/** 默认开局牌组（用于未选角色前的兜底） */
const DEFAULT_STARTING_DECK_IDS = CHARACTER_DEFS[CHARACTER_IDS.WARRIOR].starterDeck;

const CAMP_HEAL_RATIO = GAME_TUNING.camp.healRatio;

/**
 * @typedef {Object} RunDeckCard
 * @property {string} uid
 * @property {string} templateId
 * @property {boolean} upgraded
 */

/**
 * 升级后数值表（你后续可按导出文档继续调整）。
 * @type {Record<string, Partial<CardTemplate & { vulnerable: number, gainEnergy: number }>>}
 */
const DEFAULT_UPGRADE_RULES = {
  strike: { damage: 9, desc: '造成 9 点基础伤害（受力量加成；决战发动后打击部分翻倍）。' },
  defend: { block: 8, desc: '获得 8 点基础格挡（受坚固加成）。' },
  insight: { draw: 4, desc: '抽 4 张牌。' },
  acrobatics: { draw: 3, discard: 1, desc: '抽取 3 张牌，选择丢弃 1 张牌。' },
  comboSlash: { multiHit: { count: 3, perHit: 3 }, desc: '对敌方单体造成 3 次 3 点伤害（每次独立受力量加成）。' },
  armorBreak: {
    damage: 11,
    vulnerable: 3,
    desc: '【消耗】造成 11 点伤害并施加 3 层易伤（此次伤害不受易伤加成）。',
  },
  adrenalineLock: { gainEnergy: 3, desc: '【消耗】获得 3 点能量，本回合不能再获得格挡。' },
  crescendo: {
    strengthGain: 2,
    fortitudeGain: 2,
    desc: '本场战斗获得 2 点力量与 2 点坚固。',
  },
};

/**
 * 外部可编辑配置（data/card-config.js）：
 * - templates: 卡牌基础效果
 * - upgraded: 卡牌升级后效果
 */
const CARD_CONFIG = window.CARD_CONFIG || {};
const BLESSING_CONFIG = window.BLESSING_CONFIG || {};
const TEMPLATES = CARD_CONFIG.templates || DEFAULT_TEMPLATES;
const UPGRADE_RULES = CARD_CONFIG.upgraded || DEFAULT_UPGRADE_RULES;
const ALL_TEMPLATE_IDS = Object.keys(TEMPLATES);

/**
 * @param {CardTemplate} t
 * @returns {CardInstance}
 */
function instantiateCard(t) {
  return instantiateCardSystem(t);
}

/**
 * @param {RunDeckCard} runCard
 * @returns {CardInstance}
 */
function instantiateRunDeckCard(runCard) {
  return instantiateRunDeckCardSystem({ runCard, TEMPLATES, UPGRADE_RULES });
}

/**
 * @returns {RunDeckCard[]}
 */
function createStartingRunDeck() {
  return DEFAULT_STARTING_DECK_IDS.map((templateId) => ({
    uid: `${templateId}-run-${Math.random().toString(36).slice(2, 10)}`,
    templateId,
    upgraded: false,
  }));
}

function createRunDeckFromTemplateIds(templateIds) {
  return templateIds.map((templateId) => ({
    uid: `${templateId}-run-${Math.random().toString(36).slice(2, 10)}`,
    templateId,
    upgraded: false,
  }));
}

function buildRunFloorTypes() {
  const eliteA = MAP_FLOOR_COUNT - 3;
  const eliteB = MAP_FLOOR_COUNT - 4;
  const allowedTypesByIndex = {};
  for (let i = 0; i < MAP_FLOOR_COUNT; i += 1) {
    if (i === 0 || i === SHOP_FLOOR_INDEX || i === MAP_FLOOR_COUNT - 2 || i === MAP_FLOOR_COUNT - 1) continue;
    allowedTypesByIndex[i] = (i === eliteA || i === eliteB)
      ? ['event', 'normal', 'camp', 'elite']
      : ['event', 'normal', 'camp'];
  }
  return buildRunFloorTypesSystem({
    nodeCount: MAP_FLOOR_COUNT,
    fixedTypes: {
      0: 'blessing',
      1: 'normal',
      [SHOP_FLOOR_INDEX]: 'shop',
      [MAP_FLOOR_COUNT - 2]: 'camp',
      [MAP_FLOOR_COUNT - 1]: 'boss',
    },
    weightedTypes: ROUTE_WEIGHTED_TYPES,
    allowedTypesByIndex,
    minNormalCount: GAME_TUNING.map.minNormalNodeCount,
    rng: Math.random,
  });
}

/**
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
// shuffle moved to `data/rng.js`

const state = createState({ createStartingRunDeck, INITIAL_ENERGY_MAX, PLAYER_MAX_HP });
state.runFloorTypes = buildRunFloorTypes();

const els = cacheEls();

const DEFAULT_RELIC_DEFS = {
  orichalcum: {
    id: 'orichalcum',
    name: '奥里哈刚',
    icon: '🛡',
    rarity: 'common',
    desc: '如果回合结束时你没有格挡，获得 2 点格挡。',
    effects: { endTurnNoBlockGainBlock: 2 },
  },
  bloodPact: {
    id: 'bloodPact',
    name: '鲜血契约',
    icon: '🩸',
    rarity: 'rare',
    desc: '战斗开始时，获得 1 点力量与 1 点坚固；当生命值低于最大生命的一半时，该效果翻倍。',
    effects: { battleStartStrength: 1, battleStartFortitude: 1, lowHpDouble: true },
  },
  snakeSkin: {
    id: 'snakeSkin',
    name: '褪下的蛇皮',
    icon: '🐍',
    rarity: 'uncommon',
    desc: '每场战斗抵消你受到的第一次伤害。',
    effects: { negateFirstDamagePerBattle: true },
  },
  chargeBattery: {
    id: 'chargeBattery',
    name: '充能电池',
    icon: '🔋',
    rarity: 'common',
    desc: '若本回合未打出攻击牌，下回合开始时获得 1 点额外能量（不叠加）。',
    effects: { noAttackTurnStartEnergyNextTurn: 1, nonStacking: true },
  },
  clownMask: {
    id: 'clownMask',
    name: '小丑面具',
    icon: '🤡',
    rarity: 'common',
    desc: '战斗开始的第一回合，给予所有敌人 1 层易伤。',
    effects: { firstTurnAllEnemiesVulnerable: 1 },
  },
  sunflowerMask: {
    id: 'sunflowerMask',
    name: '向日葵面具',
    icon: '🌻',
    rarity: 'common',
    desc: '战斗开始的第一回合，给予所有人 1 层虚弱。',
    effects: { firstTurnAllUnitsWeak: 1 },
  },
  thornArmor: {
    id: 'thornArmor',
    name: '荆棘甲',
    icon: '🧥',
    rarity: 'uncommon',
    desc: '获得 2 点荆棘。每次受到敌方伤害时，按受击次数反弹伤害。',
    effects: { thorns: 2 },
  },
  sanitizer: {
    id: 'sanitizer',
    name: '酒精洗手液',
    icon: '🧴',
    rarity: 'uncommon',
    desc: '每场战斗结束时，恢复 3 点生命。',
    effects: { healAfterBattle: 3 },
  },
  yinYangHarmony: {
    id: 'yinYangHarmony',
    name: '阴阳调和',
    icon: '☯',
    rarity: 'rare',
    desc: '每场战斗限 1 次：第一次将被施加虚弱或易伤时免疫，并获得力量与坚固。',
    effects: {
      firstIncomingWeakOrVulnImmuneOncePerBattle: true,
      gainStrengthOnTrigger: 1,
      gainFortitudeOnTrigger: 1,
    },
  },
  enlightenment: {
    id: 'enlightenment',
    name: '开悟',
    icon: '🧠',
    rarity: 'rare',
    desc: '每回合第一次打出费用大于 1 的卡牌时，恢复 1 点能量。',
    effects: { firstHighCostCardRefundEnergy: 1 },
  },
};
const DEFAULT_BLESSING_POOL = [];
// 若外部配置提供 relics，则与默认遗物做合并，避免覆盖导致缺失（例如本次需要的「褪下的蛇皮」）
const RELIC_DEFS = { ...DEFAULT_RELIC_DEFS, ...(BLESSING_CONFIG.relics || {}) };
const BLESSING_POOL = BLESSING_CONFIG.blessings || CARD_CONFIG.blessings || DEFAULT_BLESSING_POOL;

/** @type {'draw' | 'discard' | 'exhaust' | null} */
let pileOverlayView = null;
let uiAnimationLockCount = 0;
let pendingArcaneFuelIndex = null;
let pendingToleranceTransformUid = null;
const collectionCardFilterState = createCardFilterState();
const debugCardFilterState = createCardFilterState();

function log(msg) {
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  els.log.prepend(line);
}

function ensureHoverTooltipEl() {
  let el = document.getElementById('hover-tooltip');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'hover-tooltip';
  el.className = 'hover-tooltip';
  el.hidden = true;
  document.body.appendChild(el);
  return el;
}

function placeHoverTooltip(el, clientX, clientY) {
  const margin = 14;
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = clientX + margin;
  let top = clientY + margin;
  if (left + rect.width > vw - 8) left = Math.max(8, clientX - rect.width - margin);
  if (top + rect.height > vh - 8) top = Math.max(8, clientY - rect.height - margin);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function bindHoverTooltip(targetEl, textOrGetter) {
  if (!targetEl || !textOrGetter) return;
  targetEl.removeAttribute('title');
  const tipEl = ensureHoverTooltipEl();
  const readText = () => (typeof textOrGetter === 'function' ? textOrGetter() : textOrGetter);
  const show = (e) => {
    const text = readText();
    if (!text) return;
    tipEl.textContent = text;
    tipEl.hidden = false;
    placeHoverTooltip(tipEl, e.clientX ?? 0, e.clientY ?? 0);
  };
  const move = (e) => {
    if (tipEl.hidden) return;
    placeHoverTooltip(tipEl, e.clientX ?? 0, e.clientY ?? 0);
  };
  const hide = () => {
    tipEl.hidden = true;
  };
  targetEl.addEventListener('mouseenter', show);
  targetEl.addEventListener('mousemove', move);
  targetEl.addEventListener('mouseleave', hide);
  targetEl.addEventListener('blur', hide);
}

function getEnergyColorByCharacter() {
  if (state.selectedCharacterId === CHARACTER_IDS.WARRIOR) return '#d56a6a';
  if (state.selectedCharacterId === CHARACTER_IDS.NATURE_MAGE) return '#66c38e';
  return '#8ec5ff';
}

function renderEnergyOrbsUI() {
  const el = els.energyOrbs;
  if (!el) return;
  const current = Math.max(0, Number(state.energy ?? 0));
  const max = Math.max(0, Number(state.energyMax ?? 0));
  el.style.setProperty('--energy-color', getEnergyColorByCharacter());
  el.classList.remove('hand-energy--infinite');
  el.innerHTML = '';
  if (state.debugMode) {
    el.classList.add('hand-energy--infinite');
    el.textContent = '∞';
    return;
  }
  const capped = Math.min(current, 20);
  for (let i = 0; i < capped; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'energy-orb';
    if (i >= max) dot.classList.add('energy-orb--overflow');
    el.appendChild(dot);
  }
  if (current > 20) {
    const extra = document.createElement('span');
    extra.className = 'energy-orb-extra';
    extra.textContent = `+${current - 20}`;
    el.appendChild(extra);
  }
}

function showBattleStartToast(text = '开始战斗') {
  const el = els.battleStartToast;
  if (!el) return;
  el.textContent = text;
  el.style.opacity = '0.95';
  clearTimeout(showBattleStartToast._timer);
  showBattleStartToast._timer = setTimeout(() => {
    el.style.opacity = '0';
  }, 800);
}

function lockUiForAnimation() {
  uiAnimationLockCount += 1;
  refreshUI();
}

function unlockUiForAnimation() {
  uiAnimationLockCount = Math.max(0, uiAnimationLockCount - 1);
  refreshUI();
}

const spawnFlyingCard = spawnFlyingCardSystem;

function buildHandInsertRect(slotIndex) {
  return buildHandInsertRectSystem({ handEl: els.hand, slotIndex });
}

/**
 * 玩家立方体：攻击红 / 防御蓝 / 能力紫
 * @param {'attack' | 'defend' | 'power'} kind
 */
function flashPlayerAura(kind) {
  const aura = els.playerCubeAura;
  if (!aura) return;
  aura.classList.remove('cube-aura--attack', 'cube-aura--defend', 'cube-aura--power');
  void aura.offsetWidth;
  const cls =
    kind === 'attack' ? 'cube-aura--attack' : kind === 'defend' ? 'cube-aura--defend' : 'cube-aura--power';
  aura.classList.add(cls);
  aura.addEventListener(
    'animationend',
    () => {
      aura.classList.remove('cube-aura--attack', 'cube-aura--defend', 'cube-aura--power');
    },
    { once: true },
  );
}

function playEnemyHitFeedback() {
  const wrap = els.enemyHitWrap;
  if (!wrap) return;
  wrap.classList.remove('enemy-hit-wrap--knock');
  void wrap.offsetWidth;
  wrap.classList.add('enemy-hit-wrap--knock');
  wrap.addEventListener(
    'animationend',
    () => {
      wrap.classList.remove('enemy-hit-wrap--knock');
    },
    { once: true },
  );
}

function isAppleBorerEncounter() {
  return isAppleBorerEncounterSystem({ state });
}

function anyAppleBorerAlive() {
  return anyAppleBorerAliveSystem({ state });
}

function pickNormalEnemyId() {
  return pickNormalEnemyIdSystem({ ENEMY_IDS: NORMAL_ENEMY_IDS, state });
}

function pickEliteEnemyId() {
  return pickEliteEnemyIdSystem({ ELITE_ENEMY_IDS, state });
}

function pickBossEnemyId() {
  return pickBossEnemyIdSystem({ BOSS_ENEMY_IDS, state });
}

function getRunFloorTypes() {
  return state.runFloorTypes && state.runFloorTypes.length ? state.runFloorTypes : FALLBACK_FLOOR_TYPES;
}

function initializeRunRelicPool() {
  state.runRelicPoolIds = Object.keys(RELIC_DEFS);
}

function addCardToPlayerDiscard(templateId) {
  const t = TEMPLATES[templateId];
  if (!t) return false;
  state.discardPile.push(instantiateCard(t));
  return true;
}

function addCardToPlayerHand(templateId) {
  const t = TEMPLATES[templateId];
  if (!t) return false;
  const card = instantiateCard(t);
  state.hand.push(card);
  return card;
}

function createCardByTemplateId(templateId, upgraded = false) {
  const base = TEMPLATES[templateId];
  if (!base) return null;
  const card = instantiateCard(base);
  if (!upgraded) return card;
  const patch = UPGRADE_RULES[templateId];
  if (!patch) {
    card.name = `${card.name}+`;
    card.upgraded = true;
    return card;
  }
  const merged = { ...card, ...patch };
  if (patch.multiHit) {
    merged.multiHit = { count: patch.multiHit.count, perHit: patch.multiHit.perHit };
  }
  merged.name = `${card.name}+`;
  merged.upgraded = true;
  return merged;
}

function rollRunRelicRewardCandidate() {
  if (!Array.isArray(state.runRelicPoolIds) || state.runRelicPoolIds.length === 0) {
    return null;
  }
  const owned = new Set((state.relics || []).map((r) => r.id));
  const candidateIds = state.runRelicPoolIds.filter((id) => !owned.has(id));
  if (!candidateIds.length) return null;
  const relicId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
  return relicId;
}

function consumePendingRelicReward(addToSlot) {
  const relicId = state.pendingRelicRewardId;
  state.pendingRelicRewardId = null;
  if (!relicId) return;
  state.runRelicPoolIds = state.runRelicPoolIds.filter((id) => id !== relicId);
  if (!addToSlot) {
    const r = RELIC_DEFS[relicId];
    log(`你跳过了遗物「${r?.name ?? relicId}」。`);
    return;
  }
  const before = state.relics.length;
  addRelicById(relicId);
  if (state.relics.length > before) {
    const r = RELIC_DEFS[relicId];
    log(`奖励：获得遗物「${r?.name ?? relicId}」。`);
  }
}

function tryResolveBattleLootFlow() {
  const hasCard = state.awaitingCardRewardChoice && state.pendingCardRewardChoices.length > 0;
  const hasRelic = !!state.pendingRelicRewardId;
  if (!hasCard && !hasRelic) {
    state.awaitingBattleLootChoice = false;
    state.pendingBattleLootSourceType = null;
    if (els.selectionFrameActions) els.selectionFrameActions.innerHTML = '';
    if (els.selectionFrameHint) els.selectionFrameHint.textContent = '';
    startNextEncounter();
    return;
  }
  openBattleLootFrame();
}

function openRelicRewardPicker() {
  if (!els.selectionFramePicker || !els.selectionFramePickerGrid || !els.selectionFramePickerTitle) return;
  const relicId = state.pendingRelicRewardId;
  if (!relicId) {
    tryResolveBattleLootFlow();
    return;
  }
  const r = RELIC_DEFS[relicId];
  els.selectionFramePicker.hidden = false;
  els.selectionFramePickerTitle.textContent = '遗物奖励';
  els.selectionFramePickerGrid.innerHTML = '';

  const takeBtn = document.createElement('button');
  takeBtn.type = 'button';
  takeBtn.className = 'btn primary';
  takeBtn.textContent = `领取 ${r?.icon ?? '◆'} ${r?.name ?? relicId}`;
  takeBtn.addEventListener('click', () => {
    consumePendingRelicReward(true);
    tryResolveBattleLootFlow();
  });
  els.selectionFramePickerGrid.appendChild(takeBtn);

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'btn';
  skipBtn.textContent = '跳过遗物';
  skipBtn.addEventListener('click', () => {
    consumePendingRelicReward(false);
    tryResolveBattleLootFlow();
  });
  els.selectionFramePickerGrid.appendChild(skipBtn);
}

function openBattleLootFrame() {
  state.awaitingBattleLootChoice = true;
  if (!els.selectionFrame || !els.selectionFrameActions) return;
  if (els.selectionFrameTitle) els.selectionFrameTitle.textContent = '战斗结算奖励';
  if (els.selectionFrameHint) els.selectionFrameHint.textContent = '可先选卡牌或遗物，也可直接跳过。';
  els.selectionFrameActions.innerHTML = '';
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';

  const hasCard = state.awaitingCardRewardChoice && state.pendingCardRewardChoices.length > 0;
  const hasRelic = !!state.pendingRelicRewardId;

  if (hasCard) {
    const cardBtn = document.createElement('button');
    cardBtn.type = 'button';
    cardBtn.className = 'btn';
    cardBtn.textContent = '卡牌奖励';
    cardBtn.addEventListener('click', () => {
      openCardRewardOverlay(state.pendingBattleLootSourceType || 'normal');
    });
    els.selectionFrameActions.appendChild(cardBtn);
  }

  if (hasRelic) {
    const r = RELIC_DEFS[state.pendingRelicRewardId];
    const relicBtn = document.createElement('button');
    relicBtn.type = 'button';
    relicBtn.className = 'btn';
    relicBtn.textContent = `遗物奖励：${r?.icon ?? '◆'} ${r?.name ?? state.pendingRelicRewardId}`;
    relicBtn.addEventListener('click', () => {
      openRelicRewardPicker();
    });
    els.selectionFrameActions.appendChild(relicBtn);
  }

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'btn';
  skipBtn.textContent = '全部跳过';
  skipBtn.addEventListener('click', () => {
    if (state.awaitingCardRewardChoice) {
      state.awaitingCardRewardChoice = false;
      state.pendingCardRewardChoices = [];
    }
    if (state.pendingRelicRewardId) consumePendingRelicReward(false);
    tryResolveBattleLootFlow();
  });
  els.selectionFrameActions.appendChild(skipBtn);

  els.selectionFrame.hidden = false;
}

function queueEventRewards({ relicId = null, cardTemplateIds = [] } = {}) {
  state.pendingBattleLootSourceType = 'normal';
  if (relicId) state.pendingRelicRewardId = relicId;
  if (Array.isArray(cardTemplateIds) && cardTemplateIds.length > 0) {
    state.pendingCardRewardChoices = cardTemplateIds
      .map((id) => ({ templateId: id, upgraded: false }))
      .filter((x) => !!TEMPLATES[x.templateId]);
    state.awaitingCardRewardChoice = state.pendingCardRewardChoices.length > 0;
  } else {
    state.awaitingCardRewardChoice = false;
    state.pendingCardRewardChoices = [];
  }
  state.awaitingBattleLootChoice = !!state.pendingRelicRewardId || state.awaitingCardRewardChoice;
  if (state.awaitingBattleLootChoice) {
    openBattleLootFrame();
    refreshUI();
  } else {
    startNextEncounter();
  }
}

function getAppleBorerTargetIndex(preferred = null) {
  return getAppleBorerTargetIndexSystem({ state, preferred });
}

function createAppleBorerActionBag(actions = null) {
  return createAppleBorerActionBagSystem({ shuffleFn: shuffle, actions });
}

function resetAppleBorerState(inBattle = false, enemyId = state.activeEnemyId, def = ENEMIES[enemyId]) {
  return resetAppleBorerStateSystem({ state, inBattle, shuffleFn: shuffle, enemyId, def });
}

function beginCardDrag(handIndex, e) {
  state.pendingAttackDragHandIndex = handIndex;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(handIndex));
  }
}

function finishCardDrag() {
  state.pendingAttackDragHandIndex = null;
}

function renderAppleBorerUnits() {
  if (!els.enemyHitWrap) return;
  els.enemyHitWrap.classList.toggle('enemy-hit-wrap--multi', isAppleBorerEncounter());
  if (!isAppleBorerEncounter()) {
    els.enemyHitWrap.innerHTML = '<div class="enemy-shard-host" id="enemy-shard-host" aria-hidden="true"></div><div class="cube cube--enemy" id="enemy-cube"></div>';
    els.enemyShardHost = document.getElementById('enemy-shard-host');
    const cube = document.getElementById('enemy-cube');
    if (cube) {
      cube.addEventListener('dragover', (e) => {
        if (state.pendingAttackDragHandIndex === null) return;
        e.preventDefault();
      });
      cube.addEventListener('drop', (e) => {
        e.preventDefault();
        if (state.pendingAttackDragHandIndex === null) return;
        const handIndex = state.pendingAttackDragHandIndex;
        finishCardDrag();
        if (playFromHand(handIndex, null, true)) refreshUI();
      });
    }
    return;
  }
  els.enemyHitWrap.innerHTML = '';
  const group = document.createElement('div');
  group.className = 'enemy-pair';
  const isGoblin = state.activeEnemyId === 'goblinGang';
  if (isGoblin) {
    group.style.gap = '0.45rem';
  }
  state.appleBorerUnitsHp.forEach((hp, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'enemy-unit-wrap';
    const intentHtml = buildMultiUnitIntentHtmlSystem({
      state,
      ENEMIES,
      applyEnemyOutgoingDamage,
      createAppleBorerActionBag,
      unitIndex: idx,
    });
    const intent = document.createElement('span');
    intent.className = 'enemy-unit-intent';
    intent.innerHTML = intentHtml;
    wrap.appendChild(intent);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'enemy-unit';
    if (hp <= 0) btn.classList.add('enemy-unit--dead');
    const maxHp = Math.max(1, Number(state.appleBorerUnitsMaxHp?.[idx] ?? 30));
    const pct = Math.max(0, Math.min(100, (Math.max(0, hp) / maxHp) * 100));
    const kind = state.appleBorerUnitKinds?.[idx];
    const label = !isGoblin
      ? `蛀虫 ${idx + 1}`
      : kind === 'trickster'
        ? `调皮地精 ${idx + 1}`
        : kind === 'taunter'
          ? `嘲讽地精 ${idx + 1}`
          : `魔法地精 ${idx + 1}`;
    const buffs = [];
    const str = Number(state.appleBorerUnitsStrength?.[idx] ?? 0);
    const weak = Number(state.appleBorerUnitsWeakTurns?.[idx] ?? 0);
    const vuln = Number(state.appleBorerUnitsVulnerableTurns?.[idx] ?? 0);
    if (str > 0) buffs.push(`力${str}`);
    if (weak > 0) buffs.push(`虚${weak}`);
    if (vuln > 0) buffs.push(`易${vuln}`);
    const buffText = buffs.length > 0 ? buffs.join(' ') : '—';
    btn.innerHTML = `
      <span class="enemy-unit-name">${label}</span>
      <div class="enemy-unit-hpbar" aria-hidden="true">
        <div class="enemy-unit-hpbar-inner" style="width: ${pct}%"></div>
      </div>
      <span class="enemy-unit-hp">${Math.max(0, hp)}/${maxHp}</span>
      <span class="enemy-unit-hp">${buffText}</span>
    `;
    btn.addEventListener('dragover', (e) => {
      if (!isAppleBorerEncounter() || hp <= 0) return;
      e.preventDefault();
      btn.classList.add('enemy-unit--dragover');
    });
    btn.addEventListener('dragleave', () => btn.classList.remove('enemy-unit--dragover'));
    btn.addEventListener('drop', (e) => {
      e.preventDefault();
      btn.classList.remove('enemy-unit--dragover');
      if (state.pendingAttackDragHandIndex === null) return;
      const handIndex = state.pendingAttackDragHandIndex;
      finishCardDrag();
      if (playFromHand(handIndex, idx, true)) refreshUI();
    });
    wrap.appendChild(btn);
    group.appendChild(wrap);
  });
  els.enemyHitWrap.appendChild(group);
}

/**
 * 抽牌堆：按类型归纳，不暴露真实抽序。
 * @param {CardInstance[]} cards
 * @returns {{ name: string, kind: CardKind, count: number }[]}
 */
function groupDrawPileForDisplay(cards) {
  return groupDrawPileForDisplaySystem(cards, KIND_ORDER_FOR_DECK_VIEW);
}

/**
 * @param {'draw' | 'discard' | 'exhaust'} which
 */
function fillPileOverlayList(which) {
  const ul = els.pileOverlayList;
  if (!ul) return;
  ul.innerHTML = '';
  if (which === 'draw') {
    const rows = groupDrawPileForDisplay(state.drawPile);
    if (rows.length === 0) {
      const li = document.createElement('li');
      li.textContent = '（空）';
      ul.appendChild(li);
      return;
    }
    rows.forEach((row) => {
      const li = document.createElement('li');
      li.textContent = `${row.name} ×${row.count}`;
      ul.appendChild(li);
    });
    return;
  }
  const cards = which === 'discard' ? state.discardPile.slice().reverse() : state.exhaustPile.slice().reverse();
  if (cards.length === 0) {
    const li = document.createElement('li');
    li.textContent = '（空）';
    ul.appendChild(li);
    return;
  }
  cards.forEach((c) => {
    const li = document.createElement('li');
    li.textContent = c.name;
    ul.appendChild(li);
  });
}

/**
 * @param {'draw' | 'discard' | 'exhaust'} which
 */
function openPileOverlay(which) {
  if (state.phase !== 'playing') return;
  if (!els.pileOverlay || !els.pileOverlayTitle) return;
  pileOverlayView = which;
  els.pileOverlayTitle.textContent = getPileOverlayTitleSystem(which);
  fillPileOverlayList(which);
  els.pileOverlay.hidden = false;
}

function closePileOverlay() {
  pileOverlayView = null;
  if (els.pileOverlay) els.pileOverlay.hidden = true;
}

/**
 * 牌库检视：按开局牌组顺序展示每张牌（与手牌同款样式，不可操作）。
 */
function fillCollectionGrid() {
  const grid = els.collectionGrid;
  if (!grid) return;
  grid.innerHTML = '';
  let filterMount = document.getElementById('collection-card-filter');
  if (!filterMount) {
    filterMount = document.createElement('div');
    filterMount.id = 'collection-card-filter';
    const parent = grid.parentElement;
    if (parent) parent.insertBefore(filterMount, grid);
  }
  renderCardFilterControls({
    mountEl: filterMount,
    filterState: collectionCardFilterState,
    onChange: () => fillCollectionGrid(),
  });

  const items = state.runDeck.map((runCard) => {
    const base = TEMPLATES[runCard.templateId];
    const t = runCard.upgraded ? instantiateRunDeckCard(runCard) : base;
    return { runCard, card: t };
  });
  const filteredItems = filterAndSortCardItems({
    items,
    filterState: collectionCardFilterState,
    getCard: (x) => x.card,
  });
  filteredItems.forEach(({ runCard, card: t }) => {
    if (!t) return;
    const wrap = document.createElement('div');
    wrap.className = 'collection-card-wrap';
    const div = document.createElement('div');
    div.className = buildCardClassName(t, { view: true });
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = renderCardFaceHtml(t, { costClass: 'card-cost card-cost--view' });
    wrap.appendChild(div);
    if (!runCard.upgraded) {
      wrap.addEventListener('mouseenter', () => showCampUpgradePreview(runCard));
      wrap.addEventListener('mouseleave', () => hideCampUpgradePreview());
    }
    grid.appendChild(wrap);
  });
}

function openCollectionOverlay() {
  closePileOverlay();
  fillCollectionGrid();
  if (els.collectionOverlay) els.collectionOverlay.hidden = false;
}

function closeCollectionOverlay() {
  if (els.collectionOverlay) els.collectionOverlay.hidden = true;
  hideCampUpgradePreview();
}

function fillDebugRewardPoolGrid() {
  const grid = els.debugRewardPoolGrid;
  if (!grid) return;
  grid.innerHTML = '';

  const createSection = (titleText, hintText = '') => {
    const section = document.createElement('section');
    section.className = 'debug-section';
    const title = document.createElement('h4');
    title.className = 'debug-section-title';
    title.textContent = titleText;
    section.appendChild(title);
    if (hintText) {
      const hint = document.createElement('p');
      hint.className = 'debug-section-hint';
      hint.textContent = hintText;
      section.appendChild(hint);
    }
    const body = document.createElement('div');
    body.className = 'debug-btn-grid';
    section.appendChild(body);
    grid.appendChild(section);
    return { section, body };
  };

  const quick = createSection('快速调试');
  const addCoinsBtn = document.createElement('button');
  addCoinsBtn.type = 'button';
  addCoinsBtn.className = 'btn';
  addCoinsBtn.textContent = '+100 金币';
  addCoinsBtn.addEventListener('click', () => {
    state.coins += 100;
    log('[DEBUG] 已获得 100 金币。');
    refreshUI();
  });
  quick.body.appendChild(addCoinsBtn);
  const fullHealBtn = document.createElement('button');
  fullHealBtn.type = 'button';
  fullHealBtn.className = 'btn';
  fullHealBtn.textContent = '回复至满血';
  fullHealBtn.addEventListener('click', () => {
    state.playerHp = state.playerMaxHp;
    log('[DEBUG] 已回复至满血。');
    refreshUI();
  });
  quick.body.appendChild(fullHealBtn);

  const floorTypes = getRunFloorTypes();
  const floorIndex = Number(state.nextEncounterFloor ?? 0);
  const floorType = floorTypes[floorIndex];
  const floorLabel = classifyFloorTypeSystem({ floorType });
  const forcedMap = state.debugForcedEnemyByFloor || {};
  const setForcedEnemy = (enemyId) => {
    forcedMap[floorIndex] = enemyId;
    state.debugForcedEnemyByFloor = forcedMap;
    log(`[DEBUG] 第 ${floorIndex + 1} 层已指定敌人：${ENEMIES[enemyId]?.name ?? enemyId}。`);
    fillDebugRewardPoolGrid();
    refreshUI();
  };
  const clearForcedEnemy = () => {
    delete forcedMap[floorIndex];
    state.debugForcedEnemyByFloor = forcedMap;
    log(`[DEBUG] 第 ${floorIndex + 1} 层已清除指定敌人。`);
    fillDebugRewardPoolGrid();
    refreshUI();
  };
  const canSetByFloor = floorType === 'normal' || floorType === 'elite' || floorType === 'boss';
  const inEventBattle = !!state.eventBattleTag;
  const canSetEnemy = canSetByFloor && !inEventBattle;
  const enemySection = createSection(
    '本层遇敌指定',
    canSetEnemy
    ? `当前节点：第 ${floorIndex + 1} 层（${floorLabel}）。可指定本层遇敌。`
    : `当前节点：第 ${floorIndex + 1} 层（${floorLabel}）。仅普通/精英/BOSS 节点可指定，事件节点（含事件战）不可用。`,
  );
  if (canSetEnemy) {
    const pool = floorType === 'boss'
      ? BOSS_ENEMY_IDS
      : floorType === 'elite'
        ? ELITE_ENEMY_IDS
        : NORMAL_ENEMY_IDS;
    pool.forEach((enemyId) => {
      const def = ENEMIES[enemyId];
      if (!def) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      const active = forcedMap[floorIndex] === enemyId;
      btn.textContent = `${active ? '✓ ' : ''}${def.name}`;
      btn.addEventListener('click', () => setForcedEnemy(enemyId));
      enemySection.body.appendChild(btn);
    });
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn';
    clearBtn.textContent = '清除本层指定敌人';
    clearBtn.disabled = !forcedMap[floorIndex];
    clearBtn.addEventListener('click', clearForcedEnemy);
    enemySection.body.appendChild(clearBtn);
  }

  const relicSection = createSection('遗物池');
  const ownedRelics = new Set((state.relics || []).map((r) => r.id));
  const relicIds = Object.keys(RELIC_DEFS).sort((a, b) => {
    const ra = RELIC_DEFS[a];
    const rb = RELIC_DEFS[b];
    const order = { common: 0, uncommon: 1, rare: 2 };
    const ro = (order[ra?.rarity ?? 'common'] ?? 9) - (order[rb?.rarity ?? 'common'] ?? 9);
    if (ro !== 0) return ro;
    return (ra?.name ?? a).localeCompare(rb?.name ?? b, 'zh-CN');
  });
  relicIds.forEach((relicId) => {
    const relic = RELIC_DEFS[relicId];
    if (!relic) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = `${relic.icon ?? '◆'} ${relic.name}`;
    btn.disabled = ownedRelics.has(relicId);
    if (btn.disabled) btn.title = '已拥有';
    btn.addEventListener('click', () => {
      const before = state.relics.length;
      addRelicById(relicId);
      if (state.relics.length > before) {
        log(`[DEBUG] 已获得遗物「${relic.name}」。`);
        refreshUI();
        fillDebugRewardPoolGrid();
      }
    });
    relicSection.body.appendChild(btn);
  });

  const selectedCharacter = CHARACTER_DEFS[state.selectedCharacterId];
  const selectedCharacterName = selectedCharacter?.name ?? '未选择角色';
  const cardSection = createSection('卡牌池', `当前角色：${selectedCharacterName}。仅展示该角色可获得的奖励牌。`);
  cardSection.section.classList.add('debug-section--cards');
  const filterMount = document.createElement('div');
  filterMount.className = 'card-filter-host';
  cardSection.section.insertBefore(filterMount, cardSection.body);
  renderCardFilterControls({
    mountEl: filterMount,
    filterState: debugCardFilterState,
    onChange: () => fillDebugRewardPoolGrid(),
  });
  cardSection.body.classList.add('debug-card-grid');
  const starterIds = new Set((CHARACTER_DEFS[state.selectedCharacterId]?.starterDeck || []).filter(Boolean));
  const debugPoolIds = Array.from(new Set([
    ...state.runRewardPoolTemplateIds,
    ...Array.from(starterIds),
  ]));
  const characterScopedPool = debugPoolIds
    .slice()
    .map((templateId) => ({
      templateId,
      card: TEMPLATES[templateId],
    }))
    .filter(({ card }) => {
      if (!card) return false;
      const exclusive = card.exclusiveToCharacterId ?? null;
      if (!exclusive) return true;
      return exclusive === state.selectedCharacterId;
    });

  const sortedItems = filterAndSortCardItems({
    items: characterScopedPool,
    filterState: debugCardFilterState,
    getCard: (x) => x.card,
  });

  sortedItems.forEach(({ templateId, card: template }) => {
    if (!template) return;
    const card = instantiateCardSystem(template);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = buildCardClassName(card);
    btn.title = '点击加入本局牌组';
    btn.innerHTML = renderCardFaceHtml(card);
    btn.addEventListener('click', () => {
      state.runDeck.push({
        uid: `${templateId}-run-${Math.random().toString(36).slice(2, 10)}`,
        templateId,
        upgraded: false,
      });
      log(`[DEBUG] 已将「${template.name}」加入本局牌组。`);
      refreshUI();
    });
    cardSection.body.appendChild(btn);
  });
}

function openDebugRewardPoolOverlay() {
  if (!state.debugMode) return;
  closePileOverlay();
  fillDebugRewardPoolGrid();
  if (els.debugRewardPoolOverlay) els.debugRewardPoolOverlay.hidden = false;
}

function closeDebugRewardPoolOverlay() {
  if (els.debugRewardPoolOverlay) els.debugRewardPoolOverlay.hidden = true;
}

function closeCampOverlay(force = false) {
  if (state.inCamp && !force) return;
  state.inCamp = false;
  if (els.selectionFrameActions) els.selectionFrameActions.innerHTML = '';
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
  hideCampUpgradePreview();
}

function closeBlessingOverlay(force = false) {
  if (state.inBlessing && !force) return;
  state.inBlessing = false;
  if (els.selectionFrameActions) els.selectionFrameActions.innerHTML = '';
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
  hideCampUpgradePreview();
}

function pickRandomBlessings(count) {
  return pickRandomBlessingsSystem({
    blessingPool: BLESSING_POOL,
    count,
    shuffleFn: shuffle,
  });
}

function takeDamageOutOfCombat(amount) {
  return takeDamageOutOfCombatSystem({
    state,
    amount,
    minHp: 1,
  });
}

function addRelicById(relicId) {
  return addRelicByIdSystem({ relicId, state, RELIC_DEFS });
}

function applyPlayerDebuff(type, amount) {
  return applyIncomingPlayerDebuffWithRelicSystem({ state, type, amount, logFn: log });
}

function buildShopCardOffers() {
  return buildShopCardOffersSystem({ state, TEMPLATES, PROBABILITY_CONFIG, SHOP_CONFIG });
}

function buildShopRelicOffers() {
  return buildShopRelicOffersSystem({ state, RELIC_DEFS, PROBABILITY_CONFIG, SHOP_CONFIG });
}

function getShopServiceCost(kind) {
  return getShopServiceCostSystem({ kind, state, SHOP_CONFIG });
}

const { openShopOverlay, closeShopOverlay, leaveShopToNextNode } = createShopUI({
  state,
  els,
  SHOP_CONFIG,
  MAP_FLOOR_COUNT,
  buildShopCardOffers,
  buildShopRelicOffers,
  getShopServiceCost,
  instantiateRunDeckCard,
  buildCardClassName,
  renderCardFaceHtml,
  RELIC_DEFS,
  TEMPLATES,
  addRelicById,
  hideCampUpgradePreview,
  showCampUpgradePreview,
  startNextEncounter: () => startNextEncounter(),
  refreshUI,
  log,
});

/**
 * @param {'upgrade' | 'purge'} mode
 * @param {() => void} onDone
 * @param {{ count?: number }} [options]
 */
function openBlessingDeckPicker(mode, onDone, options = {}) {
  if (!els.selectionFramePicker || !els.selectionFramePickerGrid || !els.selectionFramePickerTitle) return;
  let remaining = Math.max(1, Number(options.count ?? 1));
  const finishIfDone = () => {
    if (remaining <= 0) {
      onDone();
      return true;
    }
    return false;
  };

  const renderPicker = () => {
    els.selectionFramePicker.hidden = false;
    els.selectionFramePickerGrid.innerHTML = '';
    els.selectionFramePickerTitle.textContent = `${
      mode === 'upgrade' ? '选择一张牌升级' : '选择一张牌删除'
    }（剩余 ${remaining} 次）`;
    let candidateCount = 0;
    state.runDeck.forEach((runCard) => {
    if (mode === 'upgrade' && runCard.upgraded) return;
      candidateCount += 1;
    const c = instantiateRunDeckCard(runCard);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = buildCardClassName(c);
    btn.innerHTML = renderCardFaceHtml(c);
    btn.addEventListener('click', () => {
      if (mode === 'upgrade') runCard.upgraded = true;
      else state.runDeck = state.runDeck.filter((x) => x.uid !== runCard.uid);
      remaining -= 1;
      if (finishIfDone()) return;
      renderPicker();
    });
    if (mode === 'upgrade') {
      btn.addEventListener('mouseenter', () => {
        showCampUpgradePreview(runCard);
      });
      btn.addEventListener('mouseleave', () => {
        hideCampUpgradePreview();
      });
    }
    els.selectionFramePickerGrid.appendChild(btn);
    });
    if (candidateCount <= 0) {
      // 没有可选目标时直接结束，避免 UI 卡在空列表。
      onDone();
    }
  };
  renderPicker();
}

function applyBlessing(blessing) {
  return applyBlessingSystem({
    blessing,
    state,
    log,
    takeDamageOutOfCombat,
    addRelicById,
    openBlessingDeckPicker,
    closeBlessingOverlay,
    startNextEncounter,
  });
}

function openBlessingOverlay() {
  state.inBlessing = true;
  if (!els.selectionFrame || !els.selectionFrameActions) return;
  if (els.selectionFrameTitle) els.selectionFrameTitle.textContent = '开局祝福 ✨';
  if (els.selectionFrameHint) els.selectionFrameHint.textContent = '从随机祝福池中选择一个强化，随后开始你的旅程。';
  els.selectionFrameActions.innerHTML = '';
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
  const picks = pickRandomBlessings(3);
  picks.forEach((blessing) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = `${blessing.name}：${blessing.desc}`;
    btn.addEventListener('click', () => {
      applyBlessing(blessing);
      log(`祝福：获得「${blessing.name}」。`);
      if (els.selectionFramePicker && !els.selectionFramePicker.hidden) {
        refreshUI();
        return;
      }
      closeBlessingOverlay(true);
      state.nextEncounterFloor = 1;
      startNextEncounter();
    });
    els.selectionFrameActions.appendChild(btn);
  });
  els.selectionFrame.hidden = false;
}

function openCampOverlay() {
  state.inCamp = true;
  if (els.selectionFrameTitle) els.selectionFrameTitle.textContent = '篝火休息区 🔥';
  if (els.selectionFrameHint) els.selectionFrameHint.textContent = '选择一个选项后将前往下一节点。';
  if (els.selectionFrameActions) {
    els.selectionFrameActions.innerHTML = '';
    const mkBtn = (text, cls, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = cls;
      b.textContent = text;
      b.addEventListener('click', onClick);
      els.selectionFrameActions.appendChild(b);
    };
    mkBtn('休息（回复 25% 最大生命）', 'btn primary', () => {
      const heal = Math.max(1, Math.floor(state.playerMaxHp * CAMP_HEAL_RATIO));
      const before = state.playerHp;
      state.playerHp = Math.min(state.playerMaxHp, state.playerHp + heal);
      log(`篝火：休息回复 ${state.playerHp - before} 点生命。`);
      closeCampOverlay(true);
      state.nextEncounterFloor = Math.min(MAP_FLOOR_COUNT, state.nextEncounterFloor + 1);
      startNextEncounter();
    });
    mkBtn('升级（选择一张牌升级）', 'btn', () => openCampPicker('upgrade'));
    mkBtn('清理（移除一张牌）', 'btn', () => openCampPicker('purge'));
  }
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
  if (els.selectionFrame) els.selectionFrame.hidden = false;
  hideCampUpgradePreview();
}

/**
 * @param {RunDeckCard} runCard
 */
function showCampUpgradePreview(runCard) {
  const panel = els.upgradePreviewFloat;
  const left = els.upgradePreviewBefore;
  const right = els.upgradePreviewAfter;
  if (!panel || !left || !right) return;
  const before = instantiateRunDeckCard({ ...runCard, upgraded: false });
  const after = instantiateRunDeckCard({ ...runCard, upgraded: true });
  left.innerHTML = renderCardViewHtml(before);
  right.innerHTML = renderCardViewHtml(after);
  panel.hidden = false;
}

function hideCampUpgradePreview() {
  if (els.upgradePreviewFloat) els.upgradePreviewFloat.hidden = true;
  if (els.upgradePreviewBefore) els.upgradePreviewBefore.innerHTML = '';
  if (els.upgradePreviewAfter) els.upgradePreviewAfter.innerHTML = '';
}

function closeDiscardOverlay(force = false) {
  if (state.awaitingHandDiscard && !force) return;
  state.awaitingHandDiscard = false;
  if (els.discardOverlay) els.discardOverlay.hidden = true;
  if (els.discardGrid) els.discardGrid.innerHTML = '';
}

function openHandCardPickerOverlay({
  hintText,
  candidateIndexes,
  onPick,
  titleText = '选择手牌',
}) {
  if (!els.discardOverlay || !els.discardGrid || !els.discardHint) return false;
  const candidates = Array.isArray(candidateIndexes) ? candidateIndexes.filter((i) => Number.isInteger(i) && i >= 0 && i < state.hand.length) : [];
  if (candidates.length <= 0) return false;
  const titleEl = document.getElementById('discard-title');
  if (titleEl) titleEl.textContent = titleText;
  state.awaitingHandDiscard = true;
  els.discardGrid.innerHTML = '';
  els.discardHint.textContent = hintText;
  candidates.forEach((idx) => {
    const card = state.hand[idx];
    if (!card) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = buildCardClassName(card);
    btn.innerHTML = renderCardFaceHtml(card);
    btn.addEventListener('click', () => {
      closeDiscardOverlay(true);
      if (typeof onPick === 'function') onPick(idx, card);
      refreshUI();
    });
    els.discardGrid.appendChild(btn);
  });
  els.discardOverlay.hidden = false;
  return true;
}

function pickRandomEventId() {
  return pickRandomEventIdSystem({
    normalPool: EVENT_POOLS.normal,
    rarePool: EVENT_POOLS.rare,
  });
}

function upgradeRandomRunDeckCard() {
  return upgradeRandomRunDeckCardSystem({
    state,
    TEMPLATES,
    rng: Math.random,
  });
}

const { openEventOverlay, closeEventOverlay, leaveEventToNextNode } = createEventUI({
  state,
  els,
  EVENT_IDS,
  EVENT_DEFS,
  getEventTitle,
  pickRandomEventId,
  prepareEventState: prepareEventStateSystem,
  applyBlessingCoinDamageEvent: applyBlessingCoinDamageEventSystem,
  applySnakeTradeOption: applySnakeTradeOptionSystem,
  buildWellDescription: buildWellDescriptionSystem,
  resolveWellAttempt: resolveWellAttemptSystem,
  resolveThornChestAttempt: resolveThornChestAttemptSystem,
  takeDamageOutOfCombat,
  upgradeRandomRunDeckCard,
  queueEventRewards,
  startBattleAgainstEnemy: (enemyId, resetPlayerHp, battleFloorIndex, exitNextEncounterFloorOverride) =>
    startBattleAgainstEnemy(enemyId, resetPlayerHp, battleFloorIndex, exitNextEncounterFloorOverride),
  startNextEncounter: () => startNextEncounter(),
  refreshUI,
  log,
});

function openCharacterSelectOverlay() {
  state.inCharacterSelect = true;
  if (els.selectionFrameTitle) els.selectionFrameTitle.textContent = '选择角色';
  if (els.selectionFrameHint) els.selectionFrameHint.textContent = '在进入第一间祝福前，先选择本局角色。';
  if (els.selectionFrameActions) {
    els.selectionFrameActions.innerHTML = '';
    const mkBtn = (label, cls, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `btn ${cls}`.trim();
      b.textContent = label;
      b.addEventListener('click', onClick);
      els.selectionFrameActions.appendChild(b);
    };
    mkBtn('🟥 战士', 'primary', () => {
      applyCharacterSelection(CHARACTER_IDS.WARRIOR);
      refreshUI();
    });
    mkBtn('🟩 自然法师', '', () => {
      applyCharacterSelection(CHARACTER_IDS.NATURE_MAGE);
      refreshUI();
    });
  }
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFrame) els.selectionFrame.hidden = false;
}

function closeCharacterSelectOverlay(force = false) {
  if (state.inCharacterSelect && !force) return;
  state.inCharacterSelect = false;
  if (els.selectionFrameActions) els.selectionFrameActions.innerHTML = '';
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
}

function applyCharacterSelection(characterId) {
  const def = CHARACTER_DEFS[characterId];
  if (!def) return;
  if (def.comingSoon) {
    log(`${def.name}暂未开放，当前请先使用战士。`);
    return;
  }
  state.selectedCharacterId = characterId;
  state.runDeck = createRunDeckFromTemplateIds(def.starterDeck);
  state.runRewardPoolTemplateIds = buildRewardPoolTemplateIdsSystem({
    templateIds: ALL_TEMPLATE_IDS,
    excludedTemplateIds: def.starterDeck,
    templates: TEMPLATES,
    selectedCharacterId: characterId,
  });
  closeCharacterSelectOverlay(true);
  log(`已选择角色：${def.name}。`);
  startNextEncounter();
}

function closeCardRewardOverlay() {
  if (els.rewardOverlay) els.rewardOverlay.hidden = true;
  if (els.rewardChoices) els.rewardChoices.innerHTML = '';
}

function closeResultOverlays() {
  if (els.victoryOverlay) els.victoryOverlay.hidden = true;
  if (els.defeatOverlay) els.defeatOverlay.hidden = true;
}

function resetPendingBattleLootState() {
  state.awaitingBattleLootChoice = false;
  state.pendingBattleLootSourceType = null;
  state.pendingRelicRewardId = null;
}

function bindUpgradePreviewDrag() {
  const panel = els.upgradePreviewFloat;
  const head = els.upgradePreviewHead;
  if (!panel || !head) return;
  let dragging = false;
  let dx = 0;
  let dy = 0;
  const onMove = (e) => {
    if (!dragging) return;
    const cx = e.clientX;
    const cy = e.clientY;
    panel.style.left = `${cx - dx}px`;
    panel.style.top = `${cy - dy}px`;
    panel.style.right = 'auto';
  };
  const onUp = () => {
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  head.addEventListener('mousedown', (e) => {
    const rect = panel.getBoundingClientRect();
    dx = e.clientX - rect.left;
    dy = e.clientY - rect.top;
    dragging = true;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function openCardRewardOverlay(sourceType) {
  const rewardChoices = generateCardRewardChoicesSystem({
    rewardPoolTemplateIds: state.runRewardPoolTemplateIds,
    templates: TEMPLATES,
    sourceType,
    rng: Math.random,
  });
  if (state.pendingCardRewardChoices.length <= 0) {
    state.pendingCardRewardChoices = rewardChoices;
    state.awaitingCardRewardChoice = rewardChoices.length > 0;
  }
  const visibleChoices = state.pendingCardRewardChoices;
  if (!els.rewardOverlay || !els.rewardChoices || visibleChoices.length <= 0) {
    closeCardRewardOverlay();
    tryResolveBattleLootFlow();
    return;
  }
  if (els.rewardTitle) {
    els.rewardTitle.textContent = sourceType === 'boss'
      ? 'BOSS 奖励：稀有三选一'
      : sourceType === 'elite'
        ? '精英奖励：高稀有三选一'
        : '战斗奖励：三选一';
  }
  if (els.rewardHint) {
    els.rewardHint.textContent = '选择一张加入本局牌库。';
  }
  els.rewardChoices.innerHTML = '';
  visibleChoices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const runCard = {
      uid: `${choice.templateId}-preview`,
      templateId: choice.templateId,
      upgraded: !!choice.upgraded,
    };
    const card = instantiateRunDeckCard(runCard);
    btn.className = buildCardClassName(card);
    btn.innerHTML = renderCardFaceHtml(card);
    btn.addEventListener('click', () => {
      state.runDeck.push({
        uid: `${choice.templateId}-run-${Math.random().toString(36).slice(2, 10)}`,
        templateId: choice.templateId,
        upgraded: !!choice.upgraded,
      });
      log(`奖励：获得「${card.name}」。`);
      state.awaitingCardRewardChoice = false;
      state.pendingCardRewardChoices = [];
      closeCardRewardOverlay();
      tryResolveBattleLootFlow();
    });
    els.rewardChoices.appendChild(btn);
  });
  els.rewardOverlay.hidden = false;
}

function openDiscardOverlay(count) {
  if (!els.discardOverlay || !els.discardGrid || !els.discardHint) return;
  if (state.hand.length <= 0 || count <= 0) return;
  const titleEl = document.getElementById('discard-title');
  if (titleEl) titleEl.textContent = '选择弃牌';
  state.awaitingHandDiscard = true;
  els.discardGrid.innerHTML = '';
  els.discardHint.textContent = `请选择 ${count} 张手牌弃置。`;
  let remaining = count;
  const render = () => {
    els.discardGrid.innerHTML = '';
    state.hand.forEach((card, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = buildCardClassName(card);
      btn.innerHTML = renderCardFaceHtml(card);
      btn.addEventListener('click', () => {
        const [picked] = state.hand.splice(idx, 1);
        if (picked) state.discardPile.push(picked);
        remaining -= 1;
        if (remaining <= 0 || state.hand.length <= 0) {
          closeDiscardOverlay(true);
          refreshUI();
          return;
        }
        els.discardHint.textContent = `请选择 ${remaining} 张手牌弃置。`;
        render();
      });
      els.discardGrid.appendChild(btn);
    });
  };
  render();
  els.discardOverlay.hidden = false;
}

/**
 * @param {'upgrade' | 'purge'} mode
 */
function openCampPicker(mode) {
  if (!els.selectionFramePicker || !els.selectionFramePickerGrid || !els.selectionFramePickerTitle) return;
  els.selectionFramePicker.hidden = false;
  els.selectionFramePickerGrid.innerHTML = '';
  if (mode === 'upgrade') {
    els.selectionFramePickerTitle.textContent = '选择一张可升级的牌';
  } else {
    els.selectionFramePickerTitle.textContent = '选择一张牌从本局牌库中移除';
  }
  hideCampUpgradePreview();
  state.runDeck.forEach((runCard) => {
    if (mode === 'upgrade' && runCard.upgraded) return;
    const card = instantiateRunDeckCard(runCard);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = buildCardClassName(card);
    btn.innerHTML = renderCardFaceHtml(card);
    btn.addEventListener('click', () => {
      if (mode === 'upgrade') {
        runCard.upgraded = true;
        log(`篝火：升级了「${TEMPLATES[runCard.templateId].name}」。`);
      } else {
        state.runDeck = state.runDeck.filter((c) => c.uid !== runCard.uid);
        log(`篝火：清理了「${TEMPLATES[runCard.templateId].name}」。`);
      }
      closeCampOverlay(true);
      state.nextEncounterFloor = Math.min(MAP_FLOOR_COUNT, state.nextEncounterFloor + 1);
      startNextEncounter();
    });
    if (mode === 'upgrade') {
      btn.addEventListener('mouseenter', () => {
        showCampUpgradePreview(runCard);
      });
      btn.addEventListener('mouseleave', () => {
        hideCampUpgradePreview();
      });
    }
    els.selectionFramePickerGrid.appendChild(btn);
  });
}

function syncPileOverlayIfOpen() {
  if (pileOverlayView) fillPileOverlayList(pileOverlayView);
}

/**
 * 多段攻击：按段依次播放红光与受击（不重叠）。
 * @param {number} hitCount
 */
function runMultiHitAttackEffects(hitCount) {
  for (let i = 0; i < hitCount; i++) {
    setTimeout(() => {
      if (state.phase !== 'playing') return;
      flashPlayerAura('attack');
      playEnemyHitFeedback();
    }, i * MULTI_HIT_EFFECT_GAP_MS);
  }
}

/**
 * 单次攻击伤害（打击等，不含多段）。
 * @param {CardInstance} played
 */
function resolveStrikeLikeDamage(played) {
  return resolveStrikeLikeDamageSystem({ played, state, STRIKE_BASE_DAMAGE });
}

/**
 * 连斩等多段：每段基础 + 力量。
 * @param {CardInstance} played
 */
function resolveMultiHitDamage(played) {
  return resolveMultiHitDamageSystem({ played, state });
}

/**
 * 玩家对敌造成伤害的最终倍率：先力量/决战等算出 raw，再乘虚弱/目标易伤，最后一次性向下取整（最终结算）。
 * @param {number} raw
 * @param {{ ignoreEnemyVulnerable?: boolean, targetIndex?: number|null }} [opts]
 */
function applyPlayerOutgoingDamage(raw, opts = {}) {
  return applyPlayerOutgoingDamageSystem({
    raw,
    state,
    opts,
    WEAK_OUT_MULT,
    VULNERABLE_IN_MULT,
    isAppleBorerEncounter,
    getAppleBorerTargetIndex,
  });
}

/**
 * 敌方对玩家造成伤害的最终倍率：先基础+力量等算出 raw，再乘虚弱/玩家易伤，最后一次性向下取整，再与格挡结算。
 * @param {number} raw
 * @param {{ enemyUnitIndex?: number|null }} [opts]
 */
function applyEnemyOutgoingDamage(raw, opts = {}) {
  return applyEnemyOutgoingDamageSystem({
    raw,
    state,
    opts,
    WEAK_OUT_MULT,
    VULNERABLE_IN_MULT,
    isAppleBorerEncounter,
  });
}

/** 玩家回合结束：虚弱/易伤持续递减 */
function tickPlayerDebuffsEndOfPlayerTurn() {
  return tickPlayerDebuffsEndOfPlayerTurnSystem({ state });
}

/**
 * @param {number} amount 已由卡牌结算的力量/决战等加成后的数值，尚未乘虚弱/易伤
 * @param {{ ignoreEnemyVulnerable?: boolean }} [opts]
 */
function damageEnemy(amount, opts = {}) {
  if (state.phase !== 'playing' || amount <= 0) return;
  let dealtAmount = amount;
  if (state.activeEnemyId === 'gargoyle') {
    const perCard = Number(ENEMIES.gargoyle?.behavior?.slowPerCard ?? 0.1);
    const playedCount = Math.max(0, Number(state.playedCardsThisTurn ?? 0));
    const mult = 1 + (perCard * playedCount);
    dealtAmount = Math.floor(amount * mult);
  }
  if (isAppleBorerEncounter()) {
    const target = getAppleBorerTargetIndex(opts.targetIndex ?? null);
    if (target === null) return;
    const dmg = applyPlayerOutgoingDamage(dealtAmount, opts);
    const dealt = Math.max(0, dmg);
    if (dealt <= 0) return;
    state.appleBorerUnitsHp[target] = Math.max(0, state.appleBorerUnitsHp[target] - dealt);
    const left = state.appleBorerUnitsHp[target];
    const isGoblin = state.activeEnemyId === 'goblinGang';
    const maxHp = Math.max(1, Number(state.appleBorerUnitsMaxHp?.[target] ?? 30));
    const label = isGoblin ? `地精 ${target + 1}` : `蛀虫 ${target + 1}`;
    log(`${label} 受到 ${dealt} 点有效伤害，剩余 ${left}/${maxHp}。`);
    const nodes = els.enemyHitWrap ? els.enemyHitWrap.querySelectorAll('.enemy-unit') : [];
    if (nodes[target]) {
      nodes[target].classList.remove('enemy-unit--hit');
      void nodes[target].offsetWidth;
      nodes[target].classList.add('enemy-unit--hit');
    }
    if (!anyAppleBorerAlive()) {
      enterVictory();
      return;
    }
    const hasMadnessInHand = state.hand.some((c) => c?.templateId === 'madness');
    if (hasMadnessInHand && dealt > 0) {
      const chance = Number(TEMPLATES.madness?.madnessSelfReflectChance ?? 0.2);
      if (Math.random() < chance) {
        const lost = losePlayerHp(dealt);
        log(`诅咒「疯癫」触发：你同时受到 ${lost} 点伤害。`);
      }
    }
    state.enemyHp = (state.appleBorerUnitsHp || []).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
    refreshUI();
    return;
  }
  if (state.activeEnemyId === 'moltingSnake' && state.moltingSnakeGuardNextDamage) {
    state.moltingSnakeGuardNextDamage = false;
    log('蜕皮的蛇：抵挡了下一次伤害（消耗）。');
    return;
  }
  const dmg = applyPlayerOutgoingDamage(dealtAmount, opts);
  let remaining = dmg;
  if (state.enemyBlock > 0) {
    const absorbed = Math.min(remaining, state.enemyBlock);
    state.enemyBlock -= absorbed;
    remaining -= absorbed;
    log(`敌人格挡吸收 ${absorbed} 点伤害，剩余格挡 ${state.enemyBlock}。`);
  }
  if (remaining <= 0) return;
  state.enemyHp = Math.max(0, state.enemyHp - remaining);
  state.enemyDamageTakenThisTurn += remaining;
  log(`敌人受到 ${remaining} 点有效伤害，剩余 ${state.enemyHp}/${state.enemyMaxHp} 生命。`);

  if (state.activeEnemyId === 'lihuabird') {
    const threshold = Math.floor(state.enemyMaxHp * 0.25);
    if (!state.lihuabirdThresholdTriggeredThisTurn && state.enemyDamageTakenThisTurn > threshold) {
      state.lihuabirdThresholdTriggeredThisTurn = true;
      const overflow = state.enemyDamageTakenThisTurn - threshold;
      state.lihuabirdPendingHeal = Math.max(0, overflow);
      state.enemyStrength = Math.max(0, state.enemyStrength - 2);
      log(`离花弃枝触发：本回合累计受伤超过 ${threshold}，力量 -2，下回合回复 ${state.lihuabirdPendingHeal} 点生命。`);
    }
  }

  if (
    state.activeEnemyId === 'moltingSnake' &&
    !state.moltingSnakeMolted &&
    state.enemyHp > 0 &&
    state.enemyHp <= 40
  ) {
    state.moltingSnakeMolted = true;
    state.moltingSnakePostMoltingStep = 0; // 第一回合
    state.moltingSnakeGuardNextDamage = false;
    state.enemyStrength = 0;
    state.enemyFortitude = 0;
    state.enemyBlock = 0;
    log('蜕皮的蛇在 40 血量处蜕皮！力量清空，进入蜕皮后的循环。');
  }
  if (
    state.activeEnemyId === 'diablo' &&
    !state.diabloAwake &&
    state.diabloSleepRemaining > 0
  ) {
    state.diabloSleepHpDamageTotal += remaining;
    const threshold = state.enemyMaxHp * 0.2;
    if (state.diabloSleepHpDamageTotal >= threshold) {
      state.diabloAwake = true;
      state.diabloSleepRemaining = 0;
      state.diabloPostWakeStun = true;
      log(
        `大菠萝在睡眠中累计受到 ${state.diabloSleepHpDamageTotal} 点生命伤害（≥${Math.floor(threshold)}，20% 最大生命），惊醒过来！`,
      );
    }
  }
  if (state.enemyHp <= 0) {
    enterVictory();
    return;
  }
  const hasMadnessInHand = state.hand.some((c) => c?.templateId === 'madness');
  if (hasMadnessInHand && remaining > 0) {
    const chance = Number(TEMPLATES.madness?.madnessSelfReflectChance ?? 0.2);
    if (Math.random() < chance) {
      const lost = losePlayerHp(remaining);
      log(`诅咒「疯癫」触发：你同时受到 ${lost} 点伤害。`);
    }
  }
}

/**
 * @param {number} amount 敌人攻击基础值（含敌人力量等），尚未乘虚弱/易伤
 * @param {{ enemyUnitIndex?: number|null }} [opts]
 */
function damagePlayer(amount, opts = {}) {
  if (state.phase !== 'playing' || amount <= 0) return 0;
  const dmg = applyEnemyOutgoingDamage(amount, opts);
  if (dmg > 0 && state.relicFirstDamageNegateAvailable) {
    state.relicFirstDamageNegateAvailable = false;
    log(`遗物：抵消了本场第一次受到的伤害（${dmg}）。`);
    return 0;
  }
  let remaining = dmg;
  if (state.playerBlock > 0) {
    const absorbed = Math.min(remaining, state.playerBlock);
    state.playerBlock -= absorbed;
    remaining -= absorbed;
    log(`你的格挡吸收 ${absorbed} 点伤害，剩余格挡 ${state.playerBlock}。`);
  }
  if (remaining <= 0) return 0;
  state.playerHp = Math.max(0, state.playerHp - remaining);
  log(`你受到 ${remaining} 点伤害，剩余 ${state.playerHp}/${state.playerMaxHp} 生命。`);
  if (state.playerThorns > 0) {
    const hits = Math.max(1, Number(opts?.incomingHits ?? 1));
    const reflectedTotal = state.playerThorns * hits;
    if (isAppleBorerEncounter()) {
      const target = getAppleBorerTargetIndex(opts?.enemyUnitIndex ?? null);
      if (target !== null) {
        state.appleBorerUnitsHp[target] = Math.max(0, state.appleBorerUnitsHp[target] - reflectedTotal);
        state.enemyHp = (state.appleBorerUnitsHp || []).reduce((a, b) => a + Math.max(0, Number(b || 0)), 0);
      }
    } else {
      state.enemyHp = Math.max(0, state.enemyHp - reflectedTotal);
    }
    log(`荆棘反伤：总计反弹 ${reflectedTotal} 点伤害。`);
    if (isAppleBorerEncounter() && !anyAppleBorerAlive()) {
      enterVictory();
      return remaining;
    }
    if (!isAppleBorerEncounter() && state.enemyHp <= 0) {
      enterVictory();
      return remaining;
    }
  }
  if (state.activeEnemyId === 'witheredToad') {
    addCardToPlayerDiscard('withered');
    log('枯萎传播：你受到了未被格挡的伤害，弃牌堆加入 1 张「枯萎」。');
  }
  if (state.playerHp <= 0) {
    enterDefeat();
  }
  return remaining;
}

/**
 * 直接失去生命（不经过格挡与受伤倍率）。
 * @param {number} amount
 * @returns {number}
 */
function losePlayerHp(amount) {
  const loss = Math.max(0, Math.floor(amount));
  if (loss <= 0) return 0;
  const before = state.playerHp;
  state.playerHp = Math.max(0, state.playerHp - loss);
  if (state.playerHp <= 0) enterDefeat();
  return before - state.playerHp;
}

function enterVictory() {
  if (state.phase !== 'playing') return;
  const enemyId = state.activeEnemyId;
  const fromThornEvent = state.eventBattleTag === 'thornChest';
  if (enemyId === 'chestMimic') {
    const stolen = Math.max(0, Number(state.chestMimicStolenCoins ?? 0));
    if (stolen > 0) {
      state.coins += stolen;
      log(`你击败了宝箱怪，追回了 ${stolen} 金币。`);
    }
    if (fromThornEvent) {
      const bonus = Number(ENEMIES.chestMimic?.behavior?.eventKillBonusCoins ?? 100);
      state.coins += bonus;
      log(`事件战斗额外奖励：获得 ${bonus} 金币。`);
    }
  }
  if (enemyId === 'moltingSnake') {
    if (!state.moltingSnakeRewardClaimed) {
      state.moltingSnakeRewardClaimed = true;
      const gain = Number(GAME_TUNING.rewards.battleCoins.eventMoltingSnake ?? 60);
      state.coins += gain;
      addRelicById('snakeSkin');
      // 本场结束后也让玩家看到该遗物的效果提示（悬浮说明用 title 展示）。
      state.relicFirstDamageNegateAvailable = true;
      log(`事件战斗胜利：获得 ${gain} 金币，并掉落「褪下的蛇皮」。`);
    }
  } else if (enemyId === 'diablo') {
    const gain = Number(GAME_TUNING.rewards.battleCoins.boss ?? 100);
    state.coins += gain;
    log(`战斗胜利：获得 ${gain} 金币（BOSS）。`);
  } else {
    const gain = Number(GAME_TUNING.rewards.battleCoins.normal ?? 25);
    state.coins += gain;
    log(`战斗胜利：获得 ${gain} 金币。`);
  }
  const bonusCoins = Math.max(0, Number(state.battleEndBonusCoins ?? 0));
  if (bonusCoins > 0) {
    state.coins += bonusCoins;
    log(`能力结算：额外获得 ${bonusCoins} 金币。`);
  }
  const healBonus = Math.max(0, Number(state.battleEndHealBonus ?? 0));
  if (healBonus > 0) {
    const before = state.playerHp;
    state.playerHp = Math.min(state.playerMaxHp, state.playerHp + healBonus);
    const healed = state.playerHp - before;
    if (healed > 0) log(`能力结算：恢复 ${healed} 点生命。`);
  }
  state.battleEndBonusCoins = 0;
  state.battleEndHealBonus = 0;
  state.eventBattleTag = null;
  state.chestMimicEscaped = false;
  state.chestMimicStolenCoins = 0;
  applyBattleEndRelicsSystem({ state, logFn: log });
  state.phase = 'victory';
  if (state.battleExitNextEncounterFloorOverride !== null) {
    state.nextEncounterFloor = state.battleExitNextEncounterFloorOverride;
    state.battleExitNextEncounterFloorOverride = null;
  } else {
    state.nextEncounterFloor += 1;
    if (state.nextEncounterFloor > MAP_FLOOR_COUNT) state.nextEncounterFloor = MAP_FLOOR_COUNT;
  }
  state.enemyStrength = 0;
  state.enemyFortitude = 0;
  state.enemyBlock = 0;
  state.playerBlock = 0;
  closePileOverlay();
  playEnemyShatterAnimation();
  if (els.victoryOverlay) els.victoryOverlay.hidden = true;
  if (els.defeatOverlay) els.defeatOverlay.hidden = true;
  if (els.victorySub) {
    els.victorySub.textContent =
      state.nextEncounterFloor >= MAP_FLOOR_COUNT ? '你已抵达路线终点' : '敌人已溃散';
  }
  const rewardSourceType = BOSS_ENEMY_IDS.includes(enemyId) ? 'boss' : state.inEliteBattle ? 'elite' : 'normal';
  state.pendingBattleLootSourceType = rewardSourceType;
  state.pendingCardRewardChoices = generateCardRewardChoicesSystem({
    rewardPoolTemplateIds: state.runRewardPoolTemplateIds,
    templates: TEMPLATES,
    sourceType: rewardSourceType,
    rng: Math.random,
  });
  state.awaitingCardRewardChoice = state.pendingCardRewardChoices.length > 0;
  state.pendingRelicRewardId = state.inEliteBattle ? rollRunRelicRewardCandidate() : null;
  tryResolveBattleLootFlow();
  log('战斗胜利！');
}

function resolveChestMimicEscape() {
  state.phase = 'victory';
  state.awaitingCardRewardChoice = false;
  state.pendingCardRewardChoices = [];
  state.pendingRelicRewardId = null;
  state.pendingBattleLootSourceType = 'normal';
  if (state.battleExitNextEncounterFloorOverride !== null) {
    state.nextEncounterFloor = state.battleExitNextEncounterFloorOverride;
    state.battleExitNextEncounterFloorOverride = null;
  } else {
    state.nextEncounterFloor = Math.min(MAP_FLOOR_COUNT, state.nextEncounterFloor + 1);
  }
  state.awaitingBattleLootChoice = true;
  if (els.selectionFrameTitle) els.selectionFrameTitle.textContent = '战斗结算奖励';
  if (els.selectionFrameHint) els.selectionFrameHint.textContent = '宝箱怪逃走了，未掉落卡牌奖励。';
  if (els.selectionFrameActions) {
    els.selectionFrameActions.innerHTML = '';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn primary';
    nextBtn.textContent = '继续前进';
    nextBtn.addEventListener('click', () => {
      state.awaitingBattleLootChoice = false;
      if (els.selectionFrameActions) els.selectionFrameActions.innerHTML = '';
      if (els.selectionFrameHint) els.selectionFrameHint.textContent = '';
      startNextEncounter();
    });
    els.selectionFrameActions.appendChild(nextBtn);
  }
  if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
  if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
  if (els.selectionFrame) els.selectionFrame.hidden = false;
  state.eventBattleTag = null;
  state.chestMimicEscaped = false;
  state.chestMimicStolenCoins = 0;
  if (els.victorySub) {
    els.victorySub.textContent = '宝箱怪逃走了';
  }
}

function enterDefeat() {
  if (state.phase !== 'playing') return;
  state.phase = 'defeat';
  state.playerBlock = 0;
  closePileOverlay();
  if (els.defeatOverlay) els.defeatOverlay.hidden = false;
  if (els.victoryOverlay) els.victoryOverlay.hidden = true;
  log('游戏失败。');
}

function resetEnemyVisual() {
  const host = els.enemyShardHost;
  const cube = document.getElementById('enemy-cube');
  if (host) host.innerHTML = '';
  if (cube) cube.classList.remove('cube--hidden');
}

function playEnemyShatterAnimation() {
  const host = els.enemyShardHost;
  const cube = document.getElementById('enemy-cube');
  if (!host || !cube) return;
  host.innerHTML = '';
  cube.classList.add('cube--hidden');
  const n = 26;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'enemy-shard';
    const tx = (Math.random() - 0.5) * 220;
    const ty = (Math.random() - 0.5) * 220 - 24;
    const rot = (Math.random() - 0.5) * 720;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    s.style.setProperty('--rot', `${rot}deg`);
    s.style.setProperty('--delay', `${i * 30}ms`);
    host.appendChild(s);
  }
}

function executeEnemyTurn() {
  executeEnemyTurnSystem({
    state,
    ENEMIES,
    damagePlayer,
    applyPlayerDebuff,
    log,
    createAppleBorerActionBag,
    addCardToPlayerDiscard,
    addCardToPlayerHand,
  });
}

/**
 * @param {number} n
 */
function drawCards(n) {
  return drawCardsSystem({
    state,
    n,
    shuffleFn: shuffle,
    log,
    onCardShuffledIntoDraw: (card) => {
      const dmg = Number(card?.onShuffleIntoDrawSelfDamage ?? 0);
      if (dmg > 0) {
        const lost = losePlayerHp(dmg);
        log(`「${card.name}」被洗入抽牌堆：你受到 ${lost} 点伤害。`);
      }
    },
  });
}

function applyBattleStartRelics() {
  applyBattleStartRelicsSystem({ state, logFn: log });
  if (state.turn === 1) {
    applyBattleStartRoundOneRelicsSystem({
      state,
      isAppleBorerEncounter: isAppleBorerEncounter(),
      logFn: log,
    });
  }
}

function applyEndTurnRelicsBeforeEnemy() {
  return applyEndTurnRelicsBeforeEnemySystem({ state, logFn: log });
}

function applyEndTurnRelicsAfterPlayer() {
  return applyEndTurnRelicsAfterPlayerSystem({ state });
}

function applyTurnStartRelics() {
  return applyTurnStartRelicsSystem({ state, logFn: log });
}

const turnFlow = createTurnFlowSystem({
  state,
  els,
  DEBUG_ENERGY,
  DRAW_PER_TURN,
  MAX_ENERGY_CAP,
  MAX_SEEDS_PER_TURN,
  drawCardFlyDurationMs: DRAW_CARD_FLY_DURATION_MS,
  drawCardIntervalMs: DRAW_CARD_INTERVAL_MS,
  discardCardFlyDurationMs: DISCARD_CARD_FLY_DURATION_MS,
  discardCardIntervalMs: DISCARD_CARD_INTERVAL_MS,
  reshuffleDiscardIntoDrawIfNeeded: () => reshuffleDiscardIntoDrawIfNeededSystem({
    state,
    shuffleFn: shuffle,
    log,
    onCardShuffledIntoDraw: (card) => {
      const dmg = Number(card?.onShuffleIntoDrawSelfDamage ?? 0);
      if (dmg > 0) {
        const lost = losePlayerHp(dmg);
        log(`「${card.name}」被洗入抽牌堆：你受到 ${lost} 点伤害。`);
      }
    },
  }),
  resolveOnDrawCardEffects: ({ card, damagePlayerOutOfCombatLike }) => resolveOnDrawCardEffectsSystem({
    state,
    card,
    log,
    applyPlayerDebuff,
    damagePlayerOutOfCombatLike,
  }),
  applyPlayerDebuff,
  losePlayerHp,
  enterDefeat,
  applyTurnStartRelics,
  applyEndTurnRelicsAfterPlayer,
  applyEndTurnRelicsBeforeEnemy,
  executeEnemyTurn,
  resolveChestMimicEscape,
  tickPlayerDebuffsEndOfPlayerTurn,
  lockUiForAnimation,
  unlockUiForAnimation,
  refreshUI,
  log,
  spawnFlyingCard,
  buildHandInsertRect,
  sleepMs: sleepMsSystem,
});

function onTurnBegin() {
  return turnFlow.onTurnBeginFlow();
}

async function endTurn() {
  return turnFlow.endTurnFlow();
}

/**
 * 决战发动后：仅允许打出会造成伤害的攻击牌。
 * @param {CardInstance} card
 */
function canPlayUnderDecisiveBattle(card) {
  return canPlayUnderDecisiveBattleSystem({ state, card });
}

function isRotActiveInHand() {
  return state.hand.some((c) => c?.templateId === 'rot');
}

function getEffectiveCardInHand(card) {
  if (!card) return card;
  if (!isRotActiveInHand()) return card;
  if (!card.upgraded) return card;
  if (card.templateId === 'rot') return card;
  const downgraded = instantiateCard(TEMPLATES[card.templateId]);
  if (!downgraded) return card;
  return {
    ...downgraded,
    uid: card.uid,
    templateId: card.templateId,
    upgraded: false,
  };
}

/**
 * 奥术薪柴：是否可支付“消耗 1 张虚无/状态/诅咒手牌”的打出代价。
 * @param {number} handIndex
 */
function canPayArcaneKindling(handIndex) {
  return canPayArcaneKindlingSystem({ hand: state.hand, playHandIndex: handIndex });
}

/**
 * 奥术薪柴：支付额外代价（当前默认自动选择第一张可作为薪柴的手牌）。
 * @param {number} handIndex
 */
function payArcaneKindling(handIndex) {
  return payArcaneKindlingSystem({
    state,
    playHandIndex: handIndex,
    chooseFuelIndex: () => {
      const picked = pendingArcaneFuelIndex;
      pendingArcaneFuelIndex = null;
      return picked;
    },
    log,
  });
}

/**
 * @param {number} handIndex
 * @param {number | null} [targetIndex]
 * @param {boolean} [viaDrag]
 * @returns {boolean} 是否成功打出
 */
function playFromHand(handIndex, targetIndex = null, viaDrag = false) {
  const raw = state.hand[handIndex];
  const effective = raw ? getEffectiveCardInHand(raw) : null;
  if (!effective) return false;
  if (!effective.arcaneKindlingRequireFuel) pendingArcaneFuelIndex = null;

  if (effective.arcaneKindlingRequireFuel && pendingArcaneFuelIndex === null) {
    const candidates = collectArcaneKindlingFuelIndexesSystem({
      hand: state.hand,
      skipHandIndex: handIndex,
    });
    const opened = openHandCardPickerOverlay({
      titleText: '选择薪柴',
      hintText: `请选择 1 张“虚无/状态/诅咒”手牌，作为「${effective.name}」的奥术薪柴代价。`,
      candidateIndexes: candidates,
      onPick: (idx) => {
        pendingArcaneFuelIndex = idx;
        playFromHand(handIndex, targetIndex, viaDrag);
      },
    });
    if (!opened) {
      log(`无法打出「${effective.name}」：奥术薪柴需要先消耗一张“虚无/状态/诅咒”手牌。`);
    }
    return false;
  }

  if (effective.templateId === 'tolerance' && !pendingToleranceTransformUid) {
    const candidates = state.hand
      .map((_, idx) => idx)
      .filter((idx) => idx !== handIndex);
    if (candidates.length > 0) {
      openHandCardPickerOverlay({
        titleText: '选择转化目标',
        hintText: '请选择 1 张手牌，打出「包容」后会将其转化为「种子」。',
        candidateIndexes: candidates,
        onPick: (_idx, pickedCard) => {
          pendingToleranceTransformUid = pickedCard?.uid ?? null;
          playFromHand(handIndex, targetIndex, viaDrag);
        },
      });
      return false;
    }
  }

  const ok = playFromHandSystem({
    state,
    handIndex,
    targetIndex,
    viaDrag,
    isAppleBorerEncounter,
    getAppleBorerTargetIndex,
    canPlayUnderDecisiveBattle,
    canPayArcaneKindling,
    payArcaneKindling,
    normalizeCardBeforePlay: (card) => {
      const normalized = getEffectiveCardInHand(card);
      if (normalized?.templateId === 'tolerance' && pendingToleranceTransformUid) {
        return { ...normalized, transformTargetUid: pendingToleranceTransformUid };
      }
      return normalized;
    },
    losePlayerHp,
    onAfterPayCost: ({ cost }) => {
      const refund = Number((state.relics || []).reduce(
        (m, r) => Math.max(m, Number(r?.effects?.firstHighCostCardRefundEnergy ?? 0)),
        0,
      ));
      if (refund > 0 && cost > 1 && !state.relicEnlightenmentTriggeredThisTurn) {
        state.relicEnlightenmentTriggeredThisTurn = true;
        state.energy = Math.min(MAX_ENERGY_CAP, Number(state.energy ?? 0) + refund);
        log(`遗物「开悟」生效：恢复 ${refund} 点能量。`);
      }
    },
    applyCardEffects: ({ played, targetIndex: resolvedTargetIndex }) =>
      applyCardEffectsSystem({
        played,
        state,
        targetIndex: resolvedTargetIndex,
        resolveMultiHitDamage,
        resolveStrikeLikeDamage,
        damageEnemy,
        runMultiHitAttackEffects,
        flashPlayerAura,
        playEnemyHitFeedback,
        isAppleBorerEncounter,
        getAppleBorerTargetIndex,
        DEFEND_BASE_BLOCK,
        FRAGILE_CARD_BLOCK_MULT,
        drawCards,
        addCardToPlayerHand,
        createCardByTemplateId,
        openDiscardOverlay,
        shouldAutoExhaustOnDiscard: shouldAutoExhaustOnDiscardSystem,
        losePlayerHp,
        MAX_SEEDS_PER_TURN,
        MAX_ENERGY_CAP,
        log,
      }),
    log,
  });
  pendingToleranceTransformUid = null;
  return ok;
}

function renderHand() {
  els.hand.innerHTML = '';
  const canAct = state.phase === 'playing';
  state.hand.forEach((card, index) => {
    const effectiveCard = getEffectiveCardInHand(card);
    const affordable = state.debugMode || state.energy >= effectiveCard.cost;
    const allowedByRule = canPlayUnderDecisiveBattle(effectiveCard);
    const playableByCard = !effectiveCard.cannotPlay;
    const playable = canAct && affordable && allowedByRule && playableByCard;
    let costClass = 'card-cost';
    if (!affordable) costClass += ' unaffordable';
    else if (!allowedByRule) costClass += ' rule-locked';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = buildCardClassName(effectiveCard);
    btn.disabled = !playable;
    if (!playableByCard) btn.title = '该牌无法被直接打出';
    if (playable) {
      btn.draggable = true;
      btn.addEventListener('dragstart', (e) => beginCardDrag(index, e));
      btn.addEventListener('dragend', () => finishCardDrag());
    }
    btn.innerHTML = renderCardFaceHtml(effectiveCard, { costClass });
    btn.addEventListener('click', () => {
      if (isAppleBorerEncounter() && effectiveCard.kind === 'attack') {
        log(`「${effectiveCard.name}」需要拖拽到目标单位上才能打出。`);
        return;
      }
      playFromHand(index);
      refreshUI();
    });
    els.hand.appendChild(btn);
  });
}

/**
 * @param {string} icon
 * @param {string} title
 * @param {string} num
 * @param {string} cls
 */
function makeBuffChip(icon, title, num, cls) {
  const span = document.createElement('span');
  span.className = `buff-chip ${cls}`;
  span.innerHTML = `<span class="buff-chip-ico">${icon}</span>${
    num !== '' ? `<span class="buff-chip-n">${escapeHtml(num)}</span>` : ''
  }`;
  bindHoverTooltip(span, title);
  return span;
}

function renderEnemyIntent() {
  const el = els.enemyIntent;
  if (!el) return;
  if (state.phase !== 'playing' || isAppleBorerEncounter()) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = buildEnemyIntentHTML({
    state,
    ENEMIES,
    applyEnemyOutgoingDamage,
    createAppleBorerActionBag,
  });
}

function renderBuffRows() {
  const p = els.playerBuffs;
  const e = els.enemyBuffs;
  if (!p || !e) return;
  p.innerHTML = '';
  e.innerHTML = '';
  const playerChips = buildPlayerBuffChipsSystem({ state });
  playerChips.forEach((c) => p.appendChild(makeBuffChip(c.icon, c.title, c.num, c.cls)));

  const enemyChips = buildEnemyBuffChipsSystem({
    state,
    isAppleBorerEncounter: isAppleBorerEncounter(),
    gargoyleSlowPerCard: Number(ENEMIES.gargoyle?.behavior?.slowPerCard ?? 0.1),
  });
  enemyChips.forEach((c) => e.appendChild(makeBuffChip(c.icon, c.title, c.num, c.cls)));
}

function syncEnergyAfterDebugToggle() {
  return syncEnergyAfterDebugToggleSystem({
    state,
    DEBUG_ENERGY,
    INITIAL_ENERGY_MAX,
    MAX_ENERGY_CAP,
  });
}

function toggleDebugMode() {
  state.debugMode = !state.debugMode;
  if (!state.debugMode) closeDebugRewardPoolOverlay();
  syncEnergyAfterDebugToggle();
  refreshUI();
}

/**
 * DEBUG：从路线任意层开始战斗（保留当前生命）；顶层为 BOSS。
 * @param {number} floorIndex 0 .. MAP_FLOOR_COUNT-1
 */
function debugJumpToFloor(floorIndex) {
  if (!validateDebugJumpFloorSystem({ state, floorIndex, MAP_FLOOR_COUNT })) return;
  const floorTypes = getRunFloorTypes();
  state.nextEncounterFloor = floorIndex;
  if (floorTypes[floorIndex] === 'blessing') {
    closePileOverlay();
    openBlessingOverlay();
    refreshUI();
    return;
  }
  if (floorTypes[floorIndex] === 'camp') {
    closePileOverlay();
    openCampOverlay();
    refreshUI();
    return;
  }
  if (floorTypes[floorIndex] === 'event') {
    closePileOverlay();
    openEventOverlay();
    refreshUI();
    return;
  }
  if (floorTypes[floorIndex] === 'shop') {
    closePileOverlay();
    openShopOverlay();
    refreshUI();
    return;
  }
  log(
    `[DEBUG] 跳转至路线第 ${floorIndex + 1}/${MAP_FLOOR_COUNT} 层（${
      classifyFloorTypeSystem({
        floorType: floorTypes[floorIndex],
      })
    }）。`,
  );
  startBattleCore(false);
}

function renderMap() {
  const el = els.mapNodes;
  if (!el) return;
  const floorTypes = getRunFloorTypes();
  if (els.mapRail) {
    els.mapRail.classList.toggle('map-rail--debug', state.debugMode);
  }
  el.innerHTML = '';
  for (let i = 0; i < MAP_FLOOR_COUNT; i += 1) {
    const isBoss = i === MAP_FLOOR_COUNT - 1;
    const isCamp = floorTypes[i] === 'camp';
    const isBlessing = floorTypes[i] === 'blessing';
    const isEvent = floorTypes[i] === 'event';
    const isElite = floorTypes[i] === 'elite';
    const isShop = floorTypes[i] === 'shop';
    let cls = buildMapNodeClassSystem({
      isBoss,
      isCamp,
      isBlessing,
      isEvent,
      isElite,
      isShop,
      state,
      index: i,
    });
    const node = state.debugMode ? document.createElement('button') : document.createElement('div');
    if (state.debugMode) {
      node.type = 'button';
      node.title = `DEBUG：跳转到第 ${i + 1} 层（${
        isBoss ? 'BOSS' : isCamp ? '篝火' : isBlessing ? '祝福' : isShop ? '商店' : isElite ? '精英' : isEvent ? '事件' : '普通'
      }）`;
      node.addEventListener('click', () => {
        debugJumpToFloor(i);
      });
    }
    node.className = cls;
    node.textContent = getMapNodeLabelSystem({ isBoss, isCamp, isBlessing, isEvent, isElite, isShop });
    el.appendChild(node);
  }
}

function renderRelics() {
  const box = els.relicSlots;
  if (!box) return;
  box.innerHTML = '';
  if (!state.relics.length) {
    const span = document.createElement('span');
    span.className = 'relic-empty';
    span.textContent = '暂无遗物';
    box.appendChild(span);
    return;
  }
  state.relics.forEach((r) => {
    const slot = document.createElement('span');
    slot.className = 'relic-slot';
    bindHoverTooltip(slot, r.desc ? `${r.name}：${r.desc}` : r.name);
    slot.textContent = r.icon ?? '◆';
    box.appendChild(slot);
  });
}

function refreshUI() {
  const inSelectionMode = state.inCharacterSelect || state.inBlessing || state.inCamp || state.inShop || state.awaitingBattleLootChoice;
  if (els.selectionFrame) els.selectionFrame.hidden = !inSelectionMode;
  if (els.arenaSection) els.arenaSection.hidden = inSelectionMode;
  if (els.handSection) els.handSection.hidden = inSelectionMode;

  const battleFlowUI = getBattleFlowUIStateSystem({ state, MAP_FLOOR_COUNT });
  const playing = battleFlowUI.interactivePlaying;
  els.turnDisplay.textContent = String(state.turn);
  if (state.debugMode) {
    els.energyDisplay.textContent = '∞';
    els.energyMaxDisplay.textContent = '∞';
  } else {
    els.energyDisplay.textContent = String(state.energy);
    els.energyMaxDisplay.textContent = String(state.energyMax);
  }
  renderEnergyOrbsUI();
  if (els.energyOrbs && !els.energyOrbs.dataset.tooltipBound) {
    bindHoverTooltip(els.energyOrbs, () =>
      state.debugMode ? '能量：∞（DEBUG）' : `能量：${state.energy}/${state.energyMax}`,
    );
    els.energyOrbs.dataset.tooltipBound = '1';
  }
  if (els.btnDebugToggle) {
    els.btnDebugToggle.setAttribute('aria-pressed', state.debugMode ? 'true' : 'false');
    els.btnDebugToggle.classList.toggle('debug-fab--on', state.debugMode);
    els.btnDebugToggle.textContent = state.debugMode ? 'DEBUG 开' : 'DEBUG';
  }
  if (els.btnDebugRewardPool) {
    els.btnDebugRewardPool.disabled = !state.debugMode;
    els.btnDebugRewardPool.classList.toggle('debug-fab--on', state.debugMode);
  }
  renderBuffRows();
  renderEnemyIntent();
  if (els.playerHpText) els.playerHpText.textContent = String(state.playerHp);
  if (els.playerMaxHpText) els.playerMaxHpText.textContent = String(state.playerMaxHp);
  const appleEncounter = isAppleBorerEncounter();
  if (els.enemyHpText) {
    els.enemyHpText.textContent = getEnemyHpTextSystem({ state, isAppleBorerEncounter: appleEncounter });
  }
  if (els.enemyMaxHpText) {
    els.enemyMaxHpText.textContent = getEnemyMaxHpTextSystem({ state, isAppleBorerEncounter: appleEncounter });
  }
  if (els.playerBlockSuffix) {
    const pBlock = getPlayerBlockSuffixSystem({ state });
    els.playerBlockSuffix.textContent = pBlock.text;
    els.playerBlockSuffix.hidden = pBlock.hidden;
  }
  if (els.enemyBlockSuffix) {
    const eBlock = getEnemyBlockSuffixSystem({ state, isAppleBorerEncounter: appleEncounter });
    els.enemyBlockSuffix.textContent = eBlock.text;
    els.enemyBlockSuffix.hidden = eBlock.hidden;
  }
  if (els.playerHpStrip) {
    els.playerHpStrip.classList.toggle('hp-strip--blocked', state.playerBlock > 0);
  }
  if (els.enemyHpStrip) {
    if (appleEncounter) {
      els.enemyHpStrip.hidden = true;
    } else {
      els.enemyHpStrip.hidden = false;
      els.enemyHpStrip.classList.toggle('hp-strip--blocked', state.enemyBlock > 0);
    }
  }
  if (els.playerHpBar && state.playerMaxHp > 0) {
    els.playerHpBar.style.width = `${Math.max(0, Math.min(100, (state.playerHp / state.playerMaxHp) * 100))}%`;
  }
  if (els.enemyHpBar && state.enemyMaxHp > 0) {
    if (!appleEncounter) {
      els.enemyHpBar.style.width = `${Math.max(0, Math.min(100, (state.enemyHp / state.enemyMaxHp) * 100))}%`;
    }
  }
  if (els.drawCount) els.drawCount.textContent = String(state.drawPile.length);
  if (els.discardCount) els.discardCount.textContent = String(state.discardPile.length);
  if (els.exhaustCount) els.exhaustCount.textContent = String(state.exhaustPile.length);
  if (els.btnEndTurn) els.btnEndTurn.disabled = !playing || uiAnimationLockCount > 0;
  if (els.btnViewDraw) els.btnViewDraw.disabled = !playing;
  if (els.btnViewDiscard) els.btnViewDiscard.disabled = !playing;
  if (els.btnViewExhaust) els.btnViewExhaust.disabled = !playing;
  if (els.btnNewBattle) els.btnNewBattle.disabled = !playing;
  if (els.btnNextBattle) {
    els.btnNextBattle.disabled = !battleFlowUI.canNextBattle;
    els.btnNextBattle.hidden = battleFlowUI.hideNextBattleButton;
    els.btnNextBattle.textContent = getNextBattleButtonTextSystem({ state, FLOOR_TYPES: getRunFloorTypes() });
  }
  if (els.btnDefeatRestart) els.btnDefeatRestart.disabled = battleFlowUI.defeatRestartDisabled;
  if (els.coinsDisplay) els.coinsDisplay.textContent = String(state.coins ?? 0);
  syncPileOverlayIfOpen();
  renderHand();
  renderAppleBorerUnits();
  renderMap();
  renderRelics();
}

/**
 * @param {boolean} resetPlayerHp 是否将玩家生命重置为满（开始新对战为 true；下一场战斗为 false，保留当前生命）
 */
function startBattleCore(resetPlayerHp, options = {}) {
  if (state.nextEncounterFloor >= MAP_FLOOR_COUNT) return;
  const floorTypes = getRunFloorTypes();
  const floorType = floorTypes[state.nextEncounterFloor];
  if (floorType === 'camp' || floorType === 'blessing' || floorType === 'shop') return;
  state.inCamp = false;
  state.inBlessing = false;
  state.inEvent = false;
  state.eventBattleTag = null;
  state.inShop = false;
  state.awaitingCardRewardChoice = false;
  resetPendingBattleLootState();
  state.battleExitNextEncounterFloorOverride = null;
  state.chestMimicEscaped = false;
  state.chestMimicStolenCoins = 0;
  state.battleEndBonusCoins = 0;
  state.battleEndHealBonus = 0;
  state.battleFloor = state.nextEncounterFloor;
  const forceNormalEnemy = !!options.forceNormalEnemy;
  state.inEliteBattle = floorType === 'elite' && !forceNormalEnemy;
  const forcedId = state.debugForcedEnemyByFloor?.[state.nextEncounterFloor];
  const pickByFloor = () => {
    if (floorType === 'boss') return pickBossEnemyId() || 'diablo';
    if (state.inEliteBattle) return pickEliteEnemyId() || pickNormalEnemyId();
    return pickNormalEnemyId();
  };
  const allowedPool = floorType === 'boss'
    ? BOSS_ENEMY_IDS
    : state.inEliteBattle
      ? ELITE_ENEMY_IDS
      : NORMAL_ENEMY_IDS;
  state.activeEnemyId = forcedId && allowedPool.includes(forcedId) ? forcedId : pickByFloor();
  state.enemyDamageTakenThisTurn = 0;
  state.lihuabirdThresholdTriggeredThisTurn = false;
  state.lihuabirdPendingHeal = 0;
  state.witheredToadCycleStep = 0;
  state.witheredToadSeedCount = Number(ENEMIES.witheredToad?.behavior?.seedStart ?? 3);
  const def = ENEMIES[state.activeEnemyId];
  initializeBattleStateSystem({
    state,
    enemyId: state.activeEnemyId,
    def,
    resetPlayerHp,
    DEBUG_ENERGY,
    INITIAL_ENERGY_MAX,
    MAX_ENERGY_CAP,
    PLAYER_MAX_HP,
    shuffleFn: shuffle,
    instantiateRunDeckCard,
    resetAppleBorerState,
    applyBattleStartRelics,
    treatAppleBorerAsPair: true,
    moltingGuardOnStart: false,
  });
  if (els.enemyNameLabel) els.enemyNameLabel.textContent = def.name;
  resetEnemyVisual();
  if (els.defeatOverlay) els.defeatOverlay.hidden = true;
  if (els.victoryOverlay) els.victoryOverlay.hidden = true;
  if (els.victorySub) els.victorySub.textContent = '敌人已溃散';
  closePileOverlay();
  closeCardRewardOverlay();
  closeCollectionOverlay();
  closeDebugRewardPoolOverlay();
  log('———— 战斗开始：抽牌堆已随机洗牌。');
  if (state.tempEnergyBonusBattlesLeft > 0) {
    state.tempEnergyBonusBattlesLeft -= 1;
    if (state.tempEnergyBonusBattlesLeft <= 0) state.tempEnergyBonusValue = 0;
  }
  if (state.activeEnemyId === 'appleBorerPair') {
    log('遭遇：苹果蛀虫 ×2（每只 30 生命）。攻击牌请拖拽到目标蛀虫上。');
  } else if (state.activeEnemyId === 'goblinGang') {
    log('遭遇：小地精们（3 个独立单位）。攻击牌请拖拽到目标地精上。');
  } else if (state.inEliteBattle) {
    log(`遭遇：精英「${def.name}」（${def.maxHp} 生命）。`);
  } else {
    log(`遭遇：${def.name}（${def.maxHp} 生命）。`);
  }
  showBattleStartToast('开始战斗');
  onTurnBegin();
  refreshUI();
}

/**
 * 直接与指定敌人开战（用于事件中的特殊战斗）。
 * @param {string} enemyId
 * @param {boolean} resetPlayerHp
 * @param {number} battleFloorIndex 地图高亮用层索引
 * @param {number|null} exitNextEncounterFloorOverride 胜利后去往的层索引
 */
function startBattleAgainstEnemy(enemyId, resetPlayerHp, battleFloorIndex, exitNextEncounterFloorOverride = null) {
  state.inCamp = false;
  state.inBlessing = false;
  state.inEvent = false;
  state.inShop = false;
  state.awaitingCardRewardChoice = false;
  resetPendingBattleLootState();
  state.battleExitNextEncounterFloorOverride = exitNextEncounterFloorOverride;
  state.chestMimicEscaped = false;
  state.chestMimicStolenCoins = 0;
  state.battleFloor = battleFloorIndex;
  state.activeEnemyId = enemyId;
  state.inEliteBattle = false;

  const def = ENEMIES[enemyId];
  if (!def) return;
  initializeBattleStateSystem({
    state,
    enemyId,
    def,
    resetPlayerHp,
    DEBUG_ENERGY,
    INITIAL_ENERGY_MAX,
    MAX_ENERGY_CAP,
    PLAYER_MAX_HP,
    shuffleFn: shuffle,
    instantiateRunDeckCard,
    resetAppleBorerState,
    applyBattleStartRelics,
    // keep previous behavior for event battles
    treatAppleBorerAsPair: false,
    moltingGuardOnStart: enemyId === 'moltingSnake',
  });

  if (els.enemyNameLabel) els.enemyNameLabel.textContent = def.name;
  resetEnemyVisual();
  if (els.defeatOverlay) els.defeatOverlay.hidden = true;
  if (els.victoryOverlay) els.victoryOverlay.hidden = true;
  if (els.victorySub) els.victorySub.textContent = '敌人已溃散';

  closePileOverlay();
  closeCardRewardOverlay();
  closeCollectionOverlay();
  log('———— 战斗开始：抽牌堆已随机洗牌。');
  if (state.tempEnergyBonusBattlesLeft > 0) {
    state.tempEnergyBonusBattlesLeft -= 1;
    if (state.tempEnergyBonusBattlesLeft <= 0) state.tempEnergyBonusValue = 0;
  }
  log(`遭遇：${def.name}（${def.maxHp} 生命）。`);

  if (enemyId === 'moltingSnake') {
    log('蜕皮的蛇：血量 80，抵挡下一次伤害；到达 40 血量时蜕皮。');
  }

  showBattleStartToast('开始战斗');
  onTurnBegin();
  refreshUI();
}

const { startNewRun, startNextEncounter } = createGameLoop({
  state,
  PLAYER_MAX_HP,
  MAP_FLOOR_COUNT,
  FLOOR_TYPES: getRunFloorTypes(),
  createStartingRunDeck,
  resetAppleBorerState,
  finishCardDrag,
  els,
  // overlays
  closeBlessingOverlay,
  closeCampOverlay,
  closeDiscardOverlay,
  closeEventOverlay,
  closeCardRewardOverlay,
  closeShopOverlay,
  openBlessingOverlay,
  openCampOverlay,
  openEventOverlay,
  openShopOverlay,
  openCharacterSelectOverlay,
  closeResultOverlays,
  refreshUI,
  onStartNewRun: () => {
    state.runFloorTypes = buildRunFloorTypes();
    initializeRunRelicPool();
  },
  shouldEventTurnIntoBattle: () => Math.random() < PROBABILITY_CONFIG.map.eventTurnsIntoBattleChance,
  // battle start (still in game.js for incremental refactor)
  startBattleCore,
});

els.btnNewBattle.addEventListener('click', () => {
  startNewRun();
});

if (els.btnNextBattle) {
  els.btnNextBattle.addEventListener('click', () => {
    startNextEncounter();
  });
}

if (els.btnDefeatRestart) {
  els.btnDefeatRestart.addEventListener('click', () => {
    startNewRun();
  });
}

els.btnEndTurn.addEventListener('click', () => {
  endTurn();
});

if (els.btnViewDraw) {
  els.btnViewDraw.addEventListener('click', () => openPileOverlay('draw'));
}
if (els.btnViewDiscard) {
  els.btnViewDiscard.addEventListener('click', () => openPileOverlay('discard'));
}
if (els.btnViewExhaust) {
  els.btnViewExhaust.addEventListener('click', () => openPileOverlay('exhaust'));
}
bindOverlayDismiss({
  backdropEl: els.pileOverlayBackdrop,
  closeEl: els.pileOverlayClose,
  onClose: closePileOverlay,
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (els.blessingOverlay && !els.blessingOverlay.hidden) {
    closeBlessingOverlay();
    return;
  }
  if (els.discardOverlay && !els.discardOverlay.hidden) {
    closeDiscardOverlay();
    return;
  }
  if (els.campOverlay && !els.campOverlay.hidden) {
    closeCampOverlay();
    return;
  }
  if (els.eventOverlay && !els.eventOverlay.hidden) {
    closeEventOverlay();
    return;
  }
  if (els.rewardOverlay && !els.rewardOverlay.hidden) {
    closeCardRewardOverlay();
    return;
  }
  if (els.collectionOverlay && !els.collectionOverlay.hidden) {
    closeCollectionOverlay();
    return;
  }
  if (els.debugRewardPoolOverlay && !els.debugRewardPoolOverlay.hidden) {
    closeDebugRewardPoolOverlay();
    return;
  }
  if (pileOverlayView && state.phase === 'playing') closePileOverlay();
});

if (els.btnViewCollection) {
  els.btnViewCollection.addEventListener('click', () => openCollectionOverlay());
}
if (els.rewardSkip) {
  els.rewardSkip.addEventListener('click', () => {
    state.awaitingCardRewardChoice = false;
    state.pendingCardRewardChoices = [];
    closeCardRewardOverlay();
    tryResolveBattleLootFlow();
  });
}
if (els.btnDebugToggle) {
  els.btnDebugToggle.addEventListener('click', () => {
    toggleDebugMode();
  });
}
if (els.btnDebugRewardPool) {
  els.btnDebugRewardPool.addEventListener('click', () => {
    openDebugRewardPoolOverlay();
  });
}
if (els.btnPickWarrior) {
  els.btnPickWarrior.addEventListener('click', () => {
    applyCharacterSelection(CHARACTER_IDS.WARRIOR);
    refreshUI();
  });
}
if (els.btnPickNatureMage) {
  els.btnPickNatureMage.addEventListener('click', () => {
    applyCharacterSelection(CHARACTER_IDS.NATURE_MAGE);
    refreshUI();
  });
}
bindOverlayDismiss({
  backdropEl: els.collectionBackdrop,
  closeEl: els.collectionClose,
  onClose: closeCollectionOverlay,
});
bindOverlayDismiss({
  backdropEl: els.debugRewardPoolBackdrop,
  closeEl: els.debugRewardPoolClose,
  onClose: closeDebugRewardPoolOverlay,
});
bindOverlayDismiss({
  backdropEl: els.campBackdrop,
  closeEl: els.campClose,
  onClose: closeCampOverlay,
});
if (els.campRest) {
  els.campRest.addEventListener('click', () => {
    const heal = Math.max(1, Math.floor(state.playerMaxHp * CAMP_HEAL_RATIO));
    const before = state.playerHp;
    state.playerHp = Math.min(state.playerMaxHp, state.playerHp + heal);
    log(`篝火：休息回复 ${state.playerHp - before} 点生命。`);
    closeCampOverlay(true);
    state.nextEncounterFloor = Math.min(MAP_FLOOR_COUNT, state.nextEncounterFloor + 1);
    startNextEncounter();
  });
}
if (els.campUpgrade) {
  els.campUpgrade.addEventListener('click', () => {
    openCampPicker('upgrade');
  });
}
if (els.campPurge) {
  els.campPurge.addEventListener('click', () => {
    openCampPicker('purge');
  });
}
bindOverlayDismiss({
  backdropEl: els.blessingBackdrop,
  closeEl: els.blessingClose,
  onClose: closeBlessingOverlay,
});
bindOverlayDismiss({
  backdropEl: els.discardBackdrop,
  closeEl: els.discardClose,
  onClose: closeDiscardOverlay,
});
bindOverlayDismiss({
  backdropEl: els.eventBackdrop,
  closeEl: els.eventClose,
  onClose: closeEventOverlay,
});
bindOverlayDismiss({
  backdropEl: els.characterBackdrop,
  closeEl: els.characterClose,
  onClose: closeCharacterSelectOverlay,
});

bindUpgradePreviewDrag();

startNewRun();
