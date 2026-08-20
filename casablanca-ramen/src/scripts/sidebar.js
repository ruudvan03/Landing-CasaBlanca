import { fmt } from './state.js';
import { playExitAndThen, activateFreshAnimations } from './animations.js';
import {
  getBowlDesign,
  getFideoStyle,
  getProteinaSvg,
  getVerdurasSvg,
  getExtraSvg,
  renderDynamicBowl,
  renderMiniBowlSvg,
  resetBuildState
} from './bowlDesign.js';

/* ================================================================
   SIDEBAR — ORQUESTADOR PRINCIPAL
   Punto de entrada del carrito (renderSidebar / confirmOrderReset).

   Este archivo solo se encarga de:
   - construir/mantener el "skeleton" del DOM del sidebar,
   - reconciliar listas (ramen / extras) contra el estado actual,
     conservando nodos existentes (claves estables) para que el
     motor de animaciones (animations.js) solo anime lo que cambió,
   - delegar el dibujo de tazones e íconos a bowlDesign.js.

   El efecto de "vuelo" del menú al sidebar vive aparte, en
   flyToSidebar.js, y se invoca directamente desde extras.js y
   builder.js (no desde aquí).
================================================================ */

/* ================================================================
   RECONCILIADOR CON CLAVES
   - Cada ramen / extra conserva su nodo DOM entre renders.
   - Solo lo nuevo entra animado; lo existente se actualiza en el
     lugar (precio, chips, índice); solo lo eliminado sale animado.
================================================================ */

let _skeleton = null;
const _ramenNodeMap = new Map();   // uid -> <div class="ramen-card">
const _extraNodeMap = new Map();   // key (nombre en state.extras) -> <div class="extra-row">
const _ramenUidMap = new WeakMap();
let _ramenUidSeq = 0;

let _latestState = null;
let _latestUpdateCallback = null;

function getRamenUid(ramenObj) {
  if (!_ramenUidMap.has(ramenObj)) {
    _ramenUidMap.set(ramenObj, `ramen-${_ramenUidSeq++}`);
  }
  return _ramenUidMap.get(ramenObj);
}

function renderRamenCardHTML(r, ramenIndex) {
  const design = getBowlDesign(r);
  const fideoStyle = getFideoStyle(r.fideo);
  const uid = getRamenUid(r);

  return `
    <div class="ramen-card flex flex-col gap-2 p-3 mb-3 rounded-xl bg-card/60 border border-border-dim transition-all hover:border-red/40 shadow-sm relative group" data-uid="${uid}" data-fresh="1" data-anim-kind="generic" data-anim-delay="0">
      <div class="flex items-start gap-3">
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-card border border-red/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_12px_rgba(204,26,26,0.25)] mini-bowl">
          ${renderMiniBowlSvg(r, design, fideoStyle)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-1">
            <span class="font-display font-bold text-bone tracking-wide text-[0.88rem] ramen-title">Ramen ${ramenIndex + 1}</span>
            <div class="flex items-center gap-1">
              <span class="text-red font-semibold whitespace-nowrap ramen-price">${fmt(r.total)}</span>
              <button type="button" class="edit-ramen text-muted hover:text-amber-400 transition-colors text-xs px-1" data-ramen-index="${ramenIndex}" title="Editar este ramen">✏️</button>
              <button type="button" class="remove-ramen text-muted hover:text-red transition-colors text-xs px-1" data-ramen-index="${ramenIndex}" title="Eliminar ramen completo">🗑️</button>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-border-dim/50 ingredient-chips"></div>
    </div>
  `.trim();
}

function reconcileChips(chipsEl, ramenItem, ramenIndex) {
  const allIngredients = [
    ...(ramenItem.caldo || []).map(item => ({ ...item, cat: 'caldo' })),
    ...(ramenItem.fideo || []).map(item => ({ ...item, cat: 'fideo' })),
    ...(ramenItem.proteina || []).map(item => ({ ...item, cat: 'proteina' })),
    ...(ramenItem.verduras || []).map(item => ({ ...item, cat: 'verduras' }))
  ];

  if (allIngredients.length === 0) {
    if (!chipsEl.querySelector('.no-ingredients')) {
      chipsEl.innerHTML = '<span class="text-[0.73rem] text-muted no-ingredients">Sin ingredientes</span>';
    }
    return;
  }

  const emptyMsg = chipsEl.querySelector('.no-ingredients');
  if (emptyMsg) emptyMsg.remove();

  const seenKeys = new Set();
  let prevChip = null;

  allIngredients.forEach((item, idx) => {
    const key = `${item.cat}-${item.id}`;
    seenKeys.add(key);
    let chip = chipsEl.querySelector(`[data-chip-key="${key}"]`);
    if (!chip) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <span class="ingredient-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border-dim text-[0.7rem] text-bone" data-chip-key="${key}" data-fresh="1" data-anim-kind="generic" data-anim-delay="${idx * 40}">
          ${item.name}
          <button type="button" class="remove-ingredient text-muted hover:text-red transition-colors ml-0.5 text-xs font-bold" data-ramen-index="${ramenIndex}" data-category="${item.cat}" data-item-id="${item.id}">×</button>
        </span>
      `.trim();
      chip = wrapper.firstElementChild;
      chipsEl.appendChild(chip);
    } else {
      const btn = chip.querySelector('.remove-ingredient');
      if (btn) btn.dataset.ramenIndex = ramenIndex;
    }

    if (prevChip ? prevChip.nextElementSibling !== chip : chipsEl.firstElementChild !== chip) {
      chipsEl.insertBefore(chip, prevChip ? prevChip.nextElementSibling : chipsEl.firstElementChild);
    }
    prevChip = chip;
  });

  chipsEl.querySelectorAll('[data-chip-key]').forEach(chip => {
    if (!seenKeys.has(chip.dataset.chipKey)) chip.remove();
  });
}

function updateRamenCard(cardEl, r, ramenIndex) {
  const titleEl = cardEl.querySelector('.ramen-title');
  if (titleEl) titleEl.textContent = `Ramen ${ramenIndex + 1}`;

  const priceEl = cardEl.querySelector('.ramen-price');
  if (priceEl) priceEl.textContent = fmt(r.total);

  const editBtn = cardEl.querySelector('.edit-ramen');
  if (editBtn) editBtn.dataset.ramenIndex = ramenIndex;
  const removeBtn = cardEl.querySelector('.remove-ramen');
  if (removeBtn) removeBtn.dataset.ramenIndex = ramenIndex;

  const miniBowl = cardEl.querySelector('.mini-bowl');
  if (miniBowl) {
    const design = getBowlDesign(r);
    const fideoStyle = getFideoStyle(r.fideo);
    miniBowl.innerHTML = renderMiniBowlSvg(r, design, fideoStyle);
  }

  const chipsEl = cardEl.querySelector('.ingredient-chips');
  if (chipsEl) reconcileChips(chipsEl, r, ramenIndex);
}

function reconcileRamenList(listEl, ramenItems) {
  const seenUids = new Set();
  let prevEl = null;

  ramenItems.forEach((r, ramenIndex) => {
    const uid = getRamenUid(r);
    seenUids.add(uid);
    let el = _ramenNodeMap.get(uid);
    if (!el) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderRamenCardHTML(r, ramenIndex);
      el = wrapper.firstElementChild;
      _ramenNodeMap.set(uid, el);
      listEl.appendChild(el);
    }
    updateRamenCard(el, r, ramenIndex);

    if (prevEl ? prevEl.nextElementSibling !== el : listEl.firstElementChild !== el) {
      listEl.insertBefore(el, prevEl ? prevEl.nextElementSibling : listEl.firstElementChild);
    }
    prevEl = el;
  });

  Array.from(_ramenNodeMap.entries()).forEach(([uid, el]) => {
    if (!seenUids.has(uid)) {
      _ramenNodeMap.delete(uid);
      playExitAndThen(el, 'card', () => el.remove());
    }
  });
}

function renderExtraRowHTML(e, extraIndex, key) {
  const extraSvg = getExtraSvg(e.name, e.qty);
  return `
    <div class="extra-row flex items-center justify-between p-2.5 mb-2 rounded-xl bg-card/60 border border-border-dim transition-all hover:border-red/40 shadow-sm" data-extra-key="${key}" data-qty="${e.qty}" data-fresh="1" data-anim-kind="generic" data-anim-delay="${extraIndex * 70}">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 flex-shrink-0 rounded-xl bg-card border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_8px_rgba(204,26,26,0.15)] extra-icon">
          ${extraSvg}
        </div>
        <div class="min-w-0">
          <span class="font-display font-bold text-bone text-[0.85rem] block truncate extra-label">${e.qty}× ${e.name}</span>
          <span class="text-[0.68rem] text-muted uppercase tracking-wider">Extra / Menú</span>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <span class="text-red font-semibold whitespace-nowrap text-[0.85rem] extra-price">${fmt(e.price * e.qty)}</span>
      </div>
    </div>
  `.trim();
}

function reconcileExtrasList(listEl, extras) {
  const entries = Object.entries(extras).filter(([, e]) => e.qty > 0);
  const seenKeys = new Set();
  let prevEl = null;

  entries.forEach(([key, e], extraIndex) => {
    seenKeys.add(key);
    let el = _extraNodeMap.get(key);
    if (!el) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = renderExtraRowHTML(e, extraIndex, key);
      el = wrapper.firstElementChild;
      _extraNodeMap.set(key, el);
      listEl.appendChild(el);
    } else {
      const label = el.querySelector('.extra-label');
      if (label) label.textContent = `${e.qty}× ${e.name}`;
      const price = el.querySelector('.extra-price');
      if (price) price.textContent = fmt(e.price * e.qty);
      if (el.dataset.qty !== String(e.qty)) {
        const iconWrap = el.querySelector('.extra-icon');
        if (iconWrap) iconWrap.innerHTML = getExtraSvg(e.name, e.qty);
        el.dataset.qty = String(e.qty);
      }
    }

    if (prevEl ? prevEl.nextElementSibling !== el : listEl.firstElementChild !== el) {
      listEl.insertBefore(el, prevEl ? prevEl.nextElementSibling : listEl.firstElementChild);
    }
    prevEl = el;
  });

  Array.from(_extraNodeMap.entries()).forEach(([key, el]) => {
    if (!seenKeys.has(key)) {
      _extraNodeMap.delete(key);
      playExitAndThen(el, 'row', () => el.remove());
    }
  });
}

function ensureSkeleton(content) {
  if (_skeleton && _skeleton.root === content && content.contains(_skeleton.ramenSection)) {
    return _skeleton;
  }

  content.innerHTML = `
    <div id="sb-ramen-section" class="mb-4" hidden>
      <div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Ramen</div>
      <div id="sb-ramen-list" class="flex flex-col gap-[0.3rem]"></div>
    </div>
    <div id="sb-extras-section" class="mb-4" hidden>
      <div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Complementos, Pastas y Extras</div>
      <div id="sb-extras-list" class="flex flex-col gap-[0.3rem]"></div>
    </div>
    <div id="sb-build-section" class="mb-4 bg-card/40 border border-border-dim rounded-xl p-4" hidden>
      <div class="text-[0.7rem] uppercase tracking-[0.15em] text-red mb-2 font-bold flex justify-between items-center">
        <span>En construcción…</span>
      </div>
      <div id="sb-build-bowl"></div>
      <div class="text-[0.75rem] text-muted text-center mt-1">Completa los pasos y presiona "Agregar"</div>
    </div>
    <div id="sb-empty-state" hidden>
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
      </div>
    </div>
  `;

  _ramenNodeMap.clear();
  _extraNodeMap.clear();

  _skeleton = {
    root: content,
    ramenSection: content.querySelector('#sb-ramen-section'),
    ramenList: content.querySelector('#sb-ramen-list'),
    extrasSection: content.querySelector('#sb-extras-section'),
    extrasList: content.querySelector('#sb-extras-list'),
    buildSection: content.querySelector('#sb-build-section'),
    buildBowl: content.querySelector('#sb-build-bowl'),
    emptyState: content.querySelector('#sb-empty-state')
  };

  bindDelegatedEvents(content);
  return _skeleton;
}

function bindDelegatedEvents(content) {
  if (content.__sidebarDelegated) return;
  content.__sidebarDelegated = true;

  content.addEventListener('click', (e) => {
    const state = _latestState;
    const updateCallback = _latestUpdateCallback;
    if (!state) return;

    const triggerUpdate = () => {
      if (typeof updateCallback === 'function') updateCallback();
      else renderSidebar(state, updateCallback);
    };

    const removeIngBtn = e.target.closest('.remove-ingredient');
    if (removeIngBtn) {
      const rIndex = parseInt(removeIngBtn.dataset.ramenIndex, 10);
      const category = removeIngBtn.dataset.category;
      const itemId = removeIngBtn.dataset.itemId;
      const chipEl = removeIngBtn.closest('.ingredient-chip');

      playExitAndThen(chipEl, 'chip', () => {
        if (chipEl) chipEl.remove();
        const ramenItem = state.ramenItems[rIndex];
        if (ramenItem && ramenItem[category]) {
          ramenItem[category] = ramenItem[category].filter(i => String(i.id) !== String(itemId));
          let newTotal = 0;
          ['caldo', 'fideo', 'proteina', 'verduras'].forEach(cat => {
            if (ramenItem[cat]) ramenItem[cat].forEach(i => { newTotal += (i.price || 0); });
          });
          ramenItem.total = newTotal;
          triggerUpdate();
        }
      });
      return;
    }

    const editBtn = e.target.closest('.edit-ramen');
    if (editBtn) {
      const rIndex = parseInt(editBtn.dataset.ramenIndex, 10);
      const cardEl = editBtn.closest('.ramen-card');

      playExitAndThen(cardEl, 'card', () => {
        const ramenToEdit = state.ramenItems[rIndex];
        if (ramenToEdit) {
          _ramenNodeMap.delete(getRamenUid(ramenToEdit));
          if (cardEl) cardEl.remove();
          state.ramen = {
            caldo: [...(ramenToEdit.caldo || [])],
            fideo: [...(ramenToEdit.fideo || [])],
            proteina: [...(ramenToEdit.proteina || [])],
            verduras: [...(ramenToEdit.verduras || [])]
          };
          state.ramenItems.splice(rIndex, 1);
          triggerUpdate();
        }
      });
      return;
    }

    const removeBtn = e.target.closest('.remove-ramen');
    if (removeBtn) {
      const rIndex = parseInt(removeBtn.dataset.ramenIndex, 10);
      const cardEl = removeBtn.closest('.ramen-card');

      playExitAndThen(cardEl, 'card', () => {
        const ramenObj = state.ramenItems[rIndex];
        if (ramenObj) _ramenNodeMap.delete(getRamenUid(ramenObj));
        if (cardEl) cardEl.remove();
        state.ramenItems.splice(rIndex, 1);
        triggerUpdate();
      });
      return;
    }
  });
}

export function renderSidebar(state, updateCallback) {
  _latestState = state;
  _latestUpdateCallback = updateCallback;

  const content = document.getElementById('sidebar-order-content');
  const totalBox = document.getElementById('sidebar-total');
  if (!content) return;

  const skeleton = ensureSkeleton(content);

  let grandTotal = 0;
  let itemCount = 0;

  if (state.ramenItems.length > 0) {
    state.ramenItems.forEach((r) => { grandTotal += r.total; itemCount++; });
    reconcileRamenList(skeleton.ramenList, state.ramenItems);
    skeleton.ramenSection.hidden = false;
  } else {
    if (_ramenNodeMap.size > 0) reconcileRamenList(skeleton.ramenList, []);
    skeleton.ramenSection.hidden = true;
  }

  const extraEntries = Object.values(state.extras || {}).filter((e) => e.qty > 0);
  if (extraEntries.length > 0) {
    extraEntries.forEach((e) => { grandTotal += e.price * e.qty; itemCount += e.qty; });
    reconcileExtrasList(skeleton.extrasList, state.extras);
    skeleton.extrasSection.hidden = false;
  } else {
    if (_extraNodeMap.size > 0) reconcileExtrasList(skeleton.extrasList, {});
    skeleton.extrasSection.hidden = true;
  }

  const inProgress = ['fideo', 'verduras', 'proteina', 'caldo'].some(
    (k) => state.ramen[k].length > 0
  );

  if (inProgress) {
    skeleton.buildBowl.innerHTML = renderDynamicBowl(state.ramen);
    skeleton.buildSection.hidden = false;
  } else {
    skeleton.buildSection.hidden = true;
    resetBuildState();
  }

  const isEmpty = state.ramenItems.length === 0 && extraEntries.length === 0 && !inProgress;
  skeleton.emptyState.hidden = !isEmpty;

  if (totalBox) {
    if (isEmpty) {
      totalBox.classList.add('hidden');
    } else {
      totalBox.classList.remove('hidden');
      const totalPriceEl = document.getElementById('sidebar-total-price');
      if (totalPriceEl) totalPriceEl.textContent = fmt(grandTotal);
    }
  }

  activateFreshAnimations(content);

  const mobileItemCount = document.getElementById('mobile-item-count');
  if (mobileItemCount) mobileItemCount.textContent = itemCount + (itemCount === 1 ? ' item' : ' items');

  const mobileTotal = document.getElementById('mobile-total');
  if (mobileTotal) mobileTotal.textContent = fmt(grandTotal);

  const cartCount = document.getElementById('cart-count');
  if (cartCount) cartCount.textContent = itemCount;
}

/* ================================================================
   RECARGA COMPLETA AL CONFIRMAR PEDIDO
================================================================ */
export function confirmOrderReset(state, updateCallback) {
  const content = document.getElementById('sidebar-order-content');

  state.ramenItems.splice(0, state.ramenItems.length);
  Object.values(state.extras || {}).forEach((e) => { e.qty = 0; });
  state.ramen.caldo = [];
  state.ramen.fideo = [];
  state.ramen.proteina = [];
  state.ramen.verduras = [];
  state.ramen.extras = [];

  _ramenNodeMap.clear();
  _extraNodeMap.clear();
  resetBuildState();
  _skeleton = null;

  if (content) {
    try {
      content.animate(
        [{ opacity: 1 }, { opacity: 0.25 }],
        { duration: 180, easing: 'ease-in' }
      );
    } catch (err) { /* noop */ }
  }

  if (typeof updateCallback === 'function') updateCallback();
  else renderSidebar(state, updateCallback);
}