// Inicializo Prisma y utilidades para preparar datos de ejemplo de manera reproducible.
const { PrismaClient, Rol } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

// Orquesto el seeding creando usuarios base, zona de entrega, tarifas y configuración del sistema.
async function main() {
  // Genero contraseñas hash para cada rol de prueba.
  const adminPassword = await bcrypt.hash('Admin1234', 12)
  const clientPassword = await bcrypt.hash('Cliente1234', 12)
  const driverPassword = await bcrypt.hash('Repartidor1234', 12)

  // Aseguro la existencia del administrador principal del sistema.
  await prisma.usuario.upsert({
    where: { email: 'admin@sistemapedidos.com' },
    update: {
      contrasena: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: Rol.ADMINISTRADOR,
      activo: true,
    },
    create: {
      email: 'admin@sistemapedidos.com',
      contrasena: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      rol: Rol.ADMINISTRADOR,
      activo: true,
    },
  })

  // Creo o actualizo un cliente de demostración para flujos públicos.
  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@sistemapedidos.com' },
    update: {
      contrasena: clientPassword,
      nombre: 'Cliente',
      apellido: 'Demo',
      rol: Rol.CLIENTE,
      activo: true,
    },
    create: {
      email: 'cliente@sistemapedidos.com',
      contrasena: clientPassword,
      nombre: 'Cliente',
      apellido: 'Demo',
      rol: Rol.CLIENTE,
      activo: true,
    },
  })

  // Incorporo un usuario repartidor para pruebas de logística.
  await prisma.usuario.upsert({
    where: { email: 'repartidor@sistemapedidos.com' },
    update: {
      contrasena: driverPassword,
      nombre: 'Repartidor',
      apellido: 'Demo',
      rol: Rol.REPARTIDOR,
      activo: true,
    },
    create: {
      email: 'repartidor@sistemapedidos.com',
      contrasena: driverPassword,
      nombre: 'Repartidor',
      apellido: 'Demo',
      rol: Rol.REPARTIDOR,
      activo: true,
    },
  })

  // Defino el polígono de la cobertura nacional (RD) para pruebas geoespaciales.
  const zonaNacionalCoordenadas = [
    [-72.0, 19.9],
    [-71.4, 19.4],
    [-70.9, 19.0],
    [-70.2, 18.4],
    [-69.7, 18.1],
    [-69.0, 17.8],
    [-68.2, 18.2],
    [-68.3, 19.0],
    [-68.6, 19.6],
    [-69.5, 19.9],
    [-70.5, 20.1],
    [-71.5, 20.1],
    [-72.0, 19.9],
  ]

  // Creo/actualizo la zona nacional con su polígono, centroide y tarifas anidadas iniciales.
  const zonaNacional = await prisma.zonaEntrega.upsert({
    where: { nombre: 'Zona Nacional RD' },
    update: {
      descripcion: 'Cobertura completa de República Dominicana',
      color: '#1d4ed8',
      activa: true,
      poligono: {
        type: 'Polygon',
        coordinates: [zonaNacionalCoordenadas],
      },
      centroideLatitud: 18.486057,
      centroideLongitud: -69.931211,
      radioCoberturaKm: 250,
    },
    create: {
      nombre: 'Zona Nacional RD',
      descripcion: 'Cobertura completa de República Dominicana',
      color: '#1d4ed8',
      activa: true,
      poligono: {
        type: 'Polygon',
        coordinates: [zonaNacionalCoordenadas],
      },
      centroideLatitud: 18.486057,
      centroideLongitud: -69.931211,
      radioCoberturaKm: 250,
      tarifas: {
        create: [
          {
            distanciaMin: 0,
            distanciaMax: 30,
            costoBase: 4,
            costoPorKm: 0.35,
            recargo: 0,
          },
          {
            distanciaMin: 30,
            distanciaMax: 120,
            costoBase: 10,
            costoPorKm: 0.3,
            recargo: 0,
          },
          {
            distanciaMin: 120,
            distanciaMax: null,
            costoBase: 18,
            costoPorKm: 0.25,
            recargo: 0,
          },
        ],
      },
    },
  })

  // Normalizo las tarifas: elimino las previas y creo el set canónico para la zona.
  await prisma.tarifaZona.deleteMany({ where: { zonaId: zonaNacional.id } })
  await prisma.tarifaZona.createMany({
    data: [
      {
        zonaId: zonaNacional.id,
        distanciaMin: 0,
        distanciaMax: 30,
        costoBase: 4,
        costoPorKm: 0.35,
        recargo: 0,
      },
      {
        zonaId: zonaNacional.id,
        distanciaMin: 30,
        distanciaMax: 120,
        costoBase: 10,
        costoPorKm: 0.3,
        recargo: 0,
      },
      {
        zonaId: zonaNacional.id,
        distanciaMin: 120,
        distanciaMax: null,
        costoBase: 18,
        costoPorKm: 0.25,
        recargo: 0,
      },
    ],
  })

  // Vinculo una dirección validada al cliente con coordenadas dentro del polígono definido.
  await prisma.direccion.upsert({
    where: { id: 1 },
    update: {
      zonaId: zonaNacional.id,
      latitud: 18.485,
      longitud: -69.934,
      validada: true,
      referencias: 'Edificio demo, piso 4',
    },
    create: {
      calle: 'Av. Principal 123',
      ciudad: 'Ciudad',
      pais: 'País',
      codigoPostal: '12345',
      usuarioId: cliente.id,
      zonaId: zonaNacional.id,
      latitud: 18.485,
      longitud: -69.934,
      validada: true,
      referencias: 'Edificio demo, piso 4',
    },
  })

  // Establezco una configuración por defecto para la instancia del sistema.
  await prisma.configuracionSistema.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombreTienda: 'Mi Orden RD',
      descripcion: 'La mejor tienda digital para tus pedidos en República Dominicana.',
      email: 'contacto@miordenrd.com',
      telefono: '+1 (829) 727-3392',
      direccion: 'Santo Domingo, República Dominicana',
      notificacionesPedidos: true,
      notificacionesStock: true,
      notificacionesClientes: false,
      autenticacionDosFactor: false,
      sesionExpiracion: 24,
      envioGratis: 0,
      costoEnvio: 0,
      tiempoEntrega: '2-4 días laborables',
      iva: 18,
      moneda: 'RD$',
      colorPrimario: '#2b62e1',
      colorSecundario: '#1f2937',
      logoUrl: '',
    },
  })
  console.log('✅ Datos iniciales insertados.')
}

main()
  .catch((error) => {
    // Reporto cualquier fallo durante el seeding y retorno código de error.
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    // Libero la conexión de Prisma al finalizar el proceso.
    await prisma.$disconnect()
  })
