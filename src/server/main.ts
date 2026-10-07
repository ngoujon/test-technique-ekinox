/**
 * Point d'entrée du serveur web : charge la configuration, démarre l'écoute
 * et s'arrête proprement à la réception d'un signal (ex. `docker stop`).
 */
import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildApp(config);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info(`Signal ${signal} reçu, arrêt du serveur`);
    // Termine les requêtes en cours avant de quitter.
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        app.log.error(error);
        process.exit(1);
      },
    );
  });
}

await app.listen({ host: config.host, port: config.port });
