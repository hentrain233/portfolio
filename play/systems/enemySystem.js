/**
 * Enemy system (selection and encounter state helpers).
 * These functions are written to be dependency-injected via parameters.
 */

export function isAppleBorerEncounterSystem({ state }) {
  return state.activeEnemyId === 'appleBorerPair' || state.activeEnemyId === 'goblinGang';
}

export function anyAppleBorerAliveSystem({ state }) {
  return (state.appleBorerUnitsHp || []).some((hp) => hp > 0);
}

export function pickNormalEnemyIdSystem({ ENEMY_IDS, state }) {
  const seen = state.seenNormalEnemyIds || [];
  const unseen = ENEMY_IDS.filter((id) => !seen.includes(id));
  const pool = unseen.length > 0 ? unseen : ENEMY_IDS;
  let id = pool[Math.floor(Math.random() * pool.length)];
  // Increase early-run visibility of the new goblin encounter.
  if (
    unseen.includes('goblinGang')
    && Number(state.nextEncounterFloor ?? 0) <= 3
    && Math.random() < 0.45
  ) {
    id = 'goblinGang';
  }
  if (!seen.includes(id)) seen.push(id);
  state.seenNormalEnemyIds = seen;
  return id;
}

export function pickEliteEnemyIdSystem({ ELITE_ENEMY_IDS, state }) {
  if (!ELITE_ENEMY_IDS || !ELITE_ENEMY_IDS.length) return null;
  const seen = state.seenEliteEnemyIds || [];
  const unseen = ELITE_ENEMY_IDS.filter((id) => !seen.includes(id));
  const pool = unseen.length > 0 ? unseen : ELITE_ENEMY_IDS;
  const id = pool[Math.floor(Math.random() * pool.length)];
  if (!seen.includes(id)) seen.push(id);
  state.seenEliteEnemyIds = seen;
  return id;
}

export function pickBossEnemyIdSystem({ BOSS_ENEMY_IDS, state }) {
  if (!BOSS_ENEMY_IDS || !BOSS_ENEMY_IDS.length) return null;
  const seen = state.seenBossEnemyIds || [];
  const unseen = BOSS_ENEMY_IDS.filter((id) => !seen.includes(id));
  const pool = unseen.length > 0 ? unseen : BOSS_ENEMY_IDS;
  const id = pool[Math.floor(Math.random() * pool.length)];
  if (!seen.includes(id)) seen.push(id);
  state.seenBossEnemyIds = seen;
  return id;
}

export function getAppleBorerTargetIndexSystem({ state, preferred = null }) {
  const hpArr = state.appleBorerUnitsHp || [];
  const alive = hpArr.map((hp, idx) => ({ hp, idx })).filter((x) => x.hp > 0);
  if (!alive.length) return null;
  if (preferred !== null && preferred >= 0 && preferred < hpArr.length && hpArr[preferred] > 0) return preferred;
  return alive[0].idx;
}

export function createAppleBorerActionBagSystem({ shuffleFn, actions }) {
  const base = Array.isArray(actions) && actions.length > 0 ? actions.slice() : ['debuff', 'attack', 'buff'];
  return shuffleFn(base);
}

export function resetAppleBorerStateSystem({ state, inBattle, shuffleFn, enemyId, def }) {
  if (!inBattle) {
    state.appleBorerUnitsHp = [0, 0];
    state.appleBorerUnitsMaxHp = [0, 0];
    state.appleBorerUnitsStrength = [0, 0];
    state.appleBorerUnitsWeakTurns = [0, 0];
    state.appleBorerUnitsVulnerableTurns = [0, 0];
    state.appleBorerUnitsActionBags = [[], []];
    state.appleBorerUnitKinds = [];
    return;
  }
  if (enemyId === 'goblinGang') {
    const cfg = def?.behavior || {};
    const n = Math.max(3, Number(cfg.unitCount ?? 3));
    const hpMin = Number(cfg.unitHpMin ?? 12);
    const hpMax = Number(cfg.unitHpMax ?? 18);
    const kinds = Array.isArray(cfg.unitKinds) && cfg.unitKinds.length >= 3
      ? cfg.unitKinds.slice()
      : ['trickster', 'taunter', 'mage'];
    const picked = [kinds[Math.floor(Math.random() * kinds.length)], kinds[Math.floor(Math.random() * kinds.length)]];
    const mustHave = kinds.filter((k) => !picked.includes(k));
    if (mustHave.length > 0) picked.push(mustHave[Math.floor(Math.random() * mustHave.length)]);
    while (picked.length < n) picked.push(kinds[Math.floor(Math.random() * kinds.length)]);
    const unitHp = Array.from({ length: n }).map(() => hpMin + Math.floor(Math.random() * (hpMax - hpMin + 1)));
    state.appleBorerUnitsHp = unitHp.slice();
    state.appleBorerUnitsMaxHp = unitHp.slice();
    state.appleBorerUnitsStrength = Array.from({ length: n }).map(() => 0);
    state.appleBorerUnitsWeakTurns = Array.from({ length: n }).map(() => 0);
    state.appleBorerUnitsVulnerableTurns = Array.from({ length: n }).map(() => 0);
    state.appleBorerUnitsActionBags = Array.from({ length: n }).map(() => []);
    state.appleBorerUnitKinds = picked.slice(0, n);
    return;
  }
  const cfg = def?.behavior || {};
  const n = Math.max(2, Number(cfg.unitCount ?? 2));
  const singleHp = Number(cfg.unitHp ?? 30);
  const hpMin = Number(cfg.unitHpMin ?? singleHp);
  const hpMax = Number(cfg.unitHpMax ?? singleHp);
  const hp = Array.from({ length: n }).map(() => hpMin + Math.floor(Math.random() * (hpMax - hpMin + 1)));
  state.appleBorerUnitsHp = hp.slice();
  state.appleBorerUnitsMaxHp = hp.slice();
  state.appleBorerUnitsStrength = Array.from({ length: n }).map(() => 0);
  state.appleBorerUnitsWeakTurns = Array.from({ length: n }).map(() => 0);
  state.appleBorerUnitsVulnerableTurns = Array.from({ length: n }).map(() => 0);
  state.appleBorerUnitsActionBags = Array.from({ length: n }).map(
    () => createAppleBorerActionBagSystem({ shuffleFn, actions: cfg.actions }),
  );
  state.appleBorerUnitKinds = Array.from({ length: n }).map(() => 'appleBorer');
}

function tickEnemyDebuffsAfterEnemyTurnSystem({ state }) {
  // Enemy-side weak/vulnerable 的衰减在敌人回合结束后统一处理。
  if (state.enemyWeakTurns > 0) state.enemyWeakTurns -= 1;
  if (state.enemyVulnerableTurns > 0) state.enemyVulnerableTurns -= 1;
}

function diabloStepSystem({ state, damagePlayer, log, step, behavior, applyPlayerDebuff }) {
  const cfg = behavior.steps[step] || behavior.steps[0];
  if (cfg.type === 'attack') {
    const raw = cfg.base;
    log(`大菠萝挥击：${raw} 点基础伤害（经虚弱/易伤后与格挡结算）。`);
    damagePlayer(raw);
    return;
  }
  if (cfg.type === 'debuff') {
    if (typeof applyPlayerDebuff === 'function') {
      applyPlayerDebuff('weak', Number(cfg.weak ?? 0), 'diablo');
      applyPlayerDebuff('vulnerable', Number(cfg.vulnerable ?? 0), 'diablo');
    }
    log('大菠萝：诅咒 — 你获得 1 回合虚弱、2 回合易伤（叠层延长持续）。');
    return;
  }
  if (cfg.type === 'buffAndBlock') {
    state.enemyStrength += Number(cfg.strength ?? 0);
    state.enemyFortitude += Number(cfg.fortitude ?? 0);
    state.enemyBlock += Number(cfg.block ?? 0);
    log('大菠萝：强化 — 力量 +1、敏捷 +1（本作记为坚固，影响格挡加成），获得 10 点格挡。');
    return;
  }
  const perHit = Number(cfg.perHitBase ?? 0) + state.enemyStrength;
  const raw = perHit * Number(cfg.hits ?? 1);
  log(
    `大菠萝连击：${cfg.hits} 段 × ${perHit} 点（基础 ${cfg.perHitBase} + 力量 ${state.enemyStrength}，合计 ${raw} 点，经虚弱/易伤后与格挡一次结算）。`,
  );
  damagePlayer(raw, { incomingHits: Number(cfg.hits ?? 1) });
}

function diabloExecuteTurnSystem({ state, ENEMIES, damagePlayer, log, addCardToPlayerDiscard, applyPlayerDebuff }) {
  if (state.enemyHp <= 0) return;
  const def = ENEMIES.diablo;
  if (state.diabloPostWakeStun) {
    state.diabloPostWakeStun = false;
    log('── 大菠萝的行动 ──');
    log('大菠萝醒了，但仍眩晕，无法行动。下回合将进入攻击循环。');
    return;
  }
  const behavior = ENEMIES.diablo.behavior;
  if (state.diabloSleepRemaining > 0 && !state.diabloAwake) {
    if (typeof addCardToPlayerDiscard === 'function' && behavior.sleepAddDiscardCard) {
      addCardToPlayerDiscard(behavior.sleepAddDiscardCard);
      log('大菠萝沉睡外溢：向你的弃牌堆塞入 1 张「困意」。');
    }
    state.diabloSleepRemaining -= 1;
    log(`大菠萝沉睡中…（剩余 ${state.diabloSleepRemaining} 次敌方行动）`);
    if (state.diabloSleepRemaining === 0) {
      state.diabloAwake = true;
      log('大菠萝自然苏醒。');
    }
    return;
  }
  if (!state.diabloAwake) state.diabloAwake = true;
  const step = state.diabloCycleStep % behavior.steps.length;
  log(`── ${def.name} 的行动（第 ${step + 1}/4 步）──`);
  diabloStepSystem({ state, damagePlayer, log, step, behavior, applyPlayerDebuff });
  state.diabloCycleStep = (state.diabloCycleStep + 1) % behavior.steps.length;
}

function grayRatStepSystem({ state, damagePlayer, log, step, behavior }) {
  const cfg = behavior.steps[step] || behavior.steps[0];
  if (cfg.type === 'attack') {
    const dmg = Number(cfg.base ?? 0) + state.enemyStrength;
    log(`灰鼠攻击：${dmg} 点伤害（基础 6 + 力量 ${state.enemyStrength}）。`);
    damagePlayer(dmg);
    return;
  }
  if (cfg.type === 'buff') {
    state.enemyStrength += Number(cfg.strength ?? 0);
    state.enemyFortitude += Number(cfg.fortitude ?? 0);
    log('灰鼠：获得 1 点力量与 1 点坚固。');
    return;
  }
  const blk = Number(cfg.base ?? 0) + (cfg.scaleByFortitude ? state.enemyFortitude : 0);
  state.enemyBlock += blk;
  log(`灰鼠：获得 ${blk} 点格挡（基础 5 + 坚固 ${state.enemyFortitude}）。`);
}

function slimeStepSystem({ state, damagePlayer, log, step, behavior }) {
  const cfg = behavior.steps[step] || behavior.steps[0];
  if (cfg.type === 'attack') {
    const dmg = Number(cfg.base ?? 0) + state.enemyStrength;
    log(`史莱姆攻击：${dmg} 点伤害（基础 6 + 力量 ${state.enemyStrength}）。`);
    damagePlayer(dmg);
    return;
  }
  if (cfg.type === 'multiAttack') {
    const per = Number(cfg.perHitBase ?? 0) + state.enemyStrength;
    const total = per * Number(cfg.hits ?? 1);
    log(
      `史莱姆攻击：${cfg.hits} 段，每段 ${per} 点（基础 ${cfg.perHitBase} + 力量 ${state.enemyStrength}），合计 ${total} 点。`,
    );
    damagePlayer(total, { incomingHits: Number(cfg.hits ?? 1) });
    return;
  }
  state.enemyStrength += Number(cfg.strength ?? 0);
  const before = state.enemyHp;
  state.enemyHp = Math.min(state.enemyMaxHp, state.enemyHp + Number(cfg.heal ?? 0));
  const healed = state.enemyHp - before;
  log(`史莱姆：获得 1 点力量，回复 ${healed} 点生命（当前 ${state.enemyHp}/${state.enemyMaxHp}）。`);
}

function moltingSnakeExecuteTurnSystem({ state, damagePlayer, log, applyPlayerDebuff }) {
  const label = '蜕皮的蛇';
  if (!state.moltingSnakeMolted) {
    log(`── ${label} 的行动（蜕皮前）──`);
    const raw = 6;
    log(`蜕皮的蛇撕咬：造成 ${raw} 点伤害。`);
    damagePlayer(raw);
    state.enemyStrength += 1;
    log('蜕皮的蛇获得 1 点力量。');
    return;
  }

  const step = state.moltingSnakePostMoltingStep;
  if (step === 0) {
    log(`── ${label} 的行动（蜕皮后：虚弱）──`);
    if (typeof applyPlayerDebuff === 'function') applyPlayerDebuff('weak', 3, 'moltingSnake');
    log('你获得 3 层虚弱。');
    state.moltingSnakePostMoltingStep = 1;
    return;
  }
  if (step === 1) {
    log(`── ${label} 的行动（蜕皮后：坚固+护甲）──`);
    state.enemyFortitude += 1;
    state.enemyBlock += 5;
    log('蜕皮的蛇获得 1 层坚固，并获得 5 点护甲（格挡）。');
    state.moltingSnakePostMoltingStep = 2;
    return;
  }

  log(`── ${label} 的行动（蜕皮后：护甲反击）──`);
  const armor = state.enemyBlock;
  log(`根据护甲 ${armor} 点造成伤害。`);
  state.enemyBlock = 0; // 护甲转化为伤害
  if (armor > 0) damagePlayer(armor);
  state.moltingSnakePostMoltingStep = 1; // 返回“第二回合”，在第二/第三回合间循环
}

function witheredToadExecuteTurnSystem({ state, damagePlayer, log, addCardToPlayerDiscard, behavior }) {
  const resolvedBehavior = { steps: [{}, {}, {}], ...(behavior || {}) };
  const step = state.witheredToadCycleStep % resolvedBehavior.steps.length;
  const cfg = resolvedBehavior.steps[step] || resolvedBehavior.steps[0];
  log(`── 枯瘸蛙 的行动（第 ${step + 1}/3 步）──`);
  if (cfg.type === 'addStatusToDiscard') {
    const n = Math.max(1, Number(state[cfg.amountFromState] ?? resolvedBehavior.seedStart ?? 3));
    for (let i = 0; i < n; i += 1) addCardToPlayerDiscard(cfg.templateId);
    log(`枯萎传播：向你的弃牌堆塞入 ${n} 张「枯萎」。`);
  } else if (cfg.type === 'attack') {
    damagePlayer(Number(cfg.base ?? 0));
  } else {
    for (let i = 0; i < Number(cfg.hits ?? 1); i += 1) {
      damagePlayer(Number(cfg.perHitBase ?? 0));
      if (state.phase !== 'playing') return;
    }
    state.enemyStrength += Number(cfg.postBuffStrength ?? 0);
    log('枯瘸蛙获得 2 点力量。');
    state.witheredToadSeedCount = Math.max(1, Number(state.witheredToadSeedCount ?? resolvedBehavior.seedStart ?? 3))
      + Number(resolvedBehavior.seedGrowthPerCycle ?? 1);
  }
  state.witheredToadCycleStep = (state.witheredToadCycleStep + 1) % resolvedBehavior.steps.length;
}

function lihuabirdExecuteTurnSystem({ state, damagePlayer, log, addCardToPlayerHand, behavior, applyPlayerDebuff }) {
  const pendingHeal = Math.max(0, Number(state.lihuabirdPendingHeal ?? 0));
  if (pendingHeal > 0) {
    const before = state.enemyHp;
    state.enemyHp = Math.min(state.enemyMaxHp, state.enemyHp + pendingHeal);
    const healed = state.enemyHp - before;
    if (healed > 0) log(`离花弃枝：离花鸟回复 ${healed} 点生命。`);
    state.lihuabirdPendingHeal = 0;
  }

  const step = state.enemyCycleStep % behavior.steps.length;
  const cfg = behavior.steps[step] || behavior.steps[0];
  log(`── 离花鸟 的行动（第 ${step + 1}/3 步）──`);
  if (cfg.type === 'multiAttack') {
    const per = Number(cfg.perHitBase ?? 0) + state.enemyStrength;
    const total = per * Number(cfg.hits ?? 1);
    log(`离花鸟连击：${cfg.hits} 段 × ${per} 点（合计 ${total}）。`);
    damagePlayer(total, { incomingHits: Number(cfg.hits ?? 1) });
  } else if (cfg.type === 'debuffAndAddHand') {
    if (typeof applyPlayerDebuff === 'function') applyPlayerDebuff('weak', Number(cfg.weak ?? 0), 'lihuabird');
    addCardToPlayerHand(cfg.templateId);
    log('离花鸟：你获得 1 层虚弱，并将「离去的花」置入你的手牌。');
  } else {
    state.enemyBlock += Number(cfg.block ?? 0);
    state.enemyStrength += Number(cfg.strength ?? 0);
    log('离花鸟：获得 12 点护甲，并获得 1 点力量。');
  }
  state.enemyCycleStep = (state.enemyCycleStep + 1) % behavior.steps.length;
}

function gargoyleExecuteTurnSystem({ state, damagePlayer, log, behavior }) {
  const step = Math.min(2, state.enemyCycleStep);
  const cfg = behavior.steps[step] || behavior.steps[2];
  log(`── 石像鬼 的行动（第 ${step + 1} 步）──`);
  if (cfg.type === 'sleep') {
    log('石像鬼沉睡：本回合不行动。');
    state.enemyCycleStep = 1;
    return;
  }
  if (cfg.type === 'selfBuff') {
    const gain = Number(cfg.strength ?? 0);
    state.enemyStrength += gain;
    log(`石像鬼苏醒增强：力量 +${gain}。`);
    state.enemyCycleStep = 2;
    return;
  }
  const raw = Number(cfg.base ?? 0) + state.enemyStrength;
  log(`石像鬼重击：${raw} 点伤害（基础 ${cfg.base ?? 0} + 力量 ${state.enemyStrength}）。`);
  damagePlayer(raw);
  state.enemyCycleStep = 2;
}

function chestMimicExecuteTurnSystem({ state, damagePlayer, log, behavior }) {
  const step = state.enemyCycleStep % 3;
  const cfg = behavior.steps[step] || behavior.steps[0];
  log(`── 宝箱怪 的行动（第 ${step + 1}/3 步）──`);
  if (cfg.type === 'gainBlock') {
    const gain = Number(cfg.block ?? 30);
    state.enemyBlock += gain;
    log(`宝箱怪蜷缩：获得 ${gain} 点格挡。`);
    state.enemyCycleStep = 1;
    return;
  }
  const strike = Math.max(0, Number(state.enemyBlock ?? 0));
  state.enemyBlock = 0;
  const lostHp = strike > 0 ? damagePlayer(strike) : 0;
  if (state.phase !== 'playing' || state.enemyHp <= 0) return;
  const steal = Math.max(0, Math.min(Number(state.coins ?? 0), Number(lostHp ?? 0)));
  state.coins = Math.max(0, Number(state.coins ?? 0) - steal);
  state.chestMimicStolenCoins = Number(state.chestMimicStolenCoins ?? 0) + steal;
  log(`宝箱怪夺金：造成 ${lostHp} 点伤害，偷走 ${steal} 金币。`);
  state.enemyCycleStep = 2;
}

function goblinGangExecuteTurnSystem({ state, damagePlayer, log, addCardToPlayerHand, applyPlayerDebuff, behavior }) {
  const n = (state.appleBorerUnitsHp || []).length;
  log('── 小地精们 的行动 ──');
  for (let idx = 0; idx < n; idx += 1) {
    if ((state.appleBorerUnitsHp[idx] ?? 0) <= 0) continue;
    const kind = state.appleBorerUnitKinds?.[idx] || 'trickster';
    const unitLabel = `地精 ${idx + 1}`;
    if (kind === 'trickster') {
      const base = Number(behavior?.trickster?.attackBase ?? 4);
      const raw = base + Number(state.appleBorerUnitsStrength[idx] ?? 0);
      damagePlayer(raw, { enemyUnitIndex: idx });
      state.appleBorerUnitsStrength[idx] = Number(state.appleBorerUnitsStrength[idx] ?? 0) + Number(behavior?.trickster?.gainStrengthPerTurn ?? 1);
      log(`${unitLabel}（调皮）造成 ${raw} 点伤害，并获得 1 点力量。`);
      continue;
    }
    if (kind === 'taunter') {
      if (typeof applyPlayerDebuff === 'function') {
        applyPlayerDebuff('vulnerable', Number(behavior?.taunter?.applyVulnerable ?? 1), 'goblinTaunter');
        applyPlayerDebuff('fragile', Number(behavior?.taunter?.applyFragile ?? 1), 'goblinTaunter');
      }
      log(`${unitLabel}（嘲讽）使你获得 1 层易伤与 1 层脆弱。`);
      continue;
    }
    const cardId = String(behavior?.mage?.addHandCardTemplateId ?? 'magicExplosion');
    addCardToPlayerHand(cardId);
    log(`${unitLabel}（魔法）向你手牌塞入 1 张「魔法爆炸」。`);
  }
  for (let idx = 0; idx < n; idx += 1) {
    if (state.appleBorerUnitsWeakTurns[idx] > 0) state.appleBorerUnitsWeakTurns[idx] -= 1;
    if (state.appleBorerUnitsVulnerableTurns[idx] > 0) state.appleBorerUnitsVulnerableTurns[idx] -= 1;
  }
}

function chestMimicEscapeStepSystem({ state, log }) {
  state.chestMimicEscaped = true;
  state.enemyCycleStep = 0;
  log('宝箱怪趁乱逃走了！');
}

export function executeEnemyTurnSystem({
  state,
  ENEMIES,
  damagePlayer,
  log,
  createAppleBorerActionBag,
  addCardToPlayerDiscard,
  addCardToPlayerHand,
  applyPlayerDebuff,
}) {
  if (state.enemyHp <= 0) return;

  if (state.activeEnemyId === 'appleBorerPair') {
    if (!anyAppleBorerAliveSystem({ state })) return;
    const behavior = ENEMIES.appleBorerPair?.behavior || {};
    const debuffWeak = Number(behavior.debuffWeak ?? 1);
    const debuffVulnerable = Number(behavior.debuffVulnerable ?? 1);
    const attackBase = Number(behavior.attackBase ?? 6);
    const buffStrength = Number(behavior.buffStrength ?? 2);
    const actionList = Array.isArray(behavior.actions) ? behavior.actions : ['debuff', 'attack', 'buff'];
    log('── 苹果蛀虫 的行动 ──');
    const n = Array.isArray(state.appleBorerUnitsHp) ? state.appleBorerUnitsHp.length : 0;
    for (let idx = 0; idx < n; idx += 1) {
      if (state.appleBorerUnitsHp[idx] <= 0) continue;
      if (!state.appleBorerUnitsActionBags[idx].length) {
        state.appleBorerUnitsActionBags[idx] = createAppleBorerActionBag(actionList);
      }
      const action = state.appleBorerUnitsActionBags[idx].shift();
      const unitLabel = `蛀虫 ${idx + 1}`;
      if (action === 'debuff') {
        if (typeof applyPlayerDebuff === 'function') {
          applyPlayerDebuff('weak', debuffWeak, 'appleBorer');
          applyPlayerDebuff('vulnerable', debuffVulnerable, 'appleBorer');
        }
        log(`${unitLabel}喷吐酸液：你获得 ${debuffWeak} 回合虚弱与 ${debuffVulnerable} 回合易伤。`);
      } else if (action === 'attack') {
        const raw = attackBase + state.appleBorerUnitsStrength[idx];
        log(`${unitLabel}撕咬：造成 ${raw} 点基础伤害。`);
        damagePlayer(raw, { enemyUnitIndex: idx });
        if (state.phase !== 'playing') return;
      } else {
        state.appleBorerUnitsStrength[idx] += buffStrength;
        log(`${unitLabel}躁动：自身力量 +${buffStrength}。`);
      }
    }

    // tick apple borer debuffs at end of enemy turn
    for (let idx = 0; idx < n; idx += 1) {
      if (state.appleBorerUnitsWeakTurns[idx] > 0) state.appleBorerUnitsWeakTurns[idx] -= 1;
      if (state.appleBorerUnitsVulnerableTurns[idx] > 0) state.appleBorerUnitsVulnerableTurns[idx] -= 1;
    }
    return;
  }

  if (state.activeEnemyId === 'moltingSnake') {
    moltingSnakeExecuteTurnSystem({ state, damagePlayer, log, applyPlayerDebuff });
    tickEnemyDebuffsAfterEnemyTurnSystem({ state });
    return;
  }

  if (state.activeEnemyId === 'diablo') {
    diabloExecuteTurnSystem({ state, ENEMIES, damagePlayer, log, addCardToPlayerDiscard, applyPlayerDebuff });
    tickEnemyDebuffsAfterEnemyTurnSystem({ state });
    return;
  }

  if (state.activeEnemyId === 'witheredToad') {
    witheredToadExecuteTurnSystem({
      state,
      damagePlayer,
      log,
      addCardToPlayerDiscard,
      behavior: ENEMIES.witheredToad.behavior,
    });
    tickEnemyDebuffsAfterEnemyTurnSystem({ state });
    return;
  }

  if (state.activeEnemyId === 'lihuabird') {
    lihuabirdExecuteTurnSystem({
      state,
      damagePlayer,
      log,
      addCardToPlayerHand,
      behavior: ENEMIES.lihuabird.behavior,
      applyPlayerDebuff,
    });
    tickEnemyDebuffsAfterEnemyTurnSystem({ state });
    return;
  }

  if (state.activeEnemyId === 'gargoyle') {
    gargoyleExecuteTurnSystem({
      state,
      damagePlayer,
      log,
      behavior: ENEMIES.gargoyle.behavior,
    });
    tickEnemyDebuffsAfterEnemyTurnSystem({ state });
    return;
  }
  if (state.activeEnemyId === 'chestMimic') {
    const behavior = ENEMIES.chestMimic.behavior;
    const step = state.enemyCycleStep % 3;
    const cfg = behavior.steps[step] || behavior.steps[0];
    if (cfg.type === 'escape') {
      chestMimicEscapeStepSystem({ state, log });
      tickEnemyDebuffsAfterEnemyTurnSystem({ state });
      return;
    }
    chestMimicExecuteTurnSystem({
      state,
      damagePlayer,
      log,
      behavior,
    });
    tickEnemyDebuffsAfterEnemyTurnSystem({ state });
    return;
  }
  if (state.activeEnemyId === 'goblinGang') {
    goblinGangExecuteTurnSystem({
      state,
      damagePlayer,
      log,
      addCardToPlayerHand,
      applyPlayerDebuff,
      behavior: ENEMIES.goblinGang?.behavior,
    });
    return;
  }

  const def = ENEMIES[state.activeEnemyId];
  const behavior = def.behavior;
  const step = state.enemyCycleStep % behavior.steps.length;
  log(`── ${def.name} 的行动（第 ${step + 1}/${behavior.steps.length} 步）──`);
  if (state.activeEnemyId === 'grayRat') {
    grayRatStepSystem({ state, damagePlayer, log, step, behavior });
  } else {
    slimeStepSystem({ state, damagePlayer, log, step, behavior });
  }
  state.enemyCycleStep = (state.enemyCycleStep + 1) % behavior.steps.length;
  tickEnemyDebuffsAfterEnemyTurnSystem({ state });
}


