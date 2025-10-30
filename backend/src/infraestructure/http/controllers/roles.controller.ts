import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { RolesService } from '../services/roles.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Aquí he listado todos los roles disponibles restringiendo el acceso a administradores.
  @Get()
  @Roles(Rol.ADMINISTRADOR)
  obtenerRoles() {
    return this.rolesService.obtenerRoles();
  }

  // Aquí he asignado un rol a un usuario asegurando la validación y el control de acceso.
  @Post('asignar')
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  asignarRol(@Body() body: { usuarioId: number; rol: Rol }) {
    return this.rolesService.asignarRol(body.usuarioId, body.rol);
  }

  // Aquí he editado el rol de un usuario existente, operación reservada a administradores.
  @Put('editar/:usuarioId')
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  editarRol(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Body() body: { nuevoRol: Rol },
  ) {
    return this.rolesService.editarRol(usuarioId, body.nuevoRol);
  }

  @Delete('eliminar/:usuarioId')
  @Roles(Rol.ADMINISTRADOR)
  eliminarRol(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.rolesService.eliminarRol(usuarioId);
  }
}
