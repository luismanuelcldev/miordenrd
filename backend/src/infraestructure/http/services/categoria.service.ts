import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { CrearCategoriaDto } from '../dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from '../dto/actualizar-categoria.dto';
import { CrearSubcategoriaDto } from '../dto/crear-subcategoria.dto';
import { ActualizarSubcategoriaDto } from '../dto/actualizar-subcategoria.dto';

// Aquí he gestionado categorías y subcategorías con validaciones de integridad referencial.
@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he listado categorías con sus subcategorías ordenadas alfabéticamente.
  async listar() {
    return this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        subcategorias: {
          orderBy: { nombre: 'asc' },
        },
      },
    });
  }

  // Aquí he creado una categoría nueva contemplando campos opcionales como la imagen.
  async crearCategoria(data: CrearCategoriaDto) {
    return this.prisma.categoria.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagenUrl: data.imagenUrl ?? null,
      },
    });
  }

  // Aquí he actualizado una categoría normalizando la imagen (permite limpiar con cadena vacía).
  async actualizarCategoria(id: number, data: ActualizarCategoriaDto) {
    try {
      return await this.prisma.categoria.update({
        where: { id },
        data: {
          ...data,
          imagenUrl:
            data.imagenUrl === ''
              ? null
              : data.imagenUrl !== undefined
                ? data.imagenUrl
                : undefined,
        },
      });
    } catch {
      throw new NotFoundException('La categoría especificada no existe');
    }
  }

  // Aquí he eliminado una categoría sólo si no tiene productos asociados y borro sus subcategorías.
  async eliminarCategoria(id: number) {
    const productosAsociados = await this.prisma.producto.count({
      where: { categoriaId: id },
    });
    if (productosAsociados > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene productos asociados',
      );
    }

    try {
      await this.prisma.subcategoria.deleteMany({ where: { categoriaId: id } });
      await this.prisma.categoria.delete({ where: { id } });
    } catch {
      throw new NotFoundException('La categoría especificada no existe');
    }

    return { message: 'Categoría eliminada exitosamente' };
  }

  // Aquí he creado una subcategoría validando previamente la existencia de su categoría padre.
  async crearSubcategoria(data: CrearSubcategoriaDto) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: data.categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException('La categoría especificada no existe');
    }

    return this.prisma.subcategoria.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoriaId: data.categoriaId,
      },
    });
  }

  // Aquí he actualizado una subcategoría y, si cambia de categoría, valido el destino.
  async actualizarSubcategoria(id: number, data: ActualizarSubcategoriaDto) {
    const subcategoria = await this.prisma.subcategoria.findUnique({
      where: { id },
    });
    if (!subcategoria) {
      throw new NotFoundException('La subcategoría especificada no existe');
    }

    if (data.categoriaId) {
      const categoria = await this.prisma.categoria.findUnique({
        where: { id: data.categoriaId },
      });
      if (!categoria) {
        throw new NotFoundException('La categoría especificada no existe');
      }
    }

    return this.prisma.subcategoria.update({
      where: { id },
      data,
    });
  }

  // Aquí he eliminado una subcategoría sólo si no tiene productos asociados.
  async eliminarSubcategoria(id: number) {
    const productosAsociados = await this.prisma.producto.count({
      where: { subcategoriaId: id },
    });
    if (productosAsociados > 0) {
      throw new BadRequestException(
        'No se puede eliminar la subcategoría porque tiene productos asociados',
      );
    }

    try {
      await this.prisma.subcategoria.delete({ where: { id } });
    } catch {
      throw new NotFoundException('La subcategoría especificada no existe');
    }

    return { message: 'Subcategoría eliminada exitosamente' };
  }
}
