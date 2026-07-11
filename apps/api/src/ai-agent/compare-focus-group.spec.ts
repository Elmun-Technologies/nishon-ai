import { ServiceUnavailableException } from "@nestjs/common";

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

describe("AiAgentService.compareFocusGroup", () => {
  let service: AiAgentService;
  let workspaceRepo: { findOne: jest.Mock };

  const panel = (probs: number[]) => ({
    personas: probs.map((p, i) => ({ label: `P${i}`, clickProbability: p })),
    topObjections: [],
    topImprovements: [],
  });

  beforeEach(() => {
    mockConfigured.value = true;
    mockAiClient.completeJson.mockReset();
    workspaceRepo = {
      findOne: jest.fn().mockResolvedValue({ id: "w1", industry: "ecom" }),
    };
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

  it("propagates ServiceUnavailable when AI is not configured", async () => {
    mockConfigured.value = false;
    await expect(
      service.compareFocusGroup({
        workspaceId: "w1",
        variantA: { headline: "A" },
        variantB: { headline: "B" },
      } as any),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("picks the higher-interest variant and computes lift", async () => {
    // First call = variant A (avg 0.6), second = variant B (avg 0.3)
    mockAiClient.completeJson
      .mockResolvedValueOnce(panel([0.6, 0.6]))
      .mockResolvedValueOnce(panel([0.3, 0.3]));

    const res = await service.compareFocusGroup({
      workspaceId: "w1",
      variantA: { headline: "A" },
      variantB: { headline: "B" },
    } as any);

    expect(res.a.avgClickProbability).toBe(0.6);
    expect(res.b.avgClickProbability).toBe(0.3);
    expect(res.winner).toBe("A");
    expect(res.liftPct).toBe(100); // (0.6-0.3)/0.3
    expect(res.recommendation).toContain("A");
  });

  it("reports a tie when the two variants are within the threshold", async () => {
    mockAiClient.completeJson
      .mockResolvedValueOnce(panel([0.4, 0.4]))
      .mockResolvedValueOnce(panel([0.41, 0.41]));

    const res = await service.compareFocusGroup({
      workspaceId: "w1",
      variantA: { headline: "A" },
      variantB: { headline: "B" },
    } as any);

    expect(res.winner).toBe("tie");
    expect(res.liftPct).toBe(0);
  });
});
