import { fileURLToPath } from 'node:url';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import type { ServerConfig } from './config.js';
import { MAX_CART_LENGTH, registerQuoteRoute } from './quote-route.js';

/** Dossier des fichiers de l'interface web, identique depuis `src/server` et `dist/server`. */
const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));

/**
 * Construit l'application sans la démarrer : les tests l'utilisent directement
 * via `app.inject()`, sans ouvrir de port réseau.
 */
export async function buildApp(config: ServerConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
    // Limite la taille des requêtes : un panier valide n'en approche jamais.
    bodyLimit: MAX_CART_LENGTH * 4 + 1_024,
    // Validation stricte : Fastify convertit par défaut les types et retire les champs inconnus
    // en silence ; on préfère rejeter explicitement toute requête non conforme au contrat.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
    // Délais maximaux : sans eux, un client très lent (attaque « slowloris ») peut monopoliser
    // des connexions indéfiniment. Fastify ne fixe aucune limite par défaut.
    requestTimeout: 10_000,
    connectionTimeout: 15_000,
  });

  // L'API n'accepte que du JSON : on retire l'analyseur text/plain fourni par défaut
  // pour réduire la surface d'attaque (tout autre type est rejeté en 415).
  app.removeContentTypeParser('text/plain');

  // En-têtes de sécurité HTTP (CSP, nosniff, anti-clickjacking, HSTS…).
  // La CSP est définie en liste blanche explicite, plus stricte que celle de helmet par
  // défaut : tout est interdit sauf les scripts, styles, images et appels d'API servis par
  // l'application elle-même. Aucun script ni style inline n'est autorisé.
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: 'deny' },
  });

  // Désactive les fonctionnalités sensibles du navigateur, dont l'interface n'a pas l'usage.
  app.addHook('onRequest', (_request, reply, done) => {
    reply.header(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    done();
  });

  // Limite le nombre de requêtes par IP pour protéger le service des abus.
  await app.register(rateLimit, { max: config.rateLimitPerMinute, timeWindow: '1 minute' });

  // Ne renvoie jamais le détail d'une erreur interne au client : il est seulement journalisé.
  app.setErrorHandler((error: { statusCode?: number; message: string }, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erreur interne du serveur' });
    }
    return reply.status(statusCode).send({ error: error.message });
  });

  app.get('/health', () => ({ status: 'ok' }));
  registerQuoteRoute(app);
  await app.register(fastifyStatic, { root: PUBLIC_DIR });

  return app;
}
