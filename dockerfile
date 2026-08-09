# --- Etapa 1: Build de Node.js (Node 20) ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

# Argumentos de compilación para Vite
ARG VITE_APP_API_URL=/api
ARG VITE_APP_PRODUCTS_API_URL=/api/productos

ENV VITE_APP_API_URL=$VITE_APP_API_URL
ENV VITE_APP_PRODUCTS_API_URL=$VITE_APP_PRODUCTS_API_URL

RUN npm run build

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine

# Variables de entorno dinámicas para la plantilla de Nginx
ARG BACKEND_HOST=backend-service
ARG BACKEND_PORT=8080
ARG CORS_ALLOWED_ORIGIN=*

ENV BACKEND_HOST=$BACKEND_HOST
ENV BACKEND_PORT=$BACKEND_PORT
ENV CORS_ALLOWED_ORIGIN=$CORS_ALLOWED_ORIGIN

# Plantilla para la sustitución de variables de entorno (envsubst)
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# CORRECCIÓN CLAVE: Copiar desde /app/build (no /app/dist)
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer el puerto estándar de Nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]