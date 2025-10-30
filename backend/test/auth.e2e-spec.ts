import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// Instalo un cliente de Prisma para gestionar el reseteo y consultas directas en las pruebas e2e.
const prisma = new PrismaClient();

jest.setTimeout(20000);

async function resetDatabase() {
  // Reinicio el estado de la base de datos para garantizar independencia entre suites e2e.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "TransaccionPago", "Notificacion", "ItemPedido", "Pedido",
    "ItemCarrito", "Carrito", "HistorialStock", "Producto",
    "Subcategoria", "Categoria", "Direccion", "Usuario"
    RESTART IDENTITY CASCADE;
  `);
}

// Valido el flujo de autenticación completo (registro, login y perfil) de extremo a extremo.
describe('Autenticación (e2e)', () => {
  let app: INestApplication;

  // Levanto la aplicación Nest y preparo una base de datos limpia antes de iniciar las pruebas.
  beforeAll(async () => {
    await resetDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Cierro la aplicación y libero recursos de Prisma al finalizar la suite e2e.
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Ejecuto registro, inicio de sesión y consulta de perfil, comprobando tokens y datos devueltos.
  it('permite registrar, iniciar sesión y obtener perfil', async () => {
    const registerDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@example.com',
      contrasena: 'Password123!',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: registerDto.email, contrasena: registerDto.contrasena })
      .expect(200);

    expect(loginResponse.body).toHaveProperty('accessToken');

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body.email).toBe(registerDto.email);
  });
});
