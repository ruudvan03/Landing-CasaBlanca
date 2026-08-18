import { renderSidebar } from './sidebar.js';

export function initExtras(state) {
  // 1. Escuchar clics en los botones de más y menos
  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (!id) return;

      const card = btn.closest('.group');
      const noteInput = card ? card.querySelector(`input[data-note-id="${id}"]`) : null;
      const itemNote = noteInput ? noteInput.value.trim() : '';

      if (!state.extras[id]) {
        state.extras[id] = {
          id: id,
          name: btn.dataset.name || id,
          price: parseInt(btn.dataset.price) || 0,
          qty: 0,
          cat: btn.dataset.cat,
          note: itemNote,
        };
      }

      if (action === 'plus') {
        state.extras[id].qty++;
        if (itemNote) state.extras[id].note = itemNote;
      } else if (state.extras[id].qty > 0) {
        state.extras[id].qty--;
      }

      const el = document.getElementById('qty-' + id);
      if (el) el.textContent = state.extras[id].qty;
      renderSidebar(state);
    });
  });

  // 2. NUEVO: Escuchar en tiempo real lo que se escribe en los inputs de notas
  document.querySelectorAll('input[data-note-id]').forEach((input) => {
    input.addEventListener('input', (e) => {
      const id = e.target.dataset.noteId;
      const typedNote = e.target.value.trim();

      // Si el producto ya está agregado en el estado, actualizamos su nota al instante
      if (state.extras[id]) {
        state.extras[id].note = typedNote;
      }
    });
  });
}