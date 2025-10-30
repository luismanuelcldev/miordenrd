// Aquí he definido el DTO para permitir que el usuario actualice su información básica del perfil.
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarPerfilDto {
  // Aquí he habilitado la actualización opcional del nombre.
  @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  // Aquí he habilitado la actualización opcional del apellido.
  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellido?: string;

  // Aquí he habilitado la actualización opcional del teléfono de contacto.
  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+34 600 123 456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;
}
