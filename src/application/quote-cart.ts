import { parseCart } from '../domain/cart.js';
import type { Movie } from '../domain/movie.js';
import { priceCart, type Quote } from '../domain/pricing.js';

export interface CartQuote {
  /** Films reconnus, dans l'ordre de saisie : permet de vérifier la lecture du panier. */
  readonly movies: readonly Movie[];
  readonly quote: Quote;
}

/**
 * Cas d'usage unique de l'application : chiffrer un panier saisi en texte.
 * Point d'entrée commun à l'API HTTP et à la CLI, qui restent ainsi de simples adaptateurs.
 */
export function quoteCart(cartText: string): CartQuote {
  const movies = parseCart(cartText);
  return { movies, quote: priceCart(movies) };
}
