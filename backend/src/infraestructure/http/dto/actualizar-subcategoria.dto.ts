// Aquí he definido el DTO de actualización de subcategorías reutilizando el de creación con campos opcionales.
import { PartialType } from '@nestjs/swagger';
import { CrearSubcategoriaDto } from './crear-subcategoria.dto';

export class ActualizarSubcategoriaDto extends PartialType(
  CrearSubcategoriaDto,
) {}
