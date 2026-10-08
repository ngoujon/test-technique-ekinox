# Sécurité

## Signaler une vulnérabilité

Merci de ne pas ouvrir d'issue publique. Utiliser le
[signalement privé de GitHub](https://docs.github.com/fr/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
(onglet _Security_ du dépôt) en décrivant la faille et un moyen de la reproduire.

## Mesures en place

Mesures appliquées, en référence aux recommandations
[OWASP](https://owasp.org/www-project-top-ten/) les plus pertinentes pour ce service.
Chacune est couverte par un test lorsque c'est possible.

### Entrées

- **Validation stricte par schéma JSON** : type exact, champs inconnus refusés,
  panier limité à 10 000 caractères. La coercition de types de Fastify est désactivée.
- **Seul le JSON est accepté** (`415` sinon) et le corps de requête est borné (`413`).
- **Caractères invisibles supprimés** des titres (contrôle, largeur nulle, marques
  bidirectionnelles) : pas de ligne fantôme facturée ni de titre affiché trompeur.
- Le texte n'est jamais interprété : il est découpé puis comparé à un motif
  ancré, sans expression régulière exposée au _ReDoS_.

### Sorties

- **Sérialisation par schéma** : seuls les champs déclarés sont renvoyés.
- **Aucune fuite d'erreur interne** : les erreurs 5xx sont journalisées, le
  client reçoit un message générique.
- **Pas d'injection HTML (XSS)** : l'interface insère le contenu avec
  `textContent`, jamais `innerHTML`.

### En-têtes HTTP

- **CSP en liste blanche** (`default-src 'none'`, scripts, styles et appels
  d'API limités à `'self'`, aucun inline), `frame-ancestors 'none'` et
  `X-Frame-Options: DENY` contre le _clickjacking_, `nosniff`, HSTS (via helmet).
- **Permissions-Policy** désactivant caméra, micro, géolocalisation, paiement, USB.

> La CSP contient `upgrade-insecure-requests` : en production, le service doit
> être exposé en HTTPS (typiquement derrière un reverse proxy). `localhost`
> n'est pas concerné.

### Disponibilité

- **Rate limiting** par IP (configurable). Derrière un reverse proxy de
  confiance, activer `TRUST_PROXY=true` pour compter les requêtes par client
  réel ; sinon `X-Forwarded-For` est ignoré, car falsifiable.
- **Délais maximaux** de requête (10 s) et de connexion (15 s) contre les
  clients lents (_slowloris_).
- **Arrêt gracieux** sur `SIGTERM`/`SIGINT`, sonde `GET /health` et `HEALTHCHECK` Docker.

### Exécution et chaîne d'approvisionnement

- Écoute par défaut sur `127.0.0.1` uniquement : l'exposition réseau est explicite.
- Image Docker multi-étapes, **épinglée par empreinte**, sans outils de build ni
  dépendances de dev, exécutée avec l'utilisateur **non root** `node`.
- Dépendances **figées** (versions exactes, `package-lock.json`, `npm ci`) et
  installées sans scripts dans l'image (`--ignore-scripts`).
- `npm audit` bloquant en CI, mises à jour par **Dependabot** (npm, actions, Docker).
- Actions GitHub **épinglées par SHA**, jeton en lecture seule, identifiants Git
  non conservés après le checkout.
- Configuration par variables d'environnement uniquement, aucun secret dans le
  code (le service n'en a pas besoin), `.env` ignoré par Git.

## Hors périmètre

Pas d'authentification : le besoin exprimé est un calculateur public. Si un
panier devait un jour être associé à un client, il faudrait ajouter
authentification, CORS explicite et journalisation d'audit.
