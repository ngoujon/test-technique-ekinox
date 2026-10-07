import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('fournit des valeurs par défaut sûres', () => {
    expect(loadConfig({})).toEqual({
      host: '127.0.0.1',
      port: 3000,
      logLevel: 'info',
      rateLimitPerMinute: 100,
    });
  });

  it('lit les variables d’environnement', () => {
    expect(
      loadConfig({ HOST: '0.0.0.0', PORT: '8080', LOG_LEVEL: 'warn', RATE_LIMIT_PER_MINUTE: '5' }),
    ).toEqual({ host: '0.0.0.0', port: 8080, logLevel: 'warn', rateLimitPerMinute: 5 });
  });

  it.each(['abc', '-1', '70000', '80.5'])('refuse le port « %s »', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(/PORT/);
  });

  it('refuse un niveau de log inconnu', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('refuse une limite de requêtes nulle', () => {
    expect(() => loadConfig({ RATE_LIMIT_PER_MINUTE: '0' })).toThrow(/RATE_LIMIT_PER_MINUTE/);
  });
});
