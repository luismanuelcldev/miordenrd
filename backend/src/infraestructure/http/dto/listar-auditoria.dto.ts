// Aquí he definido el DTO de filtros para listar registros de auditoría con paginación y rangos de fecha.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ListarAuditoriaDto {
  // Aquí he filtrado por módulo o sección del sistema.
  @ApiPropertyOptional({
    description: 'Filtro por módulo o área del sistema',
    example: 'PEDIDOS',
  })
  @IsOptional()
  @IsString()
  modulo?: string;

  // Aquí he filtrado por la acción registrada en auditoría.
  @ApiPropertyOptional({
    description: 'Filtro por tipo de acción registrada',
    example: 'ACTUALIZAR_ESTADO',
  })
  @IsOptional()
  @IsString()
  accion?: string;

  // Aquí he filtrado por el usuario que ejecutó la acción.
  @ApiPropertyOptional({
    description: 'Identificador de usuario que ejecutó la acción',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  // Aquí he definido la fecha inicial del rango de búsqueda.
  @ApiPropertyOptional({
    description: 'Fecha inicial en formato ISO 8601',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  // Aquí he definido la fecha final del rango de búsqueda.
  @ApiPropertyOptional({
    description: 'Fecha final en formato ISO 8601',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  // Aquí he controlado la página actual para la paginación del listado.
  @ApiPropertyOptional({
    description: 'Número de página (paginación)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Aquí he configurado el tamaño de página con un valor por defecto.
  @ApiPropertyOptional({
    description: 'Cantidad de registros por página (máximo 100)',
    default: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
