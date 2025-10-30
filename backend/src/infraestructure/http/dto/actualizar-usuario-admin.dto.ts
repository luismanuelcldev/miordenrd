// Aquí he definido el DTO para que un administrador actualice datos principales de un usuario.
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Rol } from '../../../domain/entities/usuario';

export class ActualizarUsuarioAdminDto {
  // Aquí he permitido actualizar el nombre del usuario.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  // Aquí he permitido actualizar el apellido del usuario.
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido?: string;

  // Aquí he permitido actualizar el teléfono del usuario.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  // Aquí he permitido ajustar el rol del usuario de forma opcional.
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;
}
