# 0002 — Montants manipulés en centimes entiers

- Statut : Acceptée
- Date : 2026-10-07

## Contexte

Les nombres flottants ne représentent pas exactement la plupart des décimaux
(`0.1 + 0.2 !== 0.3` en JavaScript). Avec des remises en pourcentage, un calcul
en euros flottants peut produire des montants comme `40.49999999999999`.

## Décision

- Tous les montants du domaine sont des **entiers en centimes**, matérialisés par
  le type marqué `Cents`.
- Seul le montant d'une remise est arrondi, au centime le plus proche ; le total
  est obtenu par soustraction, donc toujours cohérent avec le détail affiché.
- L'API expose des centimes ; la conversion en euros n'a lieu qu'à l'affichage
  (CLI, interface web).

## Conséquences

- Aucune erreur d'arrondi, même si les prix deviennent non ronds (14,99 €).
- Le type `Cents` empêche de mélanger par erreur un montant et une quantité.
- Les consommateurs de l'API doivent diviser par 100 pour afficher des euros ;
  c'est documenté et le nom des champs (`…Cents`) le rappelle.
