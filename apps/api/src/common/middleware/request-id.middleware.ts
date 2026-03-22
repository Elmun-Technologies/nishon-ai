import { randomUUID } from "node:crypto";
import { RequestContextService } from "../request-context.service";

export function createRequestIdMiddleware(
  requestContext: RequestContextService,
) {
  return (
    req: {
      method: string;
      originalUrl?: string;
      url: string;
      headers: Record<string, string | string[] | undefined>;
      requestId?: string;
    },
    res: {
      setHeader: (name: string, value: string) => void;
    },
    next: () => void,
  ) => {
    const headerValue = req.headers["x-request-id"];
    const requestId =
      typeof headerValue === "string" && headerValue.trim().length > 0
        ? headerValue
        : randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    requestContext.run(
      {
        requestId,
        path: req.originalUrl || req.url,
        method: req.method,
      },
      next,
    );
  };
}
