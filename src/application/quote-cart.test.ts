import { describe, expect, it } from 'vitest';
import { quoteCart } from './quote-cart.js';

describe('quoteCart', () => {
  it('retourne les films reconnus et le prix du panier', () => {
    const { movies, quote } = quoteCart('Back to the Future 1\nLa chèvre');

    expect(movies.map((movie) => movie.kind)).toEqual(['saga', 'other']);
    expect(quote.total).toBe(3500);
  });
});
