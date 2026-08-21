import { normalize, keyOf } from './Utils.js';

/* ================================================================
   DISEÑO: TAZÓN, INGREDIENTES E ÍCONOS (SVG)
   Todo lo relacionado a "cómo se ve" un ramen o un extra: colores
   según el caldo, grosor/color de fideo, dibujos por proteína y
   verdura, íconos específicos por platillo, y el armado del tazón
   grande "en construcción" del sidebar.

   Este módulo NO toca el DOM real ni hace fetch: solo construye
   strings de SVG/HTML a partir del estado del pedido. La única
   "memoria" que guarda es cuál fue el último caldo/fideo/proteína
   y qué verduras ya se vieron, para marcar con data-fresh="1" solo
   lo que cambió (y así el motor de animaciones no re-anime todo).
================================================================ */

let _buildKeys = { caldo: null, fideo: null, proteina: null };
let _seenVeggieKeys = new Set();

// Limpia la memoria de "qué ya se animó" del tazón en construcción.
// Debe llamarse cuando el tazón se vacía o se confirma el pedido.
export function resetBuildState() {
  _buildKeys = { caldo: null, fideo: null, proteina: null };
  _seenVeggieKeys.clear();
}

export function getBowlDesign(ramen) {
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
export function getFideoStyle(fideoArray) {
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
export function getProteinaSvg(proteinaArray, animCfg = null) {
  if (!proteinaArray || proteinaArray.length === 0) return '';

  return proteinaArray.map((p, pIdx) => {
    const pName = normalize(p.name);
    const attrs = animCfg && animCfg.fresh
      ? `data-fresh="1" data-anim-kind="proteina" data-anim-delay="${(animCfg.delay || 0) + (pIdx * 90)}"`
      : '';

    // Si hay más de una proteína, desplazamos cada una para que no se empalmen
    let transform = '';
    if (proteinaArray.length > 1) {
      if (pIdx === 0) transform = 'transform="translate(-6, -3)"';
      else if (pIdx === 1) transform = 'transform="translate(6, 4)"';
      else transform = `transform="translate(${(pIdx - 1) * 8}, ${pIdx * 3})"`;
    }

    let content = '';
    if (pName.includes('huevo duro')) {
      content = `
        <ellipse cx="34" cy="46" rx="7" ry="9" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <circle cx="34" cy="46" r="3" fill="#facc15"/>
        <ellipse cx="63" cy="47" rx="7" ry="9" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
        <circle cx="63" cy="47" r="3" fill="#facc15"/>
      `;
    } else if (pName.includes('pollito') || pName.includes('pollo')) {
      content = `
        <rect x="28" y="43" width="10" height="9" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
        <rect x="58" y="44" width="11" height="8" rx="2" fill="#d97706" stroke="#92400e" stroke-width="1.5"/>
        <circle cx="31" cy="46" r="0.8" fill="#fef3c7"/>
        <circle cx="62" cy="47" r="0.8" fill="#fef3c7"/>
      `;
    } else if (pName.includes('tocino')) {
      content = `
        <path d="M 26 44 Q 32 40, 38 44 Q 44 48, 50 44" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M 26 48 Q 32 44, 38 48 Q 44 52, 50 48" fill="none" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/>
        <path d="M 52 46 Q 58 42, 64 46 Q 70 50, 76 46" fill="none" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round"/>
      `;
    } else if (pName.includes('costillita') || pName.includes('costilla')) {
      content = `
        <path d="M 28 42 Q 26 48, 30 53" fill="none" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
        <path d="M 34 41 Q 32 48, 36 54" fill="none" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="32" cy="44" rx="8" ry="4" fill="#b45309" opacity="0.5"/>
        <path d="M 58 43 Q 56 49, 60 54" fill="none" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="59" cy="45" rx="6" ry="3.5" fill="#b45309" opacity="0.5"/>
      `;
    } else if (pName.includes('camaron') || pName.includes('shrimp') || pName.includes('marisco')) {
      content = `
        <path d="M 30 45 Q 35 38, 42 42 Q 45 46, 38 49 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M 54 46 Q 59 39, 66 43 Q 69 47, 62 50 Z" fill="#fb923c" stroke="#c2410c" stroke-width="1.5"/>
        <path d="M 33 43 Q 36 44, 38 47" fill="none" stroke="#c2410c" stroke-width="0.8" opacity="0.6"/>
        <path d="M 58 44 Q 61 45, 63 48" fill="none" stroke="#c2410c" stroke-width="0.8" opacity="0.6"/>
      `;
    } else if (pName.includes('tofu')) {
      content = `
        <rect x="27" y="41" width="12" height="12" rx="1.5" fill="#fefce8" stroke="#d4d4d8" stroke-width="1.5"/>
        <rect x="57" y="42" width="12" height="12" rx="1.5" fill="#fefce8" stroke="#d4d4d8" stroke-width="1.5"/>
        <line x1="27" y1="47" x2="39" y2="47" stroke="#d4d4d8" stroke-width="0.6"/>
        <line x1="57" y1="48" x2="69" y2="48" stroke="#d4d4d8" stroke-width="0.6"/>
      `;
    } else if (pName.includes('raviole')) {
      content = `
        <path d="M 28 42 L 39 42 L 39 53 L 28 53 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" transform="rotate(6 33 47)"/>
        <path d="M 58 43 L 69 43 L 69 54 L 58 54 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.5" transform="rotate(-6 63 48)"/>
      `;
    } else if (pName.includes('res') || pName.includes('beef') || pName.includes('carne')) {
      content = `
        <path d="M 27 45 Q 35 42, 45 47" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
        <path d="M 52 47 Q 60 42, 69 46" fill="none" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
        <path d="M 30 45 Q 37 43, 43 46" fill="none" stroke="#fde68a" stroke-width="0.8" opacity="0.5"/>
      `;
    } else {
      content = `
        <path d="M 30 46 Q 39 37, 48 46 Q 39 55, 30 46 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
        <circle cx="39" cy="46" r="5.5" fill="#f87171" opacity="0.7"/>
        <path d="M 50 48 Q 59 39, 68 48 Q 59 57, 50 48 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2"/>
        <circle cx="59" cy="48" r="5" fill="#f87171" opacity="0.7"/>
      `;
    }

    return `<g ${attrs} ${transform}>${content}</g>`;
  }).join('');
}

// Generador de gráficos SVG específicos para Verduras y Complementos según su tipo
export function getVerdurasSvg(verdurasArray, accentDefault, animate = false) {
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

    // Reacomodo de coordenadas: Germinado (Extrema Izq), Brócoli (Centro Izq), Champiñón (Centro Abajo), Elote (Centro Der), Naruto (Derecha), Nori (Fondo Der)
    if (vName.includes('brocoli')) {
      vegElements.push(`
        <g ${attrs}>
          <circle cx="34" cy="37" r="3" fill="#16a34a"/>
          <circle cx="38" cy="35" r="3.2" fill="#22c55e"/>
          <circle cx="41" cy="38" r="2.8" fill="#16a34a"/>
          <line x1="38" y1="38" x2="38" y2="45" stroke="#84cc16" stroke-width="2"/>
        </g>
      `);
    } else if (vName.includes('germinado')) {
      vegElements.push(`
        <g ${attrs}>
          <path d="M 21 44 Q 23 36, 19 31" fill="none" stroke="#bef264" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 25 45 Q 27 37, 24 31" fill="none" stroke="#d9f99d" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M 29 44 Q 31 37, 28 32" fill="none" stroke="#bef264" stroke-width="1.5" stroke-linecap="round"/>
        </g>
      `);
    } else if (vName.includes('nori') || vName.includes('alga')) {
      vegElements.push(`<g ${attrs}><path d="M 70 42 L 76 23 L 84 26 L 78 45 Z" fill="#1e293b" stroke="#0f172a" stroke-width="1.5"/></g>`);
    } else if (vName.includes('elote') || vName.includes('maiz') || vName.includes('corn')) {
      vegElements.push(`
        <g ${attrs}>
          <circle cx="51" cy="37" r="2.2" fill="#facc15"/>
          <circle cx="55" cy="36" r="2" fill="#eab308"/>
          <circle cx="59" cy="38" r="2.2" fill="#facc15"/>
          <circle cx="53" cy="40" r="2" fill="#eab308"/>
        </g>
      `);
    } else if (vName.includes('champin') || vName.includes('hongo') || vName.includes('shiitake')) {
      vegElements.push(`
        <g ${attrs}>
          <ellipse cx="42" cy="43" rx="5.5" ry="3.5" fill="#78350f" stroke="#451a03" stroke-width="1"/>
          <path d="M 40 43 L 40 47 L 44 47 L 44 43 Z" fill="#fef3c7"/>
          <ellipse cx="49" cy="45" rx="5" ry="3" fill="#78350f" stroke="#451a03" stroke-width="1"/>
          <path d="M 47 45 L 47 48 L 51 48 L 51 45 Z" fill="#fef3c7"/>
        </g>
      `);
    } else if (vName.includes('naruto') || vName.includes('surimi')) {
      vegElements.push(`
        <g ${attrs}>
          <circle cx="64" cy="41" r="5" fill="#f8fafc" stroke="#ef4444" stroke-width="1.5"/>
          <path d="M 64 38 Q 66 40, 64 42 Q 62 40, 64 38" fill="#ef4444"/>
        </g>
      `);
    } else {
      vegElements.push(`
        <g ${attrs}>
          <path d="M25 45 Q 30 38, 35 45" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M65 43 Q 70 36, 75 44" fill="none" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round"/>
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
export function renderDynamicBowl(ramen) {
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

export function renderMiniBowlSvg(r, design, fideoStyle) {
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