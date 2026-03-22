import { Injectable, LoggerService } from "@nestjs/common";
import { RequestContextService } from "./request-context.service";

type JsonLogLevel = "log" | "error" | "warn" | "debug" | "verbose";

type JsonLogPayload = {
  level: JsonLogLevel;
  message: string;
  timestamp: string;
  requestId: string | null;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  durationMs: number | null;
  context: string | null;
  stack: string | null;
};

@Injectable()
export class JsonLoggerService implements LoggerService {
  constructor(private readonly requestContext: RequestContextService) {}

  log(message: any, context?: string): void {
    this.write("log", message, undefined, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.write("error", message, trace, context);
  }

  warn(message: any, context?: string): void {
    this.write("warn", message, undefined, context);
  }

  debug(message: any, context?: string): void {
    this.write("debug", message, undefined, context);
  }

  verbose(message: any, context?: string): void {
    this.write("verbose", message, undefined, context);
  }

  private write(
    level: JsonLogLevel,
    message: unknown,
    trace?: string,
    context?: string,
  ): void {
    const currentContext = this.requestContext.getStore();
    const normalized = this.normalizeMessage(message);

    const payload: JsonLogPayload = {
      level,
      message: normalized.message,
      timestamp: new Date().toISOString(),
      requestId: normalized.requestId || currentContext?.requestId || null,
      path: normalized.path || currentContext?.path || null,
      method: normalized.method || currentContext?.method || null,
      statusCode: normalized.statusCode ?? null,
      durationMs: normalized.durationMs ?? null,
      context: normalized.context || context || null,
      stack: normalized.stack || trace || null,
    };

    const line = JSON.stringify(payload);
    if (level === "error") {
      process.stderr.write(`${line}\n`);
      return;
    }
    process.stdout.write(`${line}\n`);
  }

  private normalizeMessage(message: unknown): {
    message: string;
    requestId?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    durationMs?: number;
    context?: string;
    stack?: string;
  } {
    if (typeof message === "string") {
      return { message };
    }

    if (message && typeof message === "object") {
      const payload = message as Record<string, unknown>;
      const rawMessage = payload.message;
      return {
        message: typeof rawMessage === "string" ? rawMessage : JSON.stringify(payload),
        requestId:
          typeof payload.requestId === "string" ? payload.requestId : undefined,
        path: typeof payload.path === "string" ? payload.path : undefined,
        method: typeof payload.method === "string" ? payload.method : undefined,
        statusCode:
          typeof payload.statusCode === "number" ? payload.statusCode : undefined,
        durationMs:
          typeof payload.durationMs === "number" ? payload.durationMs : undefined,
        context: typeof payload.context === "string" ? payload.context : undefined,
        stack: typeof payload.stack === "string" ? payload.stack : undefined,
      };
    }

    return { message: String(message) };
  }
}
