/* ================================================================
   MOTOR DE ANIMACIONES
   - Web Animations API, no depende de CSS externo.
   - Cada categoría anima distinto.
   - Un elemento ya visto NO vuelve a animar al re-renderizar.
   - Al eliminar, solo el elemento eliminado anima su salida.

   Este módulo es agnóstico del contenido: no sabe nada de ramen,
   extras ni tazones. Solo sabe animar elementos marcados con
   data-fresh="1" / data-anim-kind, y reproducir una salida antes
   de invocar un callback (usado por la reconciliación al eliminar).
================================================================ */

export function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

// Reproduce la animación de salida de `el` y luego invoca `callback`.
// Si falla o no hay elemento, invoca el callback de inmediato.
export function playExitAndThen(el, kind, callback) {
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

// Recorre `root` buscando elementos marcados data-fresh="1" y les aplica
// su animación de entrada (por capa si tiene data-anim-kind conocido en
// LAYER_ANIMATIONS, si no una variante genérica rotativa).
export function activateFreshAnimations(root) {
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