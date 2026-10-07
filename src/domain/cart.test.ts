import { describe, expect, it } from 'vitest';
import { parseCart } from './cart.js';

describe('parseCart', () => {
  it('lit un titre par ligne', () => {
    expect(parseCart('Back to the Future 1\nLa chèvre')).toEqual([
      { kind: 'saga', title: 'Back to the Future 1', episode: 1 },
      { kind: 'other', title: 'La chèvre' },
    ]);
  });

  it('ignore les lignes vides et accepte les fins de ligne Windows', () => {
    expect(
      parseCart('\r\nBack to the Future 1\r\n\r\n   \r\nBack to the Future 3\r\n'),
    ).toHaveLength(2);
  });

  it('retourne un panier vide pour un texte vide', () => {
    expect(parseCart('')).toEqual([]);
    expect(parseCart('\n \n')).toEqual([]);
  });

  it('conserve les doublons', () => {
    expect(parseCart('Back to the Future 2\nBack to the Future 2')).toHaveLength(2);
  });
});
