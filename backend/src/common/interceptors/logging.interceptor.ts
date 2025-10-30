// Aquí registro cada petición HTTP con su duración para observabilidad y diagnóstico.
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Aquí mido el tiempo de ejecución por ruta y usuario autenticado (si existe).
    const request = context.switchToHttp().getRequest();
    if (!request) {
      return next.handle();
    }

    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, originalUrl, start, request.user?.id),
        error: (err) =>
          this.log(method, originalUrl, start, request.user?.id, err),
      }),
    );
  }

  private log(
    method: string,
    url: string,
    start: number,
    userId?: number,
    error?: any,
  ) {
    // Aquí construyo el mensaje base y lo envío como log informativo o de error según corresponda.
    const duration = Date.now() - start;
    const baseMessage =
      `${method} ${url} ${duration}ms` + (userId ? ` uid=${userId}` : '');

    if (error) {
      this.logger.error(`${baseMessage} -> ${error?.status ?? ''}`);
    } else {
      this.logger.log(baseMessage);
    }
  }
}
