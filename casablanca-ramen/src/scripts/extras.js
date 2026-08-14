import { renderSidebar } from './sidebar.js';

export function initExtras(state) {
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!id) return;

      if (!state.extras[id]) {
        state.extras[id] = {
          name: btn.dataset.name || id,
          price: parseInt(btn.dataset.price) || 0,
          qty: 0,
          cat: btn.dataset.cat,
        };
      }
      if (action === 'plus') state.extras[id].qty++;
      else if (state.extras[id].qty > 0) state.extras[id].qty--;

      const el = document.getElementById('qty-' + id);
      if (el) el.textContent = state.extras[id].qty;
      renderSidebar(state);
    });
  });
}   