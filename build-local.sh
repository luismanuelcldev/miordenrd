#!/bin/bash
set -e

echo "Compilando backend localmente..."

cd backend

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
fi

# Generar cliente Prisma
echo "Generando cliente Prisma..."
npx prisma generate

# Compilar
echo "Compilando TypeScript..."
npm run build

echo "Build completado! Puedes iniciar con: docker-compose up -d (sin --build)"
