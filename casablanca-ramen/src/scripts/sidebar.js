import { fmt } from './state.js';

/* ================================================================
   MOTOR DE ANIMACIONES
   - Web Animations API, no depende de CSS externo.
   - Cada categoría anima distinto.
   - Un elemento ya visto NO vuelve a animar al re-renderizar.
   - Al eliminar, solo el elemento eliminado anima su salida.
================================================================ */

let _buildKeys = { caldo: null, fideo: null, proteina: null };
let _seenVeggieKeys = new Set();

function keyOf(arr) {
  if (!arr || arr.length === 0) return null;
  return String(arr[0].id ?? arr[0].name);
}

// Normaliza texto para comparaciones robustas: minúsculas y sin acentos
// (así "Camarón" === "camaron", "Champiñón" === "champinon", etc.)
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const ENTRANCE_VARIANTS = [
  {
    keyframes: [
      { opacity: 0, transform: 'translateY(14px) scale(0.9)' },
      { opacity: 1, transform: 'translateY(-3px) scale(1.02)', offset: 0.7 },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ],
    options: { duration: 480, easing: 'cubic-bezier(.34,1.56,.64,1)' }
  },
  {
    keyframes: [
      { opacity: 0, transform: 'translateX(-22px) rotate(-4deg)' },
      { opacity: 1, transform: 'translateX(0) rotate(0deg)' }
    ],
    options: { duration: 420, easing: 'cubic-bezier(.22,.9,.4,1)' }
  },
  {
    keyframes: [
      { opacity: 0, transform: 'translateX(22px) rotate(4deg)' },
      { opacity: 1, transform: 'translateX(0) rotate(0deg)' }
    ],
    options: { duration: 420, easing: 'cubic-bezier(.22,.9,.4,1)' }
  },
  {
    keyframes: [
      { opacity: 0, transform: 'scale(0.4)' },
      { opacity: 1, transform: 'scale(1.08)', offset: 0.6 },
      { opacity: 1, transform: 'scale(1)' }
    ],
    options: { duration: 400, easing: 'cubic-bezier(.34,1.75,.64,1)' }
  },
  {
    keyframes: [
      { opacity: 0, transform: 'perspective(400px) rotateX(60deg)' },
      { opacity: 1, transform: 'perspective(400px) rotateX(0deg)' }
    ],
    options: { duration: 460, easing: 'ease-out' }
  },
  {
    keyframes: [
      { opacity: 0, transform: 'translateY(-16px) rotate(-8deg) scale(0.85)' },
      { opacity: 1, transform: 'translateY(2px) rotate(2deg) scale(1.03)', offset: 0.65 },
      { opacity: 1, transform: 'translateY(0) rotate(0deg) scale(1)' }
    ],
    options: { duration: 500, easing: 'cubic-bezier(.3,1.4,.5,1)' }
  }
];

let _variantCursor = 0;
function nextVariant() {
  const v = ENTRANCE_VARIANTS[_variantCursor % ENTRANCE_VARIANTS.length];
  _variantCursor++;
  return v;
}

const LAYER_ANIMATIONS = {
  caldo: {
    keyframes: [
      { opacity: 0, transform: 'scaleY(0.15) translateY(-6px)' },
      { opacity: 1, transform: 'scaleY(1.06) translateY(1px)', offset: 0.7 },
      { opacity: 1, transform: 'scaleY(1) translateY(0)' }
    ],
    options: { duration: 520, easing: 'cubic-bezier(.3,.9,.4,1)' }
  },
  fideo: {
    keyframes: [
      { opacity: 0, transform: 'translateY(-12px) rotate(-6deg)' },
      { opacity: 1, transform: 'translateY(3px) rotate(3deg)', offset: 0.5 },
      { opacity: 1, transform: 'translateY(-1px) rotate(-1deg)', offset: 0.78 },
      { opacity: 1, transform: 'translateY(0) rotate(0deg)' }
    ],
    options: { duration: 560, easing: 'ease-out' }
  },
  proteina: {
    keyframes: [
      { opacity: 0, transform: 'translateY(-18px) scale(0.7)' },
      { opacity: 1, transform: 'translateY(3px) scale(1.08)', offset: 0.6 },
      { opacity: 1, transform: 'translateY(-1px) scale(0.98)', offset: 0.82 },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ],
    options: { duration: 500, easing: 'cubic-bezier(.34,1.6,.5,1)' }
  },
  verduras: {
    keyframes: [
      { opacity: 0, transform: 'translate(-10px,-8px) rotate(-15deg) scale(0.6)' },
      { opacity: 1, transform: 'translate(1px,1px) rotate(4deg) scale(1.05)', offset: 0.65 },
      { opacity: 1, transform: 'translate(0,0) rotate(0deg) scale(1)' }
    ],
    options: { duration: 480, easing: 'cubic-bezier(.3,1.4,.5,1)' }
  },
  verdurasAlt: {
    keyframes: [
      { opacity: 0, transform: 'translate(10px,-8px) rotate(15deg) scale(0.6)' },
      { opacity: 1, transform: 'translate(-1px,1px) rotate(-4deg) scale(1.05)', offset: 0.65 },
      { opacity: 1, transform: 'translate(0,0) rotate(0deg) scale(1)' }
    ],
    options: { duration: 480, easing: 'cubic-bezier(.3,1.4,.5,1)' }
  }
};

const EXIT_VARIANTS = {
  chip: [
    { opacity: 1, transform: 'scale(1) translateY(0)' },
    { opacity: 0, transform: 'scale(0.4) translateY(-8px)' }
  ],
  card: [
    { opacity: 1, transform: 'scale(1) translateX(0)' },
    { opacity: 0, transform: 'scale(0.9) translateX(30px)' }
  ],
  row: [
    { opacity: 1, transform: 'translateX(0)' },
    { opacity: 0, transform: 'translateX(40px)' }
  ]
};

function playExitAndThen(el, kind, callback) {
  if (!el) { callback(); return; }
  const frames = EXIT_VARIANTS[kind] || EXIT_VARIANTS.chip;
  const duration = kind === 'card' ? 340 : 280;
  let done = false;
  const finish = () => { if (!done) { done = true; callback(); } };
  try {
    const anim = el.animate(frames, { duration, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
    anim.addEventListener('finish', finish);
    setTimeout(finish, duration + 80);
  } catch (err) {
    finish();
  }
}

function activateFreshAnimations(root) {
  if (!root) return;
  root.querySelectorAll('[data-fresh="1"]').forEach((el) => {
    const kind = el.dataset.animKind || 'generic';
    const delay = Number(el.dataset.animDelay || 0);
    el.style.opacity = '0';
    const cfg = LAYER_ANIMATIONS[kind];
    try {
      if (cfg) {
        el.animate(cfg.keyframes, { ...cfg.options, delay, fill: 'both' });
      } else {
        const v = nextVariant();
        el.animate(v.keyframes, { ...v.options, delay, fill: 'both' });
      }
    } catch (err) {
      el.style.opacity = '1';
    }
    el.removeAttribute('data-fresh');
  });
}

/* ================================================================
   VUELO DEL MENÚ AL SIDEBAR
   - Clona el ícono real del origen (svg/img) si existe; si no, emoji.
   - Trayectoria en arco con rotación + estela de "fantasmas".
   - Ráfaga de partículas en el origen y en el destino, + pulso.
   - Respeta prefers-reduced-motion (sin vuelo, solo confirmación).

   Se invoca MANUALMENTE desde extras.js (al presionar "+" de un
   complemento/bebida/postre/pasta) y desde builder.js (al confirmar
   la construcción de un ramen), pasando el botón como origen.
   También sigue funcionando automáticamente si algún botón tiene
   data-fly-origin en su markup.
================================================================ */

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getFlyTarget() {
  return (
    document.getElementById('cart-count') ||
    document.getElementById('sidebar-order-content') ||
    document.getElementById('mobile-total')
  );
}

function spawnParticles(x, y, opts = {}) {
  const color = opts.color || '#facc15';
  const count = opts.count || 6;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 18 + Math.random() * 22;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 3 + Math.random() * 3;
    p.style.cssText = `
      position: fixed;
      left: ${x}px; top: ${y}px;
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      background: ${color};
      pointer-events: none;
      z-index: 9998;
      box-shadow: 0 0 6px ${color};
    `;
    document.body.appendChild(p);
    try {
      const anim = p.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
      ], { duration: 460 + Math.random() * 180, easing: 'cubic-bezier(.3,.7,.4,1)' });
      anim.addEventListener('finish', () => p.remove());
    } catch (err) {
      p.remove();
    }
    setTimeout(() => p.remove(), 700);
  }
}

function pulseTarget(target) {
  if (!target) return;
  try {
    target.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.4)', offset: 0.45 },
      { transform: 'scale(0.95)', offset: 0.7 },
      { transform: 'scale(1)' }
    ], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  } catch (err) { /* noop */ }

  const rect = target.getBoundingClientRect();
  const ring = document.createElement('span');
  ring.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top + rect.height / 2}px;
    width: 6px; height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    border: 2px solid #facc15;
    pointer-events: none;
    z-index: 9997;
  `;
  document.body.appendChild(ring);
  try {
    const anim = ring.animate([
      { width: '6px', height: '6px', margin: '-3px 0 0 -3px', opacity: 0.9 },
      { width: '46px', height: '46px', margin: '-23px 0 0 -23px', opacity: 0 }
    ], { duration: 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
    anim.addEventListener('finish', () => ring.remove());
  } catch (err) {
    ring.remove();
  }
  setTimeout(() => ring.remove(), 650);
}

function buildFlyingClone(originEl, opts) {
  const iconSource = originEl.querySelector('svg, img');
  const clone = document.createElement('div');
  clone.style.cssText = `
    position: fixed;
    width: 34px; height: 34px;
    z-index: 9999;
    pointer-events: none;
    filter: drop-shadow(0 0 8px rgba(204,26,26,0.65));
    display: flex; align-items: center; justify-content: center;
  `;

  if (iconSource) {
    const inner = iconSource.cloneNode(true);
    inner.style.width = '100%';
    inner.style.height = '100%';
    clone.appendChild(inner);
  } else {
    clone.textContent = opts.emoji || '🍜';
    clone.style.fontSize = '26px';
    clone.style.lineHeight = '34px';
  }
  return clone;
}

export function flyToSidebar(originEl, opts = {}) {
  if (!originEl || typeof document === 'undefined') return;
  const target = getFlyTarget();
  if (!target) return;

  const startRect = originEl.getBoundingClientRect();
  const endRect = target.getBoundingClientRect();
  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const endX = endRect.left + endRect.width / 2;
  const endY = endRect.top + endRect.height / 2;

  spawnParticles(startX, startY, { color: opts.particleColor || '#facc15', count: 7 });

  if (prefersReducedMotion()) {
    pulseTarget(target);
    return;
  }

  const dx = endX - startX;
  const dy = endY - startY;
  const arcLift = -Math.max(90, Math.abs(dy) * 0.65);

  const flightFrames = [
    { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, offset: 0 },
    { transform: `translate(${dx * 0.35}px, ${dy * 0.35 + arcLift}px) scale(1.25) rotate(140deg)`, opacity: 1, offset: 0.4 },
    { transform: `translate(${dx * 0.72}px, ${dy * 0.72 + arcLift * 0.4}px) scale(0.9) rotate(280deg)`, opacity: 0.9, offset: 0.75 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.15) rotate(380deg)`, opacity: 0.15, offset: 1 }
  ];
  const flightOptions = { duration: 680, easing: 'cubic-bezier(.3,.6,.3,1)' };

  const trailCount = 2;
  for (let i = 1; i <= trailCount; i++) {
    const ghost = buildFlyingClone(originEl, opts);
    ghost.style.left = `${startX - 17}px`;
    ghost.style.top = `${startY - 17}px`;
    ghost.style.opacity = '0.35';
    ghost.style.filter = 'none';
    document.body.appendChild(ghost);
    try {
      const ghostAnim = ghost.animate(flightFrames, {
        ...flightOptions,
        delay: i * 60,
        duration: flightOptions.duration - i * 40
      });
      const cleanupGhost = () => ghost.remove();
      ghostAnim.addEventListener('finish', cleanupGhost);
    } catch (err) {
      ghost.remove();
    }
    setTimeout(() => ghost.remove(), flightOptions.duration + 200);
  }

  const clone = buildFlyingClone(originEl, opts);
  clone.style.left = `${startX - 17}px`;
  clone.style.top = `${startY - 17}px`;
  document.body.appendChild(clone);

  const cleanup = () => {
    clone.remove();
    spawnParticles(endX, endY, { color: opts.particleColor || '#cc1a1a', count: 8 });
    pulseTarget(target);
  };

  try {
    const anim = clone.animate(flightFrames, flightOptions);
    anim.addEventListener('finish', cleanup);
  } catch (err) {
    cleanup();
    return;
  }
  setTimeout(cleanup, flightOptions.duration + 120);
}

if (typeof document !== 'undefined' && !document.__ramenFlyBound) {
  document.__ramenFlyBound = true;
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-fly-origin]');
    if (el) flyToSidebar(el, { emoji: el.dataset.flyEmoji, particleColor: el.dataset.flyColor });
  });
}

// Función para obtener colores y estilos dinámicos del tazón según el caldo
function getBowlDesign(ramen) {
  let stroke = '#cc1a1a';
  let gradTop = '#3a0a0a';
  let gradBottom = '#120202';
  let accent = '#facc15';

  if (ramen.caldo && ramen.caldo.length > 0) {
    const name = normalize(ramen.caldo[0].name);
    if (name.includes('miso')) {
      stroke = '#d97706';
      gradTop = '#451a03';
      gradBottom = '#180a02';
    } else if (name.includes('camaron pikin') || name.includes('camaron')) {
      stroke = '#f97316';
      gradTop = '#4c1d0e';
      gradBottom = '#1a0a03';
    } else if (name.includes('hongo shiitake') || name.includes('shiitake')) {
      stroke = '#a16207';
      gradTop = '#2f2410';
      gradBottom = '#100c05';
    } else if (name.includes('tonkotsu')) {
      stroke = '#fcd34d';
      gradTop = '#52525b';
      gradBottom = '#18181b';
    } else if (name.includes('spicy') || name.includes('chili') || name.includes('diabla') || name.includes('picante')) {
      stroke = '#dc2626';
      gradTop = '#581c87';
      gradBottom = '#1e1b4b';
    } else if (name.includes('shoyu') || name.includes('soy')) {
      stroke = '#b45309';
      gradTop = '#271c12';
      gradBottom = '#0f0a05';
    } else if (name.includes('shio') || name.includes('sal')) {
      stroke = '#38bdf8';
      gradTop = '#0c2340';
      gradBottom = '#050c16';
    }
  }
  return { stroke, gradTop, gradBottom, accent };
}

// Estilos dinámicos para fideos según su variedad
function getFideoStyle(fideoArray) {
  let color = '#facc15';
  let width = '4.5';
  if (fideoArray && fideoArray.length > 0) {
    const name = normalize(fideoArray[0].name);
    if (name.includes('egg noodle')) {
      width = '5';
      color = '#fbbf24';
    } else if (name.includes('fideo cristal') || name.includes('cristal')) {
      width = '3';
      color = '#e5e7eb';
    } else if (name.includes('grueso') || name.includes('thick') || name.includes('udon')) {
      width = '6.5';
      color = '#fde047';
    } else if (name.includes('delgado') || name.includes('fino') || name.includes('thin')) {
      width = '3.2';
      color = '#fef08a';
    } else if (name.includes('soba') || name.includes('integral') || name.includes('trigo')) {
      width = '4.5';
      color = '#a16207';
    }
  }
  return { color, width };
}

// Generador de gráficos SVG específicos para Proteínas según su tipo
function getProteinaSvg(proteinaArray, animCfg = null) {
  if (!proteinaArray || proteinaArray.length === 0) return '';
  const pName = normalize(proteinaArray[0].name);
  const attrs = animCfg && animCfg.fresh
    ? `data-fresh="1" data-anim-kind="proteina" data-anim-delay="${animCfg.delay || 0}"`
    : '';

  if (pName.includes('huevo duro')) {
    return `
      <g ${attrs}>
        <ellipse cx="34" cy="46" rx="7" ry="9" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <circle cx="34" cy="46" r="3" fill="#facc15"/>
        <ellipse cx="63" cy="47" rx="7" ry="9" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <circle cx="63" cy="47" r="3" fill="#facc15"/>
      </g>
    `;
  } else if (pName.includes('pollito') || pName.includes('pollo')) {
    return `
      <g ${attrs}>
        <rect x="28" y="43" width="10" height="9" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
        <rect x="58" y="44" width="11" height="8" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
        <circle cx="31" cy="46" r="0.8" fill="#fef3c7"/>
        <circle cx="62" cy="47" r="0.8" fill="#fef3c7"/>
      </g>
    `;
  } else if (pName.includes('tocino')) {
    return `
      <g ${attrs}>
        <path d="M 26 44 Q 32 40, 38 44 Q 44 48, 50 44" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 26 48 Q 32 44, 38 48 Q 44 52, 50 48" fill="none" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/>
        <path d="M 52 46 Q 58 42, 64 46 Q 70 50, 76 46" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round"/>
      </g>
    `;
  } else if (pName.includes('costillita') || pName.includes('costilla')) {
    return `
      <g ${attrs}>
        <path d="M 28 42 Q 26 48, 30 53" fill="none" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
        <path d="M 34 41 Q 32 48, 36 54" fill="none" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
        <path d="M 40 42 Q 38 48, 42 53" fill="none" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="35" cy="44" rx="10" ry="4" fill="#b45309" opacity="0.5"/>
      </g>
    `;
  } else if (pName.includes('camaron') || pName.includes('shrimp') || pName.includes('marisco')) {
    return `
      <g ${attrs}>
        <path d="M 30 45 Q 35 38, 42 42 Q 45 46, 38 49 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M 54 46 Q 59 39, 66 43 Q 69 47, 62 50 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M 33 43 Q 36 44, 38 47" fill="none" stroke="#c2410c" stroke-width="0.8" opacity="0.6"/>
        <path d="M 58 44 Q 61 45, 63 48" fill="none" stroke="#c2410c" stroke-width="0.8" opacity="0.6"/>
      </g>
    `;
  } else if (pName.includes('tofu')) {
    return `
      <g ${attrs}>
        <rect x="27" y="41" width="12" height="12" rx="1.5" fill="#fefce8" stroke="#d4d4d8" stroke-width="1.5"/>
        <rect x="57" y="42" width="12" height="12" rx="1.5" fill="#fefce8" stroke="#d4d4d8" stroke-width="1.5"/>
        <line x1="27" y1="47" x2="39" y2="47" stroke="#d4d4d8" stroke-width="0.6"/>
        <line x1="57" y1="48" x2="69" y2="48" stroke="#d4d4d8" stroke-width="0.6"/>
      </g>
    `;
  } else if (pName.includes('raviole')) {
    return `
      <g ${attrs}>
        <path d="M 28 42 L 39 42 L 39 53 L 28 53 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" transform="rotate(6 33 47)"/>
        <path d="M 58 43 L 69 43 L 69 54 L 58 54 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" transform="rotate(-6 63 48)"/>
      </g>
    `;
  } else if (pName.includes('res') || pName.includes('beef') || pName.includes('carne')) {
    return `
      <g ${attrs}>
        <path d="M 27 45 Q 35 42, 45 47" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
        <path d="M 52 47 Q 60 42, 69 46" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
        <path d="M 30 45 Q 37 43, 43 46" fill="none" stroke="#fde68a" stroke-width="0.8" opacity="0.5"/>
      </g>
    `;
  } else {
    return `
      <g ${attrs}>
        <path d="M 30 46 Q 39 37, 48 46 Q 39 55, 30 46 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
        <circle cx="39" cy="46" r="5.5" fill="#f87171" opacity="0.7"/>
        <path d="M 50 48 Q 59 39, 68 48 Q 59 57, 50 48 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
        <circle cx="59" cy="48" r="5" fill="#f87171" opacity="0.7"/>
      </g>
    `;
  }
}

// Generador de gráficos SVG específicos para Verduras y Complementos según su tipo
function getVerdurasSvg(verdurasArray, accentDefault, animate = false) {
  if (!verdurasArray || verdurasArray.length === 0) return '';

  let vegElements = [];
  verdurasArray.forEach((v, idx) => {
    const vName = normalize(v.name);
    let attrs = '';
    if (animate) {
      const key = String(v.id ?? v.name);
      const isFresh = !_seenVeggieKeys.has(key);
      _seenVeggieKeys.add(key);
      if (isFresh) {
        const kind = idx % 2 === 0 ? 'verduras' : 'verdurasAlt';
        attrs = `data-fresh="1" data-anim-kind="${kind}" data-anim-delay="${idx * 90}"`;
      }
    }

    if (vName.includes('brocoli')) {
      vegElements.push(`
        <g ${attrs}>
          <circle cx="30" cy="38" r="3" fill="#16a34a"/>
          <circle cx="34" cy="36" r="3.2" fill="#22c55e"/>
          <circle cx="37" cy="39" r="2.8" fill="#16a34a"/>
          <line x1="34" y1="39" x2="34" y2="46" stroke="#84cc16" stroke-width="2"/>
        </g>
      `);
    } else if (vName.includes('germinado')) {
      vegElements.push(`
        <g ${attrs}>
          <path d="M 24 46 Q 26 38, 22 33" fill="none" stroke="#bef264" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 28 47 Q 30 39, 27 33" fill="none" stroke="#d9f99d" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 32 46 Q 34 39, 31 34" fill="none" stroke="#bef264" stroke-width="1.5" stroke-linecap="round"/>
        </g>
      `);
    } else if (vName.includes('nori') || vName.includes('alga')) {
      vegElements.push(`<g ${attrs}><path d="M 68 42 L 74 25 L 82 28 L 76 45 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/></g>`);
    } else if (vName.includes('elote') || vName.includes('maiz') || vName.includes('corn')) {
      vegElements.push(`
        <g ${attrs}>
          <circle cx="45" cy="38" r="2.2" fill="#facc15"/>
          <circle cx="49" cy="37" r="2" fill="#eab308"/>
          <circle cx="53" cy="39" r="2.2" fill="#facc15"/>
          <circle cx="47" cy="41" r="2" fill="#eab308"/>
        </g>
      `);
    } else if (vName.includes('champin') || vName.includes('hongo') || vName.includes('shiitake')) {
      vegElements.push(`
        <g ${attrs}>
          <ellipse cx="33" cy="39" rx="6" ry="4" fill="#78350f" stroke="#451a03" stroke-width="1"/>
          <path d="M 31 39 L 31 43 L 35 43 L 35 39 Z" fill="#fef3c7"/>
        </g>
      `);
    } else if (vName.includes('naruto') || vName.includes('surimi')) {
      vegElements.push(`
        <g ${attrs}>
          <circle cx="62" cy="40" r="5" fill="#f8fafc" stroke="#ef4444" stroke-width="1.5"/>
          <path d="M 62 37 Q 64 39, 62 41 Q 60 39, 62 37" fill="#ef4444"/>
        </g>
      `);
    } else {
      vegElements.push(`
        <g ${attrs}>
          <path d="M23 45 Q 28 38, 33 45" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M67 43 Q 72 36, 77 44" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
        </g>
      `);
    }
  });

  return `<g>${vegElements.join('')}</g>`;
}

/* ================================================================
   ÍCONOS ESPECÍFICOS POR PLATILLO (nuevo)
   Mapeados uno a uno contra los nombres reales del menú
   (complementos, pastas, bebidas y postres). Si algún ítem nuevo
   no está en el mapa, cae en un ícono genérico por categoría.
================================================================ */

const ITEM_ICON_BUILDERS = {
  // Complementos
  'gyozas 6 pz': () => `
    <path d="M 32 58 Q 40 46, 50 58 Q 60 46, 68 58 Z" fill="#d97706" stroke="#92400e" stroke-width="2.5"/>
    <path d="M 40 60 Q 45 51, 50 60 Z" fill="#fbbf24"/>
    <ellipse cx="50" cy="66" rx="30" ry="8" fill="#27272a" stroke="#78350f" stroke-width="2"/>
  `,
  'dumplings 4 pz': () => `
    <circle cx="38" cy="52" r="12" fill="#fde68a" stroke="#b45309" stroke-width="2.5"/>
    <circle cx="62" cy="52" r="12" fill="#fde68a" stroke="#b45309" stroke-width="2.5"/>
    <path d="M 38 44 Q 42 40, 46 44" fill="none" stroke="#92400e" stroke-width="1.2"/>
    <path d="M 62 44 Q 66 40, 70 44" fill="none" stroke="#92400e" stroke-width="1.2"/>
  `,
  'yakimeshi': () => `
    <ellipse cx="50" cy="62" rx="32" ry="14" fill="#27272a" stroke="#eab308" stroke-width="3"/>
    <circle cx="40" cy="52" r="2.4" fill="#fde047"/>
    <circle cx="48" cy="48" r="2.4" fill="#facc15"/>
    <circle cx="56" cy="52" r="2.4" fill="#fde047"/>
    <circle cx="44" cy="56" r="2.4" fill="#f97316"/>
    <circle cx="60" cy="56" r="2" fill="#22c55e"/>
  `,
  'camarones crunchy': () => `
    <path d="M 32 50 Q 40 36, 50 44 Q 54 50, 44 55 Z" fill="#fb923c" stroke="#c2410c" stroke-width="2"/>
    <path d="M 56 52 Q 64 38, 74 46 Q 78 52, 68 57 Z" fill="#fbbf24" stroke="#c2410c" stroke-width="1.2" opacity="0.85"/>
  `,
  'kushiages 3 pz': () => `
    <line x1="26" y1="28" x2="74" y2="72" stroke="#a16207" stroke-width="3" stroke-linecap="round"/>
    <rect x="38" y="38" width="12" height="12" rx="2" fill="#d97706" transform="rotate(45 44 44)"/>
    <rect x="52" y="52" width="12" height="12" rx="2" fill="#dc2626" transform="rotate(45 58 58)"/>
  `,
  'rollos primavera 4 pz': () => `
    <rect x="26" y="40" width="20" height="24" rx="9" fill="#fde68a" stroke="#b45309" stroke-width="2.5"/>
    <rect x="52" y="40" width="20" height="24" rx="9" fill="#fde68a" stroke="#b45309" stroke-width="2.5"/>
    <circle cx="36" cy="52" r="2" fill="#22c55e"/>
    <circle cx="62" cy="52" r="2" fill="#f97316"/>
  `,
  // Pastas
  'pad thai': () => `
    <ellipse cx="50" cy="62" rx="36" ry="12" fill="#27272a" stroke="#facc15" stroke-width="3"/>
    <path d="M 28 58 Q 39 42, 50 58 Q 61 42, 72 58" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
    <path d="M 25 32 L 75 42" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
  `,
  'patsiu': () => `
    <ellipse cx="50" cy="62" rx="36" ry="12" fill="#27272a" stroke="#22c55e" stroke-width="3"/>
    <path d="M 28 58 Q 39 42, 50 58 Q 61 42, 72 58" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round"/>
    <path d="M 25 32 L 75 42" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
  `,
  'camaron extra': () => `
    <path d="M 30 45 Q 35 38, 42 42 Q 45 46, 38 49 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
    <path d="M 54 46 Q 59 39, 66 43 Q 69 47, 62 50 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
  `,
  // Bebidas
  'refrescos': () => `
    <path d="M 35 28 L 40 82 L 60 82 L 65 28 Z" fill="#38bdf8" opacity="0.3" stroke="#38bdf8" stroke-width="3"/>
    <path d="M 38 45 L 62 45 L 60 79 L 40 79 Z" fill="#38bdf8" opacity="0.8"/>
    <path d="M 53 12 L 72 32" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
    <circle cx="47" cy="58" r="2" fill="#ffffff" opacity="0.7"/>
  `,
  'te de jazmin': () => `
    <path d="M 30 42 L 68 42 L 64 76 Q 64 82, 58 82 L 40 82 Q 34 82, 34 76 Z" fill="#a3e635" opacity="0.75" stroke="#65a30d" stroke-width="3"/>
    <path d="M 68 48 Q 82 48, 80 60 Q 78 68, 66 66" fill="none" stroke="#65a30d" stroke-width="3"/>
    <path d="M 42 22 Q 46 28, 42 33" fill="none" stroke="#a3e635" stroke-width="2" opacity="0.6"/>
    <path d="M 52 18 Q 56 24, 52 30" fill="none" stroke="#a3e635" stroke-width="2" opacity="0.6"/>
  `,
  'agua de limon con chia': () => `
    <path d="M 36 28 L 40 80 L 60 80 L 64 28 Z" fill="#bef264" opacity="0.35" stroke="#84cc16" stroke-width="3"/>
    <circle cx="45" cy="55" r="1.4" fill="#3f6212"/>
    <circle cx="52" cy="62" r="1.4" fill="#3f6212"/>
    <circle cx="48" cy="68" r="1.4" fill="#3f6212"/>
    <circle cx="55" cy="50" r="1.4" fill="#3f6212"/>
    <path d="M 50 28 A 6 6 0 0 1 50 40 A 6 6 0 0 1 50 28 Z" fill="#fde047" stroke="#a16207" stroke-width="1.5"/>
  `,
  'frutos rojos': () => `
    <path d="M 36 30 L 40 80 L 60 80 L 64 30 Z" fill="#fb7185" opacity="0.4" stroke="#e11d48" stroke-width="3"/>
    <circle cx="47" cy="55" r="3" fill="#e11d48"/>
    <circle cx="55" cy="62" r="2.5" fill="#be123c"/>
    <circle cx="48" cy="68" r="2.5" fill="#e11d48"/>
  `,
  'ramune': () => `
    <path d="M 40 30 L 40 50 Q 34 55, 34 66 Q 34 78, 50 78 Q 66 78, 66 66 Q 66 55, 60 50 L 60 30 Z" fill="#38bdf8" opacity="0.7" stroke="#0284c7" stroke-width="3"/>
    <circle cx="50" cy="34" r="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
    <rect x="42" y="18" width="16" height="8" rx="2" fill="#0284c7"/>
  `,
  'corona / victoria': () => `
    <path d="M 42 20 L 42 34 Q 34 42, 34 56 L 34 78 Q 34 84, 40 84 L 60 84 Q 66 84, 66 78 L 66 56 Q 66 42, 58 34 L 58 20 Z" fill="#fde047" opacity="0.55" stroke="#a16207" stroke-width="3"/>
    <rect x="40" y="12" width="20" height="10" rx="2" fill="#a16207"/>
  `,
  'lucky buda': () => `
    <path d="M 30 30 L 70 30 L 54 58 L 54 78 L 62 78 L 62 82 L 38 82 L 38 78 L 46 78 L 46 58 Z" fill="#fbbf24" opacity="0.6" stroke="#b45309" stroke-width="3"/>
    <circle cx="50" cy="24" r="4" fill="#f87171"/>
  `,
  // Postres
  'tempura helado': () => `
    <ellipse cx="50" cy="66" rx="16" ry="8" fill="#fde68a" stroke="#b45309" stroke-width="2.5"/>
    <circle cx="50" cy="46" r="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5"/>
    <path d="M 36 42 Q 50 30, 64 42" fill="none" stroke="#78350f" stroke-width="2" opacity="0.5"/>
  `,
  'kari kari': () => `
    <circle cx="50" cy="48" r="18" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
    <circle cx="44" cy="42" r="2" fill="#b45309"/>
    <circle cx="56" cy="44" r="2" fill="#b45309"/>
    <circle cx="50" cy="54" r="2" fill="#b45309"/>
    <ellipse cx="50" cy="70" rx="14" ry="6" fill="#27272a" opacity="0.4"/>
  `,
  'pocky': () => `
    <rect x="30" y="26" width="6" height="46" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
    <rect x="30" y="26" width="6" height="20" rx="3" fill="#78350f"/>
    <rect x="47" y="30" width="6" height="46" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
    <rect x="47" y="30" width="6" height="20" rx="3" fill="#78350f"/>
    <rect x="64" y="26" width="6" height="46" rx="3" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
    <rect x="64" y="26" width="6" height="20" rx="3" fill="#78350f"/>
  `
};

function getItemBaseSvg(extraName) {
  const key = normalize(extraName);
  if (ITEM_ICON_BUILDERS[key]) return ITEM_ICON_BUILDERS[key]();

  // Ítem no mapeado (p. ej. algo nuevo del menú): ícono genérico por categoría
  if (key.includes('bebida') || key.includes('refresco') || key.includes('agua') || key.includes('te') || key.includes('soda') || key.includes('ramune') || key.includes('corona') || key.includes('victoria') || key.includes('buda')) {
    return `
      <path d="M 35 28 L 40 82 L 60 82 L 65 28 Z" fill="#38bdf8" opacity="0.3" stroke="#38bdf8" stroke-width="3"/>
      <path d="M 38 45 L 62 45 L 60 79 L 40 79 Z" fill="#38bdf8" opacity="0.8"/>
      <path d="M 53 12 L 72 32" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (key.includes('postre') || key.includes('tempura') || key.includes('helado') || key.includes('kari') || key.includes('pocky')) {
    return `
      <path d="M 28 72 L 72 72 L 50 28 Z" fill="#f43f5e" stroke="#be123c" stroke-width="3"/>
      <circle cx="50" cy="25" r="5" fill="#dc2626" stroke="#991b1b" stroke-width="1.5"/>
    `;
  } else if (key.includes('pasta') || key.includes('pad thai') || key.includes('patsiu')) {
    return `
      <ellipse cx="50" cy="62" rx="36" ry="12" fill="#27272a" stroke="#facc15" stroke-width="3"/>
      <path d="M 28 58 Q 39 42, 50 58 Q 61 42, 72 58" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>
    `;
  }
  return `
    <ellipse cx="50" cy="62" rx="36" ry="12" fill="#27272a" stroke="#eab308" stroke-width="3"/>
    <path d="M 34 56 Q 42 44, 50 56 Q 58 44, 66 56 Z" fill="#d97706" stroke="#b45309" stroke-width="2"/>
  `;
}

// Generador de íconos con agrupamiento ("grupito" cuando qty > 3)
export function getExtraSvg(extraName, qty = 1) {
  const count = Math.min(qty, 4);
  const baseSvg = getItemBaseSvg(extraName);

  const groupKinds = ['verduras', 'verdurasAlt', 'proteina'];
  const wrap = (svg, i, transform) =>
    `<g transform="${transform}" data-fresh="1" data-anim-kind="${groupKinds[i % groupKinds.length]}" data-anim-delay="${i * 70}">${svg}</g>`;

  let groupContent = '';
  if (count === 1) {
    groupContent = wrap(baseSvg, 0, 'translate(0,0)');
  } else if (count === 2) {
    groupContent = `
      ${wrap(baseSvg, 0, 'translate(-12, 4) scale(0.85)')}
      ${wrap(baseSvg, 1, 'translate(12, -4) scale(0.85)')}
    `;
  } else {
    groupContent = `
      ${wrap(baseSvg, 0, 'translate(-14, 8) scale(0.75)')}
      ${wrap(baseSvg, 1, 'translate(14, 8) scale(0.75)')}
      ${wrap(baseSvg, 2, 'translate(0, -10) scale(0.75)')}
      ${qty > 3 ? `<circle cx="78" cy="22" r="11" fill="#dc2626" stroke="#fef2f2" stroke-width="2"/><text x="78" y="26" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">+${qty - 3}</text>` : ''}
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-8 h-8 filter drop-shadow-[0_0_5px_rgba(234,179,8,0.4)]">
      ${groupContent}
    </svg>
  `;
}

// Tazón grande para el ramen en construcción (vive en su propio contenedor aislado)
function renderDynamicBowl(ramen) {
  const hasCaldo = ramen.caldo && ramen.caldo.length > 0;
  const hasFideo = ramen.fideo && ramen.fideo.length > 0;
  const hasProteina = ramen.proteina && ramen.proteina.length > 0;
  const hasVerduras = ramen.verduras && ramen.verduras.length > 0;

  if (!hasCaldo && !hasFideo && !hasProteina && !hasVerduras) {
    _buildKeys = { caldo: null, fideo: null, proteina: null };
    _seenVeggieKeys.clear();
  }

  let caldoColor = '#d97706';
  if (hasCaldo) {
    const caldoName = normalize(ramen.caldo[0].name);
    if (caldoName.includes('miso')) caldoColor = '#b45309';
    else if (caldoName.includes('camaron pikin') || caldoName.includes('camaron')) caldoColor = '#ea580c';
    else if (caldoName.includes('hongo shiitake') || caldoName.includes('shiitake')) caldoColor = '#78350f';
    else if (caldoName.includes('tonkotsu')) caldoColor = '#fef3c7';
    else if (caldoName.includes('spicy') || caldoName.includes('chili') || caldoName.includes('diabla') || caldoName.includes('picante')) caldoColor = '#dc2626';
    else if (caldoName.includes('shoyu') || caldoName.includes('soy')) caldoColor = '#78350f';
    else if (caldoName.includes('shio')) caldoColor = '#e0f2fe';
  }

  const design = getBowlDesign(ramen);
  const fideoStyle = getFideoStyle(ramen.fideo);

  const caldoKey = keyOf(ramen.caldo);
  const caldoFresh = hasCaldo && caldoKey !== _buildKeys.caldo;
  if (hasCaldo) _buildKeys.caldo = caldoKey;
  const caldoAttrs = caldoFresh ? `data-fresh="1" data-anim-kind="caldo"` : '';

  const fideoKey = keyOf(ramen.fideo);
  const fideoFresh = hasFideo && fideoKey !== _buildKeys.fideo;
  if (hasFideo) _buildKeys.fideo = fideoKey;
  const fideoAttrs = fideoFresh ? `data-fresh="1" data-anim-kind="fideo"` : '';

  const proteinaKey = keyOf(ramen.proteina);
  const proteinaFresh = hasProteina && proteinaKey !== _buildKeys.proteina;
  if (hasProteina) _buildKeys.proteina = proteinaKey;

  return `
    <div class="flex flex-col items-center justify-center py-3 animate-fade-in">
      <div class="w-36 h-36 mb-3 rounded-2xl bg-card/90 border border-border-dim flex items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(204,26,26,0.25)]">
        ${hasCaldo ? `
          <div class="absolute top-2 left-1/2 -translate-x-1/2 flex gap-3 opacity-40 pointer-events-none">
            <span class="block w-1 h-6 rounded-full bg-white/60 animate-pulse"></span>
            <span class="block w-1 h-8 rounded-full bg-white/50 animate-pulse" style="animation-delay:.3s"></span>
            <span class="block w-1 h-5 rounded-full bg-white/60 animate-pulse" style="animation-delay:.6s"></span>
          </div>
        ` : ''}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-28 h-28 filter drop-shadow-[0_0_12px_rgba(204,26,26,0.5)]">
          <ellipse cx="50" cy="50" rx="40" ry="12" fill="#0d0101" />
          <path d="M10 48 C 10 85, 90 85, 90 48 Z" fill="url(#buildBowlGrad)" stroke="${design.stroke}" stroke-width="4"/>
          <ellipse cx="50" cy="48" rx="40" ry="11" fill="#180303" stroke="${design.stroke}" stroke-width="4"/>

          ${hasCaldo ? `
            <g ${caldoAttrs} style="transform-origin: 50px 50px;">
              <ellipse cx="50" cy="50" rx="36" ry="9" fill="${caldoColor}" opacity="0.95"/>
              <ellipse cx="48" cy="49" rx="28" ry="6.5" fill="#ffffff" opacity="0.15"/>
            </g>
          ` : ''}

          ${hasFideo ? `
            <g ${fideoAttrs}>
              <path d="M24 49 Q 32 41, 40 49 Q 48 41, 56 49 Q 64 41, 72 49" fill="none" stroke="${fideoStyle.color}" stroke-width="${fideoStyle.width}" stroke-linecap="round"/>
              <path d="M28 53 Q 37 45, 46 53 Q 55 45, 64 53" fill="none" stroke="${fideoStyle.color}" stroke-width="${Number(fideoStyle.width) - 1}" stroke-linecap="round"/>
            </g>
          ` : ''}

          ${getProteinaSvg(ramen.proteina, { fresh: proteinaFresh, delay: 0 })}

          ${getVerdurasSvg(ramen.verduras, design.accent, true)}

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

function renderMiniBowlSvg(r, design, fideoStyle) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-9 h-9 filter drop-shadow-[0_0_5px_rgba(204,26,26,0.4)]">
      <path d="M15 48 C 15 78, 85 78, 85 48 Z" fill="${design.gradTop}" stroke="${design.stroke}" stroke-width="3.5"/>
      <ellipse cx="50" cy="48" rx="35" ry="9" fill="${design.gradBottom}" stroke="${design.stroke}" stroke-width="3.5"/>
      <path d="M30 46 Q 40 39, 50 46 Q 60 39, 70 46" fill="none" stroke="${fideoStyle.color}" stroke-width="${fideoStyle.width}" stroke-linecap="round"/>
      ${getProteinaSvg(r.proteina)}
      ${getVerdurasSvg(r.verduras, design.accent)}
    </svg>
  `;
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
    _buildKeys = { caldo: null, fideo: null, proteina: null };
    _seenVeggieKeys.clear();
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
  _buildKeys = { caldo: null, fideo: null, proteina: null };
  _seenVeggieKeys.clear();
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