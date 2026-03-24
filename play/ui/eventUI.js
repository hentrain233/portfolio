/**
 * Event overlay UI flow factory.
 * Keeps event UI orchestration out of game.js while using injected game actions.
 */
export function createEventUI(deps) {
  const {
    state,
    els,
    EVENT_IDS,
    EVENT_DEFS,
    getEventTitle,
    pickRandomEventId,
    prepareEventState,
    applyBlessingCoinDamageEvent,
    applySnakeTradeOption,
    queueEventRewards,
    buildWellDescription,
    resolveWellAttempt,
    resolveThornChestAttempt,
    takeDamageOutOfCombat,
    upgradeRandomRunDeckCard,
    startBattleAgainstEnemy,
    startNextEncounter,
    refreshUI,
    log,
  } = deps;

  function closeEventOverlay(force = false) {
    if (state.inEvent && !force) return;
    state.inEvent = false;
    state.activeEventId = null;
    state.eventFloorIndex = null;
    if (els.eventOverlay) els.eventOverlay.hidden = true;
    if (els.eventDescription) els.eventDescription.textContent = '';
    if (els.eventChoices) els.eventChoices.innerHTML = '';
  }

  function leaveEventToNextNode() {
    if (state.eventFloorIndex === null) return;
    const next = state.eventFloorIndex + 1;
    closeEventOverlay(true);
    state.nextEncounterFloor = next;
    startNextEncounter();
  }

  function renderEventWellChoices() {
    const wellDef = EVENT_DEFS[EVENT_IDS.WELL] ?? {};
    const { text, isDone } = buildWellDescription({ state });
    const failDamageThisTry = Number(wellDef.failDamageBase ?? 3) + Number(state.eventWellAttempts ?? 0);
    const hpInsufficient = Number(state.playerHp ?? 0) <= failDamageThisTry;
    els.eventDescription.textContent = text;
    els.eventChoices.innerHTML = '';

    const btn1 = document.createElement('button');
    btn1.type = 'button';
    btn1.className = 'btn primary';
    btn1.textContent = wellDef?.options?.attempt ?? '尝试在水井里打水喝（失败受伤，成功升级一张牌）';
    if (hpInsufficient) {
      btn1.textContent += `（生命不足，至少需要高于 ${failDamageThisTry}）`;
    }
    btn1.disabled = isDone || hpInsufficient;
    btn1.addEventListener('click', () => {
      resolveWellAttempt({
        state,
        rng: Math.random,
        takeDamageOutOfCombat,
        upgradeRandomRunDeckCard,
        log,
      });
      renderEventWellChoices();
      refreshUI();
    });
    els.eventChoices.appendChild(btn1);

    const btn2 = document.createElement('button');
    btn2.type = 'button';
    btn2.className = 'btn';
    btn2.textContent = wellDef?.options?.leave ?? '离开（直接前往下一节点）';
    btn2.addEventListener('click', () => {
      leaveEventToNextNode();
    });
    els.eventChoices.appendChild(btn2);
  }

  function renderEventSnakeChoices() {
    const snakeDef = EVENT_DEFS[EVENT_IDS.SNAKE] ?? {};
    els.eventDescription.textContent =
      snakeDef.description
      ?? '你遇见了一条比你身体还大的蛇，正想动手，见到它说话了：“给我你的血，我会给予你回报”。';
    els.eventChoices.innerHTML = '';

    const btnA = document.createElement('button');
    btnA.type = 'button';
    btnA.className = 'btn primary';
    btnA.textContent = snakeDef?.snakeTrade?.optionText ?? '选项A：接受交易';
    btnA.addEventListener('click', () => {
      const reward = applySnakeTradeOption({ state, log });
      const next = state.eventFloorIndex === null ? state.nextEncounterFloor + 1 : state.eventFloorIndex + 1;
      closeEventOverlay(true);
      state.nextEncounterFloor = next;
      if (reward?.relicId && typeof queueEventRewards === 'function') {
        queueEventRewards({ relicId: reward.relicId });
      } else {
        startNextEncounter();
      }
    });
    els.eventChoices.appendChild(btnA);

    const btnB = document.createElement('button');
    btnB.type = 'button';
    btnB.className = 'btn';
    btnB.textContent = snakeDef?.snakeBattle?.optionText ?? '选项B：战斗';
    btnB.addEventListener('click', () => {
      const exitFloor = state.eventFloorIndex === null ? null : state.eventFloorIndex + 1;
      closeEventOverlay(true);
      state.inEvent = false;
      const enemyId = snakeDef?.snakeBattle?.enemyId ?? 'moltingSnake';
      startBattleAgainstEnemy(enemyId, false, state.eventFloorIndex ?? 0, exitFloor);
    });
    els.eventChoices.appendChild(btnB);
  }

  function renderEventBlessingCoinDamageChoices() {
    const blessDef = EVENT_DEFS[EVENT_IDS.BLESSING_COIN_DAMAGE] ?? {};
    els.eventDescription.textContent = blessDef.description ?? '你获得了一份祝福，但代价随之而来。';
    els.eventChoices.innerHTML = '';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn primary';
    btn.textContent = blessDef?.options?.continue ?? '继续（前往下一节点）';
    btn.addEventListener('click', () => {
      leaveEventToNextNode();
    });
    els.eventChoices.appendChild(btn);
  }

  function renderEventThornChestChoices() {
    const def = EVENT_DEFS[EVENT_IDS.THORN_CHEST] ?? {};
    const cfg = def.thornChest ?? {};
    const tries = Number(state.eventThornChestAttempts ?? 0);
    const maxAttempts = Number(cfg.maxAttemptsBeforeBattle ?? 4);
    const maxDamage = Number(cfg.damageMax ?? 5);
    const hpInsufficient = Number(state.playerHp ?? 0) <= maxDamage;
    els.eventDescription.textContent = `${def.description ?? '你看到荆棘地的中央有一个装满金币的大宝箱！'}（已深入 ${tries}/${maxAttempts} 次）`;
    els.eventChoices.innerHTML = '';

    const btnA = document.createElement('button');
    btnA.type = 'button';
    btnA.className = 'btn primary';
    btnA.textContent = cfg.optionDeep ?? '选项A：深入荆棘地';
    if (hpInsufficient) {
      btnA.textContent += `（生命不足，至少需要高于 ${maxDamage}）`;
    }
    btnA.disabled = hpInsufficient;
    btnA.addEventListener('click', () => {
      const res = resolveThornChestAttempt({
        state,
        rng: Math.random,
        takeDamageOutOfCombat,
        log,
      });
      if (res?.triggerBattle) {
        const exitFloor = state.eventFloorIndex === null ? null : state.eventFloorIndex + 1;
        closeEventOverlay(true);
        state.inEvent = false;
        state.eventBattleTag = 'thornChest';
        startBattleAgainstEnemy(cfg.enemyId ?? 'chestMimic', false, state.eventFloorIndex ?? 0, exitFloor);
        return;
      }
      renderEventThornChestChoices();
      refreshUI();
    });
    els.eventChoices.appendChild(btnA);

    const btnB = document.createElement('button');
    btnB.type = 'button';
    btnB.className = 'btn';
    btnB.textContent = cfg.optionLeave ?? '选项B：赶紧离开';
    btnB.addEventListener('click', () => leaveEventToNextNode());
    els.eventChoices.appendChild(btnB);
  }

  function renderEventCultistChoices() {
    const def = EVENT_DEFS[EVENT_IDS.CULTIST] ?? {};
    const cfg = def.cultist ?? {};
    els.eventDescription.textContent = def.description ?? '异教徒正在朝圣。';
    els.eventChoices.innerHTML = '';

    const btnA = document.createElement('button');
    btnA.type = 'button';
    btnA.className = 'btn primary';
    btnA.textContent = cfg?.optionA?.text ?? '选项A';
    btnA.addEventListener('click', () => {
      closeEventOverlay(true);
      const next = state.eventFloorIndex === null ? state.nextEncounterFloor + 1 : state.eventFloorIndex + 1;
      state.nextEncounterFloor = next;
      queueEventRewards({
        cardTemplateIds: [cfg?.optionA?.gainCurseTemplateId ?? 'madness', cfg?.optionA?.gainRareTemplateId ?? 'polarBlessing'],
      });
    });
    els.eventChoices.appendChild(btnA);

    const btnB = document.createElement('button');
    btnB.type = 'button';
    btnB.className = 'btn';
    btnB.textContent = cfg?.optionB?.text ?? '选项B';
    btnB.addEventListener('click', () => {
      const hurt = takeDamageOutOfCombat(Number(cfg?.optionB?.damage ?? 23));
      log(`异教徒事件：你受到 ${hurt} 点伤害。`);
      closeEventOverlay(true);
      const next = state.eventFloorIndex === null ? state.nextEncounterFloor + 1 : state.eventFloorIndex + 1;
      state.nextEncounterFloor = next;
      queueEventRewards({ relicId: String(cfg?.optionB?.relicId ?? 'enlightenment') });
    });
    els.eventChoices.appendChild(btnB);

    const btnC = document.createElement('button');
    btnC.type = 'button';
    btnC.className = 'btn';
    btnC.textContent = cfg?.optionC?.text ?? '选项C';
    btnC.addEventListener('click', () => {
      const hurt = takeDamageOutOfCombat(state.playerMaxHp * Number(cfg?.optionC?.maxHpDamagePercent ?? 0.99));
      const gain = Number(cfg?.optionC?.gainCoins ?? 699);
      state.coins += gain;
      log(`异教徒事件：你受到 ${hurt} 点伤害，获得 ${gain} 金币。`);
      leaveEventToNextNode();
    });
    els.eventChoices.appendChild(btnC);
  }

  function openEventOverlay() {
    if (!els.eventOverlay || !els.eventChoices || !els.eventDescription) return;
    state.inEvent = true;
    state.eventFloorIndex = state.nextEncounterFloor;
    state.activeEventId = pickRandomEventId();

    if (els.eventTitle) {
      els.eventTitle.textContent = getEventTitle(state.activeEventId);
    }
    els.eventOverlay.hidden = false;
    els.eventChoices.innerHTML = '';

    if (state.activeEventId === EVENT_IDS.BLESSING_COIN_DAMAGE) {
      applyBlessingCoinDamageEvent({ state, takeDamageOutOfCombat, log });
      renderEventBlessingCoinDamageChoices();
      return;
    }

    if (state.activeEventId === EVENT_IDS.WELL) {
      prepareEventState({ state, eventId: state.activeEventId });
      renderEventWellChoices();
      return;
    }
    if (state.activeEventId === EVENT_IDS.THORN_CHEST) {
      prepareEventState({ state, eventId: state.activeEventId });
      renderEventThornChestChoices();
      return;
    }
    if (state.activeEventId === EVENT_IDS.CULTIST) {
      renderEventCultistChoices();
      return;
    }

    if (state.activeEventId === EVENT_IDS.SNAKE) {
      renderEventSnakeChoices();
    }
  }

  return {
    openEventOverlay,
    closeEventOverlay,
    leaveEventToNextNode,
  };
}

