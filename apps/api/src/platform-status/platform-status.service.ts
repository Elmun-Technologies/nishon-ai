import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { isAiClientConfigured } from "@adspectr/ai-sdk";
import { Platform } from "@adspectr/shared";
import { ReveService } from "../reve/reve.service";
import { TgStatService } from "../telegram-channels/tgstat.service";
import { PlatformsService } from "../platforms/platforms.service";

export interface Capability {
  key: string;
  label: string;
  /** True when the capability is ready to use right now. */
  live: boolean;
  /** server = one API key lights it up for everyone; workspace = per-account. */
  scope: "server" | "workspace";
  /** One-line, non-sensitive hint on how to activate. Never a key value. */
  hint: string;
  /** Optional web route the user can follow to finish activation. */
  href?: string;
}

/**
 * Read-only capability status for the Activation Center. Reports ONLY booleans —
 * never key values — so the founder can watch each capability light up as they
 * wire in credentials. Reuses each feature's own `isConfigured()` so there is a
 * single source of truth for "is this on".
 */
@Injectable()
export class PlatformStatusService {
  private readonly logger = new Logger(PlatformStatusService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly reve: ReveService,
    private readonly tgstat: TgStatService,
    private readonly platforms: PlatformsService,
  ) {}

  private hasKey(name: string): boolean {
    return Boolean(this.config.get<string>(name)?.trim());
  }

  /**
   * Server-level capabilities — driven purely by API-server env keys, identical
   * for every workspace. `workspaceId`/`userId` are only used for the one
   * workspace-scoped capability (Meta account connection).
   */
  async getCapabilities(
    workspaceId?: string,
    userId?: string,
  ): Promise<Capability[]> {
    const caps: Capability[] = [
      {
        key: "ai",
        label: "AI (strategiya, chat, fokus-guruh, suhbat-launch)",
        live: isAiClientConfigured((k) => this.config.get<string>(k)),
        scope: "server",
        hint: "Serverda OPENAI_API_KEY yoki ANTHROPIC_API_KEY o'rnating.",
      },
      {
        key: "reve",
        label: "Reve rasm-reklama generatsiyasi",
        live: this.reve.isConfigured(),
        scope: "server",
        hint: "Serverda FAL_KEY (Reve accessли fal.ai kaliti) o'rnating.",
        href: "/creative-hub/image-ads",
      },
      {
        key: "telegramChannels",
        label: "Telegram kanal agenti (kashfiyot)",
        live: this.tgstat.isConfigured(),
        scope: "server",
        hint: "Serverda TGSTAT_API_KEY o'rnating.",
        href: "/telegram-channels",
      },
      {
        key: "payme",
        label: "Payme to'lov (billing)",
        live:
          this.hasKey("PAYME_MERCHANT_ID") && this.hasKey("PAYME_MERCHANT_KEY"),
        scope: "server",
        hint: "Serverda PAYME_MERCHANT_ID va PAYME_MERCHANT_KEY o'rnating.",
        href: "/billing",
      },
      {
        key: "telegramBot",
        label: "Telegram bot (kunlik digest / alertlar)",
        live: this.hasKey("TELEGRAM_BOT_TOKEN"),
        scope: "server",
        hint: "Serverda TELEGRAM_BOT_TOKEN o'rnating.",
        href: "/settings/telegram",
      },
      {
        key: "heygen",
        label: "HeyGen video avatarlar",
        live: this.hasKey("HEYGEN_API_KEY"),
        scope: "server",
        hint: "Serverda HEYGEN_API_KEY o'rnating.",
      },
      {
        key: "higgsfield",
        label: "Higgsfield video",
        live: this.hasKey("HIGGSFIELD_API_KEY"),
        scope: "server",
        hint: "Serverda HIGGSFIELD_API_KEY o'rnating.",
      },
    ];

    caps.push(await this.metaCapability(workspaceId, userId));
    return caps;
  }

  /** Workspace-scoped: does this workspace have an active Meta ad account? */
  private async metaCapability(
    workspaceId?: string,
    userId?: string,
  ): Promise<Capability> {
    const base: Capability = {
      key: "meta",
      label: "Meta reklama hisobi (ulangan)",
      live: false,
      scope: "workspace",
      hint: "Settings → Meta orqali Facebook/Instagram hisobingizni ulang.",
      href: "/settings/meta",
    };
    // Needs both the server app credentials AND a connected account.
    const serverReady =
      this.hasKey("META_APP_ID") && this.hasKey("META_APP_SECRET");
    if (!serverReady) {
      base.hint =
        "Serverda META_APP_ID va META_APP_SECRET o'rnating, so'ng hisobni ulang.";
      return base;
    }
    if (!workspaceId || !userId) return base;
    try {
      const accounts = await this.platforms.getConnectedAccounts(
        workspaceId,
        userId,
      );
      base.live = accounts.some(
        (a) => a.platform === Platform.META && a.isActive,
      );
    } catch (e: any) {
      // Ownership failure or no workspace — treat as not connected, never throw.
      this.logger.debug(`meta capability check skipped: ${e?.message ?? e}`);
    }
    return base;
  }
}
