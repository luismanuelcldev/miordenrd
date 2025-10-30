import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CategoriaService } from '../services/categoria.service';
import { CrearCategoriaDto } from '../dto/crear-categoria.dto';
import { ActualizarCategoriaDto } from '../dto/actualizar-categoria.dto';
import { CrearSubcategoriaDto } from '../dto/crear-subcategoria.dto';
import { ActualizarSubcategoriaDto } from '../dto/actualizar-subcategoria.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { Public } from '../decorators/public.decorator';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  // Aquí he listado las categorías disponibles como endpoint público sin autenticación.
  @Get()
  @Public()
  async listarCategorias() {
    return this.categoriaService.listar();
  }

  // Aquí he protegido la creación de categorías para roles con permisos, validando la entrada de datos.
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async crearCategoria(@Body() body: CrearCategoriaDto) {
    return this.categoriaService.crearCategoria(body);
  }

  // Aquí he permitido actualizar una categoría existente restringiendo el acceso por rol.
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async actualizarCategoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarCategoriaDto,
  ) {
    return this.categoriaService.actualizarCategoria(id, body);
  }

  // Aquí he gestionado la eliminación de una categoría reservándolo a administradores.
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  async eliminarCategoria(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.eliminarCategoria(id);
  }

  // Aquí he creado subcategorías bajo una categoría específica aplicando validaciones.
  @Post(':categoriaId/subcategorias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async crearSubcategoria(
    @Param('categoriaId', ParseIntPipe) categoriaId: number,
    @Body() body: Omit<CrearSubcategoriaDto, 'categoriaId'>,
  ) {
    return this.categoriaService.crearSubcategoria({ ...body, categoriaId });
  }

  // Aquí he habilitado la edición de subcategorías restringido a roles con permisos.
  @Patch('subcategorias/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async actualizarSubcategoria(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActualizarSubcategoriaDto,
  ) {
    return this.categoriaService.actualizarSubcategoria(id, body);
  }

  // Aquí he gestionado la eliminación de subcategorías reservándolo a administradores.
  @Delete('subcategorias/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR)
  async eliminarSubcategoria(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaService.eliminarSubcategoria(id);
  }
}
