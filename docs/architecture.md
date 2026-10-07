# Architecture

## Vue d'ensemble

```text
            ┌──────────────┐        ┌──────────────┐
 Navigateur │  public/     │  HTTP  │ src/server/  │
 ──────────▶│ (HTML/CSS/JS)│───────▶│  (Fastify)   │──┐
            └──────────────┘        └──────────────┘  │
                                                      ▼
            ┌──────────────┐                 ┌──────────────────┐     ┌──────────────┐
 Terminal   │  src/cli/    │────────────────▶│ src/application/ │────▶│ src/domain/  │
 ──────────▶│              │                 │   quoteCart()    │     │ règles métier│
            └──────────────┘                 └──────────────────┘     └──────────────┘
```

Le projet suit une architecture en couches, avec des dépendances dirigées vers
le métier :

| Couche            | Rôle                                                         | Dépend de               |
| ----------------- | ------------------------------------------------------------ | ----------------------- |
| `domain/`         | Règles métier pures : lecture du panier, calcul du prix      | rien                    |
| `application/`    | Cas d'usage `quoteCart` : orchestre le domaine               | `domain`                |
| `server/`, `cli/` | Adaptateurs : traduisent HTTP / terminal vers le cas d'usage | `application`, `domain` |
| `public/`         | Interface web statique, consomme l'API                       | API HTTP                |

Conséquences :

- le domaine est testable unitairement, sans serveur ni mock ;
- ajouter un canal (ex. une file de messages, une autre UI) ne touche pas au métier ;
- changer de framework HTTP ne touche que `server/`.

## Flux d'une requête

1. L'interface envoie `POST /api/quotes` avec `{ "cart": "<texte>" }`.
2. Fastify applique les protections (taille de requête, rate limiting) et valide
   le corps contre un schéma JSON strict.
3. `quoteCart` lit le panier (`parseCart` → liste de `Movie`) puis le chiffre
   (`priceCart` → `Quote`).
4. La route convertit le `Quote` en contrat d'API (montants en centimes) ;
   Fastify sérialise la réponse selon son schéma, ce qui empêche toute fuite de
   champ non prévu.

## Modèle du domaine

- `Movie` : union discriminée `{ kind: 'saga', episode }` | `{ kind: 'other' }`.
  Le compilateur impose de traiter les deux cas.
- `Cents` : nombre entier « marqué » (_branded type_) ; on ne peut pas passer un
  nombre quelconque là où un montant est attendu.
- `PricingPolicy` : prix unitaires et paliers de remise sous forme de données.
  Le calcul retient le palier le plus avantageux atteint, quel que soit l'ordre
  de déclaration.
- `Quote` : résultat détaillé (sous-total, remise, total par catégorie), pour
  que le client comprenne son prix.

## Choix techniques

| Sujet        | Choix                                | Raison principale                                                                                          |
| ------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Langage      | TypeScript (strict) sur Node         | Typage fort, même langage côté serveur et navigateur — [ADR 0001](adr/0001-typescript-node-fastify.md)     |
| Serveur HTTP | Fastify                              | Validation et sérialisation par schéma, `inject()` pour les tests, écosystème sécurité officiel            |
| Front        | HTML/CSS/JS natif, sans build        | Besoin minimaliste : aucun framework ne se justifie — [ADR 0003](adr/0003-interface-web-sans-framework.md) |
| Tests        | Vitest                               | Rapide, compatible ESM/TypeScript sans configuration                                                       |
| Qualité      | ESLint (strictTypeChecked), Prettier | Conventions vérifiées automatiquement, pas en revue                                                        |
| Montants     | Centimes entiers                     | Pas d'erreur d'arrondi — [ADR 0002](adr/0002-montants-en-centimes.md)                                      |
| Déploiement  | Image Docker multi-étapes            | Exécution reproductible, image minimale, utilisateur non root                                              |

## Évolutions envisageables

- Catalogue de films et prix en base de données plutôt qu'en configuration.
- Signalement des titres ambigus (« Back to the Future » sans numéro) à l'utilisateur.
- Spécification OpenAPI générée à partir des schémas Fastify (`@fastify/swagger`).
- Tests de bout en bout de l'interface (Playwright) si elle s'enrichit.
