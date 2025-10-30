import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CheckoutService } from '../services/checkout.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProcesarCheckoutDto } from '../dto/procesar-checkout.dto';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // Aquí he orquestado el proceso de compra del usuario autenticado aplicando validaciones de entrada.
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  procesarCompra(@Req() req, @Body() body: ProcesarCheckoutDto) {
    const usuarioId = req.user.id;
    return this.checkoutService.procesarCompra(usuarioId, body, req.user);
  }
}
