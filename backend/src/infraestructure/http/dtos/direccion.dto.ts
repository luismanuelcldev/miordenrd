// Aquí he agrupado los DTOs relacionados a direcciones para creación, actualización y respuesta.
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

// Aquí he definido el DTO para crear direcciones validando campos de ubicación y referencias opcionales.
export class CrearDireccionDto {
  @ApiProperty({
    example: 'Calle Principal 123',
    description: 'Calle y número',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  calle: string;

  @ApiProperty({ example: 'Ciudad de México', description: 'Ciudad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ciudad: string;

  @ApiProperty({ example: 'México', description: 'País' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pais: string;

  @ApiPropertyOptional({ example: '01000', description: 'Código postal' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigoPostal?: string;

  @ApiPropertyOptional({
    example: 'Edificio azul, apartamento 4B',
    description: 'Referencias adicionales para ubicar la dirección',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  referencias?: string;

  @ApiPropertyOptional({
    example: 19.432608,
    description: 'Latitud geográfica de la dirección',
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @ApiPropertyOptional({
    example: -99.133209,
    description: 'Longitud geográfica de la dirección',
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Identificador de la zona de entrega seleccionada. Si no se envía, se determinará automáticamente según las coordenadas',
  })
  @IsOptional()
  @IsNumber()
  zonaId?: number;
}

export class ActualizarDireccionDto {
  // Aquí he permitido actualizar de forma opcional los campos de dirección y coordenadas.
  @ApiPropertyOptional({
    example: 'Calle Principal 123',
    description: 'Calle y número',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  calle?: string;

  @ApiPropertyOptional({ example: 'Ciudad de México', description: 'Ciudad' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ciudad?: string;

  @ApiPropertyOptional({ example: 'México', description: 'País' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  pais?: string;

  @ApiPropertyOptional({ example: '01000', description: 'Código postal' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  codigoPostal?: string;

  @ApiPropertyOptional({
    example: 'Edificio azul, apartamento 4B',
    description: 'Referencias adicionales para ubicar la dirección',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  referencias?: string;

  @ApiPropertyOptional({
    example: 19.432608,
    description: 'Latitud geográfica de la dirección',
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @ApiPropertyOptional({
    example: -99.133209,
    description: 'Longitud geográfica de la dirección',
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Identificador de la zona de entrega seleccionada. Si no se envía, se determinará automáticamente según las coordenadas',
  })
  @IsOptional()
  @IsNumber()
  zonaId?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Marca si la dirección fue validada contra una zona de entrega. Se recalculará automáticamente al actualizar coordenadas.',
  })
  @IsOptional()
  @IsBoolean()
  validada?: boolean;
}

// Aquí he definido el DTO de respuesta con la forma estandarizada que devuelvo desde el API.
export class DireccionResponseDto {
  @ApiProperty({ example: 1, description: 'ID de la dirección' })
  id: number;

  @ApiProperty({
    example: 'Calle Principal 123',
    description: 'Calle y número',
  })
  calle: string;

  @ApiProperty({ example: 'Ciudad de México', description: 'Ciudad' })
  ciudad: string;

  @ApiProperty({ example: 'México', description: 'País' })
  pais: string;

  @ApiPropertyOptional({ example: '01000', description: 'Código postal' })
  codigoPostal?: string;

  @ApiPropertyOptional({
    example: 'Edificio azul, apartamento 4B',
    description: 'Referencias adicionales para ubicar la dirección',
  })
  referencias?: string;

  @ApiPropertyOptional({
    example: 19.432608,
    description: 'Latitud geográfica de la dirección',
  })
  latitud?: number;

  @ApiPropertyOptional({
    example: -99.133209,
    description: 'Longitud geográfica de la dirección',
  })
  longitud?: number;

  @ApiProperty({
    example: false,
    description:
      'Indica si la dirección fue validada dentro de una zona de entrega activa',
  })
  validada: boolean;

  @ApiPropertyOptional({
    example: 2,
    description: 'Identificador de la zona de entrega asociada',
  })
  zonaId?: number;

  @ApiPropertyOptional({
    example: { id: 2, nombre: 'Zona Centro', color: '#00AEEF' },
    description: 'Datos básicos de la zona asociada a la dirección',
  })
  zona?: {
    id: number;
    nombre: string;
    color?: string | null;
    activa: boolean;
  };

  @ApiProperty({ example: 1, description: 'ID del usuario' })
  usuarioId: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de creación',
  })
  creadoEn: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Fecha de actualización',
  })
  actualizadoEn: string;
}
