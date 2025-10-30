#!/bin/bash

# Script para monitorear el progreso del build de Docker

echo "🔍 Monitoreando build de Docker..."
echo ""

while true; do
    clear
    echo "════════════════════════════════════════════════════════════"
    echo "       🐳 MONITOR DE BUILD DE DOCKER - Sistema Pedidos"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    # Estado de contenedores
    echo "📦 ESTADO DE CONTENEDORES:"
    docker-compose ps
    echo ""
    
    # Imágenes Docker
    echo "🖼️  IMÁGENES DOCKER:"
    docker images | grep -E "sistemapedidos|node|postgres|redis" | head -n 5
    echo ""
    
    # Uso de recursos
    echo "💾 USO DE RECURSOS:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -n 5
    echo ""
    
    # Logs recientes del backend (últimas 5 líneas)
    echo "📋 ÚLTIMOS LOGS DEL BACKEND:"
    docker logs pedidos-backend --tail 5 2>/dev/null || echo "Backend aún no iniciado"
    echo ""
    
    echo "════════════════════════════════════════════════════════════"
    echo "Actualizado: $(date '+%H:%M:%S')"
    echo "Presiona Ctrl+C para salir"
    echo ""
    
    sleep 5
done
