import { describe, expect, it } from 'vitest';
import { identifyMovie, normalizeTitle } from './movie.js';

describe('identifyMovie', () => {
  it.each([1, 2, 3] as const)('reconnaît le volet %i de la saga', (episode) => {
    expect(identifyMovie(`Back to the Future ${String(episode)}`)).toEqual({
      kind: 'saga',
      title: `Back to the Future ${String(episode)}`,
      episode,
    });
  });

  it('ignore la casse et les espaces superflus', () => {
    expect(identifyMovie('  back TO the   future\t2 ')).toMatchObject({ kind: 'saga', episode: 2 });
  });

  it.each(['La chèvre', 'Back to the Future', 'Back to the Future 4', 'Back to the Future 1 bis'])(
    'considère « %s » comme un autre film',
    (title) => {
      expect(identifyMovie(title)).toEqual({ kind: 'other', title });
    },
  );
});

describe('normalizeTitle', () => {
  it('unifie les formes Unicode composées et décomposées', () => {
    const decomposed = 'La chèvre';
    expect(normalizeTitle(decomposed)).toBe('La chèvre');
  });

  it('remplace les espaces insécables et multiples par un espace simple', () => {
    expect(normalizeTitle('La  chèvre ')).toBe('La chèvre');
  });
});
