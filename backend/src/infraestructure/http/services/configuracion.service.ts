import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { ActualizarConfiguracionDto } from '../dto/actualizar-configuracion.dto';
import { AuditoriaService } from './auditoria.service';

// Aquí he gestionado la configuración global del sistema con valores por defecto y auditoría.
@Injectable()
export class ConfiguracionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // Aquí he definido un set de valores por defecto para inicializar la configuración.
  private valoresPorDefecto() {
    return {
      id: 1,
      nombreTienda: 'Mi Orden RD',
      descripcion: 'La mejor tienda online especializada en compras en República Dominicana.',
      email: 'contacto@miordenrd.com',
      telefono: '+1 (829) 727-3392',
      direccion: 'Santo Domingo, República Dominicana',
      notificacionesPedidos: true,
      notificacionesStock: true,
      notificacionesClientes: false,
      autenticacionDosFactor: false,
      sesionExpiracion: 24,
      envioGratis: 0,
      costoEnvio: 0,
      tiempoEntrega: '2-4 días laborables',
      iva: 18,
      moneda: 'RD$',
      colorPrimario: '#2b62e1',
      colorSecundario: '#1f2937',
      logoUrl: '',
    };
  }

  async obtener() {
    // Aquí he obtenido la configuración y, si no existe, la creo con los valores por defecto.
    let configuracion = await this.prisma.configuracionSistema.findUnique({
      where: { id: 1 },
    });

    if (!configuracion) {
      configuracion = await this.prisma.configuracionSistema.create({
        data: this.valoresPorDefecto(),
      });
    }

    return configuracion;
  }

  async actualizar(
    datos: ActualizarConfiguracionDto,
    usuarioActual: { id: number },
  ) {
    // Aquí he normalizado el payload y he persistido por upsert; luego registré auditoría.
    const payload = {
      nombreTienda: datos.nombreTienda,
      descripcion: datos.descripcion,
      email: datos.email,
      telefono: datos.telefono,
      direccion: datos.direccion,
      notificacionesPedidos: datos.notificacionesPedidos,
      notificacionesStock: datos.notificacionesStock,
      notificacionesClientes: datos.notificacionesClientes,
      autenticacionDosFactor: datos.autenticacionDosFactor,
      sesionExpiracion: datos.sesionExpiracion,
      envioGratis: datos.envioGratis,
      costoEnvio: datos.costoEnvio,
      tiempoEntrega: datos.tiempoEntrega,
      iva: datos.iva,
      moneda: datos.moneda,
      colorPrimario: datos.colorPrimario,
      colorSecundario: datos.colorSecundario,
      logoUrl: datos.logoUrl,
    };

    const configuracion = await this.prisma.configuracionSistema.upsert({
      where: { id: 1 },
      create: { id: 1, ...this.valoresPorDefecto(), ...payload },
      update: payload,
    });

    await this.auditoriaService.registrarAccion({
      usuarioId: usuarioActual.id,
      modulo: 'CONFIGURACION',
      accion: 'ACTUALIZAR',
      descripcion: 'Actualizó la configuración general del sistema',
    });

    return configuracion;
  }
}
