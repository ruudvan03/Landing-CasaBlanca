import { createState } from './state.js';
import { updateProgress } from './progress.js';
import { initBuilder } from './builder.js';
import { initExtras } from './extras.js';
import { initNav } from './nav.js';
import { initModal } from './modal.js';

export function initApp(ramenPrice) {
  const state = createState();

  initBuilder(state, ramenPrice);
  initExtras(state);
  initNav();
  initModal(state);
  

  updateProgress(state);
}