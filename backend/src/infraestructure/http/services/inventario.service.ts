import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import {
  RegistrarAjusteInventarioDto,
  TipoAjusteInventario,
} from '../dto/registrar-ajuste-inventario.dto';

@Injectable()
export class InventarioService {
  // Aquí he inyectado Prisma para consultar y ajustar el stock de productos.
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he consultado el stock incluyendo categoría y subcategoría para contexto.
  async consultarStock() {
    return this.prisma.producto.findMany({
      include: {
        categoria: true,
        subcategoria: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Aquí he registrado un ajuste de inventario normalizando signo y evitando stock negativo.
  async registrarAjuste(datosAjuste: RegistrarAjusteInventarioDto) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: datosAjuste.productoId },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');

    let cantidadAjuste = datosAjuste.cantidad;

    if (
      datosAjuste.estado === TipoAjusteInventario.SALIDA &&
      cantidadAjuste > 0
    ) {
      cantidadAjuste = -cantidadAjuste;
    }

    if (
      datosAjuste.estado === TipoAjusteInventario.ENTRADA &&
      cantidadAjuste < 0
    ) {
      cantidadAjuste = Math.abs(cantidadAjuste);
    }

    const stockActual = producto.stock ?? 0;
    const nuevoStock = stockActual + cantidadAjuste;

    if (nuevoStock < 0) {
      throw new BadRequestException(
        'El stock resultante no puede ser negativo',
      );
    }

    await this.prisma.$transaction([
      this.prisma.historialStock.create({
        data: {
          productoId: datosAjuste.productoId,
          cantidad: cantidadAjuste,
          estado: datosAjuste.estado,
          motivo: datosAjuste.motivo,
        },
      }),
      this.prisma.producto.update({
        where: { id: datosAjuste.productoId },
        data: { stock: nuevoStock },
      }),
    ]);

    return this.prisma.producto.findUnique({
      where: { id: datosAjuste.productoId },
      include: {
        categoria: true,
        subcategoria: true,
      },
    });
  }
}
