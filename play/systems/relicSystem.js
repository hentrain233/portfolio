export function addRelicByIdSystem({ relicId, state, RELIC_DEFS }) {
  const def = RELIC_DEFS[relicId];
  if (!def) return;
  if (state.relics.some((r) => r.id === def.id)) return;
  state.relics = state.relics.concat([{ id: def.id, name: def.name, icon: def.icon, desc: def.desc, effects: def.effects }]);
}

export function hasRelicEffectSystem({ state, effectKey }) {
  return (state.relics || []).some((r) => Number(r?.effects?.[effectKey] ?? 0) > 0 || r?.effects?.[effectKey] === true);
}

export function sumRelicEffectSystem({ state, effectKey }) {
  return (state.relics || []).reduce((acc, r) => acc + Number(r?.effects?.[effectKey] ?? 0), 0);
}

export function applyIncomingPlayerDebuffWithRelicSystem({ state, type, amount, logFn }) {
  const n = Math.max(0, Number(amount || 0));
  if (n <= 0) return 0;
  const hasYinYang = hasRelicEffectSystem({ state, effectKey: 'firstIncomingWeakOrVulnImmuneOncePerBattle' });
  if (hasYinYang && !state.relicYinYangTriggeredThisBattle) {
    state.relicYinYangTriggeredThisBattle = true;
    const gainStrength = sumRelicEffectSystem({ state, effectKey: 'gainStrengthOnTrigger' }) || 1;
    const gainFortitude = sumRelicEffectSystem({ state, effectKey: 'gainFortitudeOnTrigger' }) || 1;
    state.strength += gainStrength;
    state.fortitude += gainFortitude;
    if (typeof logFn === 'function') {
      logFn(`遗物「阴阳调和」生效：免疫本次${type === 'weak' ? '虚弱' : '易伤'}，并获得 ${gainStrength} 力量、${gainFortitude} 坚固。`);
    }
    return 0;
  }
  if (type === 'weak') {
    state.playerWeakTurns += n;
    return n;
  }
  if (type === 'vulnerable') {
    state.playerVulnerableTurns += n;
    return n;
  }
  if (type === 'fragile') {
    state.playerFragileTurns += n;
    return n;
  }
  return 0;
}

export function applyBattleStartRoundOneRelicsSystem({ state, isAppleBorerEncounter, logFn }) {
  const enemyVuln = sumRelicEffectSystem({ state, effectKey: 'firstTurnAllEnemiesVulnerable' });
  if (enemyVuln > 0) {
    if (isAppleBorerEncounter) {
      state.appleBorerUnitsVulnerableTurns = state.appleBorerUnitsVulnerableTurns.map((v) => v + enemyVuln);
    } else {
      state.enemyVulnerableTurns += enemyVuln;
    }
    if (typeof logFn === 'function') logFn(`遗物效果：首回合给予敌方 ${enemyVuln} 层易伤。`);
  }
  const allWeak = sumRelicEffectSystem({ state, effectKey: 'firstTurnAllUnitsWeak' });
  if (allWeak > 0) {
    applyIncomingPlayerDebuffWithRelicSystem({ state, type: 'weak', amount: allWeak, logFn });
    if (isAppleBorerEncounter) {
      state.appleBorerUnitsWeakTurns = state.appleBorerUnitsWeakTurns.map((v) => v + allWeak);
    } else {
      state.enemyWeakTurns += allWeak;
    }
    if (typeof logFn === 'function') logFn(`遗物效果：首回合所有单位获得 ${allWeak} 层虚弱。`);
  }
}

export function applyBattleStartRelicsSystem({ state, logFn }) {
  state.relicFirstDamageNegateAvailable = false;
  state.relicYinYangTriggeredThisBattle = false;
  state.playerThorns = 0;
  state.relics.forEach((r) => {
    const eff = r.effects || {};
    if (eff.battleStartStrength || eff.battleStartFortitude) {
      let mult = 1;
      if (eff.lowHpDouble && state.playerHp < state.playerMaxHp / 2) mult = 2;
      const sg = (eff.battleStartStrength || 0) * mult;
      const fg = (eff.battleStartFortitude || 0) * mult;
      if (sg) state.strength += sg;
      if (fg) state.fortitude += fg;
      if ((sg || fg) && typeof logFn === 'function') logFn(`遗物「${r.name}」生效：力量 +${sg}，坚固 +${fg}。`);
    }
    if (eff.negateFirstDamagePerBattle) {
      state.relicFirstDamageNegateAvailable = true;
    }
    if (eff.thorns) {
      state.playerThorns += Number(eff.thorns) || 0;
    }
  });
}

export function applyEndTurnRelicsBeforeEnemySystem({ state, logFn }) {
  state.relics.forEach((r) => {
    const eff = r.effects || {};
    if (eff.endTurnNoBlockGainBlock && state.playerBlock <= 0) {
      state.playerBlock += eff.endTurnNoBlockGainBlock;
      if (typeof logFn === 'function') logFn(`遗物「${r.name}」生效：获得 ${eff.endTurnNoBlockGainBlock} 点格挡。`);
    }
  });
}

export function applyEndTurnRelicsAfterPlayerSystem({ state }) {
  state.relics.forEach((r) => {
    const eff = r.effects || {};
    const bonus = Number(eff.noAttackTurnStartEnergyNextTurn ?? 0);
    if (bonus <= 0) return;
    if (state.playedAttackThisTurn) return;
    state.relicChargeBatteryPending = true;
  });
}

export function applyTurnStartRelicsSystem({ state, logFn }) {
  if (state.relicChargeBatteryPending) {
    const bonus = (state.relics || []).reduce(
      (m, r) => Math.max(m, Number(r?.effects?.noAttackTurnStartEnergyNextTurn ?? 0)),
      1,
    );
    state.energy = Math.min(99, Number(state.energy ?? 0) + bonus);
    state.relicChargeBatteryPending = false;
    if (typeof logFn === 'function') logFn(`遗物「充能电池」生效：本回合额外获得 ${bonus} 点能量。`);
  }
}

export function applyBattleEndRelicsSystem({ state, logFn }) {
  state.relics.forEach((r) => {
    const eff = r.effects || {};
    const heal = Number(eff.healAfterBattle ?? 0);
    if (heal <= 0) return;
    const before = state.playerHp;
    state.playerHp = Math.min(state.playerMaxHp, state.playerHp + heal);
    const got = state.playerHp - before;
    if (got > 0 && typeof logFn === 'function') {
      logFn(`遗物「${r.name}」生效：战斗结束恢复 ${got} 点生命。`);
    }
  });
}


