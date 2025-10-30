import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Aquí he centralizado el mensaje de saludo utilizado por el controlador raíz.
  getHello(): string {
    return 'Hello World!';
  }
}
