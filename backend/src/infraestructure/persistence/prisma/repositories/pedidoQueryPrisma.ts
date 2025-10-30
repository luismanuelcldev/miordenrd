import { Injectable } from '@nestjs/common';
import {
  FiltrosPedidoQuery,
  PedidoDetalle,
  PedidoListado,
  PedidoQueryRepository,
} from '../../../../application/ports/pedidoQueryRepository';
import { PrismaService } from '../prisma.service';
import { EstadoPedido, MetodoPago } from '../../../../domain/entities/pedido';
import { Rol } from '../../../../domain/entities/usuario';

@Injectable()
export class PedidoQueryPrisma implements PedidoQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Me encargo de listar pedidos aplicando filtros y contexto del usuario (rol/propiedad).
  async listar(
    filtros: FiltrosPedidoQuery,
    usuarioActual: { id: number; rol: Rol },
  ): Promise<PedidoListado[]> {
    const where = this.buildWhere(filtros, usuarioActual);

    const pedidos = await this.prisma.pedido.findMany({
      where,
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        repartidor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
      },
    });

    return pedidos.map((pedido) => ({
      id: pedido.id,
      estado: pedido.estado as EstadoPedido,
      total: pedido.total,
      costoEnvio: pedido.costoEnvio ?? 0,
      metodoPago: pedido.metodoPago as MetodoPago,
      usuarioId: pedido.usuarioId,
      direccionId: pedido.direccionId,
      repartidorId: pedido.repartidorId,
      creadoEn: pedido.creadoEn,
      actualizadoEn: pedido.actualizadoEn,
      usuario: pedido.usuario,
      repartidor: pedido.repartidor,
    }));
  }

  // Con este método obtengo el total para paginación con los mismos criterios de filtro.
  async contar(
    filtros: FiltrosPedidoQuery,
    usuarioActual: { id: number; rol: Rol },
  ) {
    const where = this.buildWhere(filtros, usuarioActual);
    return this.prisma.pedido.count({ where });
  }

  // Busco el detalle completo de un pedido con usuario, dirección, items y últimas notificaciones.
  async obtenerPorId(id: number): Promise<PedidoDetalle | null> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        direccion: true,
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                precio: true,
                imagenUrl: true,
              },
            },
          },
        },
        repartidor: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        notificaciones: {
          orderBy: { enviadoEn: 'desc' },
          take: 5,
        },
      },
    });

    if (!pedido) {
      return null;
    }

    return {
      id: pedido.id,
      estado: pedido.estado as EstadoPedido,
      total: pedido.total,
      costoEnvio: pedido.costoEnvio ?? 0,
      metodoPago: pedido.metodoPago as MetodoPago,
      usuarioId: pedido.usuarioId,
      direccionId: pedido.direccionId,
      repartidorId: pedido.repartidorId,
      creadoEn: pedido.creadoEn,
      actualizadoEn: pedido.actualizadoEn,
      usuario: pedido.usuario,
      repartidor: pedido.repartidor,
      direccion: pedido.direccion,
      items: pedido.items.map((item) => ({
        id: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        producto: item.producto,
      })),
      notificaciones: pedido.notificaciones.map((notificacion) => ({
        id: notificacion.id,
        mensaje: notificacion.mensaje,
        estado: notificacion.estado,
        enviadoEn: notificacion.enviadoEn,
      })),
    };
  }

  // Listo pedidos por cliente autenticado con paginación.
  async listarPorUsuario(
    usuarioId: number,
    filtros: { page: number; limit: number; estado?: EstadoPedido },
  ) {
    const where = {
      usuarioId,
      estado: filtros.estado ?? undefined,
    };

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          direccion: true,
          items: {
            include: {
              producto: {
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  imagenUrl: true,
                },
              },
            },
          },
          repartidor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return {
      pedidos: pedidos.map((pedido) => ({
        id: pedido.id,
        estado: pedido.estado as EstadoPedido,
        total: pedido.total,
        costoEnvio: pedido.costoEnvio ?? 0,
        metodoPago: pedido.metodoPago as MetodoPago,
        usuarioId: pedido.usuarioId,
        direccionId: pedido.direccionId,
        repartidorId: pedido.repartidorId,
        creadoEn: pedido.creadoEn,
        actualizadoEn: pedido.actualizadoEn,
        direccion: pedido.direccion,
      })),
      total,
    };
  }

  // Listo pedidos asignados al repartidor con paginación.
  async listarPorRepartidor(
    repartidorId: number,
    filtros: { page: number; limit: number; estado?: EstadoPedido },
  ) {
    const where = {
      repartidorId,
      estado: filtros.estado ?? undefined,
    };

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip: (filtros.page - 1) * filtros.limit,
        take: filtros.limit,
        orderBy: { creadoEn: 'desc' },
        include: {
          usuario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true,
            },
          },
          direccion: true,
          items: {
            include: {
              producto: { select: { id: true, nombre: true, precio: true } },
            },
          },
        },
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return {
      pedidos: pedidos.map((pedido) => ({
        id: pedido.id,
        estado: pedido.estado as EstadoPedido,
        total: pedido.total,
        costoEnvio: pedido.costoEnvio ?? 0,
        metodoPago: pedido.metodoPago as MetodoPago,
        usuarioId: pedido.usuarioId,
        direccionId: pedido.direccionId,
        repartidorId: pedido.repartidorId,
        creadoEn: pedido.creadoEn,
        actualizadoEn: pedido.actualizadoEn,
        usuario: pedido.usuario,
        direccion: pedido.direccion,
      })),
      total,
    };
  }

  // Registro una notificación pendiente ligada al pedido (para ser enviada por otro proceso).
  async registrarNotificacion(params: {
    pedidoId: number;
    email: string;
    mensaje: string;
  }): Promise<void> {
    await this.prisma.notificacion.create({
      data: {
        email: params.email,
        mensaje: params.mensaje,
        tipo: 'EMAIL',
        estado: 'PENDIENTE',
        pedidoId: params.pedidoId,
      },
    });
  }

  // Construyo los filtros de consulta respetando el rol del usuario y el rango de fechas.
  private buildWhere(
    filtros: FiltrosPedidoQuery,
    usuarioActual: { id: number; rol: Rol },
  ) {
    const where: any = {};

    if (usuarioActual.rol !== Rol.ADMINISTRADOR) {
      if (usuarioActual.rol === Rol.REPARTIDOR) {
        where.repartidorId = usuarioActual.id;
      } else if (usuarioActual.rol === Rol.EMPLEADO) {
      } else {
        where.usuarioId = usuarioActual.id;
      }
    }

    if (filtros.usuarioId && usuarioActual.rol === Rol.ADMINISTRADOR) {
      where.usuarioId = filtros.usuarioId;
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.fechaInicio || filtros.fechaFin) {
      where.creadoEn = {};
      if (filtros.fechaInicio) {
        where.creadoEn.gte = filtros.fechaInicio;
      }
      if (filtros.fechaFin) {
        const fechaFinCompleta = new Date(filtros.fechaFin);
        fechaFinCompleta.setDate(fechaFinCompleta.getDate() + 1);
        where.creadoEn.lt = fechaFinCompleta;
      }
    }

    return where;
  }
}
