import { EVENT_IDS, EVENT_DEFS } from '../data/eventDefs.js';
import { PROBABILITY_CONFIG } from '../data/probabilities.js';

export function prepareEventStateSystem({ state, eventId }) {
  if (eventId === EVENT_IDS.WELL) {
    state.eventWellAttempts = 0;
    state.eventWellUpgradesDone = 0;
    state.eventWellUpgradedCardNames = [];
    return;
  }
  if (eventId === EVENT_IDS.THORN_CHEST) {
    state.eventThornChestAttempts = 0;
  }
}

export function applyBlessingCoinDamageEventSystem({ state, takeDamageOutOfCombat, log }) {
  const cfg = EVENT_DEFS[EVENT_IDS.BLESSING_COIN_DAMAGE]?.blessingCoinDamage ?? { gainCoins: 150, damage: 23 };
  const gainCoins = Number(cfg.gainCoins ?? 150);
  const damage = Number(cfg.damage ?? 23);
  state.coins += gainCoins;
  const hurt = takeDamageOutOfCombat(damage);
  log(`祝福事件：获得 ${gainCoins} 金币，受到 ${hurt} 点伤害。`);
}

export function applySnakeTradeOptionSystem({ state, log }) {
  const cfg = EVENT_DEFS[EVENT_IDS.SNAKE]?.snakeTrade ?? { maxHpLoss: 12, relicId: 'snakeSkin' };
  const maxHpLoss = Number(cfg.maxHpLoss ?? 12);
  const relicId = String(cfg.relicId ?? 'snakeSkin');
  state.playerMaxHp = Math.max(1, state.playerMaxHp - maxHpLoss);
  state.playerHp = Math.min(state.playerHp, state.playerMaxHp);
  log('事件：你交出了血。');
  return { relicId };
}

export function buildWellDescriptionSystem({ state }) {
  const cfg = EVENT_DEFS[EVENT_IDS.WELL] ?? {};
  const wellDesc = cfg.descBase ?? '你的必经之路上遇见了一个深不见底的水井，扔石子下去也没有回声。';
  const activeSuffix = cfg.descActiveSuffix ?? '你能听见水在很远处发出的轻响。';
  const doneSuffix = cfg.descDoneSuffix ?? '时间结束。';
  const maxUpgradeCount = Number(cfg.maxUpgradeCount ?? 2);
  const isDone = state.eventWellUpgradesDone >= maxUpgradeCount;
  const upgradesText = state.eventWellUpgradedCardNames.length
    ? `已升级（${state.eventWellUpgradedCardNames.length}/${maxUpgradeCount}）：${state.eventWellUpgradedCardNames.join('、')}`
    : '';
  const text = isDone ? `${wellDesc} ${doneSuffix}${upgradesText}` : `${wellDesc} ${activeSuffix}${upgradesText}`;
  return { text, isDone };
}

export function resolveWellAttemptSystem({
  state,
  rng = Math.random,
  takeDamageOutOfCombat,
  upgradeRandomRunDeckCard,
  log,
}) {
  const cfg = EVENT_DEFS[EVENT_IDS.WELL] ?? {};
  const failDamageBase = Number(cfg.failDamageBase ?? 3);
  const maxUpgradeCount = Number(cfg.maxUpgradeCount ?? 2);
  const damageThisTry = failDamageBase + state.eventWellAttempts;
  state.eventWellAttempts += 1;
  if (rng() < PROBABILITY_CONFIG.events.wellFailChance) {
    const hurt = takeDamageOutOfCombat(damageThisTry);
    log(`事件：水井尝试失败，受到 ${hurt} 点伤害（下次伤害+1）。`);
    return { upgraded: false, hurt };
  }
  const upgradedName = upgradeRandomRunDeckCard();
  if (upgradedName) {
    state.eventWellUpgradesDone += 1;
    state.eventWellUpgradedCardNames.push(upgradedName);
    log(`事件：好运！升级了「${upgradedName}」。（已升级 ${state.eventWellUpgradesDone}/${maxUpgradeCount}）`);
    return { upgraded: true, upgradedName };
  }
  log('事件：水井升级失败（没有可升级的牌）。');
  return { upgraded: false, upgradedName: null };
}

export function resolveThornChestAttemptSystem({ state, rng = Math.random, takeDamageOutOfCombat, log }) {
  const cfg = EVENT_DEFS[EVENT_IDS.THORN_CHEST]?.thornChest ?? {};
  const damageMin = Number(cfg.damageMin ?? 2);
  const damageMax = Number(cfg.damageMax ?? 5);
  const coinsMin = Number(cfg.coinsMin ?? 10);
  const coinsMax = Number(cfg.coinsMax ?? 20);
  const maxAttempts = Number(cfg.maxAttemptsBeforeBattle ?? 4);
  const rollInt = (min, max) => {
    const lo = Math.floor(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return lo + Math.floor(rng() * (hi - lo + 1));
  };
  const hurt = takeDamageOutOfCombat(rollInt(damageMin, damageMax));
  const gain = rollInt(coinsMin, coinsMax);
  state.coins += gain;
  state.eventThornChestAttempts = Number(state.eventThornChestAttempts ?? 0) + 1;
  log(`荆棘地：你受到 ${hurt} 点伤害，获得 ${gain} 金币。`);
  const triggerBattle = state.eventThornChestAttempts >= maxAttempts;
  return { triggerBattle, attempts: state.eventThornChestAttempts, maxAttempts };
}

