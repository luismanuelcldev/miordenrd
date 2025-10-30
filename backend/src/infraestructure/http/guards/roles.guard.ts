import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol } from '../../../domain/entities/usuario';

@Injectable()
export class RolesGuard implements CanActivate {
  // Aquí he inyectado el Reflector para leer la metadata de roles requerida por cada handler.
  constructor(private reflector: Reflector) {}

  // Aquí he validado que el usuario tenga alguno de los roles exigidos; si no se definen roles, permito el acceso.
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Rol[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !requiredRoles.includes(user.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este recurso',
      );
    }
    return true;
  }
}
