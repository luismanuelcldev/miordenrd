import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';

// Mantengo un cliente de Prisma para resetear tablas y preparar datos previos en las pruebas e2e.
const prisma = new PrismaClient();

async function resetDatabase() {
  // Dejo la base de datos en blanco para asegurar resultados deterministas al iniciar la suite.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "TransaccionPago", "Notificacion", "ItemPedido", "Pedido",
    "ItemCarrito", "Carrito", "HistorialStock", "Producto",
    "Subcategoria", "Categoria", "Direccion", "Usuario"
    RESTART IDENTITY CASCADE;
  `);
}

// Compruebo los flujos principales de gestión de productos con un usuario administrador.
describe('Productos (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  // Inicio la aplicación, creo un administrador y obtengo un token válido para operar con endpoints protegidos.
  beforeAll(async () => {
    await resetDatabase();

    // Genero un administrador de prueba con contraseña hasheada para autenticación.
    const password = await bcrypt.hash('Admin1234!', 10);
    await prisma.usuario.create({
      data: {
        email: 'admin@test.com',
        contrasena: password,
        nombre: 'Admin',
        apellido: 'Test',
        rol: 'ADMINISTRADOR',
      },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', contrasena: 'Admin1234!' })
      .expect(200);

    if (!loginResponse.body?.accessToken) {
      // Ayuda para depurar en caso de fallo local
      // eslint-disable-next-line no-console
      console.error('Fallo login admin e2e', loginResponse.body);
    }

    adminToken = loginResponse.body.accessToken;
  });

  // Finalizo la aplicación y libero conexiones con la base de datos al concluir la suite.
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  // Creo un producto como administrador y verifico que aparezca correctamente en el listado público.
  it('permite crear y listar productos', async () => {
    const productoDto = {
      nombre: 'Producto Test',
      descripcion: 'Descripción de prueba',
      precio: 99.99,
      stock: 10,
    };

    const creacion = await request(app.getHttpServer())
      .post('/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productoDto)
      .expect(201);

    expect(creacion.body).toHaveProperty('id');
    const productoId = creacion.body.id;

    const listado = await request(app.getHttpServer())
      .get('/productos')
      .expect(200);

    expect(listado.body).toHaveProperty('productos');
    const creado = listado.body.productos.find((p: any) => p.id === productoId);
    expect(creado).toBeDefined();
    expect(creado.nombre).toBe(productoDto.nombre);
  });
});
