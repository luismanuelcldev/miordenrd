import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';

// Uso un cliente de Prisma para resetear datos y preparar el estado inicial de usuarios en e2e.
const prisma = new PrismaClient();

async function resetDatabase() {
  // Trunco las tablas principales para empezar con IDs consistentes y sin residuos.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "TransaccionPago", "Notificacion", "ItemPedido", "Pedido",
    "ItemCarrito", "Carrito", "HistorialStock", "Producto",
    "Subcategoria", "Categoria", "Direccion", "Usuario"
    RESTART IDENTITY CASCADE;
  `);
}

// Verifico operaciones administrativas sobre usuarios (creación, duplicados y actualización).
describe('Usuarios (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  // Inicializo la app, creo un administrador y autentico para obtener un token con privilegios.
  beforeAll(async () => {
    await resetDatabase();

    const password = await bcrypt.hash('Admin1234!', 10);
    await prisma.usuario.create({
      data: {
        email: 'admin+e2e@test.com',
        contrasena: password,
        nombre: 'Admin',
        apellido: 'E2E',
        rol: 'ADMINISTRADOR',
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin+e2e@test.com', contrasena: 'Admin1234!' })
      .expect(200);

    adminToken = login.body.accessToken;
  });

  // Cierro la aplicación y termino la conexión de Prisma al finalizar las pruebas.
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Creo un usuario como administrador y confirmo que los campos principales coinciden.
  it('permite al administrador crear un usuario nuevo', async () => {
    const payload = {
      email: 'cliente+e2e@test.com',
      contrasena: 'Cliente123!',
      nombre: 'Cliente',
      apellido: 'E2E',
      telefono: '8090000000',
      rol: 'CLIENTE',
    };

    const respuesta = await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(respuesta.body).toMatchObject({
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    });
  });

  // Intento crear el mismo usuario y espero un conflicto por duplicidad.
  it('evita crear usuarios duplicados', async () => {
    const payload = {
      email: 'cliente+e2e@test.com',
      contrasena: 'Cliente123!',
      nombre: 'Cliente',
      apellido: 'E2E',
      telefono: '8090000000',
      rol: 'CLIENTE',
    };

    await request(app.getHttpServer())
      .post('/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(409);
  });

  // Actualizo datos sensibles (nombre y teléfono) y verifico que los cambios se reflejen.
  it('actualiza datos principales del usuario', async () => {
    const respuesta = await request(app.getHttpServer())
      .patch('/usuarios/2')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Cliente Actualizado', telefono: '8091111111' })
      .expect(200);

    expect(respuesta.body.nombre).toBe('Cliente Actualizado');
    expect(respuesta.body.telefono).toBe('8091111111');
  });
});
