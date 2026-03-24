/**
 * Shop overlay UI flow factory.
 * Keeps shop UI orchestration out of game.js while using injected game actions.
 */
export function createShopUI(deps) {
  const {
    state,
    els,
    SHOP_CONFIG,
    MAP_FLOOR_COUNT,
    buildShopCardOffers,
    buildShopRelicOffers,
    getShopServiceCost,
    instantiateRunDeckCard,
    buildCardClassName,
    renderCardFaceHtml,
    RELIC_DEFS,
    TEMPLATES,
    addRelicById,
    hideCampUpgradePreview,
    showCampUpgradePreview,
    startNextEncounter,
    refreshUI,
    log,
  } = deps;

  function closeShopOverlay(force = false) {
    if (state.inShop && !force) return;
    state.inShop = false;
    if (els.selectionFrameActions) els.selectionFrameActions.innerHTML = '';
    if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
    if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
    hideCampUpgradePreview();
  }

  function leaveShopToNextNode() {
    closeShopOverlay(true);
    state.nextEncounterFloor = Math.min(MAP_FLOOR_COUNT, state.nextEncounterFloor + 1);
    startNextEncounter();
  }

  function openShopCardPicker() {
    if (!els.selectionFramePicker || !els.selectionFramePickerGrid || !els.selectionFramePickerTitle) return;
    els.selectionFramePicker.hidden = false;
    els.selectionFramePickerTitle.textContent = '商店：卡牌';
    els.selectionFramePickerGrid.innerHTML = '';
    if (!state.shopCardOffers.length) {
      const empty = document.createElement('div');
      empty.className = 'collection-hint';
      empty.textContent = '卡牌已售罄。';
      els.selectionFramePickerGrid.appendChild(empty);
      return;
    }
    state.shopCardOffers.forEach((offer) => {
      const runCard = {
        uid: `${offer.templateId}-shop-preview`,
        templateId: offer.templateId,
        upgraded: !!offer.upgraded,
      };
      const card = instantiateRunDeckCard(runCard);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = buildCardClassName(card);
      btn.innerHTML = renderCardFaceHtml(card);
      btn.title = `购买：${offer.price} 金币`;
      btn.disabled = state.coins < offer.price;
      btn.addEventListener('click', () => {
        if (state.coins < offer.price) {
          log(`金币不足：购买「${card.name}」需要 ${offer.price}。`);
          return;
        }
        state.coins -= offer.price;
        state.runDeck.push({
          uid: `${offer.templateId}-run-${Math.random().toString(36).slice(2, 10)}`,
          templateId: offer.templateId,
          upgraded: !!offer.upgraded,
        });
        state.shopCardOffers = state.shopCardOffers.filter((x) => x !== offer);
        log(`商店：花费 ${offer.price} 金币，购买了「${card.name}」。`);
        openShopCardPicker();
        refreshUI();
      });
      const wrapper = document.createElement('div');
      wrapper.className = 'collection-card-wrap';
      wrapper.appendChild(btn);
      const tag = document.createElement('div');
      tag.className = 'collection-hint';
      tag.textContent = `${offer.price} 金币`;
      wrapper.appendChild(tag);
      els.selectionFramePickerGrid.appendChild(wrapper);
    });
  }

  function openShopRelicPicker() {
    if (!els.selectionFramePicker || !els.selectionFramePickerGrid || !els.selectionFramePickerTitle) return;
    els.selectionFramePicker.hidden = false;
    els.selectionFramePickerTitle.textContent = '商店：遗物';
    els.selectionFramePickerGrid.innerHTML = '';
    if (!state.shopRelicOffers.length) {
      const empty = document.createElement('div');
      empty.className = 'collection-hint';
      empty.textContent = '遗物已售罄。';
      els.selectionFramePickerGrid.appendChild(empty);
      return;
    }
    state.shopRelicOffers.forEach((offer) => {
      const relic = RELIC_DEFS[offer.relicId];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.disabled = state.coins < offer.price;
      btn.textContent = `${relic?.icon ?? '◆'} ${relic?.name ?? offer.relicId}（${offer.price} 金币）`;
      btn.title = relic?.desc ?? '';
      btn.addEventListener('click', () => {
        if (state.coins < offer.price) {
          log(`金币不足：购买遗物需要 ${offer.price}。`);
          return;
        }
        const before = state.relics.length;
        state.coins -= offer.price;
        addRelicById(offer.relicId);
        state.shopRelicOffers = state.shopRelicOffers.filter((x) => x !== offer);
        state.runRelicPoolIds = state.runRelicPoolIds.filter((id) => id !== offer.relicId);
        if (state.relics.length > before) {
          log(`商店：花费 ${offer.price} 金币，购买了遗物「${relic?.name ?? offer.relicId}」。`);
        }
        openShopRelicPicker();
        refreshUI();
      });
      els.selectionFramePickerGrid.appendChild(btn);
    });
  }

  function openShopServicePicker(mode) {
    if (!els.selectionFramePicker || !els.selectionFramePickerGrid || !els.selectionFramePickerTitle) return;
    const cost = getShopServiceCost(mode);
    if (state.coins < cost) {
      log(`金币不足：${mode === 'upgrade' ? '升级' : '删除'}服务需要 ${cost}。`);
      return;
    }
    els.selectionFramePicker.hidden = false;
    els.selectionFramePickerGrid.innerHTML = '';
    els.selectionFramePickerTitle.textContent = mode === 'upgrade'
      ? `商店服务：升级一张牌（${cost} 金币）`
      : `商店服务：删除一张牌（${cost} 金币）`;
    let candidateCount = 0;
    state.runDeck.forEach((runCard) => {
      if (mode === 'upgrade' && runCard.upgraded) return;
      candidateCount += 1;
      const card = instantiateRunDeckCard(runCard);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = buildCardClassName(card);
      btn.innerHTML = renderCardFaceHtml(card);
      btn.addEventListener('click', () => {
        if (state.coins < cost) {
          log(`金币不足：${mode === 'upgrade' ? '升级' : '删除'}服务需要 ${cost}。`);
          return;
        }
        state.coins -= cost;
        if (mode === 'upgrade') {
          runCard.upgraded = true;
          log(`商店：花费 ${cost} 金币，升级了「${TEMPLATES[runCard.templateId].name}」。`);
        } else {
          state.runDeck = state.runDeck.filter((c) => c.uid !== runCard.uid);
          log(`商店：花费 ${cost} 金币，删除了「${TEMPLATES[runCard.templateId].name}」。`);
        }
        state.shopServiceUsage[mode] = Number(state.shopServiceUsage?.[mode] ?? 0) + 1;
        if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
        if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
        openShopOverlay();
        refreshUI();
      });
      if (mode === 'upgrade') {
        btn.addEventListener('mouseenter', () => showCampUpgradePreview(runCard));
        btn.addEventListener('mouseleave', () => hideCampUpgradePreview());
      }
      els.selectionFramePickerGrid.appendChild(btn);
    });
    if (candidateCount <= 0) {
      log(mode === 'upgrade' ? '商店：没有可升级的牌。' : '商店：没有可删除的牌。');
      if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
    }
  }

  function openShopOverlay() {
    state.inShop = true;
    if (!Array.isArray(state.shopCardOffers) || state.shopCardOffers.length === 0) {
      state.shopCardOffers = buildShopCardOffers();
    }
    if (!Array.isArray(state.shopRelicOffers) || state.shopRelicOffers.length === 0) {
      state.shopRelicOffers = buildShopRelicOffers();
    }
    if (els.selectionFrameTitle) els.selectionFrameTitle.textContent = '商店 🛒';
    if (els.selectionFrameHint) {
      els.selectionFrameHint.textContent = `金币：${state.coins}。可购买卡牌/遗物，或使用付费服务。`;
    }
    if (els.selectionFrameActions) {
      els.selectionFrameActions.innerHTML = '';
      const mkBtn = (text, cls, onClick) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = text;
        b.addEventListener('click', onClick);
        els.selectionFrameActions.appendChild(b);
      };
      mkBtn(`购买卡牌（剩余 ${state.shopCardOffers.length}）`, 'btn', () => openShopCardPicker());
      mkBtn(`购买遗物（剩余 ${state.shopRelicOffers.length}）`, 'btn', () => openShopRelicPicker());
      mkBtn(`升级服务（${getShopServiceCost('upgrade')} 金币）`, 'btn', () => openShopServicePicker('upgrade'));
      mkBtn(`删除服务（${getShopServiceCost('purge')} 金币）`, 'btn', () => openShopServicePicker('purge'));
      mkBtn('离开商店', 'btn primary', () => leaveShopToNextNode());
    }
    if (els.selectionFramePicker) els.selectionFramePicker.hidden = true;
    if (els.selectionFramePickerGrid) els.selectionFramePickerGrid.innerHTML = '';
    if (els.selectionFrame) els.selectionFrame.hidden = false;
    hideCampUpgradePreview();
  }

  return {
    openShopOverlay,
    closeShopOverlay,
    leaveShopToNextNode,
  };
}
