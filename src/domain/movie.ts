/**
 * Identification des films saisis dans un panier.
 *
 * Un film est soit un volet de la saga « Back to the Future » (soumis à la
 * promotion), soit n'importe quel autre film du magasin.
 */

/** Volets existants de la saga. Ajouter un volet se fait ici et uniquement ici. */
export const SAGA_EPISODES = [1, 2, 3] as const;

export type SagaEpisode = (typeof SAGA_EPISODES)[number];

export type Movie =
  | { readonly kind: 'saga'; readonly title: string; readonly episode: SagaEpisode }
  | { readonly kind: 'other'; readonly title: string };

/** Titre attendu pour un volet de la saga, ex. « Back to the Future 2 ». */
const SAGA_TITLE_PATTERN = /^back to the future (\d+)$/;

/**
 * Normalise un titre saisi par un humain :
 * - forme Unicode NFC (« è » composé ou décomposé doit être le même titre) ;
 * - espaces multiples / insécables réduits à un espace, bords supprimés.
 */
export function normalizeTitle(rawTitle: string): string {
  return rawTitle.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

function isSagaEpisode(value: number): value is SagaEpisode {
  return (SAGA_EPISODES as readonly number[]).includes(value);
}

/**
 * Transforme un titre en {@link Movie}.
 *
 * La reconnaissance de la saga est insensible à la casse et aux espaces superflus.
 * Un numéro de volet inexistant (ex. « Back to the Future 4 ») n'est pas un volet
 * de la saga : il est traité comme un autre film (cf. hypothèses du README).
 */
export function identifyMovie(rawTitle: string): Movie {
  const title = normalizeTitle(rawTitle);
  const match = SAGA_TITLE_PATTERN.exec(title.toLowerCase());
  const episode = Number(match?.[1]);

  if (isSagaEpisode(episode)) {
    return { kind: 'saga', title, episode };
  }
  return { kind: 'other', title };
}
