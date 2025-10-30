// Aquí he definido el DTO de cambio de contraseña para exigir la actual y validar la nueva.
import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  // Aquí he requerido la contraseña actual para verificar la identidad del usuario.
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'MiContraseñaActual123!',
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña actual es requerida' })
  contrasenaActual: string;

  // Aquí he definido las reglas de complejidad para la nueva contraseña.
  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'MiNuevaContraseña123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La nueva contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial',
  })
  nuevaContrasena: string;
}
