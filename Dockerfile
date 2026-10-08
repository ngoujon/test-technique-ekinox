# syntax=docker/dockerfile:1

# --- Étape 1 : compilation TypeScript -------------------------------------
# Image de base épinglée par empreinte (reproductible, non altérable), mise à jour par Dependabot.
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts : aucun script d'installation de dépendance n'est exécuté (chaîne d'approvisionnement).
RUN npm ci --ignore-scripts
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# --- Étape 2 : image d'exécution minimale ---------------------------------
# Seuls le code compilé, les fichiers statiques et les dépendances de production sont embarqués.
FROM node:24-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY public ./public

# Ne jamais exécuter l'application en root.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/server/main.js"]
