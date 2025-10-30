import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
  Headers,
} from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { Rol } from '../../../domain/entities/usuario';
import { PagosService } from '../services/pagos.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Pagos')
@Controller('pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // Aquí he procesado pagos externos (PayPal, tarjeta, etc.) para usuarios autenticados con validación de datos.
  @Post('externo')
  @ApiOperation({ summary: 'Procesar pago externo' })
  @ApiResponse({ status: 200, description: 'Pago procesado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de pago inválidos' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async procesarPagoExterno(@Body() body: any) {
    return await this.pagosService.procesarPagoExterno(body);
  }

  // Aquí he registrado pagos internos limitando el acceso a administradores y empleados.
  @Post('interno')
  @Roles(Rol.ADMINISTRADOR, Rol.EMPLEADO)
  @ApiOperation({ summary: 'Registrar pago interno' })
  @ApiResponse({ status: 200, description: 'Pago registrado exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async registrarPago(@Body() body: any) {
    return await this.pagosService.registrarPago(body);
  }

  // Aquí he capturado pagos de PayPal a partir del identificador de orden proporcionado.
  @Post('paypal/capturar/:orderId')
  @ApiOperation({ summary: 'Capturar pago de PayPal' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden de PayPal' })
  @ApiResponse({ status: 200, description: 'Pago capturado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al capturar el pago' })
  async capturarPagoPayPal(@Param('orderId') orderId: string) {
    return await this.pagosService.capturarPagoPayPal(orderId);
  }

  // Aquí he procesado el webhook de PayPal verificando encabezados y contenido para actualizar estados de pago.
  @Post('paypal/webhook')
  @ApiOperation({ summary: 'Procesar webhook de PayPal' })
  @ApiResponse({ status: 200, description: 'Webhook procesado exitosamente' })
  async procesarWebhookPayPal(
    @Body() webhookData: any,
    @Headers() headers: any,
  ) {
    return await this.pagosService.procesarWebhookPayPal(webhookData, headers);
  }

  // Aquí he expuesto el historial de pagos de un pedido específico para facilitar auditoría y soporte.
  @Get('pedido/:pedidoId')
  @ApiOperation({ summary: 'Obtener historial de pagos de un pedido' })
  @ApiParam({ name: 'pedidoId', description: 'ID del pedido' })
  @ApiResponse({
    status: 200,
    description: 'Historial de pagos obtenido exitosamente',
  })
  async obtenerHistorialPagos(@Param('pedidoId') pedidoId: string) {
    return await this.pagosService.obtenerHistorialPagos(parseInt(pedidoId));
  }
}
