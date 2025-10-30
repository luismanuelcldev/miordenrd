// Aquí he definido el DTO para crear usuarios desde administración aplicando validaciones básicas y de complejidad.
import { IsString, IsEmail, IsOptional } from 'class-validator';
import { MinLength, Matches, IsEnum } from 'class-validator';
import { Rol } from '../../../domain/entities/usuario';

export class CrearUsuarioDto {
  // Aquí he permitido capturar el nombre opcional validando una longitud mínima.
  @IsString()
  @IsOptional()
  @MinLength(2)
  nombre?: string;

  // Aquí he permitido capturar el apellido opcional con la misma restricción de longitud.
  @IsString()
  @IsOptional()
  @MinLength(2)
  apellido?: string;

  // Aquí he exigido un correo válido como identificador principal del usuario.
  @IsEmail()
  email: string;

  // Aquí he requerido una contraseña con longitud mínima y combinación de letras y números.
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'La contraseña debe tener al menos 8 caracteres, incluir letras y números.',
  })
  contrasena: string;

  // Aquí he admitido un rol opcional siempre que coincida con los valores permitidos en el dominio.
  @IsOptional()
  @IsEnum(Rol, { message: 'Rol inválido' })
  rol?: Rol;
}
