import { describe, expect, it } from 'vitest';
import { parseCart } from './cart.js';
import { euros, toEuros } from './money.js';
import type { PricingPolicy } from './pricing-policy.js';
import { priceCart } from './pricing.js';

const priceOf = (cart: string, policy?: PricingPolicy): number =>
  toEuros(priceCart(parseCart(cart), policy).total);

/** Exemples fournis tels quels dans l'énoncé : ce sont les critères d'acceptation. */
describe('exemples de l’énoncé', () => {
  it.each([
    {
      example: 1,
      cart: ['Back to the Future 1', 'Back to the Future 2', 'Back to the Future 3'],
      expected: 36,
    },
    { example: 2, cart: ['Back to the Future 1', 'Back to the Future 3'], expected: 27 },
    { example: 3, cart: ['Back to the Future 1'], expected: 15 },
    {
      example: 4,
      cart: [
        'Back to the Future 1',
        'Back to the Future 2',
        'Back to the Future 3',
        'Back to the Future 2',
      ],
      expected: 48,
    },
    {
      example: 5,
      cart: ['Back to the Future 1', 'Back to the Future 2', 'Back to the Future 3', 'La chèvre'],
      expected: 56,
    },
  ])('exemple n°$example → $expected €', ({ cart, expected }) => {
    // Les exemples de l'énoncé séparent les titres par une ligne vide.
    expect(priceOf(cart.join('\n\n'))).toBe(expected);
  });
});

describe('priceCart', () => {
  it('retourne 0 pour un panier vide', () => {
    expect(priceOf('')).toBe(0);
  });

  it('facture 20 € chaque autre film, sans remise', () => {
    expect(priceOf('La chèvre\nLe Père Noël est une ordure')).toBe(40);
  });

  it('n’applique aucune remise pour plusieurs exemplaires d’un même volet', () => {
    expect(priceOf('Back to the Future 2\nBack to the Future 2')).toBe(30);
  });

  it('applique la remise de 10 % à tous les DVD de la saga, doublons compris', () => {
    // (15 × 3) × 0,9 = 40,5
    expect(priceOf('Back to the Future 1\nBack to the Future 1\nBack to the Future 3')).toBe(40.5);
  });

  it('n’applique pas la remise de la saga aux autres films', () => {
    // (15 × 2) × 0,9 + 20 = 47
    expect(priceOf('Back to the Future 1\nBack to the Future 2\nLa chèvre')).toBe(47);
  });

  it('détaille le calcul', () => {
    const quote = priceCart(
      parseCart(
        'Back to the Future 1\nBack to the Future 2\nBack to the Future 3\nBack to the Future 2\nLa chèvre',
      ),
    );

    expect(quote).toEqual({
      saga: {
        quantity: 4,
        distinctEpisodes: 3,
        subtotal: euros(60),
        discountPercent: 20,
        discount: euros(12),
        total: euros(48),
      },
      otherMovies: { quantity: 1, total: euros(20) },
      total: euros(68),
    });
  });

  it('retient le palier le plus avantageux, quel que soit l’ordre de déclaration', () => {
    const policy: PricingPolicy = {
      sagaUnitPrice: euros(10),
      otherMovieUnitPrice: euros(10),
      sagaDiscountTiers: [
        { minDistinctEpisodes: 3, percent: 50 },
        { minDistinctEpisodes: 1, percent: 5 },
      ],
    };

    expect(priceOf('Back to the Future 1', policy)).toBe(9.5);
    expect(
      priceOf('Back to the Future 1\nBack to the Future 2\nBack to the Future 3', policy),
    ).toBe(15);
  });
});
