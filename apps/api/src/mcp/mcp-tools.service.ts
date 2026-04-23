import { Injectable } from "@nestjs/common";
import { CampaignsService } from "../campaigns/campaigns.service";
import { AiDecisionsService } from "../ai-decisions/ai-decisions.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { AiAgentService } from "../ai-agent/ai-agent.service";
import type { McpCredentialContext } from "./mcp.service";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "get_workspace_info",
    description:
      "AdSpectr workspace haqida umumiy ma'lumot: nomi, sanoati, ulangan platformalar, obuna holati va kampaniyalar soni.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_campaigns",
    description:
      "Workspace'dagi barcha reklama kampaniyalar ro'yxatini qaytaradi: nomi, platformasi, holati, byudjeti va yaratilgan sanasi.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_ai_decisions",
    description:
      "AI tomonidan yaratilgan qarorlar ro'yxati. Holat: null = tasdiqlash kutilmoqda, true = tasdiqlangan, false = rad etilgan.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "approved", "rejected", "all"],
          description: "Filtrlash uchun holat. Default: all",
        },
      },
    },
  },
  {
    name: "approve_decision",
    description: "Kutilayotgan AI qarorini tasdiqlaydi va platforma API orqali bajaradi.",
    inputSchema: {
      type: "object",
      properties: {
        decision_id: {
          type: "string",
          description: "AI qaror UUID'si",
        },
      },
      required: ["decision_id"],
    },
  },
  {
    name: "reject_decision",
    description: "Kutilayotgan AI qarorini rad etadi (bajarilmaydi).",
    inputSchema: {
      type: "object",
      properties: {
        decision_id: {
          type: "string",
          description: "AI qaror UUID'si",
        },
      },
      required: ["decision_id"],
    },
  },
  {
    name: "generate_strategy",
    description:
      "Workspace uchun AI reklama strategiyasini generatsiya qiladi: maqsadlar, kanallar, byudjet taqsimoti va tavsiyalar.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "run_optimization",
    description:
      "Barcha aktiv kampaniyalar uchun AI optimizatsiya loopini ishga tushiradi. Yangi AI qarorlar yaratiladi.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "analyze_competitor",
    description:
      "Raqobatchi biznesni 12 kategoriya va 72 parametr bo'yicha tahlil qiladi (Instagram, reklama, SEO, koll-markaz va boshqalar).",
    inputSchema: {
      type: "object",
      properties: {
        competitor_name: {
          type: "string",
          description: "Raqobatchi kompaniya nomi",
        },
        competitor_instagram: {
          type: "string",
          description: "Raqobatchi Instagram username (@ belgisisiz)",
        },
        competitor_website: {
          type: "string",
          description: "Raqobatchi web-sayt URL'i",
        },
      },
      required: ["competitor_name"],
    },
  },
  {
    name: "generate_creative",
    description:
      "Berilgan platforma va maqsad uchun reklama matni va kreativ skriptlar generatsiya qiladi.",
    inputSchema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["meta", "google", "tiktok", "youtube", "telegram"],
          description: "Reklama platformasi",
        },
        objective: {
          type: "string",
          description: "Kampaniya maqsadi (masalan: savdo oshirish, brend taniqlilik)",
        },
        product_description: {
          type: "string",
          description: "Mahsulot yoki xizmat tavsifi",
        },
      },
      required: ["platform"],
    },
  },
];

@Injectable()
export class McpToolsService {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly decisionsService: AiDecisionsService,
    private readonly workspacesService: WorkspacesService,
    private readonly aiAgentService: AiAgentService,
  ) {}

  async callTool(
    name: string,
    args: Record<string, any>,
    ctx: McpCredentialContext,
  ): Promise<McpToolResult> {
    try {
      switch (name) {
        case "get_workspace_info":
          return this.getWorkspaceInfo(ctx);
        case "list_campaigns":
          return this.listCampaigns(ctx);
        case "list_ai_decisions":
          return this.listAiDecisions(args, ctx);
        case "approve_decision":
          return this.approveDecision(args);
        case "reject_decision":
          return this.rejectDecision(args);
        case "generate_strategy":
          return this.generateStrategy(ctx);
        case "run_optimization":
          return this.runOptimization(ctx);
        case "analyze_competitor":
          return this.analyzeCompetitor(args, ctx);
        case "generate_creative":
          return this.generateCreative(args, ctx);
        default:
          return this.error(`Noma'lum tool: ${name}`);
      }
    } catch (err: any) {
      return this.error(err?.message ?? "Tool bajarishda xato yuz berdi");
    }
  }

  private async getWorkspaceInfo(ctx: McpCredentialContext): Promise<McpToolResult> {
    const ws = await this.workspacesService.findOne(ctx.workspaceId, ctx.userId);
    const platforms = (ws.connectedAccounts ?? []).map((a: any) => a.platform).join(", ");
    const campaignCount = (ws.campaigns ?? []).length;
    const text = [
      `Workspace: ${ws.name}`,
      `Sanoat: ${ws.industry ?? "—"}`,
      `Ulangan platformalar: ${platforms || "yo'q"}`,
      `Jami kampaniyalar: ${campaignCount}`,
      `Autopilot: ${(ws as any).autopilotMode ?? "MANUAL"}`,
    ].join("\n");
    return { content: [{ type: "text", text }] };
  }

  private async listCampaigns(ctx: McpCredentialContext): Promise<McpToolResult> {
    const campaigns = await this.campaignsService.findAllByWorkspace(
      ctx.workspaceId,
      ctx.userId,
    );
    if (!campaigns.length) {
      return { content: [{ type: "text", text: "Hech qanday kampaniya topilmadi." }] };
    }
    const lines = campaigns.map((c) =>
      `• ${c.name} | Platforma: ${c.platform ?? "—"} | Holat: ${c.status} | Byudjet: ${c.dailyBudget ?? c.budget ?? "—"} ${c.currency ?? ""} | ID: ${c.id}`,
    );
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  private async listAiDecisions(
    args: Record<string, any>,
    ctx: McpCredentialContext,
  ): Promise<McpToolResult> {
    const decisions = await this.decisionsService.findAllByWorkspace(
      ctx.workspaceId,
      ctx.userId,
    );
    const status = args.status ?? "all";
    const filtered = decisions.filter((d) => {
      if (status === "pending") return d.isApproved === null;
      if (status === "approved") return d.isApproved === true;
      if (status === "rejected") return d.isApproved === false;
      return true;
    });
    if (!filtered.length) {
      return { content: [{ type: "text", text: `Qarorlar topilmadi (filtr: ${status}).` }] };
    }
    const lines = filtered.map((d) => {
      const statusLabel =
        d.isApproved === null ? "⏳ Kutilmoqda" : d.isApproved ? "✅ Tasdiqlangan" : "❌ Rad etilgan";
      return `• [${statusLabel}] ${d.reason?.slice(0, 120) ?? "—"} | ID: ${d.id}`;
    });
    return { content: [{ type: "text", text: lines.join("\n") }] };
  }

  private async approveDecision(args: Record<string, any>): Promise<McpToolResult> {
    if (!args.decision_id) return this.error("decision_id talab qilinadi");
    await this.aiAgentService.approveDecision(args.decision_id);
    return { content: [{ type: "text", text: `AI qaror tasdiqlandi va bajarildi: ${args.decision_id}` }] };
  }

  private async rejectDecision(args: Record<string, any>): Promise<McpToolResult> {
    if (!args.decision_id) return this.error("decision_id talab qilinadi");
    await this.aiAgentService.rejectDecision(args.decision_id);
    return { content: [{ type: "text", text: `AI qaror rad etildi: ${args.decision_id}` }] };
  }

  private async generateStrategy(ctx: McpCredentialContext): Promise<McpToolResult> {
    const result = await this.aiAgentService.generateStrategy(ctx.workspaceId);
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  }

  private async runOptimization(ctx: McpCredentialContext): Promise<McpToolResult> {
    const decisions = await this.aiAgentService.runOptimizationLoop(ctx.workspaceId);
    const count = decisions?.length ?? 0;
    return {
      content: [
        {
          type: "text",
          text: count
            ? `Optimizatsiya tugadi. ${count} ta yangi AI qaror yaratildi.`
            : "Optimizatsiya tugadi. Hozircha yangi qarorlar yo'q.",
        },
      ],
    };
  }

  private async analyzeCompetitor(
    args: Record<string, any>,
    ctx: McpCredentialContext,
  ): Promise<McpToolResult> {
    if (!args.competitor_name) return this.error("competitor_name talab qilinadi");
    const ws = await this.workspacesService.findOne(ctx.workspaceId, ctx.userId);
    const result = await this.aiAgentService.analyzeCompetitor({
      workspaceId: ctx.workspaceId,
      competitor: {
        name: args.competitor_name,
        instagram: args.competitor_instagram ?? "",
        website: args.competitor_website ?? "",
      },
      businessContext: {
        businessName: ws.name,
        industry: ws.industry,
        productDescription: (ws as any).productDescription ?? "",
      },
    });
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  }

  private async generateCreative(
    args: Record<string, any>,
    ctx: McpCredentialContext,
  ): Promise<McpToolResult> {
    if (!args.platform) return this.error("platform talab qilinadi");
    const result = await this.aiAgentService.generateAdScripts(ctx.workspaceId, {
      platform: args.platform,
      objective: args.objective ?? "brand_awareness",
      productDescription: args.product_description ?? "",
    });
    const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  }

  private error(message: string): McpToolResult {
    return { content: [{ type: "text", text: `Xato: ${message}` }], isError: true };
  }
}
