import { http, HttpResponse } from 'msw';

const baseURL = '/api/v1';

// Defino endpoints mock para simular el backend en desarrollo y pruebas
export const handlers = [
  // Auth - Login
  http.post(`${baseURL}/auth/login`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      usuario: {
        id: 1,
        email: 'test@acme.com',
        nombre: 'Test',
        apellido: 'Usuario',
        rol: 'CLIENTE',
        activo: true,
      },
      expiresIn: 3600,
    });
  }),

  // Auth - Register
  http.post(`${baseURL}/auth/register`, async () => {
    return HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      usuario: {
        id: 2,
        email: 'nuevo@acme.com',
        nombre: 'Nuevo',
        apellido: 'Usuario',
        rol: 'CLIENTE',
        activo: true,
      },
      expiresIn: 3600,
    });
  }),

  // Auth - Profile
  http.get(`${baseURL}/auth/me`, async () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@acme.com',
      nombre: 'Test',
      apellido: 'Usuario',
      telefono: '123456789',
      rol: 'CLIENTE',
      activo: true,
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Auth - Logout
  http.post(`${baseURL}/auth/logout`, async () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Auth - Refresh
  http.post(`${baseURL}/auth/refresh`, async () => {
    return HttpResponse.json({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresIn: 3600,
    });
  }),

  // Productos - Listar
  http.get(`${baseURL}/productos`, async () => {
    return HttpResponse.json({
      productos: [
        {
          id: 1,
          nombre: 'Producto A',
          precio: 50.00,
          stock: 10,
          imagenUrl: '/images/producto-a.jpg',
          categoria: { id: 1, nombre: 'Categoría 1' },
          creadoEn: '2024-01-01T00:00:00.000Z',
          actualizadoEn: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          nombre: 'Producto B',
          precio: 75.00,
          stock: 5,
          imagenUrl: '/images/producto-b.jpg',
          categoria: { id: 2, nombre: 'Categoría 2' },
          creadoEn: '2024-01-01T00:00:00.000Z',
          actualizadoEn: '2024-01-01T00:00:00.000Z',
        },
      ],
      paginacion: {
        total: 2,
        page: 1,
        limit: 12,
        totalPages: 1,
      },
    });
  }),

  // Productos - Obtener por ID
  http.get(`${baseURL}/productos/:id`, async ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      nombre: 'Producto A',
      descripcion: 'Descripción del producto A',
      precio: 50.00,
      stock: 10,
      imagenUrl: '/images/producto-a.jpg',
      categoria: { id: 1, nombre: 'Categoría 1' },
      subcategoria: { id: 1, nombre: 'Subcategoría 1' },
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Carrito - Obtener
  http.get(`${baseURL}/carrito`, async () => {
    return HttpResponse.json({
      id: 1,
      usuarioId: 1,
      items: [
        {
          id: 1,
          cantidad: 2,
          producto: {
            id: 1,
            nombre: 'Producto A',
            precio: 50.00,
            stock: 10,
            imagenUrl: '/images/producto-a.jpg',
            categoria: { id: 1, nombre: 'Categoría 1' },
            creadoEn: '2024-01-01T00:00:00.000Z',
            actualizadoEn: '2024-01-01T00:00:00.000Z',
          },
        },
      ],
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Carrito - Agregar producto
  http.post(`${baseURL}/carrito/agregar`, async () => {
    return HttpResponse.json({
      id: 1,
      usuarioId: 1,
      items: [
        {
          id: 1,
          cantidad: 3,
          producto: {
            id: 1,
            nombre: 'Producto A',
            precio: 50.00,
            stock: 10,
            imagenUrl: '/images/producto-a.jpg',
            categoria: { id: 1, nombre: 'Categoría 1' },
            creadoEn: '2024-01-01T00:00:00.000Z',
            actualizadoEn: '2024-01-01T00:00:00.000Z',
          },
        },
      ],
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Carrito - Editar producto
  http.put(`${baseURL}/carrito/editar/:itemId`, async () => {
    return HttpResponse.json({
      id: 1,
      usuarioId: 1,
      items: [
        {
          id: 1,
          cantidad: 5,
          producto: {
            id: 1,
            nombre: 'Producto A',
            precio: 50.00,
            stock: 10,
            imagenUrl: '/images/producto-a.jpg',
            categoria: { id: 1, nombre: 'Categoría 1' },
            creadoEn: '2024-01-01T00:00:00.000Z',
            actualizadoEn: '2024-01-01T00:00:00.000Z',
          },
        },
      ],
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Inventario - Stock
  http.get(`${baseURL}/inventario/stock`, async () => {
    return HttpResponse.json({
      statusCode: 200,
      data: [
        {
          id: 1,
          nombre: 'Producto A',
          precio: 50,
          stock: 10,
          categoriaId: 1,
          creadoEn: '2024-01-01T00:00:00.000Z',
          actualizadoEn: '2024-01-01T00:00:00.000Z',
        },
      ],
    })
  }),

  // Carrito - Eliminar producto
  http.delete(`${baseURL}/carrito/eliminar/:itemId`, async () => {
    return HttpResponse.json({
      id: 1,
      usuarioId: 1,
      items: [],
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Checkout - Procesar compra
  http.post(`${baseURL}/checkout`, async () => {
    return HttpResponse.json({
      id: 1,
      usuarioId: 1,
      total: 100.00,
      subtotal: 85.00,
      impuestos: 13.60,
      envio: 10.00,
      estado: 'PENDIENTE',
      metodoPago: 'TARJETA',
      direccionEnvio: {
        nombre: 'Test',
        apellido: 'Usuario',
        direccion: 'Calle 123',
        ciudad: 'Ciudad',
        codigoPostal: '12345',
        pais: 'México',
        telefono: '123456789',
      },
      items: [
        {
          id: 1,
          productoId: 1,
          cantidad: 2,
          precioUnitario: 50.00,
          subtotal: 100.00,
        },
      ],
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),

  // Pedidos - Mis pedidos
  http.get(`${baseURL}/pedidos/usuario/mis-pedidos`, async () => {
    return HttpResponse.json({
      pedidos: [
        {
          id: 1,
          total: 100.00,
          estado: 'ENTREGADO',
          creadoEn: '2024-01-01T00:00:00.000Z',
        },
      ],
      paginacion: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });
  }),

  // Pedidos - Obtener por ID
  http.get(`${baseURL}/pedidos/:id`, async ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id: Number(id),
      usuarioId: 1,
      total: 100.00,
      subtotal: 85.00,
      impuestos: 13.60,
      envio: 10.00,
      estado: 'ENTREGADO',
      metodoPago: 'TARJETA',
      direccionEnvio: {
        nombre: 'Test',
        apellido: 'Usuario',
        direccion: 'Calle 123',
        ciudad: 'Ciudad',
        codigoPostal: '12345',
        pais: 'México',
        telefono: '123456789',
      },
      items: [
        {
          id: 1,
          productoId: 1,
          cantidad: 2,
          precioUnitario: 50.00,
          subtotal: 100.00,
          producto: {
            id: 1,
            nombre: 'Producto A',
            imagenUrl: '/images/producto-a.jpg',
          },
        },
      ],
      creadoEn: '2024-01-01T00:00:00.000Z',
      actualizadoEn: '2024-01-01T00:00:00.000Z',
    });
  }),
];
