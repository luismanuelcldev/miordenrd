import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // Aquí he dejado un endpoint raíz mínimo que confirma que el servicio está en ejecución.
  getHello() {
    return 'Hello World!';
  }
}
