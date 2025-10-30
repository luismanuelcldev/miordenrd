// Aquí he definido el DTO de registro para validar y describir los datos necesarios al crear una cuenta.
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  // Aquí he capturado el nombre del usuario aplicando límites de longitud.
  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  nombre: string;

  // Aquí he capturado el apellido del usuario con validaciones de tamaño.
  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  apellido: string;

  // Aquí he requerido un email válido como identificador principal de la cuenta.
  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@email.com',
  })
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  email: string;

  // Aquí he exigido una contraseña robusta con reglas de complejidad mínimas.
  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiContraseña123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'La contraseña debe contener al menos una letra minúscula, una mayúscula, un número y un carácter especial',
  })
  contrasena: string;

  // Aquí he admitido un teléfono opcional validado en formato internacional.
  @ApiProperty({
    description: 'Teléfono del usuario (opcional)',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Debe proporcionar un número de teléfono válido',
  })
  telefono?: string;
}
