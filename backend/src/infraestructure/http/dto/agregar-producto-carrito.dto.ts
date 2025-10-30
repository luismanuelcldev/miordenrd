// Aquí he definido el DTO para agregar un producto al carrito exigiendo identificador y cantidad válidos.
import { IsInt, Min } from 'class-validator';

export class AgregarProductoCarritoDto {
  // Aquí he solicitado el ID del producto asegurando que sea un entero positivo.
  @IsInt()
  @Min(1)
  productoId: number;

  // Aquí he requerido la cantidad mínima de una unidad por ítem.
  @IsInt()
  @Min(1)
  cantidad: number;
}
