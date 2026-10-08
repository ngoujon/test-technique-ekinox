import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toEuros } from './domain/money.js';
import { quoteCart } from './domain/pricing.js';

/** Exécute la CLI comme le ferait un utilisateur, avec le panier sur l'entrée standard. */
function runCli(cart: string): string {
  return execFileSync(process.execPath, ['--import', 'tsx', 'src/cli.ts'], {
    input: cart,
    encoding: 'utf8',
  });
}

/**
 * La CLI n'est qu'un adaptateur : on vérifie qu'elle lit le fichier tel quel et affiche
 * le prix calculé par le domaine (dont les règles sont testées dans `pricing.test.ts`),
 * pour chaque fichier présent dans `examples/`.
 */
describe('CLI', () => {
  it.each(readdirSync('examples'))('affiche le prix du panier %s', (exampleFile) => {
    const cart = readFileSync(`examples/${exampleFile}`, 'utf8');

    expect(runCli(cart)).toBe(`${String(toEuros(quoteCart(cart).quote.total))}\n`);
  });

  it('affiche les prix non entiers avec un point décimal', () => {
    const cart = 'Back to the Future 1\nBack to the Future 1\nBack to the Future 3';
    expect(runCli(cart)).toBe(`${String(15 * 3 * 0.9)}\n`); // 40.5
  });
});
