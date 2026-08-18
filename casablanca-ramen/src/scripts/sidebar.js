import { fmt } from './state.js';

// Función para obtener colores y estilos dinámicos del tazón según el caldo
function getBowlDesign(caldoArray) {
  let stroke = '#cc1a1a';
  let gradTop = '#3a0a0a';
  let gradBottom = '#120202';
  let accent = '#facc15';

  if (caldoArray && caldoArray.length > 0) {
    const name = caldoArray[0].name.toLowerCase();
    if (name.includes('miso')) {
      stroke = '#d97706';
      gradTop = '#451a03';
      gradBottom = '#180a02';
    } else if (name.includes('tonkotsu')) {
      stroke = '#fcd34d';
      gradTop = '#52525b';
      gradBottom = '#18181b';
    } else if (name.includes('spicy') || name.includes('chili') || name.includes('diabla')) {
      stroke = '#dc2626';
      gradTop = '#581c87';
      gradBottom = '#1e1b4b';
    }
  }
  return { stroke, gradTop, gradBottom, accent };
}

// Tazón grande para el ramen en construcción
function renderDynamicBowl(ramen) {
  const hasCaldo = ramen.caldo && ramen.caldo.length > 0;
  const hasFideo = ramen.fideo && ramen.fideo.length > 0;
  const hasProteina = ramen.proteina && ramen.proteina.length > 0;
  const hasVerduras = ramen.verduras && ramen.verduras.length > 0;

  let caldoColor = '#d97706';
  if (hasCaldo) {
    const caldoName = ramen.caldo[0].name.toLowerCase();
    if (caldoName.includes('miso')) caldoColor = '#b45309';
    else if (caldoName.includes('tonkotsu')) caldoColor = '#fef3c7';
    else if (caldoName.includes('spicy') || caldoName.includes('chili') || caldoName.includes('diabla')) caldoColor = '#dc2626';
  }

  const design = getBowlDesign(ramen.caldo);

  return `
    <div class="flex flex-col items-center justify-center py-3 animate-fade-in">
      <div class="w-36 h-36 mb-3 rounded-2xl bg-card/90 border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(204,26,26,0.25)]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-28 h-28 filter drop-shadow-[0_0_12px_rgba(204,26,26,0.5)]">
          <ellipse cx="50" cy="50" rx="40" ry="12" fill="#0d0101" />
          <path d="M10 48 C 10 85, 90 85, 90 48 Z" fill="url(#buildBowlGrad)" stroke="${design.stroke}" stroke-width="4"/>
          <ellipse cx="50" cy="48" rx="40" ry="11" fill="#180303" stroke="${design.stroke}" stroke-width="4"/>

          <!-- CAPA 1: Caldo -->
          ${hasCaldo ? `
            <g class="animate-drop">
              <ellipse cx="50" cy="50" rx="36" ry="9" fill="${caldoColor}" opacity="0.95"/>
              <ellipse cx="48" cy="49" rx="28" ry="6.5" fill="#ffffff" opacity="0.15"/>
            </g>
          ` : ''}

          <!-- CAPA 2: Fideos -->
          ${hasFideo ? `
            <g class="animate-drop">
              <path d="M24 49 Q 32 41, 40 49 Q 48 41, 56 49 Q 64 41, 72 49" fill="none" stroke="#fde047" stroke-width="5.5" stroke-linecap="round"/>
              <path d="M28 53 Q 37 45, 46 53 Q 55 45, 64 53" fill="none" stroke="#facc15" stroke-width="4.5" stroke-linecap="round"/>
            </g>
          ` : ''}

          <!-- CAPA 3: Proteína -->
          ${hasProteina ? `
            <g class="animate-drop">
              <path d="M 30 46 Q 39 37, 48 46 Q 39 55, 30 46 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
              <circle cx="39" cy="46" r="5.5" fill="#f87171" opacity="0.7"/>
              <path d="M 50 48 Q 59 39, 68 48 Q 59 57, 50 48 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
              <circle cx="59" cy="48" r="5" fill="#f87171" opacity="0.7"/>
            </g>
          ` : ''}

          <!-- CAPA 4: Verduras -->
          ${hasVerduras ? `
            <g class="animate-drop">
              <ellipse cx="50" cy="40" rx="9" ry="6.5" fill="#fdf2f8" stroke="#cbd5e1" stroke-width="1.5"/>
              <circle cx="50" cy="40" r="4" fill="${design.accent}"/>
              <circle cx="34" cy="42" r="4.5" fill="#ffffff" stroke="#ef4444" stroke-width="1.5"/>
              <path d="M23 45 Q 28 38, 33 45" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>
              <path d="M67 43 Q 72 36, 77 44" fill="none" stroke="#22c55e" stroke-width="4" stroke-linecap="round"/>
            </g>
          ` : ''}

          <defs>
            <linearGradient id="buildBowlGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="${design.gradTop}" />
              <stop offset="100%" stop-color="${design.gradBottom}" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  `;
}

export function renderSidebar(state, updateCallback) {
  const content = document.getElementById('sidebar-order-content');
  const totalBox = document.getElementById('sidebar-total');
  let sections = [];
  let grandTotal = 0;
  let itemCount = 0;

  const itemRow = (label, price) =>
    `<div class="flex justify-between items-center text-[0.8rem] text-bone py-[0.3rem] border-b border-border-dim"><span>${label}</span><span class="text-red font-semibold whitespace-nowrap">${price}</span></div>`;

  // 1. Items de Ramen confirmados (con opción de eliminar ingredientes individuales o todo el ramen)
  if (state.ramenItems.length > 0) {
    const ramenCards = state.ramenItems
      .map((r, ramenIndex) => {
        grandTotal += r.total;
        itemCount++;

        const design = getBowlDesign(r.caldo);

        // Generar etiquetas con botón de eliminar (×) para cada ingrediente
        const allIngredients = [
          ...(r.caldo || []).map(item => ({ ...item, cat: 'caldo' })),
          ...(r.fideo || []).map(item => ({ ...item, cat: 'fideo' })),
          ...(r.proteina || []).map(item => ({ ...item, cat: 'proteina' })),
          ...(r.verduras || []).map(item => ({ ...item, cat: 'verduras' }))
        ];

        const ingredientChips = allIngredients.length > 0
          ? allIngredients.map((item, ingIndex) => `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border-dim text-[0.7rem] text-bone">
                ${item.name}
                <button type="button" class="remove-ingredient text-muted hover:text-red transition-colors ml-0.5 text-xs font-bold" data-ramen-index="${ramenIndex}" data-category="${item.cat}" data-item-id="${item.id}">×</button>
              </span>
            `).join('')
          : '<span class="text-[0.73rem] text-muted">Sin ingredientes</span>';

        return `
          <div class="flex flex-col gap-2 p-3 mb-3 rounded-xl bg-card/60 border border-border-dim transition-all hover:border-red/40 shadow-sm relative group">
            <div class="flex items-start gap-3">
              <!-- Minianimación de tazón mejorada y más grande -->
              <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-card border border-red/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_12px_rgba(204,26,26,0.25)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-9 h-9 filter drop-shadow-[0_0_5px_rgba(204,26,26,0.4)]">
                  <path d="M15 48 C 15 78, 85 78, 85 48 Z" fill="${design.gradTop}" stroke="${design.stroke}" stroke-width="3.5"/>
                  <ellipse cx="50" cy="48" rx="35" ry="9" fill="${design.gradBottom}" stroke="${design.stroke}" stroke-width="3.5"/>
                  <path d="M30 46 Q 40 39, 50 46 Q 60 39, 70 46" fill="none" stroke="#f4ede2" stroke-width="4" stroke-linecap="round"/>
                  <circle cx="50" cy="45" r="5" fill="${design.accent}"/>
                </svg>
              </div>
              
              <!-- Detalles y precio -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-display font-bold text-bone tracking-wide text-[0.88rem]">Ramen ${ramenIndex + 1}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-red font-semibold whitespace-nowrap">${fmt(r.total)}</span>
                    <button type="button" class="remove-ramen text-muted hover:text-red transition-colors text-xs px-1" data-ramen-index="${ramenIndex}" title="Eliminar ramen completo">🗑️</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chips de ingredientes modificables -->
            <div class="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-border-dim/50">
              ${ingredientChips}
            </div>
          </div>
        `;
      })
      .join('');

    sections.push(
      `<div class="mb-4"><div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Ramen</div><div class="flex flex-col gap-[0.3rem]">${ramenCards}</div></div>`
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

  // 3. Ramen en construcción
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

  // 4. Renderizado vacío
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

  // Actualizar contadores
  const mobileItemCount = document.getElementById('mobile-item-count');
  if (mobileItemCount) mobileItemCount.textContent = itemCount + (itemCount === 1 ? ' item' : ' items');
  
  const mobileTotal = document.getElementById('mobile-total');
  if (mobileTotal) mobileTotal.textContent = fmt(grandTotal);
  
  const cartCount = document.getElementById('cart-count');
  if (cartCount) cartCount.textContent = itemCount;

  // Vincular eventos de eliminación de ingredientes o ramen completo directamente en el DOM
  if (content) {
    content.querySelectorAll('.remove-ingredient').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rIndex = parseInt(e.currentTarget.dataset.ramenIndex);
        const category = e.currentTarget.dataset.category;
        const itemId = e.currentTarget.dataset.itemId;

        const ramenItem = state.ramenItems[rIndex];
        if (ramenItem && ramenItem[category]) {
          // Filtrar el ingrediente eliminado
          ramenItem[category] = ramenItem[category].filter(i => String(i.id) !== String(itemId));
          
          // Recalcular el total del ramen
          let newTotal = 0;
          ['caldo', 'fideo', 'proteina', 'verduras'].forEach(cat => {
            if (ramenItem[cat]) {
              ramenItem[cat].forEach(i => { newTotal += (i.price || 0); });
            }
          });
          ramenItem.total = newTotal;

          // Si el ramen se queda sin ingredientes esenciales, opcionalmente se puede mantener o actualizar
          if (updateCallback && typeof updateCallback === 'function') {
            updateCallback();
          } else {
            renderSidebar(state);
          }
        }
      });
    });

    content.querySelectorAll('.remove-ramen').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rIndex = parseInt(e.currentTarget.dataset.ramenIndex);
        state.ramenItems.splice(rIndex, 1);
        if (updateCallback && typeof updateCallback === 'function') {
          updateCallback();
        } else {
          renderSidebar(state);
        }
      });
    });
  }
}