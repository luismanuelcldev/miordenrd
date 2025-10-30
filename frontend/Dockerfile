# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos de build para variables de entorno
ARG VITE_API_URL
ARG VITE_PAYPAL_CLIENT_ID

# Configurar npm para mejor estabilidad de red
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias con reintentos
RUN npm ci || npm ci || npm install

# Copiar código fuente
COPY . .

# Configurar variables de entorno para el build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID

# Construir aplicación
RUN npm run build

# Etapa de producción
FROM nginx:alpine AS production

# Copiar archivos construidos
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]