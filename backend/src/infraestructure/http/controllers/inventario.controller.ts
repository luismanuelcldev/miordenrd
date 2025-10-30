import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InventarioService } from '../services/inventario.service';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegistrarAjusteInventarioDto } from '../dto/registrar-ajuste-inventario.dto';

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  // Aquí he expuesto la consulta de stock de productos para usuarios autenticados.
  @Get('stock')
  async consultarStock() {
    const stock = await this.inventarioService.consultarStock();
    return {
      statusCode: 200,
      data: stock,
    };
  }

  // Aquí he permitido registrar ajustes de inventario limitando el acceso a administradores y empleados.
  @Post('ajuste')
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async registrarAjuste(@Body() body: RegistrarAjusteInventarioDto) {
    const resultado = await this.inventarioService.registrarAjuste(body);
    return {
      statusCode: 200,
      data: resultado,
    };
  }
}
