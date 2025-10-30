// Aquí he definido el DTO de login para validar las credenciales de acceso del usuario.
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  // Aquí he requerido un email válido como usuario de acceso.
  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@email.com',
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  // Aquí he requerido la contraseña del usuario como cadena no vacía.
  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiContraseña123!',
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  contrasena: string;
}
