# 0001 — TypeScript sur Node.js avec Fastify

- Statut : Acceptée
- Date : 2026-10-07

## Contexte

L'application doit s'exécuter sur Node, une JVM ou Python. Elle comporte une
interface web et une logique métier de tarification qui doit être fiable et
facile à faire évoluer par l'équipe.

## Décision

- **TypeScript en mode strict** sur **Node.js ≥ 22** (LTS).
- **Fastify** comme serveur HTTP.

## Conséquences

- Un seul langage pour le serveur et le navigateur : l'équipe n'a qu'un
  écosystème à maîtriser.
- Le typage strict (unions discriminées, types marqués) rend les états invalides
  difficiles à représenter et sécurise les refactorings.
- Fastify apporte nativement la validation et la sérialisation par schéma JSON,
  l'injection de requêtes pour les tests (`inject()`) et des plugins de sécurité
  maintenus par l'équipe Fastify (helmet, rate-limit).
- Une étape de compilation est nécessaire pour la production (`npm run build`) ;
  en développement, `tsx` exécute directement les sources.
