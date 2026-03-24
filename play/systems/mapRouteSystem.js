function weightedPick(rng, weightedTypes) {
  const total = weightedTypes.reduce((acc, x) => acc + x.weight, 0);
  const roll = rng() * total;
  let acc = 0;
  for (const item of weightedTypes) {
    acc += item.weight;
    if (roll < acc) return item.type;
  }
  return weightedTypes[weightedTypes.length - 1].type;
}

export function buildRunFloorTypesSystem({
  nodeCount,
  fixedTypes,
  weightedTypes,
  allowedTypesByIndex = {},
  minNormalCount = 0,
  rng = Math.random,
}) {
  const floors = Array(nodeCount).fill('normal');
  const fixedIndexSet = new Set();
  Object.entries(fixedTypes || {}).forEach(([k, type]) => {
    const idx = Number(k);
    if (idx < 0 || idx >= nodeCount) return;
    floors[idx] = type;
    fixedIndexSet.add(idx);
  });

  for (let i = 0; i < nodeCount; i += 1) {
    if (fixedIndexSet.has(i)) continue;
    const allowed = Array.isArray(allowedTypesByIndex[i]) ? allowedTypesByIndex[i] : null;
    const candidates = allowed
      ? weightedTypes.filter((x) => allowed.includes(x.type))
      : weightedTypes;
    floors[i] = weightedPick(rng, candidates.length > 0 ? candidates : weightedTypes);
  }

  let normalCount = floors.filter((x) => x === 'normal').length;
  while (normalCount < minNormalCount) {
    const candidates = [];
    for (let i = 0; i < nodeCount; i += 1) {
      if (fixedIndexSet.has(i)) continue;
      if (floors[i] !== 'normal') candidates.push(i);
    }
    if (!candidates.length) break;
    const pick = candidates[Math.floor(rng() * candidates.length)];
    floors[pick] = 'normal';
    normalCount += 1;
  }

  return floors;
}

