import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { ReportesService } from '../services/reportes.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // Aquí he generado el reporte de ventas con filtros, disponible solo para administradores.
  @Get('ventas')
  @Roles(Rol.ADMINISTRADOR)
  async obtenerReporteVentas(@Query() query) {
    const data = await this.reportesService.obtenerReporteVentas(query);
    return {
      statusCode: 200,
      data,
    };
  }

  // Aquí he listado los productos más vendidos para análisis, restringido a administradores.
  @Get('productos-mas-vendidos')
  @Roles(Rol.ADMINISTRADOR)
  async productosMasVendidos(@Query() query) {
    const data = await this.reportesService.productosMasVendidos(query);
    return {
      statusCode: 200,
      data,
    };
  }

  // Aquí he entregado el reporte de usuarios activos con filtros, solo para administradores.
  @Get('usuarios-activos')
  @Roles(Rol.ADMINISTRADOR)
  async usuariosActivos(@Query() query: any) {
    const data = await this.reportesService.usuariosActivos(query);
    return {
      statusCode: 200,
      data,
    };
  }
}
