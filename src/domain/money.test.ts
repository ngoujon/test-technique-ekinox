import { describe, expect, it } from 'vitest';
import {
  addCents,
  cents,
  euros,
  multiplyCents,
  percentOf,
  subtractCents,
  toEuros,
} from './money.js';

describe('money', () => {
  it('convertit des euros entiers en centimes', () => {
    expect(euros(15)).toBe(1500);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('refuse le montant %s', (value) => {
    expect(() => cents(value)).toThrow(RangeError);
  });

  it('additionne, multiplie et soustrait des montants', () => {
    expect(addCents(euros(15), euros(20))).toBe(3500);
    expect(addCents()).toBe(0);
    expect(multiplyCents(euros(15), 3)).toBe(4500);
    expect(subtractCents(euros(45), euros(9))).toBe(3600);
  });

  it('calcule une remise en pourcentage sans erreur de flottant', () => {
    expect(percentOf(euros(45), 20)).toBe(900);
    expect(percentOf(euros(45), 10)).toBe(450);
  });

  it('arrondit la remise au centime le plus proche', () => {
    expect(percentOf(cents(5), 10)).toBe(1);
    expect(percentOf(cents(4), 10)).toBe(0);
  });

  it.each([-1, 101])('refuse le pourcentage %s', (percent) => {
    expect(() => percentOf(euros(10), percent)).toThrow(RangeError);
  });

  it('convertit des centimes en euros pour l’affichage', () => {
    expect(toEuros(cents(5600))).toBe(56);
    expect(toEuros(cents(4050))).toBe(40.5);
  });
});
