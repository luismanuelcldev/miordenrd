import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { ConfiguracionService } from '../services/configuracion.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { ActualizarConfiguracionDto } from '../dto/actualizar-configuracion.dto';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  // Aquí he expuesto la configuración del sistema para administración, protegida por roles.
  @Get()
  @Roles(Rol.ADMINISTRADOR)
  async obtener() {
    return this.configuracionService.obtener();
  }

  // Aquí he permitido actualizar parámetros globales del sistema con validación y auditoría de usuario.
  @Put()
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async actualizar(@Req() req: any, @Body() body: ActualizarConfiguracionDto) {
    return this.configuracionService.actualizar(body, req.user);
  }
}
