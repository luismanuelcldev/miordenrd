// Aquí he definido el DTO para actualizar la configuración del sistema cubriendo branding, notificaciones y reglas de negocio.
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ActualizarConfiguracionDto {
  // Aquí he configurado el nombre visible de la tienda.
  @IsString()
  @MaxLength(150)
  nombreTienda: string;

  // Aquí he permitido una descripción general opcional.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  // Aquí he establecido el email de contacto oficial.
  @IsEmail()
  email: string;

  // Aquí he admitido un teléfono de contacto opcional.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  // Aquí he permitido especificar la dirección física opcional.
  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;

  // Aquí he activado o desactivado notificaciones por eventos de pedidos.
  @IsBoolean()
  notificacionesPedidos: boolean;

  // Aquí he activado o desactivado notificaciones por eventos de stock.
  @IsBoolean()
  notificacionesStock: boolean;

  // Aquí he activado o desactivado notificaciones relacionadas a clientes.
  @IsBoolean()
  notificacionesClientes: boolean;

  // Aquí he indicado si aplico autenticación de doble factor en el panel.
  @IsBoolean()
  autenticacionDosFactor: boolean;

  // Aquí he definido la expiración de sesión (minutos) asegurando un mínimo.
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  sesionExpiracion: number;

  // Aquí he definido el umbral de envío gratis a partir de un monto.
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  envioGratis: number;

  // Aquí he configurado el costo de envío base.
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoEnvio: number;

  // Aquí he permitido declarar una ventana estimada de entrega.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tiempoEntrega?: string;

  // Aquí he configurado el IVA como porcentaje (p.ej. 0.21).
  @Type(() => Number)
  @IsNumber()
  iva: number;

  // Aquí he indicado la moneda utilizada (código corto).
  @IsString()
  @MaxLength(10)
  moneda: string;

  // Aquí he definido el color primario de la marca.
  @IsString()
  @MaxLength(20)
  colorPrimario: string;

  // Aquí he definido el color secundario de la marca.
  @IsString()
  @MaxLength(20)
  colorSecundario: string;

  // Aquí he permitido una URL opcional para el logo.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;
}
