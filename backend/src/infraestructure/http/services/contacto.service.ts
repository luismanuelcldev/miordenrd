import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../persistence/prisma/prisma.service';
import { ContactoDto } from '../dto/contacto.dto';

@Injectable()
export class ContactoService {
  constructor(private readonly prisma: PrismaService) {}

  // Aquí he registrado un contacto público almacenando los datos básicos del mensaje.
  async registrarContacto(payload: ContactoDto) {
    return (this.prisma as any).contacto.create({
      data: {
        nombre: payload.nombre,
        email: payload.email,
        asunto: payload.asunto,
        mensaje: payload.mensaje,
      },
    });
  }
}
