import { identifyMovie, normalizeTitle, type Movie } from './movie.js';

/**
 * Lit un panier au format texte : un titre de film par ligne.
 *
 * Les lignes vides (ou ne contenant que des espaces ou des caractères invisibles,
 * une fois normalisées) sont ignorées, ce qui
 * permet d'accepter les exemples de l'énoncé, où les titres sont séparés par
 * des lignes vides. Les fins de ligne Windows (`\r\n`) sont acceptées.
 */
export function parseCart(text: string): Movie[] {
  return text
    .split(/\r?\n/)
    .map(normalizeTitle)
    .filter((title) => title !== '')
    .map(identifyMovie);
}
