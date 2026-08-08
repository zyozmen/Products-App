# --- Etapa 1: Build de Node.js (Actualizado a Node 20) ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG VITE_APP_API_URL=/api
ENV VITE_APP_API_URL=$VITE_APP_API_URL

ARG VITE_APP_PRODUCTS_API_URL=/api/productos
ENV VITE_APP_PRODUCTS_API_URL=$VITE_APP_PRODUCTS_API_URL

RUN npm run build

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine

ARG BACKEND_HOST=backend-service
ARG BACKEND_PORT=8080
ARG CORS_ALLOWED_ORIGIN=https://example.cloudfront.net

ENV BACKEND_HOST=$BACKEND_HOST
ENV BACKEND_PORT=$BACKEND_PORT
ENV CORS_ALLOWED_ORIGIN=$CORS_ALLOWED_ORIGIN

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]