# ---- Etapa de build ----
FROM node:20-alpine AS build
WORKDIR /app

# Cachea las dependencias en su propia capa: solo se re-instalan si package*.json cambia.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build -- --configuration production

# ---- Etapa de runtime ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist/diabecare-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
