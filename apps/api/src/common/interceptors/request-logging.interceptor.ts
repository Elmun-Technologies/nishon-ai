import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { JsonLoggerService } from "../json-logger.service";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: JsonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<{
      method: string;
      originalUrl?: string;
      url: string;
      requestId?: string;
    }>();
    const response = httpContext.getResponse<{ statusCode: number }>();

    const start = Date.now();
    const path = request.originalUrl || request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log({
            message: "Request completed",
            method: request.method,
            path,
            statusCode: response.statusCode,
            durationMs: Date.now() - start,
            requestId: request.requestId,
          });
        },
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException ? error.getStatus() : 500;
          const stack = error instanceof Error ? error.stack : undefined;

          this.logger.error(
            {
              message: "Request failed",
              method: request.method,
              path,
              statusCode,
              durationMs: Date.now() - start,
              requestId: request.requestId,
            },
            stack,
          );
        },
      }),
    );
  }
}
