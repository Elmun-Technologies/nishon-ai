import {
  BadRequestException,
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

// eslint-disable-next-line @typescript-eslint/no-var-requires
import { AiAgentService } from "./ai-agent.service";

describe("AiAgentService.runFocusGroup", () => {
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
      service.runFocusGroup({ workspaceId: "w1", adCopy: "hi" } as any),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("rejects when the caller does not own the workspace (IDOR)", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "w1", userId: "owner" });
    await expect(
      service.runFocusGroup(
        { workspaceId: "w1", headline: "hi" } as any,
        "attacker",
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects when no creative is provided", async () => {
    await expect(
      service.runFocusGroup({ workspaceId: "w1" } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("builds personas from the workspace audience and aggregates in code", async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: "w1",
      name: "Do'kon",
      industry: "ecommerce",
      targetAudience: "Onlayn xaridorlar",
      aiStrategy: { geos: ["UZ"], ageRanges: ["25-34"] },
    });
    mockAiClient.completeJson.mockResolvedValue({
      personas: [
        {
          label: "A",
          clickProbability: 0.6,
          emotion: "qiziqdi",
          objection: "narx",
          whatWouldMakeMeClick: "chegirma",
        },
        {
          label: "B",
          clickProbability: 0.2,
          emotion: "befarq",
          objection: "ishonch",
          whatWouldMakeMeClick: "sharh",
        },
        { label: "C", clickProbability: 5 }, // out-of-range → clamps to 1
      ],
      topObjections: ["narx yuqori"],
      topImprovements: ["ijtimoiy isbot qo'shing"],
    });

    const res = await service.runFocusGroup({
      workspaceId: "w1",
      headline: "Yangi krossovka",
      goal: "sales",
    } as any);

    // clamping: 0.6, 0.2, 1 → avg 0.6
    expect(res.personas[2].clickProbability).toBe(1);
    expect(res.avgClickProbability).toBe(0.6);
    expect(res.verdict).toBe("ready"); // 0.6 >= 0.45
    expect(res.winningPersona).toBe("C");
    expect(res.predictedCtrRange).toMatch(/%$/);
    expect(res.topObjections).toEqual(["narx yuqori"]);

    // persona seeds derived from geo (UZ → Toshkent) + age reached the model
    const prompt = mockAiClient.completeJson.mock.calls[0][0] as string;
    expect(prompt).toContain("Toshkent");
    expect(prompt).toContain("25-34");
  });

  it("uses the vision path when an image is supplied", async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: "w1", industry: "food" });
    mockAiClient.completeVision.mockResolvedValue({
      personas: [{ label: "A", clickProbability: 0.1 }],
      topObjections: [],
      topImprovements: [],
    });
    const res = await service.runFocusGroup({
      workspaceId: "w1",
      imageBase64: "AAAABBBBCCCCDDDD",
      mimeType: "image/png",
    } as any);
    expect(mockAiClient.completeVision).toHaveBeenCalled();
    expect(mockAiClient.completeJson).not.toHaveBeenCalled();
    expect(res.verdict).toBe("not_ready"); // 0.1 < 0.28
  });
});
