#!/bin/bash

# Script de configuración e instalación del Sistema de Pedidos
# Autor: Sistema de Pedidos Team
# Versión: 1.0.0

set -e

echo "Configurando Sistema de Pedidos Online..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar prerrequisitos
check_prerequisites() {
    print_message "Verificando prerrequisitos..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    # Verificar Node.js (opcional para desarrollo local)
    if ! command -v node &> /dev/null; then
        print_warning "Node.js no está instalado. Solo podrás usar Docker."
    fi
    
    print_success "Prerrequisitos verificados correctamente."
}

# Crear archivo .env si no existe
setup_environment() {
    print_message "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        print_message "Creando archivo .env desde .env.example..."
        cp .env.example .env
        print_warning "Archivo .env creado. Por favor edita las variables según tu configuración."
    else
        print_message "Archivo .env ya existe."
    fi
}

# Instalar dependencias del backend
install_backend_deps() {
    print_message "Instalando dependencias del backend..."
    
    cd backend
    
    if [ -f package.json ]; then
        npm install
        print_success "Dependencias del backend instaladas."
    else
        print_warning "No se encontró package.json en el backend."
    fi
    
    cd ..
}

# Instalar dependencias del frontend
install_frontend_deps() {
    print_message "Instalando dependencias del frontend..."
    
    cd frontend
    
    if [ -f package.json ]; then
        npm install
        print_success "Dependencias del frontend instaladas."
    else
        print_warning "No se encontró package.json en el frontend."
    fi
    
    cd ..
}

# Generar cliente Prisma
setup_prisma() {
    print_message "Configurando Prisma..."
    
    cd backend
    
    if [ -f prisma/schema.prisma ]; then
        npx prisma generate
        print_success "Cliente Prisma generado."
    else
        print_warning "No se encontró schema.prisma."
    fi
    
    cd ..
}

# Construir imágenes Docker
build_docker_images() {
    print_message "Construyendo imágenes Docker..."
    
    docker-compose build
    print_success "Imágenes Docker construidas."
}

# Levantar servicios
start_services() {
    print_message "Levantando servicios..."
    
    docker-compose up -d
    print_success "Servicios levantados."
}

# Esperar a que los servicios estén listos
wait_for_services() {
    print_message "Esperando a que los servicios estén listos..."
    
    # Esperar a que la base de datos esté lista
    print_message "Esperando a que PostgreSQL esté listo..."
    timeout 60 bash -c 'until docker-compose exec -T db pg_isready -U postgres; do sleep 2; done'
    
    # Esperar a que el backend esté listo
    print_message "Esperando a que el backend esté listo..."
    timeout 60 bash -c 'until curl -f http://localhost:3000/api/v1/health > /dev/null 2>&1; do sleep 2; done'
    
    # Esperar a que el frontend esté listo
    print_message "Esperando a que el frontend esté listo..."
    timeout 60 bash -c 'until curl -f http://localhost:5173 > /dev/null 2>&1; do sleep 2; done'
    
    print_success "Todos los servicios están listos."
}

# Ejecutar migraciones
run_migrations() {
    print_message "Ejecutando migraciones de la base de datos..."
    
    docker-compose exec backend npx prisma migrate deploy
    print_success "Migraciones ejecutadas."

    print_message "Insertando datos iniciales..."
    docker-compose exec backend npm run db:seed
    print_success "Datos iniciales cargados."
}

# Mostrar información de acceso
show_access_info() {
    print_success "¡Sistema de Pedidos configurado exitosamente!"
    echo ""
    echo "URLs de acceso:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:3000/api/v1"
    echo "   Documentación API: http://localhost:3000/api/docs"
    echo "   Health Check: http://localhost:3000/api/v1/health"
    echo ""
    echo "Base de datos:"
    echo "   Host: localhost"
    echo "   Puerto: 5432"
    echo "   Base de datos: sistemapedidos_db"
    echo "   Usuario: postgres"
    echo "   Contraseña: admin123"
    echo ""
    echo "🔧 Comandos útiles:"
    echo "   Ver logs: docker-compose logs -f"
    echo "   Parar servicios: docker-compose down"
    echo "   Reiniciar: docker-compose restart"
    echo "   Prisma Studio: docker-compose exec backend npx prisma studio"
    echo ""
    echo "Próximos pasos:"
    echo "   1. Configura las variables de entorno en .env"
    echo "   2. Configura PayPal si quieres usar pagos"
    echo "   3. Configura SMTP si quieres usar notificaciones por email"
    echo "   4. Accede a la aplicación y crea un usuario administrador"
}

# Función principal
main() {
    echo "=========================================="
    echo "   Sistema de Pedidos Online - Setup"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    setup_environment
    install_backend_deps
    install_frontend_deps
    setup_prisma
    build_docker_images
    start_services
    wait_for_services
    run_migrations
    show_access_info
    
    echo ""
    print_success "¡Configuración completada!"
}

# Ejecutar función principal
main "$@"
