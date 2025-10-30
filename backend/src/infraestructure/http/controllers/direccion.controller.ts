import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { DireccionService } from '../services/direccion.service';
import {
  CrearDireccionDto,
  ActualizarDireccionDto,
  DireccionResponseDto,
} from '../dtos/direccion.dto';

@ApiTags('direcciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('direcciones')
export class DireccionController {
  constructor(private readonly direccionService: DireccionService) {}

  // Aquí he listado todas las direcciones del usuario autenticado utilizando su ID del token.
  @Get()
  @ApiOperation({ summary: 'Listar direcciones del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de direcciones',
    type: [DireccionResponseDto],
  })
  async listarDirecciones(@Request() req): Promise<DireccionResponseDto[]> {
    const usuarioId = req.user.id;
    return this.direccionService.listarDirecciones(usuarioId);
  }

  // Aquí he expuesto la consulta de una dirección específica validando pertenencia del usuario.
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una dirección por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dirección encontrada',
    type: DireccionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async obtenerDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<DireccionResponseDto> {
    const usuarioId = req.user.id;
    return this.direccionService.obtenerDireccion(id, usuarioId);
  }

  // Aquí he permitido registrar una nueva dirección para el usuario autenticado con validación de datos.
  @Post()
  @ApiOperation({ summary: 'Crear una nueva dirección' })
  @ApiResponse({
    status: 201,
    description: 'Dirección creada',
    type: DireccionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async crearDireccion(
    @Body() crearDireccionDto: CrearDireccionDto,
    @Request() req,
  ): Promise<DireccionResponseDto> {
    const usuarioId = req.user.id;
    return this.direccionService.crearDireccion(usuarioId, crearDireccionDto);
  }

  // Aquí he habilitado actualizar una dirección existente del usuario asegurando su propiedad.
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una dirección' })
  @ApiResponse({
    status: 200,
    description: 'Dirección actualizada',
    type: DireccionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async actualizarDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarDireccionDto: ActualizarDireccionDto,
    @Request() req,
  ): Promise<DireccionResponseDto> {
    const usuarioId = req.user.id;
    return this.direccionService.actualizarDireccion(
      id,
      usuarioId,
      actualizarDireccionDto,
    );
  }

  // Aquí he gestionado la eliminación de una dirección del usuario y devuelto código 204 sin contenido.
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una dirección' })
  @ApiResponse({ status: 204, description: 'Dirección eliminada' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async eliminarDireccion(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    const usuarioId = req.user.id;
    return this.direccionService.eliminarDireccion(id, usuarioId);
  }
}
