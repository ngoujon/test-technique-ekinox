import type { FastifyInstance } from 'fastify';
import { quoteCart } from '../domain/pricing.js';

/**
 * Taille maximale d'un panier, en caractères. Borne le travail du serveur
 * pour une requête (protection contre les abus) tout en restant très large :
 * environ 500 titres.
 */
export const MAX_CART_LENGTH = 10_000;

interface QuoteRequestBody {
  readonly cart: string;
}

/**
 * Le schéma de requête valide l'entrée avant qu'elle n'atteigne le métier ;
 * le schéma de réponse garantit qu'aucun champ non prévu ne fuite vers le client.
 */
const quoteSchema = {
  body: {
    type: 'object',
    required: ['cart'],
    additionalProperties: false,
    properties: { cart: { type: 'string', maxLength: MAX_CART_LENGTH } },
  },
  response: {
    200: {
      type: 'object',
      required: ['movies', 'saga', 'otherMovies', 'totalCents'],
      properties: {
        movies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'kind'],
            properties: {
              title: { type: 'string' },
              kind: { type: 'string', enum: ['saga', 'other'] },
              episode: { type: 'integer' },
            },
          },
        },
        saga: {
          type: 'object',
          properties: {
            quantity: { type: 'integer' },
            distinctEpisodes: { type: 'integer' },
            subtotalCents: { type: 'integer' },
            discountPercent: { type: 'number' },
            discountCents: { type: 'integer' },
            totalCents: { type: 'integer' },
          },
        },
        otherMovies: {
          type: 'object',
          properties: {
            quantity: { type: 'integer' },
            totalCents: { type: 'integer' },
          },
        },
        totalCents: { type: 'integer' },
      },
    },
  },
} as const;

/**
 * `POST /api/quotes` : chiffre un panier saisi en texte.
 *
 * Les montants sont exprimés en centimes (entiers) pour éviter toute ambiguïté
 * d'arrondi côté client ; le formatage en euros relève de l'affichage.
 * Le contrat d'API est volontairement distinct des types du domaine, afin que
 * le domaine puisse évoluer sans casser les clients.
 */
export function registerQuoteRoute(app: FastifyInstance): void {
  app.post<{ Body: QuoteRequestBody }>('/api/quotes', { schema: quoteSchema }, (request) => {
    const { movies, quote } = quoteCart(request.body.cart);
    return {
      movies,
      saga: {
        quantity: quote.saga.quantity,
        distinctEpisodes: quote.saga.distinctEpisodes,
        subtotalCents: quote.saga.subtotal,
        discountPercent: quote.saga.discountPercent,
        discountCents: quote.saga.discount,
        totalCents: quote.saga.total,
      },
      otherMovies: {
        quantity: quote.otherMovies.quantity,
        totalCents: quote.otherMovies.total,
      },
      totalCents: quote.total,
    };
  });
}
