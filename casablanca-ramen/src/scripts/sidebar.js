import { fmt } from './state.js';

// Función auxiliar para renderizar el tazón dinámico más grande y detallado
function renderDynamicBowl(ramen) {
  const hasCaldo = ramen.caldo && ramen.caldo.length > 0;
  const hasFideo = ramen.fideo && ramen.fideo.length > 0;
  const hasProteina = ramen.proteina && ramen.proteina.length > 0;
  const hasVerduras = ramen.verduras && ramen.verduras.length > 0;

  // Detectar color del caldo dinámicamente según la selección
  let caldoColor = '#d97706'; // Tono base (Shoyu/Ámbar)
  if (hasCaldo) {
    const caldoName = ramen.caldo[0].name.toLowerCase();
    if (caldoName.includes('miso')) caldoColor = '#b45309';
    else if (caldoName.includes('tonkotsu')) caldoColor = '#fef3c7';
    else if (caldoName.includes('spicy') || caldoName.includes('chili') || caldoName.includes('diabla')) caldoColor = '#dc2626';
  }

  return `
    <div class="flex flex-col items-center justify-center py-3 animate-fade-in">
      <div class="w-32 h-32 mb-3 rounded-2xl bg-card/90 border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_25px_rgba(204,26,26,0.25)]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-24 h-24 filter drop-shadow-[0_0_10px_rgba(204,26,26,0.5)]">
          <!-- Sombra interior del tazón -->
          <ellipse cx="50" cy="50" rx="38" ry="11" fill="#0d0101" />
          
          <!-- Base externa del tazón -->
          <path d="M12 48 C 12 82, 88 82, 88 48 Z" fill="url(#sidebarBowlGrad)" stroke="#cc1a1a" stroke-width="3.5"/>
          <ellipse cx="50" cy="48" rx="38" ry="10" fill="#180303" stroke="#cc1a1a" stroke-width="3.5"/>

          <!-- CAPA 1: Caldo -->
          ${hasCaldo ? `
            <g class="animate-drop">
              <ellipse cx="50" cy="50" rx="34" ry="8.5" fill="${caldoColor}" opacity="0.95"/>
              <ellipse cx="48" cy="49" rx="26" ry="6" fill="#ffffff" opacity="0.15"/>
            </g>
          ` : ''}

          <!-- CAPA 2: Fideos -->
          ${hasFideo ? `
            <g class="animate-drop">
              <path d="M26 49 Q 33 42, 40 49 Q 48 42, 56 49 Q 63 42, 70 49" fill="none" stroke="#fde047" stroke-width="5" stroke-linecap="round"/>
              <path d="M30 53 Q 38 46, 46 53 Q 54 46, 62 53" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
              <path d="M34 47 Q 41 40, 48 47 Q 55 40, 62 47" fill="none" stroke="#fef08a" stroke-width="3" stroke-linecap="round"/>
            </g>
          ` : ''}

          <!-- CAPA 3: Proteína (Chashu / Carne) -->
          ${hasProteina ? `
            <g class="animate-drop">
              <path d="M 32 46 Q 40 38, 48 46 Q 40 54, 32 46 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
              <circle cx="40" cy="46" r="5" fill="#f87171" opacity="0.7"/>
              <path d="M 52 48 Q 60 40, 68 48 Q 60 56, 52 48 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
              <circle cx="60" cy="48" r="4.5" fill="#f87171" opacity="0.7"/>
            </g>
          ` : ''}

          <!-- CAPA 4: Verduras y Toppings (Huevo, Cebollín, Nori) -->
          ${hasVerduras ? `
            <g class="animate-drop">
              <!-- Mitad de Huevo Ajitsuke -->
              <ellipse cx="50" cy="41" rx="8" ry="6" fill="#fdf2f8" stroke="#cbd5e1" stroke-width="1.5"/>
              <circle cx="50" cy="41" r="3.5" fill="#ca8a04"/>
              
              <!-- Naruto / Remolino -->
              <circle cx="36" cy="42" r="4" fill="#ffffff" stroke="#ef4444" stroke-width="1.5"/>
              <circle cx="36" cy="42" r="1.5" fill="#ef4444"/>

              <!-- Hojas de Cebollín -->
              <path d="M25 45 Q 29 39, 34 45" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M66 43 Q 71 38, 75 44" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
            </g>
          ` : ''}

          <defs>
            <linearGradient id="sidebarBowlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#3a0a0a" />
              <stop offset="100%" stop-color="#120202" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  `;
}

export function renderSidebar(state) {
  const content = document.getElementById('sidebar-order-content');
  const totalBox = document.getElementById('sidebar-total');
  let sections = [];
  let grandTotal = 0;
  let itemCount = 0;

  const itemRow = (label, price) =>
    `<div class="flex justify-between items-center text-[0.8rem] text-bone py-[0.3rem] border-b border-border-dim"><span>${label}</span><span class="text-red font-semibold whitespace-nowrap">${price}</span></div>`;

  // 1. Items de Ramen ya confirmados
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

  // 2. Extras agregados
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

  // 3. Ramen en construcción (Muestra el tazón dinámico más grande e interactivo)
  const inProgress = ['fideo', 'verduras', 'proteina', 'caldo'].some(
    (k) => state.ramen[k].length > 0
  );
  
  if (inProgress) {
    sections.push(
      `<div class="mb-4 bg-card/40 border border-border-dim rounded-xl p-4">
         <div class="text-[0.7rem] uppercase tracking-[0.15em] text-red mb-2 font-bold flex justify-between items-center">
           <span>En construcción…</span>
         </div>
         ${renderDynamicBowl(state.ramen)}
         <div class="text-[0.75rem] text-muted text-center mt-1">Completa los pasos y presiona "Agregar"</div>
       </div>`
    );
  }

  // 4. Renderizado condicional general (Si todo está completamente vacío)
  if (sections.length === 0) {
    if (content) {
      content.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center opacity-70">
          <div class="w-24 h-24 mb-4 rounded-full bg-card border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(204,26,26,0.15)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-14 h-14 filter drop-shadow-[0_0_6px_rgba(204,26,26,0.4)]">
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

  // Actualizadores de contadores móviles y generales
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