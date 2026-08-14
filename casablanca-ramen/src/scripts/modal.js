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
  if (summaryEl) {
    summaryEl.innerHTML = html || '<p class="text-[0.8rem] text-muted">Pedido vacío</p>';
  }
  
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.setAttribute('data-open', '');
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.removeAttribute('data-open');
  }
}

export function initModal(state) {
  document.getElementById('open-modal-btn')?.addEventListener('click', () => openModal(state));
  document.getElementById('mobile-open-modal')?.addEventListener('click', () => openModal(state));
  document.getElementById('confirm-btn')?.addEventListener('click', () => openModal(state));
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  document.getElementById('modal-submit')?.addEventListener('click', () => {
    const mesaInput = document.getElementById('field-mesa');
    if (!mesaInput) return;
    const mesa = mesaInput.value.trim();
    if (!mesa) {
      mesaInput.focus();
      showToast('Por favor indica tu mesa');
      return;
    }
    const nombreInput = document.getElementById('field-nombre');
    const nombre = nombreInput ? nombreInput.value.trim() : '';

    state.ramenItems.length = 0;
    Object.keys(state.extras).forEach((k) => delete state.extras[k]);
    ['fideo', 'verduras', 'proteina', 'extras', 'caldo'].forEach((k) => (state.ramen[k] = []));

    document.querySelectorAll('[data-step]').forEach((b) => b.removeAttribute('data-selected'));
    document.querySelectorAll('[id^="qty-"]').forEach((el) => (el.textContent = '0'));

    updateProgress(state);
    renderSidebar(state);
    closeModal();

    mesaInput.value = '';
    if (nombreInput) nombreInput.value = '';
    const notasInput = document.getElementById('field-notas');
    if (notasInput) notasInput.value = '';

    showToast(`Pedido enviado — ${mesa}${nombre ? ', ' + nombre : ''}`);
  });

  document.getElementById('clear-btn')?.addEventListener('click', () => {
    // 1. Vaciar ramen confirmados y extras
    state.ramenItems.length = 0;
    Object.keys(state.extras).forEach((k) => delete state.extras[k]);

    // 2. Vaciar los ingredientes del ramen que estaba en construcción
    ['fideo', 'verduras', 'proteina', 'extras', 'caldo'].forEach((k) => (state.ramen[k] = []));

    // 3. Quitar la selección visual de los botones del constructor en la interfaz
    document.querySelectorAll('[data-step]').forEach((b) => b.removeAttribute('data-selected'));

    // 4. Reiniciar los contadores numéricos visuales a '0'
    document.querySelectorAll('[id^="qty-"]').forEach((el) => (el.textContent = '0'));

    // 5. Actualizar la barra de progreso y volver a renderizar el sidebar (mostrando el tazón vacío)
    updateProgress(state);
    renderSidebar(state);
    showToast('Pedido limpiado');
  });
}