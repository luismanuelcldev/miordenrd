// Aquí he definido el DTO de actualización de categorías reutilizando el de creación en forma parcial.
import { PartialType } from '@nestjs/swagger';
import { CrearCategoriaDto } from './crear-categoria.dto';

export class ActualizarCategoriaDto extends PartialType(CrearCategoriaDto) {}
