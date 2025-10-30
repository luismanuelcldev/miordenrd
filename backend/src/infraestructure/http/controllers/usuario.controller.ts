import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { UsuarioService } from '../services/usuario.service';
import { CrearUsuarioDto } from '../dto/crear-usuario.dto';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ActualizarRolDto } from '../dto/actualizar-rol.dto';
import { ActualizarUsuarioAdminDto } from '../dto/actualizar-usuario-admin.dto';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  // Aquí he listado todos los usuarios registrados, restringido a administradores.
  @Get()
  @Roles(Rol.ADMINISTRADOR)
  async findAll() {
    return this.usuarioService.findAll();
  }

  // Aquí he expuesto la consulta de un usuario específico por ID solo para administradores.
  @Get(':id')
  @Roles(Rol.ADMINISTRADOR)
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.findById(id);
  }

  // Aquí he centralizado la creación de usuarios en Cognito y la sincronización local, solo para administradores.
  @Post()
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Req() req: any, @Body() body: CrearUsuarioDto) {
    return this.usuarioService.create(body, req.user);
  }

  // Aquí he permitido actualizar el rol de un usuario, controlado mediante guard de roles.
  @Patch(':id/rol')
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async actualizarRol(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarRolDto,
  ) {
    return this.usuarioService.actualizarRol(id, body.rol, req.user);
  }

  // Aquí he habilitado la actualización de datos del usuario por parte de administradores, validando la entrada.
  @Patch(':id')
  @Roles(Rol.ADMINISTRADOR)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  )
  async actualizarDatos(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarUsuarioAdminDto,
  ) {
    return this.usuarioService.actualizarDatos(id, body, req.user);
  }

  // Aquí he activado nuevamente a un usuario deshabilitado, restringido a administradores.
  @Patch(':id/activar')
  @Roles(Rol.ADMINISTRADOR)
  async activar(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.activar(id, req.user);
  }

  // Aquí he desactivado un usuario del sistema bajo control administrativo.
  @Patch(':id/desactivar')
  @Roles(Rol.ADMINISTRADOR)
  async desactivar(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.desactivar(id, req.user);
  }

  // Aquí he gestionado la eliminación de un usuario, operación reservada para administradores.
  @Delete(':id')
  @Roles(Rol.ADMINISTRADOR)
  async eliminar(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.eliminar(id, req.user);
  }
}
