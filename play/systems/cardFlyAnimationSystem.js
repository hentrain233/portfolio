/**
 * Visual-only flying card helpers.
 * Keep game state changes outside this module.
 */

export function spawnFlyingCardSystem({
  startRect,
  endRect,
  durationMs = 460,
  delayMs = 0,
  rotateStart = 0,
  rotateMid = 8,
}) {
  return new Promise((resolve) => {
    if (!startRect || !endRect) {
      resolve();
      return;
    }
    const el = document.createElement('div');
    el.className = 'fly-card';
    el.style.left = `${startRect.left}px`;
    el.style.top = `${startRect.top}px`;
    el.style.width = `${startRect.width}px`;
    el.style.height = `${startRect.height}px`;
    el.style.transform = `translate(0px, 0px) rotate(${rotateStart}deg)`;
    document.body.appendChild(el);
    const dx = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
    const dy = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);
    const onDone = () => {
      el.remove();
      resolve();
    };
    setTimeout(() => {
      requestAnimationFrame(() => {
        el.style.transition = `transform ${durationMs}ms cubic-bezier(0.2, 0.78, 0.22, 1), opacity ${durationMs}ms ease`;
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotateMid}deg)`;
        el.style.opacity = '0.96';
        setTimeout(() => {
          el.style.transition = 'transform 150ms ease, opacity 150ms ease';
          el.style.transform = `translate(${dx}px, ${dy}px) rotate(0deg)`;
          setTimeout(onDone, 165);
        }, Math.max(120, durationMs - 160));
      });
    }, Math.max(0, delayMs));
  });
}

export function buildHandInsertRectSystem({ handEl, slotIndex, cardWidth = 112, cardHeight = 150, gap = 12 }) {
  if (!handEl) return null;
  const handRect = handEl.getBoundingClientRect();
  const maxPerRow = Math.max(1, Math.floor((handRect.width + gap) / (cardWidth + gap)));
  const row = Math.floor(slotIndex / maxPerRow);
  const col = slotIndex % maxPerRow;
  return {
    left: handRect.left + (col * (cardWidth + gap)),
    top: handRect.top + (row * (cardHeight + gap)),
    width: cardWidth,
    height: cardHeight,
  };
}

export function sleepMsSystem(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}
