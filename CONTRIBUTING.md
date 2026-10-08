# Contribuer

## Mise en place

```bash
nvm use     # Node.js de référence (.nvmrc)
npm ci
npm run dev
```

## Avant chaque push

```bash
npm run verify   # format, lint, typage, tests + couverture : identique à la CI
```

## Conventions

### Code

- Identifiants en anglais, commentaires et documentation en français.
- Le **domaine** (`src/domain`) reste pur : aucune dépendance à Fastify, Node ou
  aux entrées/sorties. Toute règle métier y vit, et nulle part ailleurs.
- Les montants sont des `Cents` (voir [ADR 0002](docs/adr/0002-montants-en-centimes.md)).
- Les commentaires expliquent le **pourquoi** (règle métier, choix de sécurité),
  pas ce que le code dit déjà.
- Le formatage est l'affaire de Prettier, pas de la revue de code.

### Tests

- Toute règle métier ou correction de bug s'accompagne d'un test.
- Les tests, unitaires comme d'intégration, sont à côté du fichier testé
  (`foo.ts` → `foo.test.ts`).
- Les noms de tests décrivent le comportement attendu, en français.
- La couverture ne doit pas descendre sous 95 % (bloquant en CI).

### Commits et branches

- Une branche par sujet, fusionnée par _pull request_ après revue et CI verte.
- Messages au format [Conventional Commits](https://www.conventionalcommits.org/fr/) :
  `feat(domain): …`, `fix(api): …`, `docs: …`, `test: …`, `chore: …`.
- Des commits petits et cohérents : un commit = une intention.

### Décisions

Tout choix structurant (dépendance majeure, changement d'architecture, de
contrat d'API) est documenté par une ADR dans [`docs/adr`](docs/adr) : contexte,
décision, conséquences. Une ADR n'est jamais réécrite : si la décision change,
une nouvelle ADR la remplace et l'ancienne passe au statut « Remplacée ».
