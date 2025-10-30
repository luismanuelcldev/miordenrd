import { EstadoPedido, MetodoPago } from '../../domain/entities/pedido';
import { Rol } from '../../domain/entities/usuario';

// Prefiero separar vistas de lectura para listar/contar/obtener pedidos sin exponer entidades de dominio.
export interface PedidoListado {
  id: number;
  estado: EstadoPedido;
  total: number;
  costoEnvio: number;
  metodoPago: MetodoPago;
  usuarioId: number;
  direccionId: number;
  repartidorId?: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
  usuario?: {
    id: number;
    nombre?: string | null;
    apellido?: string | null;
    email: string;
  };
  repartidor?: {
    id: number;
    nombre?: string | null;
    apellido?: string | null;
    email: string;
  } | null;
  direccion?: {
    id: number;
    calle: string;
    ciudad: string;
    pais: string;
    codigoPostal?: string | null;
  } | null;
}

export interface PedidoItemDetalle {
  id: number;
  cantidad: number;
  precio: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    imagenUrl?: string | null;
  };
}

export interface PedidoDetalle extends PedidoListado {
  direccion: {
    id: number;
    calle: string;
    ciudad: string;
    pais: string;
    codigoPostal?: string | null;
  };
  items: PedidoItemDetalle[];
  notificaciones: Array<{
    id: number;
    mensaje: string;
    estado: string;
    enviadoEn: Date;
  }>;
}

export interface FiltrosPedidoQuery {
  page: number;
  limit: number;
  estado?: EstadoPedido;
  fechaInicio?: Date;
  fechaFin?: Date;
  usuarioId?: number;
  repartidorId?: number;
}

export interface PedidoQueryRepository {
  // Listo pedidos aplicando filtros y respetando el contexto del usuario autenticado.
  listar(
    filtros: FiltrosPedidoQuery,
    usuarioActual: { id: number; rol: Rol },
  ): Promise<PedidoListado[]>;
  // Cuento el total de pedidos que satisfacen los filtros en el contexto actual.
  contar(
    filtros: FiltrosPedidoQuery,
    usuarioActual: { id: number; rol: Rol },
  ): Promise<number>;
  // Obtengo el detalle completo de un pedido por su id.
  obtenerPorId(id: number): Promise<PedidoDetalle | null>;
  // Listo pedidos pertenecientes a un usuario con paginación y filtro de estado.
  listarPorUsuario(
    usuarioId: number,
    filtros: { page: number; limit: number; estado?: EstadoPedido },
  ): Promise<{
    pedidos: PedidoListado[];
    total: number;
  }>;
  // Listo pedidos asignados a un repartidor con paginación y filtro de estado.
  listarPorRepartidor(
    repartidorId: number,
    filtros: { page: number; limit: number; estado?: EstadoPedido },
  ): Promise<{
    pedidos: PedidoListado[];
    total: number;
  }>;
  // Registro una notificación relacionada a un pedido (por ejemplo, cambios de estado).
  registrarNotificacion(params: {
    pedidoId: number;
    email: string;
    mensaje: string;
  }): Promise<void>;
}
