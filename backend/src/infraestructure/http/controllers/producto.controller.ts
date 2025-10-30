import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CrearProductoDto } from '../dto/crear-producto.dto';
import { ActualizarProductoDto } from '../dto/actualizar-producto.dto';
import { ProductoService } from '../services/producto.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { Public } from '../decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Productos')
@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  // Aquí he listado productos aplicando filtros opcionales y paginación para búsquedas eficientes.
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Obtener lista de productos con filtros y paginación',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Término de búsqueda',
  })
  @ApiQuery({
    name: 'categoriaId',
    required: false,
    description: 'ID de categoría',
  })
  @ApiQuery({
    name: 'precioMin',
    required: false,
    description: 'Precio mínimo',
  })
  @ApiQuery({
    name: 'precioMax',
    required: false,
    description: 'Precio máximo',
  })
  @ApiQuery({
    name: 'ordenarPor',
    required: false,
    description: 'Campo para ordenar',
  })
  @ApiQuery({
    name: 'orden',
    required: false,
    description: 'Dirección del orden (asc/desc)',
  })
  @ApiQuery({
    name: 'enOferta',
    required: false,
    description: 'Filtrar productos en oferta (true/false)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('precioMin') precioMin?: string,
    @Query('precioMax') precioMax?: string,
    @Query('ordenarPor') ordenarPor?: string,
    @Query('orden') orden?: 'asc' | 'desc',
    @Query('enOferta') enOferta?: string,
  ) {
    const filtros = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
      precioMin: precioMin ? parseFloat(precioMin) : undefined,
      precioMax: precioMax ? parseFloat(precioMax) : undefined,
      ordenarPor,
      orden: orden || 'asc',
      enOferta: enOferta !== undefined ? enOferta === 'true' : undefined,
    };

    return await this.productoService.findAll(filtros);
  }

  // Aquí he expuesto la consulta de un producto específico por su identificador único.
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async findOne(@Param('id') id: string) {
    return await this.productoService.findOne(parseInt(id));
  }

  // Aquí he protegido la creación de productos para roles administrativos aplicando validaciones de entrada.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo producto' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() body: CrearProductoDto) {
    return await this.productoService.create(body);
  }

  // Aquí he habilitado la actualización de un producto existente restringida a usuarios autorizados.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() body: ActualizarProductoDto) {
    return await this.productoService.update(parseInt(id), body);
  }

  // Aquí he gestionado la eliminación lógica/física de productos con control de permisos.
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async remove(@Param('id') id: string) {
    return await this.productoService.remove(parseInt(id));
  }
}
