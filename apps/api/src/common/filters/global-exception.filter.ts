import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { JsonLoggerService } from "../json-logger.service";
import { RequestContextService } from "../request-context.service";

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: JsonLoggerService,
    private readonly requestContext: RequestContextService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : "Internal server error";

    const message = this.extractMessage(exceptionResponse);
    const requestId = request.requestId || this.requestContext.getRequestId();

    if (!isHttpException || status >= 500) {
      this.logger.error({
        message: "Unhandled exception",
        method: request.method,
        path: request.url,
        statusCode: status,
        requestId,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(exceptionResponse: unknown): string | string[] {
    if (typeof exceptionResponse === "string") {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === "object" &&
      "message" in exceptionResponse
    ) {
      return (exceptionResponse as { message: string | string[] }).message;
    }

    return "Internal server error";
  }
}
