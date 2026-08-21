import { fmt } from './state.js';
import { playExitAndThen, activateFreshAnimations } from './Animations.js';
import {
  getBowlDesign,
  getFideoStyle,
  getProteinaSvg,
  getVerdurasSvg,
  getExtraSvg,
  renderDynamicBowl,
  renderMiniBowlSvg,
  resetBuildState
} from './Bowldesign.js';

/* ================================================================
   SIDEBAR & MOBILE DRAWER — ORQUESTADOR PRINCIPAL
================================================================ */

let _skeleton = null;
const _ramenNodeMap = new Map();   // uid -> <div class="ramen-card">
const _extraNodeMap = new Map();   // key -> <div class="extra-row">
const _ramenUidMap = new WeakMap();
let _ramenUidSeq = 0;

let _latestState = null;
let _latestUpdateCallback = null;
let _onRamenEdit = null;

export function setOnRamenEdit(callback) {
  _onRamenEdit = callback;
}

function getRamenUid(ramenObj) {
  if (!_ramenUidMap.has(ramenObj)) {
    _ramenUidMap.set(ramenObj, `ramen-${_ramenUidSeq++}`);
  }
  return _ramenUidMap.get(ramenObj);
}

/* ================================================================
   HELPER ANIMACIONES RESPONSIVE
================================================================ */

function safeExitAnimation(el, kind, cb) {
  if (window.innerWidth < 768) {
    cb();
  } else {
    playExitAndThen(el, kind, cb);
  }
}

/* ================================================================
   SINCRONIZACIÓN VISUAL DEL BUILDER CON EL RAMEN EN EDICIÓN
================================================================ */

function syncBuilderUI(ramen) {
  if (!ramen) return;

  const activeIds = new Set([
    ...(ramen.caldo || []).map(i => String(i.id)),
    ...(ramen.fideo || []).map(i => String(i.id)),
    ...(ramen.proteina || []).map(i => String(i.id)),
    ...(ramen.verduras || []).map(i => String(i.id)),
    ...(ramen.extras || []).map(i => String(i.id))
  ]);

  document.querySelectorAll('[data-ingredient-id], [data-item-id], [data-id], [data-option-id]').forEach(btn => {
    const id = btn.dataset.ingredientId || btn.dataset.itemId || btn.dataset.id || btn.dataset.optionId;
    if (!id) return;

    if (activeIds.has(String(id))) {
      btn.classList.add('active', 'is-selected', 'ring-2', 'ring-red', 'bg-red/10', 'border-red');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active', 'is-selected', 'ring-2', 'ring-red', 'bg-red/10', 'border-red');
      btn.setAttribute('aria-selected', 'false');
    }
  });
}

/* ================================================================
   CONTROL DEL CAJÓN MÓVIL (BOTTOM SHEET)
================================================================ */

function setupMobileDrawerEvents() {
  const openBtn = document.getElementById('open-mobile-cart-btn');
  const closeBtn = document.getElementById('close-mobile-cart-btn');
  const backdrop = document.getElementById('sidebar-backdrop');
  const container = document.getElementById('sidebar-container');

  if (!openBtn || !backdrop || !container) return;

  const openDrawer = () => {
    container.classList.remove('translate-y-full', 'pointer-events-none');
    container.classList.add('pointer-events-auto');

    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    backdrop.classList.add('opacity-100', 'pointer-events-auto');

    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    container.classList.remove('pointer-events-auto');
    container.classList.add('translate-y-full', 'pointer-events-none');

    backdrop.classList.remove('opacity-100', 'pointer-events-auto');
    backdrop.classList.add('opacity-0', 'pointer-events-none');

    document.body.style.overflow = '';
  };

  if (!openBtn.__hasListener) {
    openBtn.addEventListener('click', openDrawer);
    openBtn.__hasListener = true;
  }
  if (closeBtn && !closeBtn.__hasListener) {
    closeBtn.addEventListener('click', closeDrawer);
    closeBtn.__hasListener = true;
  }
  if (!backdrop.__hasListener) {
    backdrop.addEventListener('click', closeDrawer);
    backdrop.__hasListener = true;
  }

  window.closeMobileCartDrawer = closeDrawer;
}

/* ================================================================
   RECONCILIACIÓN Y HTML
================================================================ */

function renderRamenCardHTML(r, ramenIndex) {
  const design = getBowlDesign(r);
  const fideoStyle = getFideoStyle(r.fideo);
  const uid = getRamenUid(r);

  return `
    <div class="ramen-card flex flex-col gap-2 p-3 mb-2.5 rounded-xl bg-card/60 border border-border-dim transition-all hover:border-red/40 shadow-sm relative group" data-uid="${uid}" data-fresh="1" data-anim-kind="generic" data-anim-delay="0">
      <div class="flex items-start gap-3">
        <!-- Oculto el diseño gráfico del bowl en móviles (hidden md:flex) -->
        <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-card border border-red/30 hidden md:flex items-center justify-center relative overflow-hidden shadow-[0_0_12px_rgba(204,26,26,0.25)] mini-bowl">
          ${renderMiniBowlSvg(r, design, fideoStyle)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-1">
            <span class="font-display font-bold text-bone tracking-wide text-[0.88rem] ramen-title">Ramen ${ramenIndex + 1}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-red font-semibold whitespace-nowrap ramen-price mr-0.5 text-sm">${fmt(r.total)}</span>
              <button type="button" class="edit-ramen w-7 h-7 rounded-full bg-card border border-border-dim flex items-center justify-center text-muted transition-all duration-200 hover:border-amber-400/60 hover:text-amber-400 hover:bg-amber-400/10 active:scale-90 cursor-pointer" data-ramen-index="${ramenIndex}" title="Editar este ramen" aria-label="Editar este ramen">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 pointer-events-none">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
              </button>
              <button type="button" class="remove-ramen w-7 h-7 rounded-full bg-card border border-border-dim flex items-center justify-center text-muted transition-all duration-200 hover:border-red/60 hover:text-red hover:bg-red/10 active:scale-90 cursor-pointer" data-ramen-index="${ramenIndex}" title="Eliminar ramen completo" aria-label="Eliminar ramen completo">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 pointer-events-none">
                  <path d="M3 6h18"/>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
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
    ...(ramenItem.verduras || []).map(item => ({ ...item, cat: 'verduras' })),
    ...(ramenItem.extras || []).map(item => ({ ...item, cat: 'extras' }))
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
          <button type="button" class="remove-ingredient text-muted hover:text-red transition-colors ml-0.5 text-xs font-bold cursor-pointer" data-ramen-index="${ramenIndex}" data-category="${item.cat}" data-item-id="${item.id}">×</button>
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
  if (miniBowl && window.innerWidth >= 768) {
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
      safeExitAnimation(el, 'card', () => el.remove());
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
      safeExitAnimation(el, 'row', () => el.remove());
    }
  });
}

function ensureSkeleton(content) {
  if (_skeleton && _skeleton.root === content && content.contains(_skeleton.ramenSection)) {
    return _skeleton;
  }

  content.innerHTML = `
    <div id="sb-ramen-section" class="mb-3" hidden>
      <div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Ramen</div>
      <div id="sb-ramen-list" class="flex flex-col gap-[0.3rem]"></div>
    </div>
    <div id="sb-extras-section" class="mb-3" hidden>
      <div class="text-[0.65rem] uppercase tracking-[0.15em] text-muted mb-[0.4rem]">Complementos, Pastas y Extras</div>
      <div id="sb-extras-list" class="flex flex-col gap-[0.3rem]"></div>
    </div>
    <!-- Previsualización del ramen en construcción oculta en móvil (hidden md:block) -->
    <div id="sb-build-section" class="mb-3 bg-card/40 border border-border-dim rounded-xl p-3 hidden md:block" hidden>
      <div class="text-[0.7rem] uppercase tracking-[0.15em] text-red mb-2 font-bold flex justify-between items-center">
        <span>En construcción…</span>
      </div>
      <div id="sb-build-bowl"></div>
      <div class="text-[0.75rem] text-muted text-center mt-1">Completa los pasos y presiona "Agregar"</div>
    </div>
    <div id="sb-empty-state" hidden>
      <div class="flex flex-col items-center justify-center h-full text-center opacity-70 py-6">
        <div class="w-20 h-20 mb-4 rounded-2xl bg-card border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(204,26,26,0.15)]">
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
        <p class="text-muted text-[0.85rem] leading-relaxed max-w-[200px]">
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

      safeExitAnimation(chipEl, 'chip', () => {
        if (chipEl) chipEl.remove();
        const ramenItem = state.ramenItems[rIndex];
        if (ramenItem && ramenItem[category]) {
          ramenItem[category] = ramenItem[category].filter(i => String(i.id) !== String(itemId));
          let newTotal = 0;
          ['caldo', 'fideo', 'proteina', 'verduras', 'extras'].forEach(cat => {
            if (ramenItem[cat]) ramenItem[cat].forEach(i => { newTotal += (i.price || 0); });
          });
          ramenItem.total = newTotal;
          triggerUpdate();
          syncBuilderUI(state.ramen);
        }
      });
      return;
    }

    const editBtn = e.target.closest('.edit-ramen');
    if (editBtn) {
      const rIndex = parseInt(editBtn.dataset.ramenIndex, 10);
      const cardEl = editBtn.closest('.ramen-card');

      safeExitAnimation(cardEl, 'card', () => {
        const ramenToEdit = state.ramenItems[rIndex];
        if (ramenToEdit) {
          _ramenNodeMap.delete(getRamenUid(ramenToEdit));
          if (cardEl) cardEl.remove();

          state.ramen = {
            caldo: [...(ramenToEdit.caldo || [])],
            fideo: [...(ramenToEdit.fideo || [])],
            proteina: [...(ramenToEdit.proteina || [])],
            verduras: [...(ramenToEdit.verduras || [])],
            extras: [...(ramenToEdit.extras || [])]
          };

          state.ramenItems.splice(rIndex, 1);
          triggerUpdate();

          syncBuilderUI(state.ramen);

          if (typeof _onRamenEdit === 'function') _onRamenEdit(state);

          if (typeof window.closeMobileCartDrawer === 'function') {
            window.closeMobileCartDrawer();
          }

          const builderEl = document.getElementById('builder') || document.querySelector('[data-builder]');
          if (builderEl) {
            builderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
      return;
    }

    const removeBtn = e.target.closest('.remove-ramen');
    if (removeBtn) {
      const rIndex = parseInt(removeBtn.dataset.ramenIndex, 10);
      const cardEl = removeBtn.closest('.ramen-card');

      safeExitAnimation(cardEl, 'card', () => {
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

  setupMobileDrawerEvents();

  const content = document.getElementById('sidebar-order-content');
  const totalBox = document.getElementById('sidebar-total');
  const mobileBar = document.getElementById('mobile-cart-bar');
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
    (k) => state.ramen[k] && state.ramen[k].length > 0
  );

  if (inProgress) {
    if (window.innerWidth >= 768) {
      skeleton.buildBowl.innerHTML = renderDynamicBowl(state.ramen);
    }
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

  if (mobileBar) {
    if (isEmpty) {
      mobileBar.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
      mobileBar.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
    } else {
      mobileBar.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
      mobileBar.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
    }
  }

  // Desactivar las animaciones de entrada en móvil
  if (window.innerWidth >= 768) {
    activateFreshAnimations(content);
  } else {
    content.querySelectorAll('[data-fresh]').forEach(el => el.removeAttribute('data-fresh'));
  }

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

  if (typeof window.closeMobileCartDrawer === 'function') {
    window.closeMobileCartDrawer();
  }

  if (content && window.innerWidth >= 768) {
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