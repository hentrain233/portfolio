/**
 * Apply the effects of a played card to the battle state.
 * This module keeps DOM work out; it only calls injected callbacks
 * (e.g. `openDiscardOverlay`, `flashPlayerAura`) when necessary.
 */

export function applyCardEffectsSystem({
  played,
  state,
  targetIndex,
  // combat helpers
  resolveMultiHitDamage,
  resolveStrikeLikeDamage,
  damageEnemy,
  runMultiHitAttackEffects,
  flashPlayerAura,
  playEnemyHitFeedback,
  // apple borer helpers
  isAppleBorerEncounter,
  getAppleBorerTargetIndex,
  // constants / rules
  DEFEND_BASE_BLOCK,
  FRAGILE_CARD_BLOCK_MULT,
  // draw/skill interactions
  drawCards,
  addCardToPlayerHand,
  createCardByTemplateId,
  openDiscardOverlay,
  shouldAutoExhaustOnDiscard,
  losePlayerHp,
  MAX_SEEDS_PER_TURN = 99,
  MAX_ENERGY_CAP = 99,
  // visuals/logging
  log,
}) {
  const pickRandomAliveAppleBorerTarget = () => {
    const alive = [];
    const n = Array.isArray(state.appleBorerUnitsHp) ? state.appleBorerUnitsHp.length : 0;
    for (let i = 0; i < n; i += 1) {
      if ((state.appleBorerUnitsHp[i] ?? 0) > 0) alive.push(i);
    }
    if (!alive.length) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  };

  const getTargetEnemyHp = (preferredTargetIndex) => {
    if (!isAppleBorerEncounter()) return state.enemyHp;
    const idx = getAppleBorerTargetIndex(preferredTargetIndex);
    if (idx !== null) return state.appleBorerUnitsHp[idx];
    const fallback = pickRandomAliveAppleBorerTarget();
    return fallback === null ? 0 : state.appleBorerUnitsHp[fallback];
  };

  const getResolvedTargetIndex = (preferredTargetIndex) => {
    if (!isAppleBorerEncounter()) return null;
    const idx = getAppleBorerTargetIndex(preferredTargetIndex);
    if (idx !== null) return idx;
    return pickRandomAliveAppleBorerTarget();
  };

  const targetHasVulnerable = (preferredTargetIndex) => {
    if (isAppleBorerEncounter()) {
      const idx = getResolvedTargetIndex(preferredTargetIndex);
      if (idx === null) return false;
      return Number(state.appleBorerUnitsVulnerableTurns?.[idx] ?? 0) > 0;
    }
    return Number(state.enemyVulnerableTurns ?? 0) > 0;
  };

  const applyVulnerableToTarget = (layers, preferredTargetIndex) => {
    const amount = Number(layers ?? 0);
    if (amount <= 0) return;
    if (isAppleBorerEncounter()) {
      const idx = getResolvedTargetIndex(preferredTargetIndex);
      if (idx === null) return;
      state.appleBorerUnitsVulnerableTurns[idx] += amount;
      log(`效果：目标单位获得 ${amount} 层易伤。`);
      return;
    }
    state.enemyVulnerableTurns += amount;
    log(`效果：敌人获得 ${amount} 层易伤。`);
  };

  const applyWeakToTarget = (layers, preferredTargetIndex) => {
    const amount = Number(layers ?? 0);
    if (amount <= 0) return;
    if (isAppleBorerEncounter()) {
      const idx = getResolvedTargetIndex(preferredTargetIndex);
      if (idx === null) return;
      state.appleBorerUnitsWeakTurns[idx] += amount;
      log(`效果：目标单位获得 ${amount} 层虚弱。`);
      return;
    }
    state.enemyWeakTurns += amount;
    log(`效果：敌人获得 ${amount} 层虚弱。`);
  };

  const applyCardBlock = (baseBlock) => {
    flashPlayerAura('defend');
    if (state.blockGainLockedThisTurn) {
      log('效果：本回合已被限制，无法再获得格挡。');
      return;
    }
    const rawBlockVal = Number(baseBlock ?? DEFEND_BASE_BLOCK) + state.fortitude;
    const fragileMult = Number(FRAGILE_CARD_BLOCK_MULT ?? 0.5);
    const blockVal = state.playerFragileTurns > 0
      ? Math.floor(rawBlockVal * fragileMult)
      : rawBlockVal;
    state.playerBlock += blockVal;
    if (state.playerFragileTurns > 0) {
      const pct = Math.round(fragileMult * 100);
      log(`效果：获得 ${blockVal} 点格挡（基础 ${baseBlock}+坚固 ${state.fortitude}，脆弱生效为 ${pct}%），当前格挡 ${state.playerBlock}。`);
    } else {
      log(`效果：获得 ${blockVal} 点格挡（基础 ${baseBlock}+坚固 ${state.fortitude}），当前格挡 ${state.playerBlock}。`);
    }
  };

  const consumeAllSeedsInHand = () => {
    let consumed = 0;
    const kept = [];
    (state.hand || []).forEach((card) => {
      if (card?.templateId === 'seed') {
        state.exhaustPile.push(card);
        consumed += 1;
      } else {
        kept.push(card);
      }
    });
    state.hand = kept;
    return consumed;
  };

  const applyDrawEffect = (count, sourceText = '') => {
    const drawCount = Math.max(0, Number(count ?? 0));
    if (drawCount <= 0) return 0;
    const extra = drawCards(drawCount);
    if (sourceText) {
      log(`效果：${sourceText}抽 ${drawCount} 张牌（实际抽到 ${extra} 张）。`);
    } else {
      log(`效果：抽 ${drawCount} 张牌（实际抽到 ${extra} 张）。`);
    }
    return extra;
  };

  const applyChampionAttackRampIfNeeded = () => {
    if (!state.championStrengthDoublingActive) return;
    state.tempAttackStrengthMultiplier = Math.max(1, Number(state.tempAttackStrengthMultiplier ?? 1)) + 1;
    log(`效果：冠军之力触发，攻击力量倍率提升至 x${state.tempAttackStrengthMultiplier}。`);
  };

  if (played.kind === 'attack' && state.championStrengthDoublingActive && played.templateId !== 'championMight') {
    applyChampionAttackRampIfNeeded();
  }

  if (played.selfHpLoss && played.selfHpLoss > 0) {
    const lost = typeof losePlayerHp === 'function' ? losePlayerHp(played.selfHpLoss) : 0;
    log(`效果：失去 ${lost || played.selfHpLoss} 点生命。`);
  }

  if (played.templateId === 'decisiveBattle') {
    state.decisiveBattleActive = true;
    flashPlayerAura('power');
    log('能力「决战」：本场战斗中打击造成双倍伤害；此后只能打出攻击牌。');
  } else if (played.templateId === 'crescendo') {
    const sg = played.strengthGain ?? 0;
    const fg = played.fortitudeGain ?? 0;
    state.strength += sg;
    state.fortitude += fg;
    flashPlayerAura('power');
    log(`能力「渐强」：力量 +${sg}，坚固 +${fg}（本场战斗持续）。`);
  } else if (played.templateId === 'jealousy') {
    const targetHp = getTargetEnemyHp(targetIndex);
    const high = played.jealousyHighGain ?? 3;
    const low = played.jealousyLowGain ?? 1;
    const gain = state.playerHp < targetHp ? high : low;
    state.strength += gain;
    flashPlayerAura('power');
    log(`效果：妒忌判定（我方 ${state.playerHp} / 目标 ${targetHp}），获得 ${gain} 点力量。`);
  } else if (played.templateId === 'championMight') {
    const shouldDoubleBefore = !!played.championDoubleBeforeDamage;
    if (shouldDoubleBefore) {
      state.tempAttackStrengthMultiplier = Math.max(1, Number(state.tempAttackStrengthMultiplier ?? 1)) + 1;
      log(`效果：冠军之力先触发，攻击力量倍率提升至 x${state.tempAttackStrengthMultiplier}。`);
    }
    const r = resolveMultiHitDamage(played);
    if (r) {
      runMultiHitAttackEffects(r.count);
      log(`效果：冠军之力造成 ${r.count} 次 ${r.perHit} 点伤害。`);
      if (isAppleBorerEncounter()) {
        for (let i = 0; i < r.count; i += 1) {
          const target = pickRandomAliveAppleBorerTarget();
          if (target === null) break;
          damageEnemy(r.perHit, { targetIndex: target });
        }
      } else {
        damageEnemy(r.total, { targetIndex });
      }
    }
    if (!shouldDoubleBefore) {
      state.tempAttackStrengthMultiplier = Math.max(1, Number(state.tempAttackStrengthMultiplier ?? 1)) + 1;
      log(`效果：冠军之力触发，攻击力量倍率提升至 x${state.tempAttackStrengthMultiplier}。`);
    }
    state.championStrengthDoublingActive = !!played.championStrengthDoubleThisTurn;
  } else if (played.templateId === 'adaptive') {
    const gain = Number(played.healAfterBattle ?? 0);
    if (gain > 0) {
      state.battleEndHealBonus = Number(state.battleEndHealBonus ?? 0) + gain;
      flashPlayerAura('power');
      log(`能力「自适应」：本场战斗结算时额外恢复 ${gain} 点生命。`);
    }
  } else if (played.templateId === 'plunder') {
    const gain = Number(played.bonusCoinsAfterBattle ?? 0);
    if (gain > 0) {
      state.battleEndBonusCoins = Number(state.battleEndBonusCoins ?? 0) + gain;
      flashPlayerAura('power');
      log(`能力「掠夺」：本场战斗结算时额外获得 ${gain} 金币。`);
    }
  } else if (played.templateId === 'growth' || played.templateId === 'fallingLeaf') {
    const sg = Number(played.tempStrengthGainThisTurn ?? 0);
    const fg = Number(played.tempFortitudeGainThisTurn ?? 0);
    if (sg !== 0) {
      state.strength += sg;
      state.tempStrengthDeltaThisTurn = Number(state.tempStrengthDeltaThisTurn ?? 0) + sg;
    }
    if (fg !== 0) {
      state.fortitude += fg;
      state.tempFortitudeDeltaThisTurn = Number(state.tempFortitudeDeltaThisTurn ?? 0) + fg;
    }
    if (sg !== 0 || fg !== 0) {
      log(`效果：本回合临时获得 ${sg} 点力量、${fg} 点坚固（下回合开始撤销）。`);
    }
    if (played.addHandCardTemplateId && typeof addCardToPlayerHand === 'function') {
      const cnt = Math.max(1, Number(played.addHandCardCount ?? 1));
      let addedCount = 0;
      let name = '';
      for (let i = 0; i < cnt; i += 1) {
        const added = addCardToPlayerHand(played.addHandCardTemplateId);
        if (added) {
          addedCount += 1;
          name = added.name || name;
        }
      }
      if (addedCount > 0) log(`效果：将 ${addedCount} 张「${name || played.addHandCardTemplateId}」加入手牌。`);
    }
    if (Number(played.draw ?? 0) > 0) {
      applyDrawEffect(played.draw);
    }
  } else if (played.templateId === 'seed') {
    const planted = Math.max(0, Number(state.plantedSeedsThisTurn ?? 0));
    if (planted >= MAX_SEEDS_PER_TURN) {
      log(`效果：本回合播种已达上限 ${MAX_SEEDS_PER_TURN}，该种子未生效。`);
    } else {
      const gainEnergy = Math.max(0, Number(played.seedPlantEnergyNextTurn ?? 1));
      const gainDraw = Math.max(0, Number(played.seedPlantDrawNextTurn ?? 1));
      state.pendingSeedEnergyNextTurn = Math.min(MAX_ENERGY_CAP, Number(state.pendingSeedEnergyNextTurn ?? 0) + gainEnergy);
      state.pendingSeedDrawNextTurn = Math.max(0, Number(state.pendingSeedDrawNextTurn ?? 0) + gainDraw);
      state.plantedSeedsThisTurn = planted + 1;
      log(`播种成功：下回合能量 +${gainEnergy}，额外抽牌 +${gainDraw}（本回合已播种 ${state.plantedSeedsThisTurn}/${MAX_SEEDS_PER_TURN}）。`);
    }
  } else if (played.templateId === 'seedBag') {
    const n = Math.max(1, Number(played.addHandCardCount ?? 2));
    let added = 0;
    for (let i = 0; i < n; i += 1) {
      const c = typeof addCardToPlayerHand === 'function' ? addCardToPlayerHand('seed') : null;
      if (c) added += 1;
    }
    log(`效果：将 ${added} 张「种子」加入手牌。`);
  } else if (played.templateId === 'seedSlingshot') {
    const consumed = consumeAllSeedsInHand();
    const perSeed = Math.max(0, Number(played.consumeSeedsInHandDamagePerSeed ?? 5));
    const total = consumed * perSeed;
    if (consumed > 0) {
      runMultiHitAttackEffects(consumed);
      damageEnemy(total, { targetIndex });
      log(`效果：消耗 ${consumed} 张种子，造成 ${perSeed}×${consumed} = ${total} 点伤害。`);
    } else {
      log('效果：手牌中没有可消耗的种子。');
    }
  } else if (played.templateId === 'witheredSpring') {
    const xSpent = Math.max(0, Number(played.xSpentEnergy ?? 0));
    const bonusHits = Math.max(0, Number(played.xCostBonusHits ?? 0));
    const hitCount = xSpent + bonusHits;
    const perBase = Math.max(0, Number(played.xCostPerHitDamage ?? 7));
    if (hitCount > 0) {
      const r = resolveMultiHitDamage({ ...played, multiHit: { count: hitCount, perHit: perBase } });
      if (r) {
        runMultiHitAttackEffects(r.count);
        damageEnemy(r.total, { targetIndex });
        log(`效果：X 结算为 ${xSpent}${bonusHits > 0 ? `+${bonusHits}` : ''} 次，每次 ${r.perHit}，合计 ${r.total} 点。`);
      }
    } else {
      log('效果：X 为 0，未造成伤害。');
    }
  } else if (played.templateId === 'tolerance') {
    const baseBlock = played.block ?? DEFEND_BASE_BLOCK;
    applyCardBlock(baseBlock);
    const pickedUid = played.transformTargetUid ?? null;
    let idx = -1;
    if (pickedUid) idx = (state.hand || []).findIndex((c) => c?.uid === pickedUid);
    if (idx < 0) idx = (state.hand || []).findIndex((c) => c?.templateId !== 'seed');
    if (idx >= 0 && typeof createCardByTemplateId === 'function') {
      const oldName = state.hand[idx]?.name || '卡牌';
      const toUpgraded = !!played.transformToUpgradedSeed;
      const replaced = createCardByTemplateId('seed', toUpgraded);
      if (replaced) {
        state.hand[idx] = replaced;
        log(`效果：将手牌中的「${oldName}」转化为「${replaced.name}」。`);
      }
    } else {
      log('效果：手牌中没有可转化的目标。');
    }
  } else if (played.kind === 'attack' && played.multiHit) {
    const r = resolveMultiHitDamage(played);
    if (r) {
      runMultiHitAttackEffects(r.count);
      log(`效果：连击 ${r.count} 次，每次 ${r.perHit} 点（每段 ${r.basePer}+力量结算），合计 ${r.total} 点。`);
      if (played.randomEnemyPerHit && isAppleBorerEncounter()) {
        for (let i = 0; i < r.count; i += 1) {
          const target = pickRandomAliveAppleBorerTarget();
          if (target === null) break;
          damageEnemy(r.perHit, { targetIndex: target });
        }
      } else {
        damageEnemy(r.total, { targetIndex });
      }
    }
  } else if (played.kind === 'attack') {
    const hadTargetVulnerable = targetHasVulnerable(targetIndex);
    const { dmg, isStrike } = resolveStrikeLikeDamage(played);
    flashPlayerAura('attack');
    playEnemyHitFeedback();
    log(`效果：造成 ${dmg} 点伤害${isStrike && state.decisiveBattleActive ? '（决战：打击双倍）' : ''}。`);
    damageEnemy(dmg, { ignoreEnemyVulnerable: !!played.ignoreTargetVulnerable, targetIndex });
    if (hadTargetVulnerable) {
      const energyGain = Number(played.gainEnergyIfTargetVulnerable ?? 0);
      const drawGain = Number(played.drawIfTargetVulnerable ?? 0);
      if (energyGain > 0) {
        state.energy = Math.min(MAX_ENERGY_CAP, Number(state.energy ?? 0) + energyGain);
        log(`效果：目标已处于易伤，获得 ${energyGain} 点能量。`);
      }
      if (drawGain > 0) {
        applyDrawEffect(drawGain, '目标已处于易伤，额外');
      }
    }
    applyVulnerableToTarget(played.vulnerable, targetIndex);
    applyWeakToTarget(played.weak, targetIndex);
  } else if (played.kind === 'defend') {
    const baseBlock = played.block ?? DEFEND_BASE_BLOCK;
    applyCardBlock(baseBlock);
    applyVulnerableToTarget(played.vulnerable, targetIndex);
  } else if (played.kind === 'skill') {
    if (Number(played.block ?? 0) > 0) {
      applyCardBlock(played.block);
    }
    applyVulnerableToTarget(played.vulnerable, targetIndex);
    applyWeakToTarget(played.weak, targetIndex);
    if (played.draw) {
      applyDrawEffect(played.draw);
    }
    if (played.discard) {
      openDiscardOverlay(played.discard);
    }
  }

  if (played.templateId !== 'crescendo' && (played.strengthGain || played.fortitudeGain)) {
    const sg = Number(played.strengthGain ?? 0);
    const fg = Number(played.fortitudeGain ?? 0);
    if (sg > 0) state.strength += sg;
    if (fg > 0) state.fortitude += fg;
    if (sg > 0 || fg > 0) log(`效果：获得 ${sg} 点力量、${fg} 点坚固。`);
  }

  if (played.gainMaxHp && Number(played.gainMaxHp) > 0) {
    const inc = Number(played.gainMaxHp);
    state.playerMaxHp += inc;
    state.playerHp += inc;
    log(`效果：最大生命 +${inc}，并回复同等生命。`);
  }

  if (played.gainEnergy && played.gainEnergy > 0) {
    state.energy = Math.min(MAX_ENERGY_CAP, Number(state.energy ?? 0) + played.gainEnergy);
    log(`效果：获得 ${played.gainEnergy} 点能量。`);
  }

  if (played.lockBlockGainThisTurn) {
    state.blockGainLockedThisTurn = true;
    log('效果：本回合不能再获得格挡。');
  }

  // Card lifecycle: power -> removed, exhaust -> exhaust pile, otherwise discard.
  if (played.kind === 'power') {
    log(`「${played.name}」作为能力牌，打出后移出本场战斗。`);
  } else if (played.exhaust || (typeof shouldAutoExhaustOnDiscard === 'function' && shouldAutoExhaustOnDiscard(played))) {
    state.exhaustPile.push(played);
    log(`「${played.name}」触发消耗，移入消耗牌堆。`);
  } else {
    state.discardPile.push(played);
    log(`「${played.name}」进入弃牌堆。`);
  }

  return true;
}

