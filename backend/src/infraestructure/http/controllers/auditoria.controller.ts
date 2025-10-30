import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from '../services/auditoria.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { ListarAuditoriaDto } from '../dto/listar-auditoria.dto';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  // Aquí he listado los registros de auditoría con filtros, acceso exclusivo para administradores.
  @Get()
  @Roles(Rol.ADMINISTRADOR)
  async listar(@Query() query: ListarAuditoriaDto) {
    return this.auditoriaService.listar(query);
  }

  // Aquí he expuesto el catálogo de módulos auditables para usarse en filtros.
  @Get('modulos')
  @Roles(Rol.ADMINISTRADOR)
  async modulos() {
    const data = await this.auditoriaService.listarModulos();
    return { data };
  }

  // Aquí he expuesto el catálogo de acciones auditadas disponibles para consulta.
  @Get('acciones')
  @Roles(Rol.ADMINISTRADOR)
  async acciones() {
    const data = await this.auditoriaService.listarAcciones();
    return { data };
  }
}
