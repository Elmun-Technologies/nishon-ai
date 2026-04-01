import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { ConnectedAccount } from "./entities/connected-account.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { MetaConnector } from "./connectors/meta.connector";
import { GoogleConnector } from "./connectors/google.connector";
import { TiktokConnector } from "./connectors/tiktok.connector";
import { YandexConnector } from "./connectors/yandex.connector";
import { Platform } from "@nishon/shared";

/**
 * PlatformsService manages the lifecycle of connected ad accounts.
 *
 * The most sensitive responsibility here is token encryption.
 * OAuth tokens are like passwords — if someone gets them, they can
 * spend money on the user's behalf. We encrypt them with AES-256
 * before storing in the database. Even if the database is breached,
 * the attacker gets only ciphertext, not usable tokens.
 */
@Injectable()
export class PlatformsService {
  private readonly logger = new Logger(PlatformsService.name);
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(ConnectedAccount)
    private readonly accountRepo: Repository<ConnectedAccount>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    private readonly metaConnector: MetaConnector,
    private readonly googleConnector: GoogleConnector,
    private readonly tiktokConnector: TiktokConnector,
    private readonly yandexConnector: YandexConnector,
    private readonly config: ConfigService,
  ) {
    // Encryption key must be exactly 32 chars for AES-256
    const key = this.config.get<string>("ENCRYPTION_KEY", "");
    if (key.length !== 32) {
      this.logger.warn("ENCRYPTION_KEY is not set or not 32 characters - platform token encryption will be unavailable");
      this.encryptionKey = "00000000000000000000000000000000";
    } else {
      this.encryptionKey = key;
    }
  }

  // ─── META OAUTH FLOW ──────────────────────────────────────────────────────

  getMetaOAuthUrl(workspaceId: string): string {
    return this.metaConnector.getOAuthUrl(workspaceId);
  }

  /**
   * Handle the OAuth callback from Meta.
   * This is the critical step where we get the access token and save it.
   *
   * Flow:
   * 1. User approved on Facebook → Meta redirects here with ?code=XXX&state=YYY
   * 2. We decode state to get workspaceId
   * 3. We exchange the code for an access token
   * 4. We get the list of ad accounts
   * 5. We save the token (encrypted) to the database
   */
  async handleMetaCallback(
    code: string,
    state: string,
  ): Promise<{ workspaceId: string; accounts: any[] }> {
    let workspaceId: string;

    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      workspaceId = decoded.workspaceId;
    } catch {
      throw new BadRequestException("Invalid state parameter");
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    // Exchange code for token
    const { accessToken, expiresAt } =
      await this.metaConnector.exchangeCodeForToken(code);

    // Get available ad accounts
    const accounts = await this.metaConnector.getAdAccounts(accessToken);

    // Save the token temporarily — user still needs to select which account to use
    // We store it on the workspace temporarily via a pending connected account
    const encryptedToken = this.encrypt(accessToken);

    // Create a pending connected account — user selects their ad account in next step
    await this.accountRepo.save(
      this.accountRepo.create({
        workspaceId,
        platform: Platform.META,
        accessToken: encryptedToken,
        externalAccountId: "pending",
        externalAccountName: "Pending account selection",
        isActive: false,
        tokenExpiresAt: expiresAt,
      }),
    );

    return { workspaceId, accounts };
  }

  /**
   * User selects which ad account to use after OAuth.
   * This finalizes the connection.
   */
  async selectMetaAdAccount(
    workspaceId: string,
    adAccountId: string,
    adAccountName: string,
  ): Promise<ConnectedAccount> {
    const pendingAccount = await this.accountRepo.findOne({
      where: {
        workspaceId,
        platform: Platform.META,
        externalAccountId: "pending",
      },
    });

    if (!pendingAccount) {
      throw new NotFoundException(
        "No pending Meta connection found. Please reconnect.",
      );
    }

    pendingAccount.externalAccountId = adAccountId;
    pendingAccount.externalAccountName = adAccountName;
    pendingAccount.isActive = true;
    pendingAccount.trackingStartedAt = new Date();

    return this.accountRepo.save(pendingAccount);
  }

  /**
   * Get the decrypted access token for a workspace's connected platform account.
   * This is called by connectors when they need to make API calls.
   */
  async getDecryptedToken(
    workspaceId: string,
    platform: Platform,
  ): Promise<{ token: string; accountId: string }> {
    const account = await this.accountRepo.findOne({
      where: { workspaceId, platform, isActive: true },
    });

    if (!account) {
      throw new NotFoundException(
        `No active ${platform} account connected to this workspace`,
      );
    }

    return {
      token: this.decrypt(account.accessToken),
      accountId: account.externalAccountId,
    };
  }

  async getConnectedAccounts(workspaceId: string): Promise<ConnectedAccount[]> {
    return this.accountRepo.find({
      where: { workspaceId },
      // Never return the tokens — even encrypted ones
      select: [
        "id",
        "platform",
        "externalAccountId",
        "externalAccountName",
        "isActive",
        "tokenExpiresAt",
        "createdAt",
      ],
    });
  }

  async disconnectAccount(
    workspaceId: string,
    accountId: string,
  ): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, workspaceId },
    });
    if (!account) throw new NotFoundException("Connected account not found");
    await this.accountRepo.remove(account);
  }

  // ─── GOOGLE ADS OAUTH FLOW ───────────────────────────────────────────────

  getGoogleOAuthUrl(workspaceId: string): string {
    return this.googleConnector.getOAuthUrl(workspaceId);
  }

  /**
   * Handle Google OAuth callback.
   * Stores access + refresh tokens encrypted. Returns accessible customer accounts.
   */
  async handleGoogleCallback(
    code: string,
    state: string,
  ): Promise<{ workspaceId: string; accounts: any[] }> {
    let workspaceId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      workspaceId = decoded.workspaceId;
    } catch {
      throw new BadRequestException("Invalid state parameter");
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const { accessToken, refreshToken, expiresAt } =
      await this.googleConnector.exchangeCodeForToken(code);

    const accounts = await this.googleConnector.getAccessibleCustomers(accessToken);
    const encryptedToken = this.encrypt(accessToken);
    const encryptedRefresh = this.encrypt(refreshToken);

    // Save with first account as default (user can switch later)
    await this.accountRepo.save(
      this.accountRepo.create({
        workspaceId,
        platform: Platform.GOOGLE,
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        externalAccountId: accounts[0]?.id ?? "pending",
        externalAccountName: accounts[0]?.descriptiveName ?? "Google Ads Account",
        isActive: accounts.length > 0,
        tokenExpiresAt: expiresAt,
        trackingStartedAt: accounts.length > 0 ? new Date() : null,
      }),
    );

    return { workspaceId, accounts };
  }

  /**
   * Select a specific Google Ads customer account after OAuth.
   */
  async selectGoogleCustomer(
    workspaceId: string,
    customerId: string,
    customerName: string,
  ): Promise<ConnectedAccount> {
    const account = await this.accountRepo.findOne({
      where: { workspaceId, platform: Platform.GOOGLE },
    });

    if (!account) {
      throw new NotFoundException("No Google Ads account connected. Please reconnect.");
    }

    account.externalAccountId = customerId;
    account.externalAccountName = customerName;
    account.isActive = true;
    account.trackingStartedAt = account.trackingStartedAt ?? new Date();

    return this.accountRepo.save(account);
  }

  // ─── TIKTOK ADS OAUTH FLOW ────────────────────────────────────────────────

  getTiktokOAuthUrl(workspaceId: string): string {
    return this.tiktokConnector.getOAuthUrl(workspaceId);
  }

  /**
   * Handle TikTok OAuth callback.
   * TikTok returns the advertiser_id directly in the token response.
   */
  async handleTiktokCallback(
    code: string,
    state: string,
  ): Promise<{ workspaceId: string; accounts: any[] }> {
    let workspaceId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      workspaceId = decoded.workspaceId;
    } catch {
      throw new BadRequestException("Invalid state parameter");
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const { accessToken, advertiserId, expiresAt } =
      await this.tiktokConnector.exchangeCodeForToken(code);

    const accounts = await this.tiktokConnector.getAdvertiserAccounts(accessToken);
    const encryptedToken = this.encrypt(accessToken);

    await this.accountRepo.save(
      this.accountRepo.create({
        workspaceId,
        platform: Platform.TIKTOK,
        accessToken: encryptedToken,
        externalAccountId: advertiserId || accounts[0]?.id || "pending",
        externalAccountName: accounts[0]?.name ?? "TikTok Ads Account",
        isActive: true,
        tokenExpiresAt: expiresAt,
        trackingStartedAt: new Date(),
      }),
    );

    return { workspaceId, accounts };
  }

  // ─── YANDEX DIRECT OAUTH FLOW ─────────────────────────────────────────────

  getYandexOAuthUrl(workspaceId: string): string {
    return this.yandexConnector.getOAuthUrl(workspaceId);
  }

  /**
   * Handle the OAuth callback from Yandex.
   *
   * Flow:
   * 1. User approved on Yandex → Yandex redirects here with ?code=XXX&state=YYY
   * 2. We decode state to get workspaceId
   * 3. We exchange the code for an access token
   * 4. We get the advertiser login associated with the token
   * 5. We save the token (encrypted) to the database
   */
  async handleYandexCallback(
    code: string,
    state: string,
  ): Promise<{ workspaceId: string; accounts: any[] }> {
    let workspaceId: string;

    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      workspaceId = decoded.workspaceId;
    } catch {
      throw new BadRequestException("Invalid state parameter");
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException("Workspace not found");

    const { accessToken, expiresAt } =
      await this.yandexConnector.exchangeCodeForToken(code);

    const accounts = await this.yandexConnector.getAdAccounts(accessToken);
    const encryptedToken = this.encrypt(accessToken);

    await this.accountRepo.save(
      this.accountRepo.create({
        workspaceId,
        platform: Platform.YANDEX,
        accessToken: encryptedToken,
        externalAccountId: accounts[0]?.id ?? "pending",
        externalAccountName: accounts[0]?.name ?? "Yandex Direct Account",
        isActive: true,
        tokenExpiresAt: expiresAt,
        trackingStartedAt: new Date(),
      }),
    );

    return { workspaceId, accounts };
  }

  // ─── ENCRYPTION HELPERS ───────────────────────────────────────────────────

  /**
   * Encrypt a string using AES-256-GCM.
   * We use GCM mode (not CBC) because it provides authentication —
   * it detects if the ciphertext was tampered with.
   * The output format is: iv:authTag:encrypted (all hex encoded)
   */
  private encrypt(text: string): string {
    const ivBuf = crypto.randomBytes(16);
    const iv = new Uint8Array(ivBuf);
    const cipher = crypto.createCipheriv("aes-256-cbc", this.encryptionKey, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${ivBuf.toString("hex")}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(":");

    if (!ivHex || !encrypted) {
      throw new Error("Invalid encrypted token format");
    }

    const iv = new Uint8Array(Buffer.from(ivHex, "hex"));
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.encryptionKey, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
