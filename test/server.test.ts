import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/server/app.js';
import type { ServerConfig } from '../src/server/config.js';
import { MAX_CART_LENGTH } from '../src/server/quote-route.js';

const TEST_CONFIG: ServerConfig = {
  host: '127.0.0.1',
  port: 0,
  logLevel: 'silent',
  rateLimitPerMinute: 1_000,
};

let app: FastifyInstance | undefined;

async function startApp(config: Partial<ServerConfig> = {}): Promise<FastifyInstance> {
  app = await buildApp({ ...TEST_CONFIG, ...config });
  return app;
}

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('POST /api/quotes', () => {
  it('chiffre le panier de l’exemple n°5 et détaille le calcul', async () => {
    const server = await startApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/quotes',
      payload: {
        cart: 'Back to the Future 1\n\nBack to the Future 2\n\nBack to the Future 3\n\nLa chèvre',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      movies: [
        { kind: 'saga', title: 'Back to the Future 1', episode: 1 },
        { kind: 'saga', title: 'Back to the Future 2', episode: 2 },
        { kind: 'saga', title: 'Back to the Future 3', episode: 3 },
        { kind: 'other', title: 'La chèvre' },
      ],
      saga: {
        quantity: 3,
        distinctEpisodes: 3,
        subtotalCents: 4500,
        discountPercent: 20,
        discountCents: 900,
        totalCents: 3600,
      },
      otherMovies: { quantity: 1, totalCents: 2000 },
      totalCents: 5600,
    });
  });

  it.each([
    ['sans panier', {}],
    ['avec un panier qui n’est pas du texte', { cart: ['Back to the Future 1'] }],
    ['avec un champ inattendu', { cart: 'La chèvre', admin: true }],
    ['avec un panier trop long', { cart: 'a'.repeat(MAX_CART_LENGTH + 1) }],
  ])('rejette une requête %s', async (_case, payload) => {
    const server = await startApp();
    const response = await server.inject({ method: 'POST', url: '/api/quotes', payload });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty('error');
  });

  it('rejette un corps de requête démesuré', async () => {
    const server = await startApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/quotes',
      payload: { cart: 'a'.repeat(MAX_CART_LENGTH * 5) },
    });

    expect(response.statusCode).toBe(413);
  });

  it('rejette un type de contenu non supporté', async () => {
    const server = await startApp();
    const response = await server.inject({
      method: 'POST',
      url: '/api/quotes',
      headers: { 'content-type': 'application/xml' },
      payload: '<cart>Back to the Future 1</cart>',
    });

    expect(response.statusCode).toBe(415);
  });

  it('limite le nombre de requêtes par client', async () => {
    const server = await startApp({ rateLimitPerMinute: 2 });
    const request = () =>
      server.inject({ method: 'POST', url: '/api/quotes', payload: { cart: '' } });

    expect((await request()).statusCode).toBe(200);
    expect((await request()).statusCode).toBe(200);
    expect((await request()).statusCode).toBe(429);
  });
});

describe('gestion des erreurs', () => {
  it('ne divulgue pas le détail d’une erreur interne', async () => {
    const server = await startApp();
    server.get('/boom', () => {
      throw new Error('secret de connexion');
    });

    const response = await server.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('secret');
  });
});

describe('interface web et exploitation', () => {
  it('sert la page d’accueil avec des en-têtes de sécurité', async () => {
    const server = await startApp();
    const response = await server.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['content-security-policy']).toContain("script-src 'self'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('expose un point de santé', async () => {
    const server = await startApp();
    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.json()).toEqual({ status: 'ok' });
  });
});
