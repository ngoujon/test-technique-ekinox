# Tests

Ce document décrit la stratégie de test du projet, comment lancer les tests et
comment en écrire de nouveaux.

## Lancer les tests

| Commande                | Rôle                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `npm test`              | Lance tous les tests une fois (moins de 2 secondes)        |
| `npm run test:watch`    | Relance les tests concernés à chaque modification          |
| `npm run test:coverage` | Tests et rapport de couverture (`coverage/index.html`)     |
| `npm run verify`        | Format, lint, typage et tests avec couverture, comme la CI |

Pour lancer un seul fichier ou un seul test :

```bash
npx vitest run src/domain/pricing.test.ts
npx vitest run -t "doublons"
```

## Outils

- [Vitest](https://vitest.dev) : exécution des tests, assertions, couverture (v8).
- [fast-check](https://fast-check.dev) : tests par propriété (paniers aléatoires).
- [happy-dom](https://github.com/capricorn86/happy-dom) : DOM simulé pour tester
  l'interface web sans navigateur.
- `fastify.inject()` : requêtes HTTP sur l'application sans ouvrir de port.

## Stratégie

Le gros des tests porte sur le métier, rapide et sans dépendance technique ; les
couches supérieures vérifient surtout l'assemblage.

| Niveau                   | Fichier                                            | Ce qui est vérifié                                                      |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Unitaire, domaine        | [`money.test.ts`](../src/domain/money.test.ts)     | Montants en centimes, remises, arrondis, refus des valeurs invalides    |
| Unitaire, domaine        | [`movie.test.ts`](../src/domain/movie.test.ts)     | Reconnaissance des volets, normalisation des titres saisis              |
| Unitaire, domaine        | [`cart.test.ts`](../src/domain/cart.test.ts)       | Lecture du panier texte : lignes vides, fins de ligne, doublons         |
| Acceptation et propriété | [`pricing.test.ts`](../src/domain/pricing.test.ts) | Les 5 exemples de l'énoncé, cas limites, 2 000 paniers aléatoires       |
| Unitaire, serveur        | [`config.test.ts`](../src/server/config.test.ts)   | Lecture et validation des variables d'environnement                     |
| Intégration, API         | [`app.test.ts`](../src/server/app.test.ts)         | Contrat de `POST /api/quotes`, validation, sécurité, rate limiting      |
| Bout en bout, CLI        | [`cli.test.ts`](../src/cli.test.ts)                | La CLI, lancée dans un vrai processus, sur chaque fichier d'`examples/` |
| Intégration, interface   | [`public.test.ts`](../src/public.test.ts)          | L'interface web branchée sur la vraie API : rendu, erreurs, XSS, mobile |

### Les règles de l'énoncé, sans résultat figé

Le calcul ne contient aucun résultat prédéfini, et les tests évitent eux aussi
les valeurs magiques :

- **Exemples de l'énoncé** : le résultat attendu est écrit sous la forme du
  calcul détaillé par l'énoncé, par exemple `15 * 3 * 0.8 + 20` pour l'exemple 5.
- **Tests par propriété** : fast-check génère 2 000 paniers aléatoires (volets,
  doublons, autres films, ordre quelconque). Pour chacun, le prix calculé est
  comparé à un **oracle** : une transcription naïve et indépendante de la règle
  de l'énoncé, écrite dans le test sans réutiliser le code testé. En cas
  d'échec, fast-check réduit automatiquement le panier au plus petit
  contre-exemple.
- **Invariants** : le prix ne dépend pas de l'ordre de saisie.

### Vérifier que les tests détectent vraiment les erreurs

Une couverture de 100 % ne prouve pas qu'un test échoue quand le code est faux.
Les tests ont donc été contrôlés en introduisant volontairement des erreurs :

- remise accordée à partir de 3 volets au lieu de 2 : les exemples, l'oracle et
  les cas limites échouent ;
- `innerHTML` au lieu de `textContent` dans l'interface : le test XSS échoue.

Refaire ce contrôle après toute modification importante d'un test.

## Couverture

La couverture porte sur `src/` et `public/` (hors fichiers de test). Le seuil est
**bloquant à 95 %** pour les lignes, branches, fonctions et instructions ; elle
est actuellement de 100 %.

Les points d'entrée `src/cli.ts` et `src/server/main.ts` sont exclus de la
mesure : ils s'exécutent dans un processus séparé, invisible pour l'outil de
couverture. La CLI est néanmoins testée de bout en bout.

## Écrire un test

- **Emplacement** : à côté du fichier testé (`foo.ts` → `foo.test.ts`).
- **Nom** : le comportement attendu, en français (`'n’applique aucune remise pour
plusieurs exemplaires d’un même volet'`).
- **Structure** : préparer, agir, vérifier, séparés par une ligne vide.
- **Cas multiples** : `it.each` plutôt que du copier-coller.
- **Règle métier ou bug** : toujours accompagné d'un test, écrit de préférence
  avant le correctif pour le voir échouer.
- **Pas de réseau ni de port** : `fastify.inject()` pour l'API, `fetch` redirigé
  vers `inject()` pour l'interface.
