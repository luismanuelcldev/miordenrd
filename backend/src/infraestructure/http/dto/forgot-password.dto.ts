// Aquí he definido el DTO para iniciar el flujo de recuperación de contraseña mediante email.
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  // Aquí he solicitado el correo del usuario para enviar el enlace de recuperación.
  @ApiProperty({ example: 'cliente@dominio.com' })
  @IsEmail()
  email: string;
}
