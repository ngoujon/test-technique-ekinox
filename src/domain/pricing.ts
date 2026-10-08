import { parseCart } from './cart.js';
import type { Movie } from './movie.js';
import { addCents, euros, multiplyCents, percentOf, subtractCents, type Cents } from './money.js';

/** Palier de remise : à partir de `minDistinctEpisodes` volets différents, `percent` % de remise. */
export interface SagaDiscountTier {
  readonly minDistinctEpisodes: number;
  readonly percent: number;
}

/**
 * Règles commerciales du magasin, regroupées en une seule donnée de configuration.
 * Modifier un prix ou un palier de la promotion ne nécessite donc aucun changement
 * de l'algorithme de calcul.
 */
export interface PricingPolicy {
  readonly sagaUnitPrice: Cents;
  readonly otherMovieUnitPrice: Cents;
  readonly sagaDiscountTiers: readonly SagaDiscountTier[];
}

/** Promotion « Back to the Future » telle que définie par l'équipe de production. */
export const BTTF_PROMOTION_POLICY: PricingPolicy = {
  sagaUnitPrice: euros(15),
  otherMovieUnitPrice: euros(20),
  sagaDiscountTiers: [
    { minDistinctEpisodes: 2, percent: 10 },
    { minDistinctEpisodes: 3, percent: 20 },
  ],
};

/** Détail du calcul, exposé pour que le client puisse comprendre son prix. */
export interface Quote {
  readonly saga: {
    readonly quantity: number;
    readonly distinctEpisodes: number;
    readonly subtotal: Cents;
    readonly discountPercent: number;
    readonly discount: Cents;
    readonly total: Cents;
  };
  readonly otherMovies: {
    readonly quantity: number;
    readonly total: Cents;
  };
  readonly total: Cents;
}

/**
 * Retourne le pourcentage de remise applicable : celui du palier le plus
 * avantageux atteint (0 si aucun palier n'est atteint).
 */
function sagaDiscountPercent(distinctEpisodes: number, policy: PricingPolicy): number {
  return policy.sagaDiscountTiers
    .filter((tier) => distinctEpisodes >= tier.minDistinctEpisodes)
    .reduce((best, tier) => Math.max(best, tier.percent), 0);
}

/**
 * Calcule le prix d'un panier.
 *
 * Règles (cf. énoncé) :
 * - la remise dépend du nombre de volets **différents** de la saga ;
 * - elle s'applique à **tous** les DVD de la saga du panier, doublons compris ;
 * - elle ne s'applique jamais aux autres films.
 */
export function priceCart(movies: readonly Movie[], policy = BTTF_PROMOTION_POLICY): Quote {
  const sagaMovies = movies.filter((movie) => movie.kind === 'saga');
  const otherMoviesQuantity = movies.length - sagaMovies.length;

  const distinctEpisodes = new Set(sagaMovies.map((movie) => movie.episode)).size;
  const discountPercent = sagaDiscountPercent(distinctEpisodes, policy);
  const sagaSubtotal = multiplyCents(policy.sagaUnitPrice, sagaMovies.length);
  const sagaDiscount = percentOf(sagaSubtotal, discountPercent);
  const sagaTotal = subtractCents(sagaSubtotal, sagaDiscount);

  const otherMoviesTotal = multiplyCents(policy.otherMovieUnitPrice, otherMoviesQuantity);

  return {
    saga: {
      quantity: sagaMovies.length,
      distinctEpisodes,
      subtotal: sagaSubtotal,
      discountPercent,
      discount: sagaDiscount,
      total: sagaTotal,
    },
    otherMovies: { quantity: otherMoviesQuantity, total: otherMoviesTotal },
    total: addCents(sagaTotal, otherMoviesTotal),
  };
}

export interface CartQuote {
  /** Films reconnus, dans l'ordre de saisie : permet de vérifier la lecture du panier. */
  readonly movies: readonly Movie[];
  readonly quote: Quote;
}

/**
 * Cas d'usage de l'application : chiffrer un panier saisi en texte.
 * Point d'entrée commun à l'API HTTP et à la CLI, qui restent ainsi de simples adaptateurs.
 */
export function quoteCart(cartText: string): CartQuote {
  const movies = parseCart(cartText);
  return { movies, quote: priceCart(movies) };
}
