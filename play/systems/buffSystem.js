/**
 * Buff row data builders. Returns chip descriptors; rendering stays in game.js.
 */

function chip(icon, title, num, cls) {
  return { icon, title, num, cls };
}

export function buildPlayerBuffChipsSystem({ state }) {
  const chips = [];
  if (state.strength > 0) {
    const tempMult = Math.max(1, Number(state.tempAttackStrengthMultiplier ?? 1));
    const strengthNum = tempMult > 1
      ? `${state.strength} (攻击按 x${tempMult})`
      : String(state.strength);
    chips.push(chip('💪', '力量', strengthNum, 'buff-chip--str'));
  }
  if (state.fortitude > 0) chips.push(chip('🛡', '坚固', String(state.fortitude), 'buff-chip--fort'));
  if (state.decisiveBattleActive) chips.push(chip('⚔', '决战（仅能打出攻击牌）', '', 'buff-chip--decisive'));
  if (Number(state.tempStrengthDeltaThisTurn ?? 0) !== 0) {
    const v = Number(state.tempStrengthDeltaThisTurn);
    const next = v > 0 ? `-${v}` : `+${Math.abs(v)}`;
    chips.push(chip('↘', '临时力量：下回合开始时回滚', next, 'buff-chip--weak'));
  }
  if (Number(state.tempFortitudeDeltaThisTurn ?? 0) !== 0) {
    const v = Number(state.tempFortitudeDeltaThisTurn);
    const next = v > 0 ? `-${v}` : `+${Math.abs(v)}`;
    chips.push(chip('↘', '临时坚固：下回合开始时回滚', next, 'buff-chip--weak'));
  }
  if (Number(state.pendingSeedEnergyNextTurn ?? 0) > 0 || Number(state.pendingSeedDrawNextTurn ?? 0) > 0) {
    const e = Math.max(0, Number(state.pendingSeedEnergyNextTurn ?? 0));
    const d = Math.max(0, Number(state.pendingSeedDrawNextTurn ?? 0));
    chips.push(chip('🌱', '种子：下回合开始获得能量并额外抽牌', `能+${e} 抽+${d}`, 'buff-chip--fort'));
  }
  if (state.playerWeakTurns > 0) chips.push(chip('虚', '虚弱：造成伤害降低', String(state.playerWeakTurns), 'buff-chip--weak'));
  if (state.playerVulnerableTurns > 0) chips.push(chip('易', '易伤：受到伤害增加', String(state.playerVulnerableTurns), 'buff-chip--vuln'));
  if (state.playerFragileTurns > 0) chips.push(chip('脆', '脆弱：仅卡牌提供的格挡降低', String(state.playerFragileTurns), 'buff-chip--vuln'));
  if (state.playerThorns > 0) chips.push(chip('🌵', '荆棘：每次受伤时反弹伤害', String(state.playerThorns), 'buff-chip--block'));
  if (state.blockGainLockedThisTurn) chips.push(chip('禁', '本回合不能再获得格挡', '', 'buff-chip--weak'));
  if (state.relicFirstDamageNegateAvailable) chips.push(chip('🐍', '褪下的蛇皮：抵消本场第一次受到的伤害', '', 'buff-chip--block'));
  return chips;
}

export function buildEnemyBuffChipsSystem({ state, isAppleBorerEncounter, gargoyleSlowPerCard = 0.1 }) {
  const chips = [];
  if (isAppleBorerEncounter) {
    const n = Array.isArray(state.appleBorerUnitsHp) ? state.appleBorerUnitsHp.length : 0;
    const isGoblin = state.activeEnemyId === 'goblinGang';
    for (let idx = 0; idx < n; idx += 1) {
      const label = isGoblin ? `地精${idx + 1}` : `蛀虫${idx + 1}`;
      if (state.appleBorerUnitsStrength[idx] > 0) {
        chips.push(chip('💪', `${label} 力量`, String(state.appleBorerUnitsStrength[idx]), 'buff-chip--str'));
      }
      if (state.appleBorerUnitsWeakTurns[idx] > 0) {
        chips.push(chip('虚', `${label} 虚弱：造成伤害降低`, String(state.appleBorerUnitsWeakTurns[idx]), 'buff-chip--weak'));
      }
      if (state.appleBorerUnitsVulnerableTurns[idx] > 0) {
        chips.push(chip('易', `${label} 易伤：受到伤害增加`, String(state.appleBorerUnitsVulnerableTurns[idx]), 'buff-chip--vuln'));
      }
    }
    return chips;
  }

  if (state.activeEnemyId === 'moltingSnake' && state.moltingSnakeGuardNextDamage) {
    chips.push(chip('🛡', '蜕皮的蛇：抵挡下一次伤害', '', 'buff-chip--block'));
  }
  if (state.activeEnemyId === 'witheredToad') {
    chips.push(chip('枯', '枯萎传播：造成未被格挡伤害时，向你弃牌堆加入枯萎', '', 'buff-chip--weak'));
  }
  if (state.activeEnemyId === 'lihuabird') {
    chips.push(chip('花', '离花弃枝：单回合受伤超过 25% 最大生命后，力量-2，下一回合回复超出生命', '', 'buff-chip--vuln'));
  }
  if (state.activeEnemyId === 'gargoyle') {
    const pct = Math.round(Number(gargoyleSlowPerCard ?? 0.1) * 100);
    const stacks = Math.max(0, Number(state.playedCardsThisTurn ?? 0));
    chips.push(chip('迟', `迟缓：同一回合内，玩家每打出一张牌，石像鬼受到伤害 +${pct}%。`, String(stacks), 'buff-chip--weak'));
  }
  if (state.enemyStrength > 0) chips.push(chip('💪', '力量', String(state.enemyStrength), 'buff-chip--str'));
  if (state.enemyFortitude > 0) chips.push(chip('🛡', '坚固', String(state.enemyFortitude), 'buff-chip--fort'));
  if (state.enemyWeakTurns > 0) chips.push(chip('虚', '虚弱：造成伤害降低', String(state.enemyWeakTurns), 'buff-chip--weak'));
  if (state.enemyVulnerableTurns > 0) chips.push(chip('易', '易伤：受到伤害增加', String(state.enemyVulnerableTurns), 'buff-chip--vuln'));
  return chips;
}

