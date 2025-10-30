// Aquí he definido el DTO para actualizar productos permitiendo campos opcionales con las mismas reglas de creación.
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
  IsUrl,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarProductoDto {
  // Aquí he permitido cambiar el nombre del producto respetando el máximo permitido.
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Producto Actualizado',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre?: string;

  // Aquí he habilitado actualizar la descripción sin exceder el límite de caracteres.
  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Descripción actualizada del producto',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  // Aquí he permitido ajustar el precio verificando que sea no negativo.
  @ApiProperty({
    description: 'Precio del producto',
    example: 29.99,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  precio?: number;

  // Aquí he permitido modificar el stock asegurando un mínimo de cero.
  @ApiProperty({
    description: 'Stock disponible del producto',
    example: 50,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El stock debe ser mayor o igual a 0' })
  stock?: number;

  // Aquí he permitido cambiar la imagen del producto validando que sea una URL correcta.
  @ApiProperty({
    description: 'URL de la imagen del producto',
    example: 'https://ejemplo.com/imagen.jpg',
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

  // Aquí he permitido reasignar la categoría del producto si es necesario.
  @ApiProperty({
    description: 'ID de la categoría del producto',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  categoriaId?: number;

  // Aquí he permitido reasignar la subcategoría.
  @ApiProperty({
    description: 'ID de la subcategoría del producto',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  subcategoriaId?: number;

  // Aquí he permitido activar o desactivar la condición de oferta.
  @ApiProperty({
    description: 'Indica si el producto está en oferta',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enOferta?: boolean;

  // Aquí he permitido actualizar el precio de oferta respetando reglas de valor.
  @ApiProperty({
    description: 'Precio especial cuando el producto está en oferta',
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de oferta debe ser mayor o igual a 0' })
  precioOferta?: number;
}
