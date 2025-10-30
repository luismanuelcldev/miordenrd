// Aquí he definido el DTO de contacto para recibir consultas públicas con validación de campos.
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactoDto {
  // Aquí he solicitado el nombre de quien escribe para dirigir la respuesta.
  @ApiProperty({
    description: 'Nombre de quien envía el mensaje',
    example: 'Juan Pérez',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  // Aquí he requerido un correo electrónico válido para contacto.
  @ApiProperty({
    description: 'Correo electrónico de contacto',
    example: 'juan@example.com',
  })
  @IsEmail()
  email: string;

  // Aquí he permitido un asunto opcional para clasificar la consulta.
  @ApiProperty({
    description: 'Asunto del mensaje',
    required: false,
    example: 'Consulta sobre un producto',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  asunto?: string;

  // Aquí he requerido el cuerpo del mensaje con un mínimo de contenido.
  @ApiProperty({
    description: 'Mensaje enviado por el cliente',
    example: 'Hola, quiero saber más sobre...',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  mensaje: string;
}
