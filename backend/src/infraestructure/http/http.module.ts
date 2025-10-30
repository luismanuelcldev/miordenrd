import { Module } from '@nestjs/common';
import { AuthModule } from '../security/auth.module';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { UsuarioController } from './controllers/usuario.controller';
import { UsuarioService } from './services/usuario.service';
import { ProductoController } from './controllers/producto.controller';
import { ProductoService } from './services/producto.service';
import { PedidoController } from './controllers/pedido.controller';
import { PedidoService } from './services/pedido.service';
import { InventarioController } from './controllers/inventario.controller';
import { PagosController } from './controllers/pagos.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { ReportesController } from './controllers/reportes.controller';
import { CarritoController } from './controllers/carrito.controller';
import { RolesController } from './controllers/roles.controller';
import { HealthController } from './controllers/health.controller';
import { DireccionController } from './controllers/direccion.controller';
import { ContactoController } from './controllers/contacto.controller';
import { CrearUsuario } from '../../application/useCases/crearUsuario';
import { CrearProducto } from '../../application/useCases/crearProducto';
import { ListarProductos } from '../../application/useCases/productos/listarProductos';
import { ObtenerProducto } from '../../application/useCases/productos/obtenerProducto';
import { ActualizarProducto } from '../../application/useCases/productos/actualizarProducto';
import { EliminarProducto } from '../../application/useCases/productos/eliminarProducto';
import { CrearPedido } from '../../application/useCases/crearPedido';
import { ListarPedidos } from '../../application/useCases/pedidos/listarPedidos';
import { ObtenerPedido } from '../../application/useCases/pedidos/obtenerPedido';
import { ActualizarEstadoPedido } from '../../application/useCases/pedidos/actualizarEstadoPedido';
import { AsignarRepartidor } from '../../application/useCases/pedidos/asignarRepartidor';
import { ListarPedidosPorUsuario } from '../../application/useCases/pedidos/listarPedidosPorUsuario';
import { ListarPedidosPorRepartidor } from '../../application/useCases/pedidos/listarPedidosPorRepartidor';
import { ProcesarCheckout } from '../../application/useCases/pedidos/procesarCheckout';
import { RepositorioUsuarioPrisma } from '../persistence/prisma/repositories/repositorioUsuarioPrisma';
import { RepositorioProductoPrisma } from '../persistence/prisma/repositories/repositorioProductoPrisma';
import { ProductoQueryPrisma } from '../persistence/prisma/repositories/productoQueryPrisma';
import { RepositorioPedidoPrisma } from '../persistence/prisma/repositories/repositorioPedidoPrisma';
import { PedidoQueryPrisma } from '../persistence/prisma/repositories/pedidoQueryPrisma';
import { CarritoQueryPrisma } from '../persistence/prisma/repositories/carritoQueryPrisma';
import { InventarioService } from './services/inventario.service';
import { PagosService } from './services/pagos.service';
import { CheckoutService } from './services/checkout.service';
import { ReportesService } from './services/reportes.service';
import { CarritoService } from './services/carrito.service';
import { RolesService } from './services/roles.service';
import { DireccionService } from './services/direccion.service';
import { ContactoService } from './services/contacto.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CategoriaController } from './controllers/categoria.controller';
import { CategoriaService } from './services/categoria.service';
import { MediaController } from './controllers/media.controller';
import { ZonaEntregaController } from './controllers/zona-entrega.controller';
import { ZonaEntregaService } from './services/zona-entrega.service';
import { AuditoriaController } from './controllers/auditoria.controller';
import { AuditoriaService } from './services/auditoria.service';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { ConfiguracionService } from './services/configuracion.service';

// Aquí he ensamblado el módulo HTTP: integro Auth y Prisma, registro controladores y conecto casos de uso con sus repositorios Prisma.
@Module({
  imports: [PrismaModule, AuthModule],
  // Aquí he registrado los controladores que exponen la API REST.
  controllers: [
    UsuarioController,
    ProductoController,
    PedidoController,
    InventarioController,
    PagosController,
    CheckoutController,
    ReportesController,
    CarritoController,
    RolesController,
    HealthController,
    DireccionController,
    CategoriaController,
    ContactoController,
    MediaController,
    ZonaEntregaController,
    AuditoriaController,
    ConfiguracionController,
  ],
  // Aquí he declarado servicios de aplicación y casos de uso; además enlazo interfaces a implementaciones Prisma mediante providers tokenizados.
  providers: [
    UsuarioService,
    CrearUsuario,
    ProductoService,
    PedidoService,
    { provide: 'RepositorioUsuario', useClass: RepositorioUsuarioPrisma },
    CrearProducto,
    ListarProductos,
    ObtenerProducto,
    ActualizarProducto,
    EliminarProducto,
    { provide: 'RepositorioProducto', useClass: RepositorioProductoPrisma },
    { provide: 'ProductoQueryRepository', useClass: ProductoQueryPrisma },
    CrearPedido,
    { provide: 'RepositorioPedido', useClass: RepositorioPedidoPrisma },
    { provide: 'PedidoQueryRepository', useClass: PedidoQueryPrisma },
    { provide: 'CarritoQueryRepository', useClass: CarritoQueryPrisma },
    ListarPedidos,
    ObtenerPedido,
    ActualizarEstadoPedido,
    AsignarRepartidor,
    ListarPedidosPorUsuario,
    ListarPedidosPorRepartidor,
    ProcesarCheckout,
    InventarioService,
    PagosService,
    CheckoutService,
    ReportesService,
    CarritoService,
    RolesService,
    DireccionService,
    CategoriaService,
    ContactoService,
    JwtAuthGuard,
    ZonaEntregaService,
    AuditoriaService,
    ConfiguracionService,
  ],
})
export class HttpModule {}
