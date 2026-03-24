/**
 * Combat math system (damage and multipliers).
 * These functions are written to be dependency-injected from game state.
 */

export function resolveStrikeLikeDamageSystem({ played, state, STRIKE_BASE_DAMAGE }) {
  const base = played.damage ?? STRIKE_BASE_DAMAGE;
  const isStrike = played.templateId === 'strike';
  const tempMult = Math.max(1, Number(state.tempAttackStrengthMultiplier ?? 1));
  const cardStrMult = Math.max(1, Number(played.strengthDamageMultiplier ?? 1));
  const effectiveStrength = state.strength * tempMult;
  let dmg = base + (effectiveStrength * cardStrMult);
  if (isStrike && state.decisiveBattleActive) dmg *= 2;
  return { dmg, isStrike };
}

export function resolveMultiHitDamageSystem({ played, state }) {
  const mh = played.multiHit;
  if (!mh) return null;
  const tempMult = Math.max(1, Number(state.tempAttackStrengthMultiplier ?? 1));
  const perHit = mh.perHit + (state.strength * tempMult);
  const total = perHit * mh.count;
  return { perHit, total, count: mh.count, basePer: mh.perHit };
}

export function applyPlayerOutgoingDamageSystem({
  raw,
  state,
  opts = {},
  WEAK_OUT_MULT,
  VULNERABLE_IN_MULT,
  isAppleBorerEncounter,
  getAppleBorerTargetIndex,
}) {
  let m = 1;
  if (state.playerWeakTurns > 0) m *= WEAK_OUT_MULT;
  if (!opts.ignoreEnemyVulnerable) {
    if (isAppleBorerEncounter()) {
      const t = getAppleBorerTargetIndex(opts.targetIndex ?? null);
      if (t !== null && state.appleBorerUnitsVulnerableTurns[t] > 0) m *= VULNERABLE_IN_MULT;
    } else if (state.enemyVulnerableTurns > 0) {
      m *= VULNERABLE_IN_MULT;
    }
  }
  return Math.floor(raw * m);
}

export function applyEnemyOutgoingDamageSystem({
  raw,
  state,
  opts = {},
  WEAK_OUT_MULT,
  VULNERABLE_IN_MULT,
  isAppleBorerEncounter,
}) {
  let m = 1;
  if (isAppleBorerEncounter()) {
    if (opts.enemyUnitIndex !== null && opts.enemyUnitIndex !== undefined) {
      const idx = Number(opts.enemyUnitIndex);
      if (state.appleBorerUnitsWeakTurns[idx] > 0) m *= WEAK_OUT_MULT;
    }
  } else if (state.enemyWeakTurns > 0) {
    m *= WEAK_OUT_MULT;
  }
  if (state.playerVulnerableTurns > 0) m *= VULNERABLE_IN_MULT;
  return Math.floor(raw * m);
}


