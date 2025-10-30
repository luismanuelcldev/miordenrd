import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CrearProductoDto } from '../dto/crear-producto.dto';
import { ActualizarProductoDto } from '../dto/actualizar-producto.dto';
import { ListarProductos } from '../../../application/useCases/productos/listarProductos';
import { ObtenerProducto } from '../../../application/useCases/productos/obtenerProducto';
import { CrearProducto } from '../../../application/useCases/crearProducto';
import { ActualizarProducto } from '../../../application/useCases/productos/actualizarProducto';
import { EliminarProducto } from '../../../application/useCases/productos/eliminarProducto';
import { FiltrosProducto } from '../../../application/ports/productoQueryRepository';

// Aquí he expuesto operaciones de productos delegando en casos de uso y normalizando DTOs.
@Injectable()
export class ProductoService {
  constructor(
    private readonly listarProductos: ListarProductos,
    private readonly obtenerProductoUC: ObtenerProducto,
    private readonly crearProductoUC: CrearProducto,
    private readonly actualizarProductoUC: ActualizarProducto,
    private readonly eliminarProductoUC: EliminarProducto,
  ) {}

  // Aquí he listado productos con filtros de consulta desde el puerto de aplicación.
  async findAll(filtros: FiltrosProducto) {
    return this.listarProductos.ejecutar(filtros);
  }

  // Aquí he recuperado un producto y lanzo 404 si no existe.
  async findOne(id: number) {
    const producto = await this.obtenerProductoUC.ejecutar(id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }
    return producto;
  }

  // Aquí he creado un producto y devuelvo su detalle recién persistido.
  async create(crearProductoDto: CrearProductoDto) {
    try {
      const producto = await this.crearProductoUC.ejecutar({
        nombre: crearProductoDto.nombre,
        descripcion: crearProductoDto.descripcion,
        precio: crearProductoDto.precio,
        stock: crearProductoDto.stock ?? 0,
        imagenUrl: crearProductoDto.imagenUrl,
        categoriaId: crearProductoDto.categoriaId,
        subcategoriaId: crearProductoDto.subcategoriaId,
        enOferta: crearProductoDto.enOferta ?? false,
        precioOferta: crearProductoDto.enOferta
          ? crearProductoDto.precioOferta
          : undefined,
      });

      const detalle = await this.obtenerProductoUC.ejecutar(producto.getId()!);
      return detalle;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Aquí he actualizado un producto normalizando imagen y precio de oferta.
  async update(id: number, actualizarProductoDto: ActualizarProductoDto) {
    try {
      const dto: ActualizarProductoDto = {
        ...actualizarProductoDto,
        imagenUrl:
          actualizarProductoDto.imagenUrl !== undefined &&
          actualizarProductoDto.imagenUrl.trim() === ''
            ? null
            : actualizarProductoDto.imagenUrl,
        precioOferta:
          actualizarProductoDto.enOferta === false
            ? null
            : actualizarProductoDto.precioOferta !== undefined
              ? actualizarProductoDto.precioOferta
              : undefined,
      };
      const producto = await this.actualizarProductoUC.ejecutar(id, dto);
      if (!producto) {
        throw new NotFoundException('Producto no encontrado');
      }
      return producto;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  // Aquí he eliminado un producto lanzando 404 si no existe.
  async remove(id: number) {
    const eliminado = await this.eliminarProductoUC.ejecutar(id);
    if (!eliminado) {
      throw new NotFoundException('Producto no encontrado');
    }
    return { message: 'Producto eliminado exitosamente' };
  }
}
