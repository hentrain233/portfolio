import { normalizeCardMetaSystem } from './statusCurseSystem.js';

/**
 * Card system: instantiate templates into runtime instances.
 */

export function instantiateCardSystem(t) {
  return normalizeCardMetaSystem({
    uid: `${t.id}-${Math.random().toString(36).slice(2, 9)}`,
    templateId: t.id,
    name: t.name,
    kind: t.kind,
    desc: t.desc,
    cost: t.cost,
    costDisplay: t.costDisplay,
    draw: t.draw,
    discard: t.discard,
    damage: t.damage,
    multiHit: t.multiHit ? { count: t.multiHit.count, perHit: t.multiHit.perHit } : undefined,
    block: t.block,
    exhaust: t.exhaust,
    strengthGain: t.strengthGain,
    fortitudeGain: t.fortitudeGain,
    rarity: t.rarity ?? 'common',
    vulnerable: t.vulnerable,
    weak: t.weak,
    ignoreTargetVulnerable: t.ignoreTargetVulnerable,
    gainEnergy: t.gainEnergy,
    gainMaxHp: t.gainMaxHp,
    lockBlockGainThisTurn: t.lockBlockGainThisTurn,
    strengthDamageMultiplier: t.strengthDamageMultiplier,
    jealousyHighGain: t.jealousyHighGain,
    jealousyLowGain: t.jealousyLowGain,
    randomEnemyPerHit: t.randomEnemyPerHit,
    selfHpLoss: t.selfHpLoss,
    championStrengthDoubleThisTurn: t.championStrengthDoubleThisTurn,
    championDoubleBeforeDamage: t.championDoubleBeforeDamage,
    gainEnergyIfTargetVulnerable: t.gainEnergyIfTargetVulnerable,
    drawIfTargetVulnerable: t.drawIfTargetVulnerable,
    healAfterBattle: t.healAfterBattle,
    bonusCoinsAfterBattle: t.bonusCoinsAfterBattle,
    tempStrengthGainThisTurn: t.tempStrengthGainThisTurn,
    tempFortitudeGainThisTurn: t.tempFortitudeGainThisTurn,
    addHandCardTemplateId: t.addHandCardTemplateId,
    addHandCardCount: t.addHandCardCount,
    cannotPlay: !!t.cannotPlay,
    seedPlantEnergyNextTurn: t.seedPlantEnergyNextTurn,
    seedPlantDrawNextTurn: t.seedPlantDrawNextTurn,
    consumeSeedsInHandDamagePerSeed: t.consumeSeedsInHandDamagePerSeed,
    xCostConsumeAllEnergy: !!t.xCostConsumeAllEnergy,
    xCostPerHitDamage: t.xCostPerHitDamage,
    xCostBonusHits: t.xCostBonusHits,
    transformOneHandCardToSeed: !!t.transformOneHandCardToSeed,
    transformToUpgradedSeed: !!t.transformToUpgradedSeed,
    rewardPoolExcluded: !!t.rewardPoolExcluded,
    exclusiveToCharacterId: t.exclusiveToCharacterId,
    sharedAllCharacters: !!t.sharedAllCharacters,
    // status/curse architecture fields
    category: t.category,
    persistence: t.persistence,
    statusAutoExhaustOnDiscard: t.statusAutoExhaustOnDiscard,
    onDrawEffects: t.onDrawEffects,
    keywords: Array.isArray(t.keywords) ? [...t.keywords] : [],
    voidExhaustOnTurnEnd: t.voidExhaustOnTurnEnd,
    arcaneKindlingRequireFuel: t.arcaneKindlingRequireFuel,
    onShuffleIntoDrawSelfDamage: t.onShuffleIntoDrawSelfDamage,
    onTurnEndInHandEffects: Array.isArray(t.onTurnEndInHandEffects) ? t.onTurnEndInHandEffects : [],
    madnessSelfReflectChance: t.madnessSelfReflectChance,
  });
}

export function instantiateRunDeckCardSystem({ runCard, TEMPLATES, UPGRADE_RULES }) {
  const base = TEMPLATES[runCard.templateId];
  const card = instantiateCardSystem(base);
  if (!runCard.upgraded) return { ...card, upgraded: false };
  const patch = UPGRADE_RULES[runCard.templateId];
  if (!patch) {
    card.name = `${card.name}+`;
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


