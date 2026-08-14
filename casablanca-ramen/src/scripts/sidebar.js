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
    if (content) {
      content.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center opacity-70">
          <div class="w-20 h-20 mb-4 rounded-full bg-card border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(204,26,26,0.15)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-12 h-12 filter drop-shadow-[0_0_6px_rgba(204,26,26,0.4)]">
              <path d="M15 48 C 15 78, 85 78, 85 48 Z" fill="url(#sidebarBowlGrad)" stroke="#cc1a1a" stroke-width="3"/>
              <ellipse cx="50" cy="48" rx="35" ry="9" fill="#1a1a1a" stroke="#cc1a1a" stroke-width="3"/>
              <path d="M30 46 Q 40 39, 50 46 Q 60 39, 70 46" fill="none" stroke="#f4ede2" stroke-width="4" stroke-linecap="round"/>
              <path d="M35 43 Q 42 36, 50 43 Q 58 36, 65 43" fill="none" stroke="#eab308" stroke-width="3" stroke-linecap="round"/>
              <circle cx="50" cy="45" r="6" fill="#f4ede2" stroke="#cc1a1a" stroke-width="1.5"/>
              <g class="animate-lid">
                <ellipse cx="50" cy="22" rx="36" ry="7" fill="#2a0808" stroke="#cc1a1a" stroke-width="2.5"/>
                <path d="M44 15 L56 15 L53 10 L47 10 Z" fill="#cc1a1a"/>
              </g>
              <defs>
                <linearGradient id="sidebarBowlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#2a0808" />
                  <stop offset="100%" stop-color="#120202" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p class="text-muted text-[0.85rem] leading-relaxed">
            Tu pedido está vacío.<br />Selecciona tus favoritos para comenzar.
          </p>
        </div>`;
    }
    if (totalBox) totalBox.classList.add('hidden');
  } else {
    if (content) content.innerHTML = sections.join('');
    if (totalBox) {
      totalBox.classList.remove('hidden');
      const totalPriceEl = document.getElementById('sidebar-total-price');
      if (totalPriceEl) totalPriceEl.textContent = fmt(grandTotal);
    }
  }

  const mobileItemCount = document.getElementById('mobile-item-count');
  if (mobileItemCount) {
    mobileItemCount.textContent = itemCount + (itemCount === 1 ? ' item' : ' items');
  }
  
  const mobileTotal = document.getElementById('mobile-total');
  if (mobileTotal) {
    mobileTotal.textContent = fmt(grandTotal);
  }
  
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.textContent = itemCount;
  }
}