/**
 * Pile display helpers.
 */

export function getPileOverlayTitleSystem(which) {
  if (which === 'draw') return '抽牌堆（按类型归纳，不显示抽牌顺序）';
  if (which === 'discard') return '弃牌堆（上为顶）';
  return '消耗牌堆（上为顶）';
}

export function groupDrawPileForDisplaySystem(cards, kindOrder) {
  const map = new Map();
  for (const c of cards) {
    const key = c.templateId;
    if (!map.has(key)) {
      map.set(key, { name: c.name, kind: c.kind, count: 0 });
    }
    map.get(key).count += 1;
  }
  const rows = [...map.values()];
  rows.sort((a, b) => {
    const ka = kindOrder[a.kind] ?? 99;
    const kb = kindOrder[b.kind] ?? 99;
    if (ka !== kb) return ka - kb;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  return rows;
}

