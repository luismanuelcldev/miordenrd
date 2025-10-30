// Aquí he definido el DTO para editar la cantidad de un producto ya existente en el carrito.
import { IsInt, Min } from 'class-validator';

export class EditarProductoCarritoDto {
  // Aquí he exigido una cantidad nueva mínima de una unidad.
  @IsInt()
  @Min(1)
  cantidad: number;
}
