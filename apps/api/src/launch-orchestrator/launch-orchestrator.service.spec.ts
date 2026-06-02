import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Platform } from "@adspectr/shared";
import { LaunchOrchestratorService } from "./launch-orchestrator.service";
import { LaunchJob } from "./entities/launch-job.entity";
import { ConnectedAccount } from "../platforms/entities/connected-account.entity";
import { WorkspaceMember } from "../workspace-members/entities/workspace-member.entity";
import { Workspace } from "../workspaces/entities/workspace.entity";
import { MetaConnector } from "../platforms/connectors/meta.connector";
import { GoogleConnector } from "../platforms/connectors/google.connector";
import * as cryptoUtil from "../common/crypto.util";

/**
 * These tests cover the core regression: before this PR, the orchestrator
 * ignored the user's launch payload (objective, dailyBudget, audiences,
 * targeting) and created a single hardcoded campaign on Meta. We now
 * verify that each field flows through to the right connector call.
 */
describe("LaunchOrchestratorService", () => {
  let service: LaunchOrchestratorService;
  let launchRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; find: jest.Mock };
  let accountRepo: { findOne: jest.Mock };
  let workspaceRepo: { findOne: jest.Mock };
  let memberRepo: { findOne: jest.Mock };
  let metaConnector: jest.Mocked<MetaConnector>;
  let _googleConnector: jest.Mocked<GoogleConnector>;

  const userId = "00000000-0000-0000-0000-000000000001";
  const workspaceId = "00000000-0000-0000-0000-000000000002";

  beforeEach(async () => {
    launchRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (entity) => entity),
      create: jest.fn((data) => ({ ...data, id: "job-1" })),
      find: jest.fn(),
    };
    accountRepo = {
      findOne: jest.fn().mockResolvedValue({
        externalAccountId: "act_999",
        accessToken: "encrypted-token",
        platform: Platform.META,
        isActive: true,
        workspaceId,
      }),
    };
    workspaceRepo = {
      findOne: jest.fn().mockResolvedValue({ id: workspaceId, userId }),
    };
    memberRepo = { findOne: jest.fn() };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === "ENCRYPTION_KEY") return "0".repeat(32);
        return undefined;
      }),
    };

    const mockMeta = {
      createCampaign: jest.fn().mockResolvedValue({ id: "camp_1" }),
      createAdSet: jest.fn().mockResolvedValue({ id: "adset_1" }),
      getCampaignAds: jest
        .fn()
        .mockResolvedValue([{ id: "ad_a", name: "A", creativeId: "cr_1", status: "ACTIVE" }]),
      createAdFromExistingCreative: jest.fn().mockResolvedValue({ id: "ad_new" }),
    };
    const mockGoogle = { createCampaign: jest.fn() };

    // Stub decryption — the real implementation requires a 32-byte key and
    // a specific AES-GCM payload format we do not need in unit tests.
    jest
      .spyOn(cryptoUtil, "decrypt")
      .mockReturnValue("plain-token");
    jest
      .spyOn(cryptoUtil, "resolveEncryptionKey")
      .mockReturnValue("0".repeat(32));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaunchOrchestratorService,
        { provide: getRepositoryToken(LaunchJob), useValue: launchRepo },
        { provide: getRepositoryToken(ConnectedAccount), useValue: accountRepo },
        { provide: getRepositoryToken(WorkspaceMember), useValue: memberRepo },
        { provide: getRepositoryToken(Workspace), useValue: workspaceRepo },
        { provide: ConfigService, useValue: mockConfig },
        { provide: MetaConnector, useValue: mockMeta },
        { provide: GoogleConnector, useValue: mockGoogle },
      ],
    }).compile();

    service = module.get(LaunchOrchestratorService);
    metaConnector = module.get(MetaConnector);
    _googleConnector = module.get(GoogleConnector);
  });

  afterEach(() => jest.restoreAllMocks());

  function jobWith(payload: Record<string, any>): LaunchJob {
    return {
      id: "00000000-0000-0000-0000-000000000abc",
      workspaceId,
      status: "validated",
      payload,
      error: null,
      launchedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as LaunchJob;
  }

  describe("launch — payload is forwarded to Meta", () => {
    it("uses payload.objective and payload.dailyBudget when calling createCampaign", async () => {
      launchRepo.findOne.mockResolvedValue(
        jobWith({
          workspaceId,
          platform: "meta",
          objective: "OUTCOME_LEADS",
          budgetType: "CBO",
          dailyBudget: 75,
          audiences: [
            { name: "prospecting", funnelStage: "acquisition_prospecting" },
          ],
        }),
      );

      const result = await service.launch("job-1", userId);

      expect(metaConnector.createCampaign).toHaveBeenCalledTimes(1);
      const [, , campaignParams] = metaConnector.createCampaign.mock.calls[0];
      expect(campaignParams.objective).toBe("OUTCOME_LEADS");
      expect(campaignParams.dailyBudget).toBe(75);
      expect(campaignParams.status).toBe("PAUSED");
      expect(result.status).toBe("launched");
    });

    it("falls back to safe defaults when payload.dailyBudget is missing", async () => {
      launchRepo.findOne.mockResolvedValue(
        jobWith({
          workspaceId,
          platform: "meta",
          objective: "OUTCOME_SALES",
          budgetType: "CBO",
          // dailyBudget omitted — backward compat
          audiences: [
            { name: "prospecting", funnelStage: "acquisition_prospecting" },
          ],
        }),
      );

      await service.launch("job-1", userId);

      const [, , campaignParams] = metaConnector.createCampaign.mock.calls[0];
      expect(campaignParams.dailyBudget).toBe(20);
    });

    it("creates one ad set per audience and forwards targeting", async () => {
      launchRepo.findOne.mockResolvedValue(
        jobWith({
          workspaceId,
          platform: "meta",
          objective: "OUTCOME_SALES",
          budgetType: "ABO",
          dailyBudget: 60,
          audiences: [
            { name: "Yangi", funnelStage: "acquisition_prospecting" },
            { name: "Retarget", funnelStage: "retargeting" },
          ],
          targeting: {
            countries: ["UZ", "KZ"],
            ageMin: 25,
            ageMax: 45,
            genders: [2],
          },
        }),
      );

      await service.launch("job-1", userId);

      expect(metaConnector.createAdSet).toHaveBeenCalledTimes(2);
      const [, , firstAdSet] = metaConnector.createAdSet.mock.calls[0];
      const [, , secondAdSet] = metaConnector.createAdSet.mock.calls[1];

      // ABO splits the budget across ad sets
      expect(firstAdSet.dailyBudget).toBe(30);

      // Targeting from the payload is honored on every ad set
      expect(firstAdSet.targeting.geoLocations.countries).toEqual(["UZ", "KZ"]);
      expect(firstAdSet.targeting.ageMin).toBe(25);
      expect(firstAdSet.targeting.ageMax).toBe(45);
      expect(firstAdSet.targeting.genders).toEqual([2]);

      // Funnel stage drives the optimization goal: prospecting → LINK_CLICKS,
      // retargeting → OFFSITE_CONVERSIONS
      expect(firstAdSet.optimizationGoal).toBe("LINK_CLICKS");
      expect(secondAdSet.optimizationGoal).toBe("OFFSITE_CONVERSIONS");
    });

    it("copies creatives from source campaigns onto every new ad set", async () => {
      launchRepo.findOne.mockResolvedValue(
        jobWith({
          workspaceId,
          platform: "meta",
          objective: "OUTCOME_SALES",
          budgetType: "CBO",
          dailyBudget: 40,
          audiences: [
            { name: "A", funnelStage: "acquisition_prospecting" },
          ],
          sourceCampaignIds: ["src_camp_1", "src_camp_2"],
          copyCreatives: true,
        }),
      );

      metaConnector.getCampaignAds
        .mockResolvedValueOnce([
          { id: "ad_1", name: "n1", creativeId: "cr_1", status: "ACTIVE" },
        ])
        .mockResolvedValueOnce([
          { id: "ad_2", name: "n2", creativeId: "cr_2", status: "ACTIVE" },
          { id: "ad_3", name: "n3", creativeId: null, status: "PAUSED" },
        ]);

      const result = await service.launch("job-1", userId);

      expect(metaConnector.getCampaignAds).toHaveBeenCalledTimes(2);
      // 1 ad set × 2 non-null creatives
      expect(metaConnector.createAdFromExistingCreative).toHaveBeenCalledTimes(2);
      const savedResult = (result.payload as any).launchResult;
      expect(savedResult.sourceCreativeCount).toBe(2);
      expect(savedResult.adIds).toEqual(["ad_new", "ad_new"]);
    });

    it("skips creative copy when copyCreatives is explicitly false", async () => {
      launchRepo.findOne.mockResolvedValue(
        jobWith({
          workspaceId,
          platform: "meta",
          objective: "OUTCOME_SALES",
          budgetType: "CBO",
          dailyBudget: 40,
          audiences: [{ name: "A", funnelStage: "acquisition_prospecting" }],
          sourceCampaignIds: ["src_camp_1"],
          copyCreatives: false,
        }),
      );

      await service.launch("job-1", userId);

      expect(metaConnector.getCampaignAds).not.toHaveBeenCalled();
      expect(metaConnector.createAdFromExistingCreative).not.toHaveBeenCalled();
    });

    it("marks the job failed when no audiences are provided in validate()", async () => {
      launchRepo.findOne.mockResolvedValue(
        jobWith({
          workspaceId,
          platform: "meta",
          objective: "OUTCOME_SALES",
          budgetType: "CBO",
          audiences: [],
        }),
      );

      const result = await service.validate("job-1", userId);
      expect(result.status).toBe("failed");
      expect(result.error).toMatch(/audience/i);
    });
  });
});
