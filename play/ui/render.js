/**
 * Lightweight shared render helpers.
 */

export function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function typeLabel(kind) {
  if (kind === 'attack') return '攻击';
  if (kind === 'defend') return '技能';
  if (kind === 'power') return '能力';
  return '技能';
}

export function cardTypeLabel(card) {
  if (card?.category === 'status') return '状态';
  if (card?.category === 'curse') return '诅咒';
  return typeLabel(card?.kind);
}

export function renderCardFaceHtml(card, opts = {}) {
  const costClass = opts.costClass ?? 'card-cost';
  const costText = card.costDisplay ?? card.cost;
  return `
    <span class="card-holo" aria-hidden="true"></span>
    <span class="${costClass}">${costText}</span>
    <div class="card-name">${escapeHtml(card.name)}</div>
    <div class="card-type">${cardTypeLabel(card)}</div>
    <div class="card-desc">${escapeHtml(card.desc)}</div>
  `;
}

export function buildCardClassName(card, opts = {}) {
  const viewClass = opts.view ? ' card--view' : '';
  const categoryClass = card.category === 'status'
    ? ' card--category-status'
    : card.category === 'curse'
      ? ' card--category-curse'
      : '';
  const rarityClass = (card.category === 'status' || card.category === 'curse')
    ? ''
    : ` card--rarity-${card.rarity ?? 'common'}`;
  return `card${viewClass} ${card.kind}${categoryClass}${rarityClass}`;
}

export function renderCardViewHtml(card) {
  return `
    <div class="${buildCardClassName(card, { view: true })}">
      ${renderCardFaceHtml(card, { costClass: 'card-cost card-cost--view' })}
    </div>
  `;
}

