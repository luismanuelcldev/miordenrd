// Aquí he definido el DTO para renovar el access token usando un refresh token válido.
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  // Aquí he requerido explícitamente el refresh token como cadena no vacía.
  @ApiProperty({
    description: 'Refresh token para renovar el access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  refreshToken: string;
}
