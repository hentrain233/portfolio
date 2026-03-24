/**
 * Bind a standard overlay close behavior.
 */
export function bindOverlayDismiss({ backdropEl, closeEl, onClose }) {
  if (backdropEl) {
    backdropEl.addEventListener('click', () => onClose());
  }
  if (closeEl) {
    closeEl.addEventListener('click', () => onClose());
  }
}

