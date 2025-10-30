import { Inject, Injectable } from '@nestjs/common';
import { PedidoQueryRepository } from '../../ports/pedidoQueryRepository';

@Injectable()
// Ofrezco la consulta puntual del detalle de un pedido por su identificador.
export class ObtenerPedido {
  // Inyecto el repositorio de lectura para no acoplarme a la capa de datos.
  constructor(
    @Inject('PedidoQueryRepository')
    private readonly queryRepository: PedidoQueryRepository,
  ) {}

  // Delego la obtención del detalle y retorno tal cual el repositorio lo provee.
  async ejecutar(id: number) {
    return this.queryRepository.obtenerPorId(id);
  }
}
