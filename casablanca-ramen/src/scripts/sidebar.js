import { fmt } from './state.js';

export function renderSidebar(state) {
  const content = document.getElementById('sidebar-order-content');
  const totalBox = document.getElementById('sidebar-total');
  let sections = [];
  let grandTotal = 0;
  let itemCount = 0;

  const itemRow = (label, price) =>
    `<div class="flex justify-between items-center text-[0.8rem] text-bone py-[0.3rem] border-b border-border-dim"><span>${label}</span><span class="text-red font-semibold whitespace-nowrap">${price}</span></div>`;

  if (state.ramenItems.length > 0) {
    const rows = state.ramenItems
      .map((r, i) => {
        grandTotal += r.total;
        itemCount++;
        const label = r.fideo[0]?.name || 'Ramen';
        return itemRow(`Ramen ${i + 1} — ${label}`, fmt(r.total));
      })
      .join('');
    sections.push(
      `<div class="mb-4"><div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Ramen</div><div class="flex flex-col gap-[0.3rem]">${rows}</div></div>`
    );
  }

  const extraItems = Object.values(state.extras).filter((e) => e.qty > 0);
  if (extraItems.length > 0) {
    const rows = extraItems
      .map((e) => {
        const sub = e.price * e.qty;
        grandTotal += sub;
        itemCount += e.qty;
        return itemRow(`${e.qty}× ${e.name}`, fmt(sub));
      })
      .join('');
    sections.push(
      `<div class="mb-4"><div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Otros</div><div class="flex flex-col gap-[0.3rem]">${rows}</div></div>`
    );
  }

  const inProgress = ['fideo', 'verduras', 'proteina', 'caldo'].some(
    (k) => state.ramen[k].length > 0
  );
  if (inProgress) {
    sections.push(
      `<div class="mb-4"><div class="text-[0.65rem] uppercase tracking-[0.15em] text-red mb-[0.4rem]">En construcción…</div><div class="text-[0.75rem] text-muted">Completa los pasos y presiona "Agregar"</div></div>`
    );
  }

  if (sections.length === 0) {
    content.innerHTML =
      '<p class="text-muted text-[0.82rem] text-center py-8">Tu pedido está vacío.<br/>Arma tu ramen para comenzar.</p>';
    totalBox.classList.add('hidden');
  } else {
    content.innerHTML = sections.join('');
    totalBox.classList.remove('hidden');
    document.getElementById('sidebar-total-price').textContent = fmt(grandTotal);
  }

  document.getElementById('mobile-item-count').textContent =
    itemCount + (itemCount === 1 ? ' item' : ' items');
  document.getElementById('mobile-total').textContent = fmt(grandTotal);
  document.getElementById('cart-count').textContent = itemCount;
}