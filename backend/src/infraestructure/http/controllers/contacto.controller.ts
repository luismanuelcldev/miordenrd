import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ContactoDto } from '../dto/contacto.dto';
import { ContactoService } from '../services/contacto.service';
import { Public } from '../decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Contacto')
@Controller('contacto')
export class ContactoController {
  constructor(private readonly contactoService: ContactoService) {}

  // Aquí he registrado mensajes de contacto públicos aplicando validaciones y devolviendo confirmación.
  @Post()
  @Public()
  @ApiOperation({ summary: 'Registrar solicitud de contacto' })
  @ApiResponse({ status: 201, description: 'Mensaje de contacto registrado' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async registrar(@Body() body: ContactoDto) {
    const contacto = await this.contactoService.registrarContacto(body);
    return {
      message: 'Hemos recibido tu mensaje, nos pondremos en contacto pronto',
      contacto,
    };
  }
}
