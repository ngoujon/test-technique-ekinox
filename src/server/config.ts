/**
 * Configuration du serveur, lue depuis les variables d'environnement
 * (principe « 12-factor » : aucune valeur propre à un environnement dans le code).
 * Une configuration invalide fait échouer le démarrage immédiatement plutôt qu'à l'usage.
 */

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

const LOG_LEVELS: readonly LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
];

export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly logLevel: LogLevel;
  /** Nombre maximal de requêtes par adresse IP et par minute. */
  readonly rateLimitPerMinute: number;
}

function parseInteger(name: string, value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(
      `${name} doit être un entier compris entre ${String(min)} et ${String(max)} (reçu : « ${value} »)`,
    );
  }
  return parsed;
}

function parseLogLevel(value: string): LogLevel {
  const level = LOG_LEVELS.find((candidate) => candidate === value);
  if (level === undefined) {
    throw new Error(
      `LOG_LEVEL doit valoir l'un de : ${LOG_LEVELS.join(', ')} (reçu : « ${value} »)`,
    );
  }
  return level;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    // Par défaut, le serveur n'écoute qu'en local : l'exposition réseau doit être un choix explicite.
    host: env.HOST ?? '127.0.0.1',
    port: parseInteger('PORT', env.PORT ?? '3000', 0, 65_535),
    logLevel: parseLogLevel(env.LOG_LEVEL ?? 'info'),
    rateLimitPerMinute: parseInteger(
      'RATE_LIMIT_PER_MINUTE',
      env.RATE_LIMIT_PER_MINUTE ?? '100',
      1,
      100_000,
    ),
  };
}
