import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { McpAuthGuard } from "./mcp-auth.guard";
import { McpToolsService, MCP_TOOLS } from "./mcp-tools.service";
import type { McpCredentialContext } from "./mcp.service";

const PROTOCOL_VERSION = "2024-11-05";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

@Controller("mcp")
@UseGuards(McpAuthGuard)
export class McpServerController {
  constructor(private readonly toolsService: McpToolsService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Body() body: JsonRpcRequest | JsonRpcRequest[],
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const ctx: McpCredentialContext = (req as any).mcpContext;

    // Batch requests support
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((req) => this.handleSingle(req, ctx)),
      );
      res.json(results);
      return;
    }

    const result = await this.handleSingle(body, ctx);
    res.json(result);
  }

  private async handleSingle(
    req: JsonRpcRequest,
    ctx: McpCredentialContext,
  ): Promise<JsonRpcResponse> {
    const id = req?.id ?? null;

    if (!req || req.jsonrpc !== "2.0") {
      return this.rpcError(id, -32600, "Invalid Request");
    }

    try {
      switch (req.method) {
        case "initialize":
          return this.rpcResult(id, {
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: { name: "AdSpectr", version: "1.0.0" },
            capabilities: { tools: {} },
            instructions:
              "AdSpectr MCP serveri. Reklama kampaniyalarini boshqarish, AI qarorlarni tasdiqlash va strategiya generatsiya qilish uchun tool'lardan foydalaning.",
          });

        case "notifications/initialized":
          // Client notification — no response needed but return empty result
          return this.rpcResult(id, {});

        case "tools/list":
          return this.rpcResult(id, { tools: MCP_TOOLS });

        case "tools/call": {
          const params = req.params ?? {};
          const toolName = params.name as string;
          const toolArgs = params.arguments ?? {};

          if (!toolName) {
            return this.rpcError(id, -32602, "Tool nomi talab qilinadi");
          }

          const known = MCP_TOOLS.find((t) => t.name === toolName);
          if (!known) {
            return this.rpcError(id, -32602, `Noma'lum tool: ${toolName}`);
          }

          const toolResult = await this.toolsService.callTool(toolName, toolArgs, ctx);
          return this.rpcResult(id, toolResult);
        }

        case "ping":
          return this.rpcResult(id, {});

        default:
          return this.rpcError(id, -32601, `Noma'lum metod: ${req.method}`);
      }
    } catch (err: any) {
      return this.rpcError(id, -32603, err?.message ?? "Ichki xato");
    }
  }

  private rpcResult(id: string | number | null, result: any): JsonRpcResponse {
    return { jsonrpc: "2.0", id, result };
  }

  private rpcError(
    id: string | number | null,
    code: number,
    message: string,
  ): JsonRpcResponse {
    return { jsonrpc: "2.0", id, error: { code, message } };
  }
}
