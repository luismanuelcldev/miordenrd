// Aquí he definido el DTO para procesar el checkout recopilando dirección, método de pago y notas opcionales.
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MetodoPago } from '../../../domain/entities/pedido';

export class ProcesarCheckoutDto {
  // Aquí he requerido la dirección de entrega seleccionada por el usuario.
  @IsInt()
  @Min(1)
  direccionId: number;

  // Aquí he exigido un método de pago válido según el dominio.
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  // Aquí he habilitado observaciones opcionales para instrucciones de envío.
  @IsOptional()
  @IsString()
  observaciones?: string;
}
