import { fmt, showToast } from './state.js';
import { updateProgress } from './progress.js';
import { renderSidebar } from './sidebar.js';

// URL de tu API en Laravel
const API_URL = 'http://localhost:8000/api/pedidos';

function openModal(state) {
  let html = '';
  let total = 0;

  state.ramenItems.forEach((r, i) => {
    html += `<div class="flex justify-between text-[0.8rem] py-1 text-muted"><span>Ramen ${i + 1} (${r.fideo[0]?.name || ''})</span><span class="text-red">${fmt(r.total)}</span></div>`;
    total += r.total;
  });

  Object.values(state.extras)
    .filter((e) => e.qty > 0)
    .forEach((e) => {
      const sub = e.price * e.qty;
      html += `<div class="flex justify-between text-[0.8rem] py-1 text-muted"><span>${e.qty}× ${e.name}</span><span class="text-red">${fmt(sub)}</span></div>`;
      total += sub;
    });

  html += `<div class="flex justify-between text-[0.8rem] py-1 text-bone font-bold border-t border-border-dim mt-2 pt-2"><span>Total</span><span class="text-red">${fmt(total)}</span></div>`;

  const summaryEl = document.getElementById('modal-summary');
  if (summaryEl) {
    summaryEl.innerHTML = html || '<p class="text-[0.8rem] text-muted">Pedido vacío</p>';
  }
  
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.setAttribute('data-open', '');
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.removeAttribute('data-open');
  }
}

export function initModal(state) {
  document.getElementById('open-modal-btn')?.addEventListener('click', () => openModal(state));
  document.getElementById('mobile-open-modal')?.addEventListener('click', () => openModal(state));
  document.getElementById('confirm-btn')?.addEventListener('click', () => openModal(state));
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
  
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  // --- AQUÍ COMIENZA LA INTEGRACIÓN CON LARAVEL ---
  document.getElementById('modal-submit')?.addEventListener('click', async (e) => {
    const btnSubmit = e.target;
    const mesaInput = document.getElementById('field-mesa');
    if (!mesaInput) return;
    
    const mesa = mesaInput.value.trim();
    if (!mesa) {
      mesaInput.focus();
      showToast('Por favor indica tu mesa');
      return;
    }

    const nombreInput = document.getElementById('field-nombre');
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    
    const notasInput = document.getElementById('field-notas');
    const notasGenerales = notasInput ? notasInput.value.trim() : '';

    // Transformar los datos para Laravel
    const clienteFinal = nombre ? `${nombre} (${mesa})` : mesa;
    const itemsParaLaravel = [];
    let totalPedido = 0;

    // 1. Mapear Ramen Armados (Solo si el usuario armó alguno)
    if (state.ramenItems && state.ramenItems.length > 0) {
      state.ramenItems.forEach((r) => {
        const getNames = (arr) => arr && arr.map ? arr.map(i => i.name).join(', ') : '';
        
        const fideos = getNames(r.fideo);
        const verduras = getNames(r.verduras);
        const proteina = getNames(r.proteina);
        const caldo = getNames(r.caldo);
        const extrasRamen = getNames(r.extras); 
        
        let detalles = `Fideo: ${fideos} | Proteína: ${proteina} | Verduras: ${verduras} | Caldo: ${caldo}`;
        if (extrasRamen) detalles += ` | Extras: ${extrasRamen}`;
        
        // La nota general del modal SÍ se aplica al ramen principal
        if (notasGenerales) {
            detalles += ` | Nota: ${notasGenerales}`;
        }

        itemsParaLaravel.push({
          product_id: 1, // ID 1 = "Ramen web"
          quantity: 1,
          price: r.total,
          notes: detalles
        });
        totalPedido += r.total;
      });
    }

    // 2. Mapear Complementos / Pastas / Bebidas / Postres (state.extras)
    if (state.extras) {
      Object.values(state.extras).filter(e => e && e.qty > 0).forEach(e => {
        // AQUÍ ESTÁ EL CAMBIO: Tomamos la nota específica que escribió el usuario en el input del producto
        let notasComplemento = e.note ? `Nota: ${e.note}` : ''; 
        
        // Forzamos la obtención del ID correcto de forma segura
        let productoIdValido = Number(e.id);
        
        // Si por alguna razón el ID sigue siendo NaN, rescatamos el número según el nombre
        if (isNaN(productoIdValido)) {
            const nombreExtra = (e.name || '').toLowerCase();
            if (nombreExtra.includes('gyoza')) productoIdValido = 5;
            else if (nombreExtra.includes('dumpling')) productoIdValido = 6;
            else if (nombreExtra.includes('yakimeshi')) productoIdValido = 7;
            else if (nombreExtra.includes('crunchy')) productoIdValido = 8;
            else if (nombreExtra.includes('kushiage')) productoIdValido = 9;
            else if (nombreExtra.includes('primavera')) productoIdValido = 10;
            else if (nombreExtra.includes('pad thai')) productoIdValido = 11;
            else if (nombreExtra.includes('patsiu')) productoIdValido = 12;
            else if (nombreExtra.includes('camarón') || nombreExtra.includes('camaron')) productoIdValido = 13;
            else if (nombreExtra.includes('refresco')) productoIdValido = 14;
            else if (nombreExtra.includes('té') || nombreExtra.includes('te')) productoIdValido = 15;
            else if (nombreExtra.includes('agua')) productoIdValido = 16;
            else if (nombreExtra.includes('frutos')) productoIdValido = 17;
            else if (nombreExtra.includes('ramune')) productoIdValido = 18;
            else if (nombreExtra.includes('corona') || nombreExtra.includes('victoria')) productoIdValido = 19;
            else if (nombreExtra.includes('buda')) productoIdValido = 20;
            else if (nombreExtra.includes('tempura')) productoIdValido = 21;
            else if (nombreExtra.includes('kari')) productoIdValido = 22;
            else if (nombreExtra.includes('pocky')) productoIdValido = 23;
            else productoIdValido = 5; 
        }
        
        itemsParaLaravel.push({
          product_id: productoIdValido, 
          quantity: Number(e.qty),
          price: Number(e.price),
          notes: notasComplemento // Ahora enviará la nota específica del input si existe
        });
        totalPedido += (Number(e.price) * Number(e.qty));
      });
    }

    // Depuración: ver qué items se armaron
    console.log("Items listos para Laravel:", itemsParaLaravel);

    // Validar que el carrito tenga al menos un producto con ID válido
    if (itemsParaLaravel.length === 0 || itemsParaLaravel.some(item => !item.product_id)) {
        console.error("Item inválido detectado:", itemsParaLaravel.find(item => !item.product_id));
        showToast('El pedido está vacío o tiene elementos inválidos');
        return;
    }

    // Armar el payload final
    const payload = {
        customer_name: clienteFinal,
        phone: "",
        items: itemsParaLaravel,
        total: totalPedido
    };

    // Cambiar estado visual del botón
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerText = "Enviando a cocina...";
    btnSubmit.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            state.ramenItems.length = 0;
            Object.keys(state.extras).forEach((k) => delete state.extras[k]);
            ['fideo', 'verduras', 'proteina', 'extras', 'caldo'].forEach((k) => (state.ramen[k] = []));

            document.querySelectorAll('[data-step]').forEach((b) => b.removeAttribute('data-selected'));
            document.querySelectorAll('[id^="qty-"]').forEach((el) => (el.textContent = '0'));

            updateProgress(state);
            renderSidebar(state);
            closeModal();

            mesaInput.value = '';
            if (nombreInput) nombreInput.value = '';
            if (notasInput) notasInput.value = '';

            showToast(`¡Pedido enviado a cocina! Orden: ${data.numero_orden}`);
        } else {
            console.error("Error de Laravel:", data);
            showToast('Hubo un error al guardar el pedido');
        }
    } catch (error) {
        console.error("Fallo la conexión:", error);
        showToast("Error de red. Verifica tu conexión.");
    } finally {
        btnSubmit.innerHTML = textoOriginal;
        btnSubmit.disabled = false;
    }
  });

  // El botón "Limpiar Pedido" se mantiene igual
  document.getElementById('clear-btn')?.addEventListener('click', () => {
    state.ramenItems.length = 0;
    Object.keys(state.extras).forEach((k) => delete state.extras[k]);
    ['fideo', 'verduras', 'proteina', 'extras', 'caldo'].forEach((k) => (state.ramen[k] = []));

    document.querySelectorAll('[data-step]').forEach((b) => b.removeAttribute('data-selected'));
    document.querySelectorAll('[id^="qty-"]').forEach((el) => (el.textContent = '0'));

    updateProgress(state);
    renderSidebar(state);
    showToast('Pedido limpiado');
  });
}