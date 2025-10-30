import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Inicializo el Service Worker de MSW con los handlers de la app
export const worker = setupWorker(...handlers);
