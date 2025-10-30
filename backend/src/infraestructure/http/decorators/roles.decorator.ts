// Aquí he definido un decorador para declarar los roles permitidos sobre una ruta o controlador.
import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../../domain/entities/usuario';

// Aquí he expuesto la función decoradora que guarda los roles en metadata para ser evaluados por el guard.
export const Roles = (...roles: Rol[]) => SetMetadata('roles', roles);
