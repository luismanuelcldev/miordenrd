import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AgregarProductoCarritoDto } from '../dto/agregar-producto-carrito.dto';
import { EditarProductoCarritoDto } from '../dto/editar-producto-carrito.dto';
import { CarritoService } from '../services/carrito.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('carrito')
@UseGuards(JwtAuthGuard)
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  // Aquí he expuesto el carrito del usuario autenticado obteniéndolo por su identificador.
  @Get()
  obtenerCarrito(@Req() req) {
    const usuarioId = req.user.id;
    // Se delega la lógica al servicio de carrito
    return this.carritoService.obtenerCarrito(usuarioId);
  }

  // Aquí he permitido agregar un producto al carrito aplicando validaciones sobre la entrada.
  @Post('agregar')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  agregarProducto(@Req() req, @Body() body: AgregarProductoCarritoDto) {
    const usuarioId = req.user.id;
    return this.carritoService.agregarProducto(
      usuarioId,
      body.productoId,
      body.cantidad,
    );
  }

  // Aquí he habilitado editar la cantidad de un ítem del carrito del usuario autenticado.
  @Put('editar/:itemId')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  editarProducto(
    @Req() req,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: EditarProductoCarritoDto,
  ) {
    const usuarioId = req.user.id;
    return this.carritoService.editarProducto(usuarioId, itemId, body.cantidad);
  }

  // Aquí he gestionado la eliminación de un producto del carrito del usuario actual.
  @Delete('eliminar/:itemId')
  eliminarProducto(@Req() req, @Param('itemId', ParseIntPipe) itemId: number) {
    const usuarioId = req.user.id;
    return this.carritoService.eliminarProducto(usuarioId, itemId);
  }
}
