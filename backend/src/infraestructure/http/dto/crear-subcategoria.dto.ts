// Aquí he definido el DTO de creación de subcategorías vinculando nombre, descripción y la categoría padre.
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearSubcategoriaDto {
  // Aquí he capturado el nombre de la subcategoría con límites de longitud.
  @ApiProperty({
    description: 'Nombre de la subcategoría',
    example: 'Refrigeradoras',
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre: string;

  // Aquí he permitido una descripción opcional y concisa de la subcategoría.
  @ApiProperty({
    description: 'Descripción de la subcategoría',
    example: 'Electrodomésticos para refrigeración',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La descripción no puede superar los 255 caracteres',
  })
  descripcion?: string;

  // Aquí he requerido la categoría padre asegurando que sea un identificador válido.
  @ApiProperty({
    description: 'Identificador de la categoría a la que pertenece',
    example: 1,
  })
  @IsInt()
  @Min(1, { message: 'Debe asociar la subcategoría a una categoría válida' })
  categoriaId: number;
}
