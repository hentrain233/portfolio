/**
 * Build enemy intent HTML.
 * This module intentionally knows nothing about DOM; it returns strings
 * so `game.js` can inject them into `els.enemyIntent`.
 */

export function buildMultiUnitIntentHtmlSystem({
  state,
  ENEMIES,
  applyEnemyOutgoingDamage,
  createAppleBorerActionBag,
  unitIndex,
}) {
  if (unitIndex < 0) return '';
  const hp = Number(state.appleBorerUnitsHp?.[unitIndex] ?? 0);
  if (hp <= 0) return '<span class="intent-piece intent-hint"><span class="intent-sub">已倒下</span></span>';
  if (state.activeEnemyId === 'appleBorerPair') {
    const behavior = ENEMIES.appleBorerPair?.behavior || {};
    const debuffWeak = Number(behavior.debuffWeak ?? 1);
    const debuffVulnerable = Number(behavior.debuffVulnerable ?? 1);
    const attackBase = Number(behavior.attackBase ?? 6);
    const buffStrength = Number(behavior.buffStrength ?? 2);
    if (!state.appleBorerUnitsActionBags[unitIndex]?.length) {
      state.appleBorerUnitsActionBags[unitIndex] = createAppleBorerActionBag(behavior.actions);
    }
    const next = state.appleBorerUnitsActionBags[unitIndex][0];
    if (next === 'debuff') {
      return `<span class="intent-piece intent-debuff"><span class="intent-ico">虚</span><span class="intent-num">${debuffWeak}</span><span class="intent-sub">+易${debuffVulnerable}</span></span>`;
    }
    if (next === 'attack') {
      const raw = attackBase + Number(state.appleBorerUnitsStrength?.[unitIndex] ?? 0);
      return `<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${applyEnemyOutgoingDamage(raw, { enemyUnitIndex: unitIndex })}</span></span>`;
    }
    return `<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+${buffStrength}</span></span>`;
  }
  if (state.activeEnemyId === 'goblinGang') {
    const kind = state.appleBorerUnitKinds?.[unitIndex] || 'trickster';
    if (kind === 'trickster') {
      const raw = 4 + Number(state.appleBorerUnitsStrength?.[unitIndex] ?? 0);
      return `<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${applyEnemyOutgoingDamage(raw, { enemyUnitIndex: unitIndex })}</span></span><span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+1</span></span>`;
    }
    if (kind === 'taunter') {
      return '<span class="intent-piece intent-debuff"><span class="intent-ico">易</span><span class="intent-num">1</span><span class="intent-sub">+脆1</span></span>';
    }
    return '<span class="intent-piece intent-addcard"><span class="intent-ico">爆</span><span class="intent-sub">魔法爆炸</span></span>';
  }
  return '';
}

export function buildEnemyIntentHTML({ state, ENEMIES, applyEnemyOutgoingDamage, createAppleBorerActionBag }) {
  const id = state.activeEnemyId;
  if (!id) return '';

  const parts = [];

  if (id === 'appleBorerPair') {
    const behavior = ENEMIES.appleBorerPair?.behavior || {};
    const debuffWeak = Number(behavior.debuffWeak ?? 1);
    const debuffVulnerable = Number(behavior.debuffVulnerable ?? 1);
    const attackBase = Number(behavior.attackBase ?? 6);
    const buffStrength = Number(behavior.buffStrength ?? 2);
    const n = Array.isArray(state.appleBorerUnitsHp) ? state.appleBorerUnitsHp.length : 0;
    for (let idx = 0; idx < n; idx += 1) {
      if (state.appleBorerUnitsHp[idx] <= 0) continue;
      if (!state.appleBorerUnitsActionBags[idx].length) {
        state.appleBorerUnitsActionBags[idx] = createAppleBorerActionBag(behavior.actions);
      }
      const next = state.appleBorerUnitsActionBags[idx][0];
      if (next === 'debuff') {
        parts.push(
          `<span class="intent-piece intent-debuff"><span class="intent-ico">虚</span><span class="intent-num">${debuffWeak}</span><span class="intent-sub">+易${debuffVulnerable}（蛀虫${idx + 1}）</span></span>`,
        );
      } else if (next === 'attack') {
        const raw = attackBase + state.appleBorerUnitsStrength[idx];
        const eff = applyEnemyOutgoingDamage(raw, { enemyUnitIndex: idx });
        parts.push(
          `<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span><span class="intent-sub">（蛀虫${idx + 1}）</span></span>`,
        );
      } else {
        parts.push(
          `<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+${buffStrength}（蛀虫${idx + 1}）</span></span>`,
        );
      }
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'moltingSnake') {
    if (!state.moltingSnakeMolted) {
      const eff = applyEnemyOutgoingDamage(6);
      parts.push(
        `<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span><span class="intent-sub">（蜕皮前）</span></span>`,
      );
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+1</span></span>`);
      return `<div class="intent-row">${parts.join('')}</div>`;
    }

    const step = state.moltingSnakePostMoltingStep;
    if (step === 0) {
      parts.push(`<span class="intent-piece intent-debuff"><span class="intent-ico">虚</span><span class="intent-num">3</span><span class="intent-sub">（蜕皮后）</span></span>`);
    } else if (step === 1) {
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">坚固+1</span></span>`);
      parts.push(`<span class="intent-piece intent-block"><span class="intent-ico">🛡</span><span class="intent-num">+5</span></span>`);
    } else {
      const armor = Math.max(0, state.enemyBlock);
      const eff = applyEnemyOutgoingDamage(armor);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span><span class="intent-sub">（护甲${armor}）</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'diablo') {
    const behavior = ENEMIES.diablo.behavior;
    if (state.diabloPostWakeStun) {
      parts.push(`<span class="intent-piece intent-stun"><span class="intent-ico">💫</span><span class="intent-sub">眩晕</span></span>`);
      return `<div class="intent-row">${parts.join('')}</div>`;
    }

    if (state.diabloSleepRemaining > 0 && !state.diabloAwake) {
      parts.push(`<span class="intent-piece intent-sleep"><span class="intent-ico">💤</span><span class="intent-sub">剩余${state.diabloSleepRemaining}次</span></span>`);
      return `<div class="intent-row">${parts.join('')}</div>`;
    }

    const step = state.diabloCycleStep % behavior.steps.length;
    const cfg = behavior.steps[step] || behavior.steps[0];
    if (cfg.type === 'attack') {
      const raw = cfg.base;
      const eff = applyEnemyOutgoingDamage(raw);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span></span>`);
      if (eff !== raw) parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">基础${raw}</span></span>`);
    } else if (cfg.type === 'debuff') {
      parts.push(`<span class="intent-piece intent-debuff"><span class="intent-ico">虚</span><span class="intent-num">${cfg.weak}</span></span>`);
      parts.push(`<span class="intent-piece intent-debuff"><span class="intent-ico">易</span><span class="intent-num">${cfg.vulnerable}</span></span>`);
    } else if (cfg.type === 'buffAndBlock') {
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力固</span></span>`);
      parts.push(`<span class="intent-piece intent-block"><span class="intent-ico">🛡</span><span class="intent-num">${cfg.block}</span></span>`);
    } else {
      const perHitBase = cfg.perHitBase + state.enemyStrength;
      const hitCount = cfg.hits;
      const rawTotal = perHitBase * hitCount;
      const effTotal = applyEnemyOutgoingDamage(rawTotal);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${perHitBase}</span><span class="intent-sub">×${hitCount}</span></span>`);
      if (effTotal !== rawTotal) parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">合计约${effTotal}</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'witheredToad') {
    const behavior = ENEMIES.witheredToad.behavior;
    const step = state.witheredToadCycleStep % behavior.steps.length;
    const cfg = behavior.steps[step] || behavior.steps[0];
    if (cfg.type === 'addStatusToDiscard') {
      const n = Math.max(1, Number(state.witheredToadSeedCount ?? 3));
      parts.push(`<span class="intent-piece intent-addcard"><span class="intent-ico">枯</span><span class="intent-num">${n}</span><span class="intent-sub">塞入弃牌堆</span></span>`);
    } else if (cfg.type === 'attack') {
      const eff = applyEnemyOutgoingDamage(cfg.base);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span></span>`);
    } else {
      const per = applyEnemyOutgoingDamage(cfg.perHitBase);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${per}</span><span class="intent-sub">×3</span></span>`);
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+2</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'lihuabird') {
    const behavior = ENEMIES.lihuabird.behavior;
    const step = state.enemyCycleStep % behavior.steps.length;
    const cfg = behavior.steps[step] || behavior.steps[0];
    const pendingHeal = Math.max(0, Number(state.lihuabirdPendingHeal ?? 0));
    if (pendingHeal > 0) {
      parts.push(`<span class="intent-piece intent-heal"><span class="intent-num">+${pendingHeal}</span></span>`);
    }
    if (cfg.type === 'multiAttack') {
      const perHitBase = cfg.perHitBase + state.enemyStrength;
      const rawTotal = perHitBase * cfg.hits;
      const effTotal = applyEnemyOutgoingDamage(rawTotal);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${perHitBase}</span><span class="intent-sub">×${cfg.hits}</span></span>`);
      if (effTotal !== rawTotal) parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">合计约${effTotal}</span></span>`);
    } else if (cfg.type === 'debuffAndAddHand') {
      parts.push(`<span class="intent-piece intent-debuff"><span class="intent-ico">虚</span><span class="intent-num">${cfg.weak}</span></span>`);
      parts.push(`<span class="intent-piece intent-addcard"><span class="intent-ico">花</span><span class="intent-num">1</span><span class="intent-sub">塞入手牌</span></span>`);
    } else {
      parts.push(`<span class="intent-piece intent-block"><span class="intent-ico">🛡</span><span class="intent-num">${cfg.block}</span></span>`);
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+${cfg.strength}</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'gargoyle') {
    const behavior = ENEMIES.gargoyle.behavior;
    const step = Math.min(2, Number(state.enemyCycleStep ?? 0));
    const cfg = behavior.steps[step] || behavior.steps[2];
    const slowPct = Math.round((Number(behavior.slowPerCard ?? 0.1) * 100));
    const slowStacks = Math.max(0, Number(state.playedCardsThisTurn ?? 0));
    parts.push(`<span class="intent-piece intent-hint" title="迟缓：同一回合内，你每打出一张牌，石像鬼本回合受到伤害 +${slowPct}%。"><span class="intent-sub">迟缓${slowStacks}</span></span>`);
    if (cfg.type === 'sleep') {
      parts.push(`<span class="intent-piece intent-sleep"><span class="intent-ico">💤</span><span class="intent-sub">睡眠</span></span>`);
    } else if (cfg.type === 'selfBuff') {
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span><span class="intent-sub">力量+${cfg.strength}</span></span>`);
    } else {
      const raw = Number(cfg.base ?? 0) + state.enemyStrength;
      const eff = applyEnemyOutgoingDamage(raw);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'chestMimic') {
    const behavior = ENEMIES.chestMimic.behavior;
    const step = Number(state.enemyCycleStep ?? 0) % 3;
    const cfg = behavior.steps[step] || behavior.steps[0];
    if (cfg.type === 'gainBlock') {
      parts.push(`<span class="intent-piece intent-block"><span class="intent-ico">🛡</span><span class="intent-num">+${cfg.block ?? 30}</span></span>`);
    } else if (cfg.type === 'escape') {
      parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">逃跑</span></span>`);
    } else {
      const raw = Math.max(0, Number(state.enemyBlock ?? 0));
      const eff = applyEnemyOutgoingDamage(raw);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span><span class="intent-sub">并偷金币</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  if (id === 'goblinGang') {
    const kinds = Array.isArray(state.appleBorerUnitKinds) ? state.appleBorerUnitKinds : [];
    const hpArr = Array.isArray(state.appleBorerUnitsHp) ? state.appleBorerUnitsHp : [];
    for (let idx = 0; idx < hpArr.length; idx += 1) {
      if ((hpArr[idx] ?? 0) <= 0) continue;
      const kind = kinds[idx] || 'trickster';
      if (kind === 'trickster') {
        const raw = 4 + Number(state.appleBorerUnitsStrength?.[idx] ?? 0);
        const eff = applyEnemyOutgoingDamage(raw, { enemyUnitIndex: idx });
        parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span><span class="intent-sub">（调皮${idx + 1}）</span></span>`);
      } else if (kind === 'taunter') {
        parts.push(`<span class="intent-piece intent-debuff"><span class="intent-ico">易</span><span class="intent-num">1</span><span class="intent-sub">+脆1（嘲讽${idx + 1}）</span></span>`);
      } else {
        parts.push(`<span class="intent-piece intent-addcard"><span class="intent-ico">爆</span><span class="intent-num">1</span><span class="intent-sub">魔法爆炸</span></span>`);
      }
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  const step = state.enemyCycleStep % 3;
  if (id === 'grayRat') {
    const behavior = ENEMIES.grayRat.behavior;
    const cfg = behavior.steps[step] || behavior.steps[0];
    if (cfg.type === 'attack') {
      const raw = cfg.base + state.enemyStrength;
      const eff = applyEnemyOutgoingDamage(raw);
      parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span></span>`);
      if (eff !== raw) parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">基础${raw}</span></span>`);
    } else if (cfg.type === 'buff') {
      parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span></span>`);
    } else {
      const blk = cfg.base + state.enemyFortitude;
      parts.push(`<span class="intent-piece intent-block"><span class="intent-ico">🛡</span><span class="intent-num">${blk}</span></span>`);
    }
    return `<div class="intent-row">${parts.join('')}</div>`;
  }

  // slime & other 3-step enemies default
  const slimeBehavior = ENEMIES.slime.behavior;
  const slimeCfg = slimeBehavior.steps[step] || slimeBehavior.steps[0];
  if (slimeCfg.type === 'attack') {
    const raw = slimeCfg.base + state.enemyStrength;
    const eff = applyEnemyOutgoingDamage(raw);
    parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${eff}</span></span>`);
    if (eff !== raw) parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">基础${raw}</span></span>`);
  } else if (slimeCfg.type === 'multiAttack') {
    const perHitBase = slimeCfg.perHitBase + state.enemyStrength;
    const hitCount = slimeCfg.hits;
    const rawTotal = perHitBase * hitCount;
    const effTotal = applyEnemyOutgoingDamage(rawTotal);
    parts.push(`<span class="intent-piece intent-attack"><span class="intent-ico">⚔</span><span class="intent-num">${perHitBase}</span><span class="intent-sub">×${hitCount}</span></span>`);
    if (effTotal !== rawTotal) parts.push(`<span class="intent-piece intent-hint"><span class="intent-sub">合计约${effTotal}</span></span>`);
  } else {
    parts.push(`<span class="intent-piece intent-buff"><span class="intent-ico">↑</span></span>`);
    parts.push(`<span class="intent-piece intent-heal"><span class="intent-num">+${slimeCfg.heal}</span></span>`);
  }
  return `<div class="intent-row">${parts.join('')}</div>`;
}

