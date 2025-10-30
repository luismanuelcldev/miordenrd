# Prisma del proyecto

He documentado el esquema y el proceso de seed para que sea más fácil entender las relaciones y los datos iniciales. Evito modificar archivos de migración ya aplicados para no provocar drift en Prisma Migrate.

## Esquema (`schema.prisma`)
- Modelos principales:
  - Usuario, Direccion, Categoria, Subcategoria, Producto, HistorialStock, Pedido
  - ZonaEntrega, TarifaZona (cobertura y costos)
  - Notificacion, TransaccionPago, ReporteVenta, Contacto, LogAdmin
  - Carrito, ItemCarrito, ItemPedido, AuditoriaAccion, ConfiguracionSistema
- Enums: Rol, EstadoPedido, MetodoPago, EstadoStock
- Datasource: PostgreSQL (url vía `DATABASE_URL`)
- Cliente: `prisma-client-js`

## Seed (`seed.js`)
- Usuarios: admin, cliente y repartidor con contraseñas hasheadas
- Zona de entrega: polígono nacional RD, centroide y tarifas por distancia
- Dirección de ejemplo: vinculada al cliente y validada
- Configuración del sistema: datos base de tienda, notificaciones y estilos

## Migraciones
No edito los `migration.sql` ya creados para mantener integridad de hashes de Prisma. Resumen de carpetas:

- 20250927004130_migracion_inicial_esquema_prisma: Esquema inicial del dominio
- 20250927010531_ajustes_esquema_avanzado: Ajustes y ampliaciones de modelo
- 20251018003814_add_usuario_activo: Campo `activo` en `Usuario`
- 20251021164400_add_producto_oferta: Campos de oferta en `Producto`
- 20251022000000_add_categoria_imagen: Imagen en `Categoria`
- 20251023000416_zonas_direcciones: Zonas de entrega y vínculo con `Direccion`
- 20251023184249_add_shipping_cost: `costoEnvio` en `Pedido` y tarifas
- 20251025195000_add_cognito_support: Campo `cognitoSub` en `Usuario`
- 20251028203624_add_configuracion_sistema: Modelo `ConfiguracionSistema`

## Notas
- Para generar el cliente después de cambios en el esquema: `npx prisma generate`
- Para aplicar migraciones nuevas: `npx prisma migrate dev` (en desarrollo)
- Para ejecutar seed (si está configurado en package.json): `npx prisma db seed`
