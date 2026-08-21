import { showToast } from './state.js';
import { updateProgress } from './progress.js';
import { renderSidebar, setOnRamenEdit } from './sidebar.js';
import { flyToSidebar } from './Flytosidebar.js';

// Categorías que puede traer un ramen guardado y que se reflejan como
// botones [data-step] en el menú de construcción.
const BUILD_STEPS = ['caldo', 'fideo', 'proteina', 'verduras', 'extras'];

// Marca en el menú los botones [data-step] que correspondan a lo que
// ya está en state.ramen (usado al editar un ramen ya agregado), y
// lleva al usuario hasta el bloque de construcción para que continúe
// desde ahí sin tener que buscar dónde quedó.
function syncBuilderSelection(state) {
  document.querySelectorAll('[data-step]').forEach((btn) => btn.removeAttribute('data-selected'));

  BUILD_STEPS.forEach((step) => {
    const selectedIds = (state.ramen[step] || []).map((item) => String(item.id));
    if (selectedIds.length === 0) return;
    document.querySelectorAll(`[data-step="${step}"]`).forEach((btn) => {
      if (selectedIds.includes(String(btn.dataset.id))) {
        btn.setAttribute('data-selected', '');
      }
    });
  });

  updateProgress(state);

  const builderAnchor = document.querySelector('[data-step]') || document.getElementById('add-ramen-btn');
  if (builderAnchor) builderAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });

  showToast('Editando tu ramen — ajusta lo que quieras y presiona "Agregar" para guardar los cambios');
}

export function initBuilder(state, ramenPrice) {
  setOnRamenEdit((s) => syncBuilderSelection(s));

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