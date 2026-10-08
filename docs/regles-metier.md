# Règles métier et hypothèses

Ce document consigne la lecture de l'énoncé, les points d'attention qu'il
contient et les hypothèses retenues là où il est muet. Toute hypothèse est
couverte par un test : la changer revient à modifier un test, puis le code.

## Règles de l'énoncé

1. Un DVD d'un volet de la saga « Back to the Future » coûte **15 €**.
2. Avec **2 volets différents** de la saga dans le panier : **−10 %** sur
   l'ensemble des DVD « Back to the Future » achetés.
3. Avec **3 volets différents** : **−20 %** sur l'ensemble de ces DVD.
4. Tout autre film coûte **20 €**.

Ces valeurs sont centralisées dans
[`pricing.ts`](../src/domain/pricing.ts) (`BTTF_PROMOTION_POLICY`).

## Vérification des exemples

Les cinq exemples ont été recalculés à la main : ils sont **cohérents entre eux
et avec les règles**. Ils constituent les tests d'acceptation du projet.

| N°  | Panier                   | Calcul              | Attendu |
| --- | ------------------------ | ------------------- | ------- |
| 1   | BTTF 1, 2, 3             | (15 × 3) × 0,8      | 36      |
| 2   | BTTF 1, 3                | (15 × 2) × 0,9      | 27      |
| 3   | BTTF 1                   | 15                  | 15      |
| 4   | BTTF 1, 2, 3, 2          | (15 × 4) × 0,8      | 48      |
| 5   | BTTF 1, 2, 3 + La chèvre | (15 × 3) × 0,8 + 20 | 56      |

## Points d'attention de l'énoncé

Ces points sont faciles à mal interpréter ; chacun fait l'objet d'un test.

- **« Volets différents »** : c'est le nombre de volets _distincts_ qui
  détermine le palier, pas le nombre de DVD. Deux exemplaires du volet 2 coûtent
  donc 30 €, sans remise.
- **La remise porte sur _tous_ les DVD de la saga, doublons compris**
  (exemple 4 : le second « Back to the Future 2 » est lui aussi remisé à 20 %).
  Une lecture « remise uniquement sur un lot de volets différents » donnerait 51 €
  au lieu de 48 €.
- **La remise ne s'applique jamais aux autres films** (exemple 5).
- **Les paliers ne se cumulent pas** : avec 3 volets différents on applique 20 %,
  pas 10 % + 20 %.
- **Lignes vides** : dans l'énoncé, les titres sont séparés par des lignes vides.
  Elles sont ignorées, de même que les lignes ne contenant que des espaces.
- **Prix non entiers** : les exemples tombent tous sur des euros ronds, mais ce
  n'est pas général. BTTF 1 + BTTF 1 + BTTF 3 = (15 × 3) × 0,9 = **40,5 €**. La CLI
  affiche alors `40.5`, l'interface web `40,50 €`.
- **Arithmétique** : tous les calculs se font en centimes entiers (voir
  [ADR 0002](adr/0002-montants-en-centimes.md)) afin qu'aucune erreur d'arrondi
  des nombres flottants ne puisse apparaître, y compris si les prix évoluent
  (ex. 14,99 €).
- **Clin d'œil temporel** : en 2000, l'euro n'existait que sous forme scripturale
  (pièces et billets en 2002) ; l'énoncé fixant les prix en euros, on s'y conforme.

## Hypothèses retenues (énoncé muet)

| Situation                                              | Comportement retenu                                  |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Casse ou espaces différents (`back to the  FUTURE 2`)  | Reconnu comme le volet 2                             |
| Caractères Unicode composés / décomposés (`è`)         | Normalisés (NFC) : même titre                        |
| Espaces insécables, tabulations, fins de ligne Windows | Normalisés                                           |
| `Back to the Future` sans numéro                       | Autre film (20 €) : on ne peut pas savoir quel volet |
| `Back to the Future 4` (volet inexistant)              | Autre film (20 €)                                    |
| Numéros romains (`Back to the Future II`)              | Autre film (20 €) : format non prévu par l'énoncé    |
| Panier vide                                            | 0 €                                                  |
| Arrondi d'une remise                                   | Au centime le plus proche (jamais atteint avec 15 €) |

Ces hypothèses seraient à valider avec le client ; elles sont isolées dans
[`movie.ts`](../src/domain/movie.ts) pour pouvoir évoluer facilement (par exemple
accepter les numéros romains ou signaler les titres ambigus).
