import { euros, type Cents } from './money.js';

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
