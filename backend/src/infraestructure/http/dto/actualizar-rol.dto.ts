// Aquí he definido el DTO para actualizar el rol de un usuario con validación del enum correspondiente.
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Rol } from '../../../domain/entities/usuario';

export class ActualizarRolDto {
  // Aquí he exigido un rol válido del sistema como nuevo perfil del usuario.
  @ApiProperty({
    enum: Rol,
    description: 'Nuevo rol para el usuario',
    example: Rol.ADMINISTRADOR,
  })
  @IsEnum(Rol, { message: 'El rol proporcionado no es válido' })
  rol: Rol;
}
