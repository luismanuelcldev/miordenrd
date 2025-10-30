import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Decidí validar el controlador raíz con un módulo de prueba mínimo para asegurar su contrato básico.
describe('AppController', () => {
  let appController: AppController;

  // Prefiero inicializar el módulo antes de cada prueba para aislar estados entre casos.
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    // Compruebo que el endpoint raíz devuelva el saludo esperado.
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
