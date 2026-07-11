import {
  ForbiddenException,
  ServiceUnavailableException,
} from "@nestjs/common";

const mockAiClient = {
  completeJson: jest.fn(),
  completeVision: jest.fn(),
};
const mockConfigured = { value: true };

jest.mock("@adspectr/ai-sdk", () => ({
  createAdSpectrAiClientFromEnv: jest.fn(() => mockAiClient),
  isAiClientConfigured: jest.fn(() => mockConfigured.value),
}));

import { AiAgentService } from "./ai-agent.service";

describe("AiAgentService.planCampaignFromBrief", () => {
  let service: AiAgentService;
  let workspaceRepo: { findOne: jest.Mock };

  beforeEach(() => {
    mockConfigured.value = true;
    mockAiClient.completeJson.mockReset();
    mockAiClient.completeVision.mockReset();
    workspaceRepo = { findOne: jest.fn() };
    const config = { get: jest.fn(() => "sk-test") };
    service = new AiAgentService(
      {} as any,
      {} as any,
      config as any,
      {} as any,
      {} as any,
      workspaceRepo as any,
    );
  });

  it("throws ServiceUnavailable when AI is not configured", async () => {
    mockConfigured.value = false;
    await expect(
      service.planCampaignFromBrief({ workspaceId: "w1", brief: "hi" } as any),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("rejects when the caller does not own the workspace (IDOR)", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "w1", userId: "owner" });
    await expect(
      service.planCampaignFromBrief(
        { workspaceId: "w1", brief: "reklama qil" } as any,
        "attacker",
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns a normalised proposal and seeds from launchDefaults", async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: "w1",
      name: "Do'kon",
      industry: "ecommerce",
      aiStrategy: {
        launchDefaults: {
          objective: "traffic",
          geos: ["KZ"],
          ageMin: 20,
          ageMax: 40,
          dailyBudgetUsd: 15,
        },
      },
    });
    mockAiClient.completeJson.mockResolvedValue({
      name: "Qishki sotuv",
      objective: "sales",
      countries: ["uz", "kz"],
      ageMin: 18,
      ageMax: 45,
      dailyBudgetUsd: 12.7,
      headline: "30% chegirma",
      primaryText: "Krossovkalar",
      cta: "SHOP_NOW",
      rationale: "Sotuvni oshirish uchun",
    });

    const res = await service.planCampaignFromBrief({
      workspaceId: "w1",
      brief: "Krossovka soting, Toshkentda, kuniga 12 dollar",
    } as any);

    expect(res.objective).toBe("sales");
    expect(res.countries).toEqual(["UZ", "KZ"]);
    expect(res.ageMin).toBe(18);
    expect(res.ageMax).toBe(45);
    expect(res.dailyBudgetUsd).toBe(13); // rounded
    expect(res.cta).toBe("SHOP_NOW");
    expect(res.name).toBe("Qishki sotuv");

    // launchDefaults reached the model as seeds
    const prompt = mockAiClient.completeJson.mock.calls[0][0] as string;
    expect(prompt).toContain("KZ");
    expect(prompt).toContain("15");
  });

  it("falls back to launchDefaults when the model returns garbage", async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: "w1",
      aiStrategy: {
        launchDefaults: {
          objective: "leads",
          geos: ["UZ"],
          ageMin: 25,
          ageMax: 55,
          dailyBudgetUsd: 8,
        },
      },
    });
    mockAiClient.completeJson.mockResolvedValue({
      objective: "not_a_real_objective",
      countries: [],
      ageMin: 99,
      ageMax: 5,
      dailyBudgetUsd: 0,
      cta: "BAD_CTA",
    });

    const res = await service.planCampaignFromBrief({
      workspaceId: "w1",
      brief: "reklama qil",
    } as any);

    expect(res.objective).toBe("leads"); // invalid → default
    expect(res.countries).toEqual(["UZ"]); // empty → geos fallback
    // ageMin(99)→65, ageMax(5)→13 → min>=max → fall back to defaults
    expect(res.ageMin).toBe(25);
    expect(res.ageMax).toBe(55);
    expect(res.dailyBudgetUsd).toBe(8); // below floor → default
    expect(res.cta).toBe("LEARN_MORE"); // invalid → default
  });

  it("uses the vision path when an image is supplied", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "w1", industry: "food" });
    mockAiClient.completeVision.mockResolvedValue({
      name: "Ovqat",
      objective: "traffic",
      countries: ["UZ"],
      ageMin: 18,
      ageMax: 45,
      dailyBudgetUsd: 10,
      headline: "Mazali",
      primaryText: "Buyurtma bering",
      cta: "GET_OFFER",
      rationale: "Trafik",
    });

    const res = await service.planCampaignFromBrief({
      workspaceId: "w1",
      brief: "shu ovqatni reklama qil",
      imageBase64: "AAAABBBBCCCC",
      mimeType: "image/png",
    } as any);

    expect(mockAiClient.completeVision).toHaveBeenCalled();
    expect(mockAiClient.completeJson).not.toHaveBeenCalled();
    expect(res.cta).toBe("GET_OFFER");
  });
});
