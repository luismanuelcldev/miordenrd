# Elijo una etapa de construcción separada para compilar la app con dependencias de desarrollo.
FROM node:20-alpine AS builder

WORKDIR /app

# Prefiero ajustar npm para dar resiliencia ante fallos intermitentes de red durante la instalación.
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

# Copio manifiestos y esquema Prisma para aprovechar cache de dependencias.
COPY package*.json ./
COPY prisma ./prisma/

# Instalo todas las dependencias (incluyendo dev) para poder compilar en esta etapa.
# Si falla por red, intento nuevamente para evitar builds frágiles.
RUN npm ci || npm ci || npm install

# Llevo el código fuente al contexto de construcción.
COPY . .

# Genero el cliente de Prisma para que el runtime tenga el cliente tipado listo.
RUN npx prisma generate

# Compilo la aplicación NestJS hacia la carpeta de salida definida (build).
RUN npm run build

# Paso a una imagen de producción mínima para ejecutar la app con dependencias necesarias.
FROM node:20-alpine AS production

WORKDIR /app

# Replico la configuración de red de npm para instalaciones más estables en producción.
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

# Instalo únicamente las dependencias de producción para reducir el tamaño de la imagen final.
COPY package*.json ./
RUN npm ci --only=production || npm ci --only=production || npm install --only=production

# Copio artefactos compilados y binarios de Prisma desde la etapa de builder.
COPY --from=builder /app/build ./build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/generated ./generated

# Creo un usuario no-root para ejecutar la app con menos privilegios.
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Ajusto permisos de trabajo a dicho usuario.
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expongo el puerto HTTP de la API.
EXPOSE 3000

# Inicio la aplicación apuntando al bundle generado en build/main.js
CMD ["node", "build/main.js"]