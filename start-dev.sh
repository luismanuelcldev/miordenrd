#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   INICIO RÁPIDO - Modo Desarrollo                      ║"
echo "╔════════════════════════════════════════════════════════════╗"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Detener contenedores anteriores
echo -e "${BLUE} Deteniendo contenedores anteriores...${NC}"
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
echo ""

# 2. Levantar servicios (backend, DB, Redis)
echo -e "${BLUE} Levantando Backend, PostgreSQL y Redis...${NC}"
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo -e "${YELLOW} Esperando a que los servicios estén listos (30 segundos)...${NC}"
sleep 30

# 3. Verificar estado
echo ""
echo -e "${BLUE} Estado de los servicios:${NC}"
docker-compose -f docker-compose.dev.yml ps

# 4. Probar backend
echo ""
echo -e "${BLUE} Probando backend...${NC}"
if curl -f http://localhost:3000/health &> /dev/null; then
    echo -e "${GREEN} Backend está corriendo en http://localhost:3000${NC}"
else
    echo -e "${RED} Backend no responde${NC}"
    echo -e "${YELLOW}Ver logs con: docker logs pedidos-backend${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   BACKEND LISTO                                        ║"
echo "╔════════════════════════════════════════════════════════════╗"
echo ""
echo -e "${GREEN} Servicios corriendo:${NC}"
echo "   • Backend:     http://localhost:3000"
echo "   • PostgreSQL:  localhost:5432"
echo "   • Redis:       localhost:6379"
echo ""
echo -e "${YELLOW} Para iniciar el FRONTEND:${NC}"
echo ""
echo "   cd frontend"
echo "   npm install          # Solo la primera vez"
echo "   npm run dev"
echo ""
echo "   Frontend estará en: http://localhost:5173"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "   • Ver logs:           docker logs -f pedidos-backend"
echo "   • Detener servicios:  docker-compose -f docker-compose.dev.yml down"
echo "   • Reiniciar backend:  docker-compose -f docker-compose.dev.yml restart backend"
echo ""
echo -e "${GREEN} ¡Listo para desarrollar!${NC}"
echo ""
