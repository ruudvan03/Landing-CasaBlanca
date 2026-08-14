export function updateProgress(state) {
  const required = ['fideo', 'verduras', 'proteina', 'caldo'];
  const done = required.filter((k) => state.ramen[k].length > 0).length;
  const pct = Math.round((done / required.length) * 100);

  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-text').textContent =
    `${done} de ${required.length} pasos requeridos`;
  document.getElementById('add-ramen-btn').disabled = done < required.length;

  const stepKeys = ['fideo', 'verduras', 'proteina', 'extras', 'caldo'];
  stepKeys.forEach((key, i) => {
    const card = document.getElementById(`step-${i + 1}`);
    if (!card) return;
    const filled = state.ramen[key] && state.ramen[key].length > 0;
    card.setAttribute('data-state', filled ? 'done' : 'active');
  });
}