import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../persistence/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../http/dto/register.dto';
import { LoginDto } from '../http/dto/login.dto';
import { ChangePasswordDto } from '../http/dto/change-password.dto';
import { Rol } from '../../domain/entities/usuario';
import { ConfigService } from '@nestjs/config';
import { ActualizarPerfilDto } from '../http/dto/actualizar-perfil.dto';
import { AuditoriaService } from '../http/services/auditoria.service';

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, contrasena, nombre, apellido, telefono } = registerDto;

    // Aquí he validado que el correo no esté registrado antes de crear la cuenta.
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      throw new ConflictException('El email ya está registrado');
    }

    // Aquí he generado el hash de la contraseña utilizando un número fijo de rondas de sal.
    const contrasenaHasheada = await bcrypt.hash(
      contrasena,
      AuthService.SALT_ROUNDS,
    );

    // Aquí he insertado el nuevo usuario estableciendo el rol por defecto como cliente.
    const usuario = await this.prisma.usuario.create({
      data: {
        email,
        contrasena: contrasenaHasheada,
        nombre,
        apellido,
        telefono,
        rol: Rol.CLIENTE,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        creadoEn: true,
      },
    });

    // Aquí he registrado en auditoría la creación de la cuenta.
    await this.auditoriaService.registrarAccion({
      usuarioId: usuario.id,
      modulo: 'AUTH',
      accion: 'REGISTRO',
      descripcion: 'Registro interno de usuario mediante formulario web',
    });

    // Aquí he emitido el par de tokens inicial para que el usuario inicie sesión de inmediato.
    const tokens = await this.generarTokens(usuario.id, usuario.email);

    return {
      usuario,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, contrasena } = loginDto;

    // Aquí he localizado al usuario junto a su contraseña y estado para validar sus credenciales.
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        contrasena: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        creadoEn: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.contrasena) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Aquí he comparado la contraseña proporcionada contra el hash almacenado.
    const contrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.contrasena,
    );
    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Aquí he generado nuevos tokens y omitido el hash antes de responder.
    const tokens = await this.generarTokens(usuario.id, usuario.email);

    const { contrasena: contrasenaOculta, ...usuarioSinContrasena } = usuario;
    void contrasenaOculta;

    // Aquí he dejado constancia en auditoría de un inicio de sesión exitoso.
    await this.auditoriaService.registrarAccion({
      usuarioId: usuario.id,
      modulo: 'AUTH',
      accion: 'LOGIN',
      descripcion: 'Inicio de sesión exitoso',
    });

    return {
      usuario: usuarioSinContrasena,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Aquí he validado la firma del refresh token utilizando la llave correspondiente.
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      // Aquí he recuperado al usuario para asegurarme de que siga activo antes de emitir nuevos tokens.
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          rol: true,
          creadoEn: true,
          activo: true,
        },
      });

      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException('Token inválido');
      }

      const tokens = await this.generarTokens(usuario.id, usuario.email);

      return {
        usuario,
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Token de renovación inválido');
    }
  }

  async logout(usuarioId: number) {
    void usuarioId;
    return { message: 'Sesión cerrada exitosamente' };
  }

  async getProfile(usuarioId: number) {
    // Aquí he consultado el perfil completo del usuario junto a sus direcciones activas.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        creadoEn: true,
        actualizadoEn: true,
        direcciones: {
          select: {
            id: true,
            calle: true,
            ciudad: true,
            pais: true,
            codigoPostal: true,
            creadoEn: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async updateProfile(usuarioId: number, datos: ActualizarPerfilDto) {
    // Aquí he actualizado selectivamente los campos de perfil permitidos y devuelto la vista consolidada.
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: datos.nombre ?? undefined,
        apellido: datos.apellido ?? undefined,
        telefono: datos.telefono ?? undefined,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        creadoEn: true,
        actualizadoEn: true,
        direcciones: {
          select: {
            id: true,
            calle: true,
            ciudad: true,
            pais: true,
            codigoPostal: true,
            creadoEn: true,
          },
        },
      },
    });

    await this.auditoriaService.registrarAccion({
      usuarioId,
      modulo: 'AUTH',
      accion: 'ACTUALIZAR_PERFIL',
      descripcion: 'Actualización de datos del perfil',
    });

    return usuario;
  }

  async changePassword(
    usuarioId: number,
    changePasswordDto: ChangePasswordDto,
  ) {
    const { contrasenaActual, nuevaContrasena } = changePasswordDto;

    // Aquí he verificado la existencia del usuario antes de continuar con el cambio de contraseña.
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { contrasena: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Aquí he comparado la contraseña actual para impedir cambios no autorizados.
    const contrasenaValida = await bcrypt.compare(
      contrasenaActual,
      usuario.contrasena,
    );
    if (!contrasenaValida) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    // Aquí he generado el nuevo hash y actualizado el registro en la base de datos.
    const nuevaContrasenaHasheada = await bcrypt.hash(
      nuevaContrasena,
      AuthService.SALT_ROUNDS,
    );

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { contrasena: nuevaContrasenaHasheada },
    });

    await this.auditoriaService.registrarAccion({
      usuarioId,
      modulo: 'AUTH',
      accion: 'CAMBIAR_CONTRASENA',
      descripcion: 'El usuario actualizó su contraseña',
    });

    return { message: 'Contraseña cambiada exitosamente' };
  }

  private async generarTokens(usuarioId: number, email: string) {
    const payload = { sub: usuarioId, email };

    // Aquí he generado simultáneamente el access token y el refresh token con las claves configuradas.
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getAccessSecret(),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutos en segundos
    };
  }

  async hashPassword(plainPassword: string): Promise<string> {
    // Aquí he expuesto un helper para hashear contraseñas en otras capas del sistema.
    return bcrypt.hash(plainPassword, AuthService.SALT_ROUNDS);
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    // Aquí he centralizado la comparación de hashes para mantener consistencia.
    if (!hashedPassword) {
      return false;
    }
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private getAccessSecret(): string {
    // Aquí he leído la llave de firma principal asegurándome de que esté configurada.
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no configurado');
    }
    return secret;
  }

  private getRefreshSecret(): string {
    // Aquí he recuperado la llave del refresh token reutilizando la de acceso si no existe una específica.
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.getAccessSecret()
    );
  }
}
