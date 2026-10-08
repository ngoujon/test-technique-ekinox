import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseCart } from './cart.js';
import { euros, toEuros } from './money.js';
import { priceCart, quoteCart, type PricingPolicy } from './pricing.js';

const priceOf = (cart: string, policy?: PricingPolicy): number =>
  toEuros(priceCart(parseCart(cart), policy).total);

const BTTF_1 = 'Back to the Future 1';
const BTTF_2 = 'Back to the Future 2';
const BTTF_3 = 'Back to the Future 3';

/**
 * Prix de référence, transcrit au plus près de la règle de l'énoncé, volontairement
 * naïf (euros flottants, aucune réutilisation du code testé) : il sert d'oracle
 * indépendant pour vérifier l'implémentation sur des paniers quelconques.
 */
function referencePrice(titles: readonly string[]): number {
  const sagaDvds = titles.filter((title) => [BTTF_1, BTTF_2, BTTF_3].includes(title));
  const differentEpisodes = new Set(sagaDvds).size;
  const discount = differentEpisodes >= 3 ? 0.2 : differentEpisodes === 2 ? 0.1 : 0;
  return sagaDvds.length * 15 * (1 - discount) + (titles.length - sagaDvds.length) * 20;
}

/**
 * Exemples de l'énoncé : ce sont les critères d'acceptation. Le résultat attendu
 * est écrit sous la forme du calcul détaillé par l'énoncé, pas comme une valeur figée.
 */
describe('exemples de l’énoncé', () => {
  it.each([
    { example: 1, cart: [BTTF_1, BTTF_2, BTTF_3], expected: 15 * 3 * 0.8 },
    { example: 2, cart: [BTTF_1, BTTF_3], expected: 15 * 2 * 0.9 },
    { example: 3, cart: [BTTF_1], expected: 15 },
    { example: 4, cart: [BTTF_1, BTTF_2, BTTF_3, BTTF_2], expected: 15 * 4 * 0.8 },
    { example: 5, cart: [BTTF_1, BTTF_2, BTTF_3, 'La chèvre'], expected: 15 * 3 * 0.8 + 20 },
  ])('exemple n°$example → $expected €', ({ cart, expected }) => {
    // Les exemples de l'énoncé séparent les titres par une ligne vide.
    expect(priceOf(cart.join('\n\n'))).toBeCloseTo(expected, 2);
  });
});

/**
 * Test par propriété : des milliers de paniers aléatoires (volets, doublons, autres
 * films, dans n'importe quel ordre) doivent tous respecter la règle de l'énoncé.
 * Aucun résultat n'est prédéfini : c'est la règle elle-même qui est vérifiée.
 */
describe('règle de l’énoncé sur des paniers aléatoires', () => {
  const anyTitle = fc.constantFrom(BTTF_1, BTTF_2, BTTF_3, 'La chèvre', 'Les Visiteurs', 'Matrix');

  it('calcule le même prix que la règle de référence', () => {
    fc.assert(
      fc.property(fc.array(anyTitle, { maxLength: 30 }), (titles) => {
        expect(priceOf(titles.join('\n'))).toBeCloseTo(referencePrice(titles), 2);
      }),
      { numRuns: 2_000 },
    );
  });

  it('donne un prix indépendant de l’ordre de saisie', () => {
    fc.assert(
      fc.property(fc.array(anyTitle, { maxLength: 30 }), (titles) => {
        const reversed = [...titles].reverse();
        expect(priceOf(reversed.join('\n'))).toBe(priceOf(titles.join('\n')));
      }),
    );
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

describe('quoteCart', () => {
  it('retourne les films reconnus et le prix du panier', () => {
    const { movies, quote } = quoteCart('Back to the Future 1\nLa chèvre');

    expect(movies.map((movie) => movie.kind)).toEqual(['saga', 'other']);
    expect(quote.total).toBe(euros(35));
  });
});
