/**
 * Blessing selection/runtime helpers.
 */

export function pickRandomBlessingsSystem({ blessingPool, count, shuffleFn }) {
  return shuffleFn(blessingPool).slice(0, Math.min(count, blessingPool.length));
}

export function takeDamageOutOfCombatSystem({ state, amount, minHp = 1 }) {
  const dmg = Math.max(0, Math.floor(amount));
  if (dmg <= 0) return 0;
  const before = state.playerHp;
  state.playerHp = Math.max(minHp, state.playerHp - dmg);
  return before - state.playerHp;
}

export function applyBlessingSystem({
  blessing,
  state,
  log,
  takeDamageOutOfCombat,
  addRelicById,
  openBlessingDeckPicker,
  closeBlessingOverlay,
  startNextEncounter,
}) {
  const kind = blessing.type || blessing.effect;
  const addRunCard = (templateId) => {
    state.runDeck.push({
      uid: `${templateId}-run-${Math.random().toString(36).slice(2, 10)}`,
      templateId: String(templateId),
      upgraded: false,
    });
  };
  if (kind === 'temp_energy_battles') {
    state.tempEnergyBonusValue += Number(blessing.amount ?? 0);
    state.tempEnergyBonusBattlesLeft = Math.max(state.tempEnergyBonusBattlesLeft, Number(blessing.battles ?? 0));
    return;
  }
  if (kind === 'purge_lose_max_hp') {
    const lose = Math.max(0, Number(blessing.loseMaxHp ?? 0));
    state.playerMaxHp = Math.max(1, state.playerMaxHp - lose);
    state.playerHp = Math.min(state.playerHp, state.playerMaxHp);
    log(`祝福代价：最大生命 -${lose}。`);
    openBlessingDeckPicker('purge', () => {
      closeBlessingOverlay(true);
      state.nextEncounterFloor = 1;
      startNextEncounter();
    });
    return;
  }
  if (kind === 'gain_relic' || kind === 'relic') {
    addRelicById(String(blessing.relicId ?? blessing.value ?? ''));
    return;
  }
  if (kind === 'upgrade_take_damage') {
    const hurt = takeDamageOutOfCombat(Number(blessing.damage ?? 0));
    log(`祝福代价：受到 ${hurt} 点伤害。`);
    openBlessingDeckPicker('upgrade', () => {
      closeBlessingOverlay(true);
      state.nextEncounterFloor = 1;
      startNextEncounter();
    });
    return;
  }
  if (kind === 'hp_percent_damage_gain_relic') {
    const hurt = takeDamageOutOfCombat(state.playerMaxHp * Number(blessing.percent ?? 0));
    log(`祝福代价：受到 ${hurt} 点伤害。`);
    addRelicById(String(blessing.relicId ?? ''));
    return;
  }
  if (kind === 'add_card') {
    const count = Math.max(1, Number(blessing.count ?? 1));
    for (let i = 0; i < count; i += 1) {
      addRunCard(blessing.templateId);
    }
    return;
  }
  if (kind === 'upgrade_n_gain_curse') {
    const count = Math.max(1, Number(blessing.count ?? 1));
    const curseTemplateId = String(blessing.curseTemplateId ?? '');
    openBlessingDeckPicker('upgrade', () => {
      if (curseTemplateId) {
        addRunCard(curseTemplateId);
        log('祝福代价：获得诅咒「骨折」。');
      }
      closeBlessingOverlay(true);
      state.nextEncounterFloor = 1;
      startNextEncounter();
    }, { count });
    return;
  }
  if (kind === 'purge_n_gain_curse') {
    const count = Math.max(1, Number(blessing.count ?? 1));
    const curseTemplateId = String(blessing.curseTemplateId ?? '');
    openBlessingDeckPicker('purge', () => {
      if (curseTemplateId) {
        addRunCard(curseTemplateId);
        log('祝福代价：获得诅咒「腐烂」。');
      }
      closeBlessingOverlay(true);
      state.nextEncounterFloor = 1;
      startNextEncounter();
    }, { count });
  }
}

