import { Pedido } from '../../domain/entities/pedido';

export interface RepositorioPedido {
  // Persiste la entidad Pedido y devuelve su representación almacenada.
  guardar(pedido: Pedido): Promise<Pedido>;
  // Recupero un pedido por id o null si no existe.
  encontrarPorId(id: number): Promise<Pedido | null>;
  // Enumero pedidos asociados a un usuario específico.
  listarPorUsuario(usuarioId: number): Promise<Pedido[]>;
  // Actualizo el estado o datos del pedido y retorno la versión persistida.
  actualizar(pedido: Pedido): Promise<Pedido>;
  // Inserto en bloque los ítems que pertenecen a un pedido dado.
  guardarItems(
    pedidoId: number,
    items: { productoId: number; cantidad: number; precio: number }[],
  ): Promise<void>;
}
