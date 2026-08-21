/**
 * Normalise une chaîne pour la recherche : minuscules, sans accents ni ligatures, sans espaces superflus.
 * Permet à « oeuf » de correspondre à « Œufs » ou « creme » à « Crème ».
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
