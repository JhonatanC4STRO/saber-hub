/**
 * Genera un slug legible y apto para URL a partir de un texto.
 * Remueve acentos, caracteres especiales, convierte a minúsculas y separa con guiones.
 *
 * @param {string} text Texto a slugificar
 * @returns {string} Slug generado
 */
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Descomponer caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (acentos)
    .replace(/\s+/g, '-') // Reemplazar espacios por guiones
    .replace(/[^\w\-]+/g, '') // Eliminar todo lo que no sea palabra o guion
    .replace(/\-\-+/g, '-') // Reemplazar múltiples guiones consecutivos
    .replace(/^-+/, '') // Eliminar guion inicial
    .replace(/-+$/, ''); // Eliminar guion final
}
