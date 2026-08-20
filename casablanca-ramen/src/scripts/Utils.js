/* ================================================================
   UTILIDADES COMPARTIDAS
   Funciones puras sin estado ni dependencias del DOM, usadas por
   varios módulos (diseño, render, reconciliación).
================================================================ */

// Normaliza texto para comparaciones robustas: minúsculas y sin acentos
// (así "Camarón" === "camaron", "Champiñón" === "champinon", etc.)
export function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Deriva una clave estable a partir del primer elemento de un arreglo
// de ingredientes (id si existe, si no el nombre). Se usa para detectar
// cambios de ingrediente y decidir si algo debe animarse como "fresco".
export function keyOf(arr) {
  if (!arr || arr.length === 0) return null;
  return String(arr[0].id ?? arr[0].name);
}