import { showToast } from './state.js';
import { updateProgress } from './progress.js';
import { renderSidebar, flyToSidebar } from './sidebar.js';

export function initBuilder(state, ramenPrice) {
  document.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const extra = parseInt(btn.dataset.extra) || 0;
      const max = parseInt(btn.dataset.max) || 1;
      const arr = state.ramen[step];
      const idx = arr.findIndex((x) => x.id === id);

      if (idx >= 0) {
        arr.splice(idx, 1);
        btn.removeAttribute('data-selected');
      } else {
        if (max === 1) {
          arr.length = 0;
          document
            .querySelectorAll(`[data-step="${step}"]`)
            .forEach((b) => b.removeAttribute('data-selected'));
        } else if (arr.length >= max) {
          showToast(`Máximo ${max} opciones para ${step}`);
          return;
        }
        arr.push({ id, name, extra });
        btn.setAttribute('data-selected', '');
      }
      updateProgress(state);
      renderSidebar(state);
    });
  });

  const addRamenBtn = document.getElementById('add-ramen-btn');
  addRamenBtn.addEventListener('click', () => {
    const r = state.ramen;
    const extrasTotal = r.extras.reduce((s, x) => s + x.extra, 0);
    state.ramenItems.push({
      fideo: [...r.fideo],
      verduras: [...r.verduras],
      proteina: [...r.proteina],
      extras: [...r.extras],
      caldo: [...r.caldo],
      total: ramenPrice + extrasTotal,
    });
    ['fideo', 'verduras', 'proteina', 'extras', 'caldo'].forEach((k) => (state.ramen[k] = []));
    document.querySelectorAll('[data-step]').forEach((b) => b.removeAttribute('data-selected'));
    updateProgress(state);
    renderSidebar(state);

    // Vuelo hacia el sidebar al confirmar la construcción del ramen
    flyToSidebar(addRamenBtn, { emoji: '🍜', particleColor: '#cc1a1a' });

    showToast('Ramen agregado al pedido');
  });
}