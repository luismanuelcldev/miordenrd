// Aquí he definido un decorador para marcar rutas públicas que no requieren autenticación JWT.
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Aquí he expuesto la función decoradora que asigna metadata para omitir los guards de autenticación.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
