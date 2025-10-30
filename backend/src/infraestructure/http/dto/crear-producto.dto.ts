// Aquí he definido el DTO para crear productos aplicando validaciones de negocio y formatos esperados.
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
  MaxLength,
  IsUrl,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrearProductoDto {
  // Aquí he capturado el nombre del producto con límites claros de longitud.
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Producto Ejemplo',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  // Aquí he permitido una descripción opcional con tope de caracteres para mantenerla acotada.
  @ApiProperty({
    description: 'Descripción del producto',
    example: 'Descripción del producto',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  // Aquí he requerido el precio con precisión de dos decimales y valor mínimo cero.
  @ApiProperty({
    description: 'Precio del producto',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  precio: number;

  // Aquí he permitido definir el stock inicial asegurando que no sea negativo.
  @ApiProperty({
    description: 'Stock inicial del producto',
    example: 10,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'El stock debe ser mayor o igual a 0' })
  stock?: number;

  // Aquí he aceptado una URL opcional de imagen validando su formato.
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

  // Aquí he referenciado opcionalmente la categoría a la que pertenece el producto.
  @ApiProperty({
    description: 'ID de la categoría del producto',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  categoriaId?: number;

  // Aquí he referenciado opcionalmente la subcategoría asociada.
  @ApiProperty({
    description: 'ID de la subcategoría del producto',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  subcategoriaId?: number;

  // Aquí he indicado si el producto está en oferta como bandera opcional.
  @ApiProperty({
    description: 'Indica si el producto está en oferta',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enOferta?: boolean;

  // Aquí he permitido un precio de oferta válido cuando el producto esté marcado en oferta.
  @ApiProperty({
    description: 'Precio especial cuando el producto está en oferta',
    example: 19.99,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'El precio de oferta debe ser mayor o igual a 0' })
  precioOferta?: number;
}
