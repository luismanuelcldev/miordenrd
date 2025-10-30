// Aquí he definido los DTOs para gestionar zonas de entrega, su polígono GeoJSON y las tarifas asociadas.
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Aquí he encapsulado la estructura mínima de un GeoJSON para recibir polígonos o multipolígonos.
class GeoJsonDto {
  @ApiProperty({
    enum: ['Polygon', 'MultiPolygon'],
    example: 'Polygon',
  })
  @IsString()
  @IsNotEmpty()
  type!: 'Polygon' | 'MultiPolygon';

  @ApiProperty({
    description:
      'Coordenadas siguiendo el estándar GeoJSON (lon, lat). Para MultiPolygon anidar por polígonos',
    example: [
      [
        [-99.135, 19.432],
        [-99.13, 19.437],
        [-99.125, 19.431],
        [-99.135, 19.432],
      ],
    ],
  })
  @IsArray()
  coordinates!: unknown;
}

// Aquí he modelado la estructura de tarifas que aplico por distancia dentro de una zona.
export class CrearTarifaZonaDto {
  @ApiProperty({
    example: 0,
    description:
      'Distancia mínima en kilómetros a la que aplica esta tarifa (incluyente)',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  distanciaMin: number;

  @ApiPropertyOptional({
    example: 10,
    description:
      'Distancia máxima en kilómetros a la que aplica esta tarifa (excluyente). Dejar vacío para sin límite.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanciaMax?: number;

  @ApiProperty({
    example: 3.5,
    description: 'Costo base en la moneda configurada para la zona',
  })
  @IsNumber()
  @Min(0)
  costoBase: number;

  @ApiPropertyOptional({
    example: 0.5,
    description:
      'Costo adicional por kilómetro recorrido. Dejar vacío para tarifa fija.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costoPorKm?: number;

  @ApiPropertyOptional({
    example: 1.5,
    description:
      'Recargo adicional fijo (ej. por condiciones especiales). Por defecto 0.',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  recargo?: number;
}

// Aquí he definido el DTO de creación de zonas con metadatos, cobertura y color opcional para mapas.
export class CrearZonaEntregaDto {
  @ApiProperty({
    example: 'Zona Centro',
    description: 'Nombre único que identifica la zona de entrega',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Cobertura del centro histórico',
    description: 'Descripción corta de la zona',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional({
    example: '#0EA5E9',
    description:
      'Color sugerido para visualizar la zona en el mapa (hexadecimal)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  color?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Permite habilitar o deshabilitar la zona',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @ApiProperty({
    type: GeoJsonDto,
    description: 'Polígono que define la cobertura de la zona',
  })
  @ValidateNested()
  @Type(() => GeoJsonDto)
  poligono: GeoJsonDto;

  @ApiPropertyOptional({
    example: 19.432608,
    description: 'Latitud del punto de referencia de la zona',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  centroideLatitud?: number;

  @ApiPropertyOptional({
    example: -99.133209,
    description: 'Longitud del punto de referencia de la zona',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  centroideLongitud?: number;

  @ApiPropertyOptional({
    example: 12,
    description:
      'Radio de cobertura (km) utilizado como referencia para validaciones',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  radioCoberturaKm?: number;

  @ApiPropertyOptional({
    type: [CrearTarifaZonaDto],
    description: 'Arreglo de tarifas aplicables a la zona',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearTarifaZonaDto)
  tarifas?: CrearTarifaZonaDto[];
}

export class ActualizarZonaEntregaDto extends PartialType(
  CrearZonaEntregaDto,
) {}

// Aquí he estandarizado la forma en que devuelvo una zona de entrega desde el API.
export class ZonaEntregaResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Zona Centro' })
  nombre: string;

  @ApiPropertyOptional()
  descripcion?: string | null;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiProperty({ example: true })
  activa: boolean;

  @ApiProperty({
    description: 'Polígono en formato GeoJSON',
  })
  poligono: unknown;

  @ApiPropertyOptional()
  centroideLatitud?: number | null;

  @ApiPropertyOptional()
  centroideLongitud?: number | null;

  @ApiPropertyOptional()
  radioCoberturaKm?: number | null;

  @ApiPropertyOptional({ type: [CrearTarifaZonaDto] })
  tarifas?: (CrearTarifaZonaDto & { id: number })[];

  @ApiProperty()
  creadoEn: string;

  @ApiProperty()
  actualizadoEn: string;
}

// Aquí he definido el DTO para calcular la tarifa a partir de un punto geográfico opcionalmente restringido a una zona.
export class CalcularTarifaZonaDto {
  @ApiProperty({
    example: 19.432608,
    description: 'Latitud del punto a evaluar',
  })
  @IsNumber()
  @Min(-90)
  latitud: number;

  @ApiProperty({
    example: -99.133209,
    description: 'Longitud del punto a evaluar',
  })
  @IsNumber()
  @Min(-180)
  longitud: number;

  @ApiPropertyOptional({
    example: 1,
    description:
      'Identificador de la zona preferida. Si se envía, se valida que el punto pertenezca a ella.',
  })
  @IsOptional()
  @IsNumber()
  zonaId?: number;
}
