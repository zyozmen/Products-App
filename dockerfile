# --- Etapa 1: Build de Node.js ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine

# Copiar configuración personalizada de Nginx para escuchar en 4200
RUN echo 'server { \
    listen 4200; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos generados
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]