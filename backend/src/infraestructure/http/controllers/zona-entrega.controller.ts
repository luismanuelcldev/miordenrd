import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ActualizarZonaEntregaDto,
  CalcularTarifaZonaDto,
  CrearZonaEntregaDto,
} from '../dtos/zona-entrega.dto';
import { ZonaEntregaService } from '../services/zona-entrega.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { Public } from '../decorators/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('zonas-entrega')
@Controller('zonas-entrega')
export class ZonaEntregaController {
  constructor(private readonly zonaService: ZonaEntregaService) {}

  // Aquí he listado las zonas de entrega disponibles permitiendo filtrar por estado activo.
  @Get()
  @Public()
  async listar(
    @Query('soloActivas', new ParseBoolPipe({ optional: true }))
    soloActivas?: boolean,
  ) {
    return this.zonaService.listarTodas(!(soloActivas ?? false));
  }

  // Aquí he expuesto la consulta de una zona de entrega por su identificador.
  @Get(':id')
  @Public()
  async obtener(@Param('id', ParseIntPipe) id: number) {
    return this.zonaService.obtenerPorId(id);
  }

  // Aquí he protegido la creación de zonas de entrega para administradores con validaciones.
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async crear(@Body() dto: CrearZonaEntregaDto) {
    return this.zonaService.crear(dto);
  }

  // Aquí he habilitado actualizar una zona de entrega existente aplicando control de acceso.
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarZonaEntregaDto,
  ) {
    return this.zonaService.actualizar(id, dto);
  }

  // Aquí he gestionado la eliminación de zonas de entrega exclusivamente por administradores.
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.zonaService.eliminar(id);
    return { eliminado: true };
  }

  // Aquí he calculado el costo de envío estimado con base en la zona de entrega recibida.
  @Post('calcular')
  @Public()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async calcularTarifa(@Body() dto: CalcularTarifaZonaDto) {
    return this.zonaService.calcularTarifa(dto);
  }
}
