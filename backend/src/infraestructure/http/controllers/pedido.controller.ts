import {
  Controller,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
  Query,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PedidoService } from '../services/pedido.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { ActualizarEstadoPedidoDto } from '../dto/actualizar-estado-pedido.dto';
import { AsignarRepartidorDto } from '../dto/asignar-repartidor.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EstadoPedido } from '../../../domain/entities/pedido';

@ApiTags('Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  // Aquí he listado pedidos con filtros de estado, fechas y usuario, respetando permisos por rol.
  @Get()
  @ApiOperation({ summary: 'Obtener lista de pedidos con filtros' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'usuarioId',
    required: false,
    description: 'ID del usuario (solo admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos obtenida exitosamente',
  })
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('usuarioId') usuarioId?: string,
  ) {
    const filtros = {
      page: parseInt(page),
      limit: parseInt(limit),
      estado: estado ? (estado as EstadoPedido) : undefined,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
      usuarioId: usuarioId ? parseInt(usuarioId) : undefined,
    };

    return this.pedidoService.findAll(filtros, req.user);
  }

  // Aquí he expuesto la consulta puntual de un pedido validando acceso según el usuario autenticado.
  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.pedidoService.findOne(parseInt(id, 10), req.user);
  }

  // Aquí he centralizado el cambio de estado del pedido aplicando validaciones y control de roles.
  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO, Rol.REPARTIDOR)
  @ApiOperation({ summary: 'Actualizar estado del pedido' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async actualizarEstado(
    @Req() req: any,
    @Param('id') id: string,
    @Body() actualizarEstadoDto: ActualizarEstadoPedidoDto,
  ) {
    return this.pedidoService.actualizarEstado(
      parseInt(id, 10),
      actualizarEstadoDto.estado,
      req.user,
    );
  }

  // Aquí he permitido asignar un repartidor a un pedido restringido a personal autorizado.
  @Patch(':id/asignar-repartidor')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @ApiOperation({ summary: 'Asignar repartidor al pedido' })
  @ApiResponse({ status: 200, description: 'Repartidor asignado exitosamente' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async asignarRepartidor(
    @Req() req: any,
    @Param('id') id: string,
    @Body() asignarRepartidorDto: AsignarRepartidorDto,
  ) {
    return this.pedidoService.asignarRepartidor(
      parseInt(id, 10),
      asignarRepartidorDto.repartidorId,
      req.user,
    );
  }

  // Aquí he listado los pedidos del propio usuario autenticado con paginación y filtro por estado.
  @Get('usuario/mis-pedidos')
  @ApiOperation({ summary: 'Obtener pedidos del usuario autenticado' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedidos del usuario obtenidos exitosamente',
  })
  async misPedidos(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('estado') estado?: string,
  ) {
    return this.pedidoService.findByUsuario({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      estado,
      usuarioId: req.user.id,
    });
  }

  // Aquí he listado los pedidos asignados al repartidor autenticado, con soporte de paginación.
  @Get('repartidor/asignados')
  @UseGuards(RolesGuard)
  @Roles(Rol.REPARTIDOR)
  @ApiOperation({ summary: 'Obtener pedidos asignados al repartidor' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiResponse({
    status: 200,
    description: 'Pedidos asignados obtenidos exitosamente',
  })
  async pedidosAsignados(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('estado') estado?: string,
  ) {
    return this.pedidoService.findByRepartidor({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      estado,
      repartidorId: req.user.id,
    });
  }
}
