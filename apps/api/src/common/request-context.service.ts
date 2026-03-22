import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContextStore = {
  requestId: string;
  path?: string;
  method?: string;
};

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContextStore>();

  run(store: RequestContextStore, callback: () => void): void {
    this.storage.run(store, callback);
  }

  getStore(): RequestContextStore | undefined {
    return this.storage.getStore();
  }

  getRequestId(): string | undefined {
    return this.storage.getStore()?.requestId;
  }
}
