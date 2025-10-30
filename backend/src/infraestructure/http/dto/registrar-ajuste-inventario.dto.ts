// Aquí he definido el DTO para registrar ajustes de inventario controlando producto, cantidad, tipo y motivo opcional.
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

// Aquí he enumerado los tipos de ajuste que utilizo para diferenciar entradas, salidas y correcciones.
export enum TipoAjusteInventario {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
}

export class RegistrarAjusteInventarioDto {
  // Aquí he solicitado el ID del producto a ajustar validando que sea un entero positivo.
  @ApiProperty({
    description: 'Identificador del producto a ajustar',
    example: 1,
  })
  @IsInt()
  @Min(1, { message: 'El producto es requerido' })
  productoId: number;

  // Aquí he capturado la cantidad a ajustar permitiendo valores positivos (entrada) o negativos (salida).
  @ApiProperty({
    description:
      'Cantidad a ajustar (positiva para entradas, negativa para salidas)',
    example: 5,
  })
  @IsInt()
  cantidad: number;

  // Aquí he forzado que el tipo de ajuste sea uno de los valores permitidos por el dominio.
  @ApiProperty({
    enum: TipoAjusteInventario,
    description: 'Tipo de ajuste a registrar',
    example: TipoAjusteInventario.ENTRADA,
  })
  @IsEnum(TipoAjusteInventario, { message: 'El tipo de ajuste no es válido' })
  estado: TipoAjusteInventario;

  // Aquí he admitido un motivo opcional para dejar trazabilidad del ajuste realizado.
  @ApiProperty({
    description: 'Motivo del ajuste',
    example: 'Reposición de inventario',
    required: false,
  })
  @IsOptional()
  @IsString()
  motivo?: string;
}
