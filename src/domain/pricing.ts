import type { Movie } from './movie.js';
import { addCents, multiplyCents, percentOf, subtractCents, type Cents } from './money.js';
import { BTTF_PROMOTION_POLICY, type PricingPolicy } from './pricing-policy.js';

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
