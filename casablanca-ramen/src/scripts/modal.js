import { fmt, showToast } from './state.js';
import { updateProgress } from './progress.js';
import { renderSidebar } from './sidebar.js';

function openModal(state) {
  let html = '';
  let total = 0;

  state.ramenItems.forEach((r, i) => {
    html += `<div class="flex justify-between text-[0.8rem] py-1 text-muted"><span>Ramen ${i + 1} (${r.fideo[0]?.name || ''})</span><span class="text-red">${fmt(r.total)}</span></div>`;
    total += r.total;
  });

  Object.values(state.extras)
    .filter((e) => e.qty > 0)
    .forEach((e) => {
      const sub = e.price * e.qty;
      html += `<div class="flex justify-between text-[0.8rem] py-1 text-muted"><span>${e.qty}× ${e.name}</span><span class="text-red">${fmt(sub)}</span></div>`;
      total += sub;
    });

  html += `<div class="flex justify-between text-[0.8rem] py-1 text-bone font-bold border-t border-border-dim mt-2 pt-2"><span>Total</span><span class="text-red">${fmt(total)}</span></div>`;

  const summaryEl = document.getElementById('modal-summary');
  summaryEl.innerHTML = html || '<p class="text-[0.8rem] text-muted">Pedido vacío</p>';
  document.getElementById('modal-overlay').setAttribute('data-open', '');
}

function closeModal() {
  document.getElementById('modal-overlay').removeAttribute('data-open');
}

export function initModal(state) {
  document.getElementById('open-modal-btn').addEventListener('click', () => openModal(state));
  document.getElementById('mobile-open-modal').addEventListener('click', () => openModal(state));
  document.getElementById('confirm-btn')?.addEventListener('click', () => openModal(state));
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.getElementById('modal-submit').addEventListener('click', () => {
    const mesaInput = document.getElementById('field-mesa');
    const mesa = mesaInput.value.trim();
    if (!mesa) {
      mesaInput.focus();
      showToast('Por favor indica tu mesa');
      return;
    }
    const nombre = document.getElementById('field-nombre').value.trim();

    state.ramenItems.length = 0;
    Object.keys(state.extras).forEach((k) => delete state.extras[k]);
    ['fideo', 'verduras', 'proteina', 'extras', 'caldo'].forEach((k) => (state.ramen[k] = []));

    document.querySelectorAll('[data-step]').forEach((b) => b.removeAttribute('data-selected'));
    document.querySelectorAll('[id^="qty-"]').forEach((el) => (el.textContent = '0'));

    updateProgress(state);
    renderSidebar(state);
    closeModal();

    mesaInput.value = '';
    document.getElementById('field-nombre').value = '';
    document.getElementById('field-notas').value = '';

    showToast(`Pedido enviado — ${mesa}${nombre ? ', ' + nombre : ''}`);
  });

  document.getElementById('clear-btn')?.addEventListener('click', () => {
    state.ramenItems.length = 0;
    Object.keys(state.extras).forEach((k) => delete state.extras[k]);
    document.querySelectorAll('[id^="qty-"]').forEach((el) => (el.textContent = '0'));
    renderSidebar(state);
    showToast('Pedido limpiado');
  });
}