// Aquí he definido el DTO de creación de categorías para normalizar nombre, descripción e imagen opcional.
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class CrearCategoriaDto {
  // Aquí he capturado el nombre de la categoría con validaciones de longitud.
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Electrodomésticos',
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
  nombre: string;

  // Aquí he permitido una descripción opcional acotada en longitud.
  @ApiProperty({
    description: 'Descripción de la categoría',
    example: 'Artículos eléctricos para el hogar',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'La descripción no puede superar los 255 caracteres',
  })
  descripcion?: string;

  // Aquí he aceptado una URL opcional de imagen representativa de la categoría.
  @ApiProperty({
    description: 'URL de la imagen de la categoría',
    example: 'https://ejemplo.com/categorias/hogar.jpg',
    required: false,
  })
  @IsOptional()
  @ValidateIf(
    (_, value) => value !== undefined && value !== null && value !== '',
  )
  @IsString()
  @IsUrl(
    { require_tld: false },
    { message: 'Debe proporcionar una URL válida' },
  )
  imagenUrl?: string | null;
}
