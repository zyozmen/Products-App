# --- Etapa 1: Build de Node.js (Actualizado a Node 20) ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Si deseas mayor tolerancia a pequeñas inconsistencias en la instalación,
# puedes usar 'npm ci || npm install' en lugar de fallar de inmediato.
RUN npm install

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# --- Etapa 2: Servidor Web Nginx ---
FROM nginx:alpine

RUN echo 'server { \
    listen 4200; \
    location /api/ { \
        proxy_pass http://3.14.127.28:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        add_header Access-Control-Allow-Origin *; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]