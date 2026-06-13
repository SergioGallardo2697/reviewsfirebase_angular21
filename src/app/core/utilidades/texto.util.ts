// Normaliza texto removiendo acentos y pasando a minúsculas (búsqueda accent-insensitive)
export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return '';
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
