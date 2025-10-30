// Aquí he definido el DTO para asignar un repartidor a un pedido con un comentario opcional.
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarRepartidorDto {
  // Aquí he solicitado el identificador del repartidor a asignar.
  @ApiProperty({
    description: 'ID del repartidor a asignar',
    example: 5,
  })
  @IsNumber()
  repartidorId: number;

  // Aquí he permitido un comentario opcional sobre la asignación.
  @ApiProperty({
    description: 'Comentario sobre la asignación',
    example: 'Repartidor asignado para entrega en zona centro',
    required: false,
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}
