# 0003 — Interface web sans framework ni build

- Statut : Acceptée
- Date : 2026-10-07

## Contexte

L'interface demandée est minimaliste : une zone de saisie, un bouton et
l'affichage du résultat. Le calcul est réalisé par le serveur.

## Décision

L'interface est écrite en **HTML, CSS et JavaScript natifs** (module ES), servie
statiquement par le serveur. Le JavaScript est typé via JSDoc (`// @ts-check`)
et analysé par ESLint.

## Conséquences

- Aucune chaîne de build front ni dépendance supplémentaire à maintenir.
- Le chargement est immédiat et compatible avec une CSP stricte (pas de script inline).
- Si l'interface s'enrichit (panier interactif, catalogue…), l'adoption d'un
  framework (ex. React, Vue) et de tests de bout en bout fera l'objet d'une
  nouvelle ADR.
