// Aquí he definido el DTO para actualizar el estado de un pedido con soporte de comentario opcional.
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoPedido } from '../../../domain/entities/pedido';

export class ActualizarEstadoPedidoDto {
  // Aquí he exigido un nuevo estado válido según el dominio de pedidos.
  @ApiProperty({
    description: 'Nuevo estado del pedido',
    enum: EstadoPedido,
    example: EstadoPedido.EN_PREPARACION,
  })
  @IsEnum(EstadoPedido, {
    message: 'El estado debe ser uno de los valores válidos',
  })
  estado: EstadoPedido;

  // Aquí he habilitado agregar un comentario descriptivo sobre el cambio.
  @ApiProperty({
    description: 'Comentario sobre el cambio de estado',
    example: 'Pedido en proceso de preparación',
    required: false,
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}
