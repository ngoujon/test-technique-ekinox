# API HTTP

## `POST /api/quotes`

Chiffre un panier saisi en texte.

### Requête

```http
POST /api/quotes
Content-Type: application/json

{ "cart": "Back to the Future 1\nBack to the Future 3" }
```

| Champ  | Type   | Contraintes                                                |
| ------ | ------ | ---------------------------------------------------------- |
| `cart` | string | Obligatoire, 10 000 caractères maximum, un titre par ligne |

Aucun autre champ n'est accepté et aucune conversion de type n'est faite.

### Réponse `200`

| Champ                    | Type    | Description                                   |
| ------------------------ | ------- | --------------------------------------------- |
| `movies[]`               | array   | Films reconnus, dans l'ordre de saisie        |
| `movies[].title`         | string  | Titre normalisé                               |
| `movies[].kind`          | string  | `saga` ou `other`                             |
| `movies[].episode`       | integer | Numéro du volet (uniquement si `kind = saga`) |
| `saga.quantity`          | integer | Nombre de DVD de la saga                      |
| `saga.distinctEpisodes`  | integer | Nombre de volets différents                   |
| `saga.subtotalCents`     | integer | Prix des DVD de la saga avant remise          |
| `saga.discountPercent`   | number  | Pourcentage de remise appliqué                |
| `saga.discountCents`     | integer | Montant de la remise                          |
| `saga.totalCents`        | integer | Prix des DVD de la saga après remise          |
| `otherMovies.quantity`   | integer | Nombre d'autres films                         |
| `otherMovies.totalCents` | integer | Prix des autres films                         |
| `totalCents`             | integer | **Prix de la commande**                       |

Tous les montants sont en **centimes d'euro** : `5600` signifie 56,00 €.

### Erreurs

Toutes les erreurs ont la forme `{ "error": "<message>" }`.

| Statut | Cause                                                                          |
| ------ | ------------------------------------------------------------------------------ |
| `400`  | Corps invalide (champ manquant, mauvais type, champ inconnu, panier trop long) |
| `413`  | Corps de requête trop volumineux                                               |
| `415`  | `Content-Type` non supporté                                                    |
| `429`  | Trop de requêtes (voir `RATE_LIMIT_PER_MINUTE`)                                |
| `500`  | Erreur interne (le détail est journalisé, jamais renvoyé)                      |

## `GET /health`

Sonde de disponibilité pour l'orchestrateur ou le load balancer.
Réponse : `200 { "status": "ok" }`.
