export function createState() {
  return {
    ramen: { fideo: [], verduras: [], proteina: [], extras: [], caldo: [] },
    extras: {},
    ramenItems: [],
  };
}

export function fmt(n) {
  return '$' + n.toLocaleString('es-MX');
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.setAttribute('data-show', '');
  setTimeout(() => t.removeAttribute('data-show'), 2200);
}