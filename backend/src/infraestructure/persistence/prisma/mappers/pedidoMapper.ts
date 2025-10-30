import {
  Pedido,
  EstadoPedido,
  MetodoPago,
} from '../../../../domain/entities/pedido';

export class PedidoMapper {
  // Decidí mantener una conversión explícita desde el resultado Prisma hacia la entidad de dominio.
  static aDominio(prisma: any): Pedido {
    return new Pedido({
      id: prisma.id,
      estado: prisma.estado as EstadoPedido,
      total: prisma.total,
      metodoPago: prisma.metodoPago as MetodoPago,
      usuarioId: prisma.usuarioId,
      direccionId: prisma.direccionId,
      repartidorId: prisma.repartidorId ?? null,
      costoEnvio: prisma.costoEnvio ?? 0,
      creadoEn: prisma.creadoEn,
      actualizadoEn: prisma.actualizadoEn,
    });
  }

  // Con esta función traduzco la entidad de dominio a la forma esperada por Prisma.
  static aPrisma(pedido: Pedido) {
    return {
      id: pedido.getId(),
      estado: pedido.getEstado(),
      total: pedido.getTotal(),
      costoEnvio: pedido.getCostoEnvio(),
      metodoPago: pedido.getMetodoPago(),
      usuarioId: pedido.getUsuarioId(),
      direccionId: pedido.getDireccionId(),
      repartidorId: pedido.getRepartidorId(),
      creadoEn: pedido.getCreadoEn(),
      actualizadoEn: pedido.getActualizadoEn(),
    };
  }

  // Para actualizar, sólo proyecto los campos que deben cambiar en la persistencia.
  static actualizarPrisma(pedido: Pedido) {
    return {
      estado: pedido.getEstado(),
      total: pedido.getTotal(),
      costoEnvio: pedido.getCostoEnvio(),
      metodoPago: pedido.getMetodoPago(),
      direccionId: pedido.getDireccionId(),
      repartidorId: pedido.getRepartidorId(),
      actualizadoEn: pedido.getActualizadoEn(),
    };
  }
}
