const RARITY_WEIGHT = {
  common: 0,
  uncommon: 1,
  rare: 2,
};

export function createCardFilterState() {
  return {
    kind: 'all',
    sort: 'rarityAsc',
  };
}

export function classifyCardFilterKind(card) {
  const category = card?.category ?? 'normal';
  if (category === 'status') return 'status';
  if (category === 'curse') return 'curse';
  const kind = card?.kind ?? 'skill';
  if (kind === 'attack') return 'attack';
  if (kind === 'power') return 'power';
  // 现有「defend」卡并入「技能」筛选项
  return 'skill';
}

function getRarityWeight(card) {
  const rarity = card?.rarity ?? 'common';
  return RARITY_WEIGHT[rarity] ?? 0;
}

function getCostWeight(card) {
  const val = Number(card?.cost);
  return Number.isFinite(val) ? val : 999;
}

function byName(a, b) {
  return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'zh-CN');
}

function compareCards(a, b, sortMode) {
  if (sortMode === 'costAsc' || sortMode === 'costDesc') {
    const dir = sortMode === 'costAsc' ? 1 : -1;
    const c = (getCostWeight(a) - getCostWeight(b)) * dir;
    if (c !== 0) return c;
    const r = getRarityWeight(a) - getRarityWeight(b);
    if (r !== 0) return r;
    return byName(a, b);
  }
  const dir = sortMode === 'rarityDesc' ? -1 : 1;
  const r = (getRarityWeight(a) - getRarityWeight(b)) * dir;
  if (r !== 0) return r;
  const c = getCostWeight(a) - getCostWeight(b);
  if (c !== 0) return c;
  return byName(a, b);
}

export function filterAndSortCardItems({ items, filterState, getCard }) {
  const kind = filterState?.kind ?? 'all';
  const sortMode = filterState?.sort ?? 'rarityAsc';
  const filtered = (items || []).filter((item) => {
    const card = getCard(item);
    if (!card) return false;
    if (kind === 'all') return true;
    return classifyCardFilterKind(card) === kind;
  });
  filtered.sort((ia, ib) => compareCards(getCard(ia), getCard(ib), sortMode));
  return filtered;
}

export function renderCardFilterControls({ mountEl, filterState, onChange }) {
  if (!mountEl || !filterState) return;
  mountEl.innerHTML = '';
  mountEl.className = 'card-filter-row';

  const kinds = [
    ['all', '全部'],
    ['attack', '攻击牌'],
    ['skill', '技能牌'],
    ['power', '能力牌'],
    ['status', '状态牌'],
    ['curse', '诅咒牌'],
  ];
  const sorts = [
    ['rarityAsc', '稀有度 ↑'],
    ['rarityDesc', '稀有度 ↓'],
    ['costAsc', '费用 ↑'],
    ['costDesc', '费用 ↓'],
  ];

  const makeSelect = (labelText, options, value, onPick) => {
    const wrap = document.createElement('label');
    wrap.className = 'card-filter-item';
    const txt = document.createElement('span');
    txt.className = 'card-filter-label';
    txt.textContent = labelText;
    const select = document.createElement('select');
    select.className = 'card-filter-select';
    options.forEach(([id, label]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      select.appendChild(opt);
    });
    select.value = value;
    select.addEventListener('change', () => {
      onPick(select.value);
      if (typeof onChange === 'function') onChange();
    });
    wrap.appendChild(txt);
    wrap.appendChild(select);
    return wrap;
  };

  mountEl.appendChild(
    makeSelect('筛选', kinds, filterState.kind, (v) => {
      filterState.kind = v;
    }),
  );
  mountEl.appendChild(
    makeSelect('排序', sorts, filterState.sort, (v) => {
      filterState.sort = v;
    }),
  );
}

