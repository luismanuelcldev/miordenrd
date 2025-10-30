import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Aquí he inyectado el Reflector para leer metadata y decidir si la ruta es pública.
  constructor(private reflector: Reflector) {
    super();
  }

  // Aquí he permitido acceso sin autenticación cuando marco la ruta como pública; en caso contrario delego al guard JWT.
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  // Aquí he centralizado el manejo del usuario autenticado y los errores de token para devolver un 401 consistente.
  handleRequest(err: any, user: any, info: any) {
    void info;
    if (err || !user) {
      throw (
        err || new UnauthorizedException('Token de acceso inválido o expirado')
      );
    }
    return user;
  }
}
