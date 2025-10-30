import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { MetodoPago } from '../../../domain/entities/pedido';

interface PayPalCreateOrderRequest {
  intent: 'CAPTURE';
  purchase_units: Array<{
    amount: {
      currency_code: string;
      value: string;
    };
    description?: string;
  }>;
  application_context?: {
    return_url?: string;
    cancel_url?: string;
  };
}

// Aquí he integrado pagos externos (PayPal y tarjeta mock) y registros internos de transacciones.
@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);
  private readonly paypalBaseUrl: string;
  private readonly paypalClientId: string;
  private readonly paypalClientSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.paypalBaseUrl =
      this.configService.get('NODE_ENV') === 'production'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com';
    this.paypalClientId = this.configService.get('PAYPAL_CLIENT_ID');
    this.paypalClientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
  }

  // Aquí he creado una orden en PayPal y persistido la transacción en estado pendiente.
  async crearOrdenPayPal(monto: number, descripcion: string, pedidoId: number) {
    try {
      const accessToken = await this.obtenerAccessTokenPayPal();

      const orderData: PayPalCreateOrderRequest = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: monto.toFixed(2),
            },
            description: descripcion,
          },
        ],
        application_context: {
          return_url: `${this.configService.get('FRONTEND_URL')}/checkout/success`,
          cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout/cancel`,
        },
      };

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'PayPal-Request-Id': `pedido-${pedidoId}-${Date.now()}`,
          },
        },
      );

      // Guardar la orden en la base de datos
      await this.prisma.transaccionPago.create({
        data: {
          pedidoId,
          metodoPago: MetodoPago.PAYPAL,
          monto,
          estado: 'PENDIENTE',
          referenciaExterna: response.data.id,
          datosAdicionales: {
            paypalOrderId: response.data.id,
            status: response.data.status,
          },
        },
      });

      return {
        id: response.data.id,
        status: response.data.status,
        links: response.data.links,
      };
    } catch (error) {
      this.logger.error('Error creando orden PayPal:', error);
      throw new BadRequestException('Error al crear la orden de pago');
    }
  }

  // Aquí he capturado una orden de PayPal y actualizo el estado a completado.
  async capturarPagoPayPal(orderId: string) {
    try {
      const accessToken = await this.obtenerAccessTokenPayPal();

      const response = await axios.post(
        `${this.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Actualizar la transacción en la base de datos
      await this.prisma.transaccionPago.updateMany({
        where: { referenciaExterna: orderId },
        data: {
          estado: 'COMPLETADO',
          datosAdicionales: {
            paypalOrderId: orderId,
            status: response.data.status,
            captureId:
              response.data.purchase_units[0]?.payments?.captures?.[0]?.id,
          },
        },
      });

      return {
        id: response.data.id,
        status: response.data.status,
        captureId: response.data.purchase_units[0]?.payments?.captures?.[0]?.id,
      };
    } catch (error) {
      this.logger.error('Error capturando pago PayPal:', error);
      throw new BadRequestException('Error al capturar el pago');
    }
  }

  // Aquí he centralizado el flujo de pagos externos despachando por método.
  async procesarPagoExterno(datosPago: any) {
    const { metodo, monto, pedidoId, datosAdicionales } = datosPago;

    switch (metodo) {
      case 'paypal':
        return await this.crearOrdenPayPal(
          monto,
          datosAdicionales.descripcion,
          pedidoId,
        );

      case 'tarjeta':
        return await this.procesarPagoTarjeta(datosPago);

      default:
        throw new BadRequestException('Método de pago no soportado');
    }
  }

  // Aquí he registrado un pago interno validando la existencia del pedido asociado.
  async registrarPago(datosPago: any) {
    const { pedidoId, metodo, monto, referencia, observaciones } = datosPago;

    // Verificar que el pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    // Crear transacción de pago
    const transaccion = await this.prisma.transaccionPago.create({
      data: {
        pedidoId,
        metodoPago: metodo as MetodoPago,
        monto,
        estado: 'COMPLETADO',
        referenciaExterna: referencia,
        datosAdicionales: {
          observaciones,
          registradoPor: 'admin', // En un caso real, usar el ID del usuario
        },
      },
    });

    return {
      mensaje: 'Pago registrado correctamente',
      transaccion,
    };
  }

  // Aquí he procesado el webhook de PayPal (firma pendiente) para eventos relevantes.
  async procesarWebhookPayPal(webhookData: any, headers: any) {
    void headers;
    try {
      // Verificar la firma del webhook (implementar según documentación de PayPal)
      const eventType = webhookData.event_type;

      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        const orderId =
          webhookData.resource?.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          await this.capturarPagoPayPal(orderId);
        }
      }

      return { mensaje: 'Webhook procesado correctamente' };
    } catch (error) {
      this.logger.error('Error procesando webhook PayPal:', error);
      throw new BadRequestException('Error al procesar el webhook');
    }
  }

  // Aquí he recuperado el historial de transacciones de un pedido ordenadas por creación.
  async obtenerHistorialPagos(pedidoId: number) {
    const transacciones = await this.prisma.transaccionPago.findMany({
      where: { pedidoId },
      orderBy: { creadoEn: 'desc' },
    });

    return transacciones;
  }

  // Aquí he obtenido un access token OAuth de PayPal usando credenciales del entorno.
  private async obtenerAccessTokenPayPal(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.paypalBaseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64')}`,
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error('Error obteniendo access token PayPal:', error);
      throw new BadRequestException('Error de autenticación con PayPal');
    }
  }

  // Aquí he simulado el procesamiento de tarjeta y registrada la transacción como completada.
  private async procesarPagoTarjeta(datosPago: any) {
    // Simulación de procesamiento de tarjeta
    const { numeroTarjeta, cvv, fechaVencimiento, monto, pedidoId } = datosPago;

    // Validaciones básicas
    if (!numeroTarjeta || !cvv || !fechaVencimiento) {
      throw new BadRequestException('Datos de tarjeta incompletos');
    }

    // Simular procesamiento
    const transaccionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Guardar transacción
    await this.prisma.transaccionPago.create({
      data: {
        pedidoId,
        metodoPago: MetodoPago.TARJETA,
        monto,
        estado: 'COMPLETADO',
        referenciaExterna: transaccionId,
        datosAdicionales: {
          ultimos4Digitos: numeroTarjeta.slice(-4),
          tipoTarjeta: this.detectarTipoTarjeta(numeroTarjeta),
        },
      },
    });

    return {
      id: transaccionId,
      status: 'COMPLETED',
      mensaje: 'Pago con tarjeta procesado exitosamente',
    };
  }

  // Aquí he detectado el tipo de tarjeta de forma aproximada a partir del BIN.
  private detectarTipoTarjeta(numero: string): string {
    const numeroLimpio = numero.replace(/\D/g, '');

    if (numeroLimpio.startsWith('4')) return 'Visa';
    if (numeroLimpio.startsWith('5') || numeroLimpio.startsWith('2'))
      return 'Mastercard';
    if (numeroLimpio.startsWith('3')) return 'American Express';
    if (numeroLimpio.startsWith('6')) return 'Discover';

    return 'Desconocida';
  }
}
