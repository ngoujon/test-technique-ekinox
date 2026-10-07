# Sécurité

Mesures appliquées, en référence aux recommandations
[OWASP](https://owasp.org/www-project-top-ten/) les plus pertinentes pour ce service.

## Entrées

- **Validation stricte par schéma JSON** de chaque requête : type exact, champs
  inconnus refusés, longueur maximale du panier (10 000 caractères). La coercition
  de types par défaut de Fastify est désactivée.
- **Taille maximale du corps de requête** (`bodyLimit`) : une requête démesurée
  est rejetée avant d'être analysée (`413`).
- Le texte saisi n'est jamais interprété : il est découpé et comparé à un motif
  ancré, sans expression régulière à risque de _ReDoS_.

## Sorties

- **Sérialisation par schéma** : seuls les champs déclarés sont renvoyés.
- **Aucune fuite d'erreur interne** : les erreurs 5xx sont journalisées côté
  serveur et le client reçoit un message générique.
- **Pas d'injection HTML (XSS)** côté interface : le contenu dynamique est inséré
  avec `textContent`, jamais `innerHTML`.

## En-têtes HTTP

Via [`@fastify/helmet`](https://github.com/fastify/fastify-helmet) :
_Content Security Policy_ stricte (`script-src 'self'`, aucun script inline),
`X-Content-Type-Options: nosniff`, protection contre le _clickjacking_, HSTS…

> La CSP contient `upgrade-insecure-requests` : en production, le service doit
> être exposé en HTTPS (typiquement derrière un reverse proxy). En local,
> `localhost` n'est pas concerné.

## Disponibilité

- **Rate limiting** par adresse IP (`@fastify/rate-limit`, configurable).
- **Arrêt gracieux** sur `SIGTERM`/`SIGINT` : les requêtes en cours se terminent.
- Sonde `GET /health` et `HEALTHCHECK` Docker.

## Exécution et chaîne d'approvisionnement

- Écoute par défaut sur `127.0.0.1` uniquement ; l'exposition réseau est explicite.
- Image Docker multi-étapes, sans outils de build ni dépendances de dev,
  exécutée avec l'utilisateur **non root** `node`.
- Versions des dépendances **figées** (`package-lock.json`, `npm ci`, versions exactes).
- `npm audit` bloquant en CI et mises à jour par **Dependabot**.
- Jeton GitHub Actions en lecture seule (`permissions: contents: read`).
- Configuration uniquement par variables d'environnement : aucun secret dans le
  code (le service n'en a d'ailleurs pas besoin), `.env` ignoré par Git.

## Hors périmètre

Pas d'authentification : le besoin exprimé est un calculateur public. Si un
panier devait un jour être associé à un client, il faudrait ajouter
authentification, CORS explicite et journalisation d'audit.
