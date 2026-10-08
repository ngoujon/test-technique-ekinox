import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Exécute la CLI comme le ferait un utilisateur, avec un fichier d'exemple sur l'entrée standard. */
function runCli(exampleFile: string): string {
  return execFileSync(process.execPath, ['--import', 'tsx', 'src/cli.ts'], {
    input: readFileSync(`examples/${exampleFile}`),
    encoding: 'utf8',
  });
}

describe('CLI', () => {
  it.each([
    ['exemple-1.txt', '36'],
    ['exemple-2.txt', '27'],
    ['exemple-3.txt', '15'],
    ['exemple-4.txt', '48'],
    ['exemple-5.txt', '56'],
  ])('affiche le prix de %s', (exampleFile, expected) => {
    expect(runCli(exampleFile)).toBe(`${expected}\n`);
  });
});
