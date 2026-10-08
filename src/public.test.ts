// @vitest-environment happy-dom
/// <reference lib="dom" />
/**
 * Tests de l'interface web (`public/`) dans un DOM simulé (happy-dom).
 *
 * `fetch` est redirigé vers la vraie application Fastify via `inject()` : on teste
 * l'interface et l'API ensemble, sans navigateur ni port réseau.
 */
import { readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from './server/app.js';

/** Contenu de `<body>` seulement : le `<head>` chargerait styles et favicon depuis le réseau. */
const PAGE_BODY =
  /<body>([\s\S]*)<\/body>/.exec(readFileSync('public/index.html', 'utf8'))?.[1] ?? '';
/** Typé `string` (et non littéral) pour que tsc ne cherche pas les types de ce script navigateur. */
// eslint-disable-next-line @typescript-eslint/no-inferrable-types -- annotation volontaire, cf. ci-dessus
const APP_SCRIPT: string = '../public/app.js';

let app: FastifyInstance;

/** `fetch` du navigateur, servi par l'application Fastify. */
async function fetchFromApp(url: string, init: RequestInit = {}): Promise<Response> {
  const response = await app.inject({
    method: 'POST',
    url,
    headers: { 'content-type': 'application/json' },
    payload: typeof init.body === 'string' ? init.body : '',
  });
  return new Response(response.body, { status: response.statusCode });
}

/** Charge la page puis son script, comme le ferait le navigateur. */
async function openPage(fetchImplementation: typeof fetchFromApp = fetchFromApp): Promise<void> {
  document.body.innerHTML = PAGE_BODY;
  vi.stubGlobal('fetch', vi.fn(fetchImplementation));
  vi.resetModules();
  await import(/* @vite-ignore */ APP_SCRIPT);
}

const byId = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} introuvable`);
  return element;
};

/** Texte affiché, espaces insécables (format monétaire français) normalisés. */
const textOf = (id: string): string => byId(id).textContent.replace(/\s/g, ' ');

beforeEach(async () => {
  app = await buildApp({
    host: '127.0.0.1',
    port: 0,
    logLevel: 'silent',
    rateLimitPerMinute: 1_000,
    trustProxy: false,
  });
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  await app.close();
});

describe('interface web', () => {
  it('chiffre le panier pré-rempli dès l’ouverture', async () => {
    await openPage();

    await vi.waitFor(() => {
      expect(textOf('total')).toBe('56,00 €');
    });
    expect(byId('result').hidden).toBe(false);
    expect(byId('placeholder').hidden).toBe(true);
  });

  it('charge un exemple de l’énoncé et affiche le ticket détaillé', async () => {
    await openPage();
    await vi.waitFor(() => {
      expect(textOf('total')).toBe('56,00 €');
    });

    document.querySelector<HTMLButtonElement>('[data-example="4"]')?.click();

    await vi.waitFor(() => {
      expect(textOf('total')).toBe('48,00 €');
    });
    const badges = [...document.querySelectorAll('#movies .badge')].map(
      (badge) => badge.textContent,
    );
    expect(badges).toEqual(['Volet 1', 'Volet 2', 'Volet 3', 'Volet 2']);
    expect(textOf('details')).toContain('Remise saga (20 %)');
  });

  it('affiche les titres comme du texte, sans interpréter de HTML (XSS)', async () => {
    await openPage();
    (byId('cart') as HTMLTextAreaElement).value = '<img src=x onerror=alert(1)>';
    (byId('cart-form') as HTMLFormElement).requestSubmit();

    await vi.waitFor(() => {
      expect(textOf('movies')).toContain('<img src=x onerror=alert(1)>');
    });
    expect(document.querySelector('#movies img')).toBeNull();
  });

  it('affiche le message d’erreur renvoyé par l’API', async () => {
    await openPage(() =>
      Promise.resolve(new Response(JSON.stringify({ error: 'panier invalide' }), { status: 400 })),
    );

    await vi.waitFor(() => {
      expect(textOf('error')).toContain('panier invalide');
    });
    expect(byId('result').hidden).toBe(true);
  });

  it('utilise le statut HTTP si l’API ne fournit pas de message', async () => {
    await openPage(() =>
      Promise.resolve(new Response('{}', { status: 503, statusText: 'Service Unavailable' })),
    );

    await vi.waitFor(() => {
      expect(textOf('error')).toContain('Service Unavailable');
    });
  });

  it('sur mobile, amène le ticket à l’écran après un calcul demandé, pas à l’ouverture', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    await openPage();
    await vi.waitFor(() => {
      expect(textOf('total')).toBe('56,00 €');
    });
    expect(scrollIntoView).not.toHaveBeenCalled();

    document.querySelector<HTMLButtonElement>('[data-example="3"]')?.click();

    await vi.waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledOnce();
    });
  });

  it('échoue explicitement si la page ne contient pas les éléments attendus', async () => {
    document.body.innerHTML = '';
    vi.resetModules();

    await expect(import(/* @vite-ignore */ APP_SCRIPT)).rejects.toThrow('introuvable');
  });

  it('signale un serveur injoignable et réactive le bouton', async () => {
    await openPage(() => Promise.reject(new TypeError('Failed to fetch')));

    await vi.waitFor(() => {
      expect(textOf('error')).toContain('injoignable');
    });
    expect((byId('submit') as HTMLButtonElement).disabled).toBe(false);
  });
});
