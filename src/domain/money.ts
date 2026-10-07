/**
 * Représentation monétaire du domaine.
 *
 * Tous les montants sont manipulés en **centimes entiers** : les calculs en
 * nombres flottants (ex. `0.1 + 0.2`) introduisent des erreurs d'arrondi
 * inacceptables pour un prix. La conversion en euros n'a lieu qu'à l'affichage.
 */

/** Montant en centimes d'euro (entier). Le « brand » empêche de passer un nombre quelconque par erreur. */
export type Cents = number & { readonly __brand: 'Cents' };

/** Crée un montant en centimes, en refusant toute valeur non entière ou négative. */
export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`Montant invalide : ${String(value)} (entier positif attendu)`);
  }
  return value as Cents;
}

/** Raccourci lisible pour déclarer un prix en euros entiers (ex. `euros(15)`). */
export function euros(value: number): Cents {
  return cents(value * 100);
}

export function addCents(...amounts: readonly Cents[]): Cents {
  return cents(amounts.reduce((sum, amount) => sum + amount, 0));
}

export function multiplyCents(amount: Cents, quantity: number): Cents {
  return cents(amount * quantity);
}

/**
 * Calcule le montant d'une remise en pourcentage, arrondi au centime le plus proche.
 * Seule la remise est arrondie : le total reste ainsi cohérent (`prix - remise`).
 */
export function percentOf(amount: Cents, percent: number): Cents {
  if (percent < 0 || percent > 100) {
    throw new RangeError(`Pourcentage invalide : ${String(percent)}`);
  }
  return cents(Math.round((amount * percent) / 100));
}

export function subtractCents(amount: Cents, deduction: Cents): Cents {
  return cents(amount - deduction);
}

/**
 * Convertit des centimes en euros pour l'affichage machine (ex. `5600` → `56`, `4050` → `40.5`).
 * Le format reproduit celui des exemples de l'énoncé.
 */
export function toEuros(amount: Cents): number {
  return amount / 100;
}
