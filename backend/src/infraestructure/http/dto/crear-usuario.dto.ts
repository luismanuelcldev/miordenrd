// Aquí he definido el DTO para crear usuarios en el panel, incluyendo datos básicos y rol opcional.
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Rol } from '../../../domain/entities/usuario';

export class CrearUsuarioDto {
  // Aquí he requerido un email válido como identificador del usuario.
  @IsEmail()
  email: string;

  // Aquí he exigido una contraseña mínima para la cuenta creada por administración.
  @IsString()
  @MinLength(6)
  contrasena: string;

  // Aquí he capturado el nombre del usuario.
  @IsString()
  nombre: string;

  // Aquí he capturado el apellido del usuario.
  @IsString()
  apellido: string;

  // Aquí he permitido registrar un teléfono de contacto opcional.
  @IsString()
  @IsOptional()
  telefono?: string;

  // Aquí he permitido asignar un rol inicial opcional.
  @IsEnum(Rol)
  @IsOptional()
  rol?: Rol;
}
