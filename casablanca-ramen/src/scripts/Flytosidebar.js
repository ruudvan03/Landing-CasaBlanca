import { prefersReducedMotion } from './animations.js';

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
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.35)', offset: 0.5 },
      { filter: 'brightness(1)' }
    ], { duration: 420, easing: 'ease-out' });
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