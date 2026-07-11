import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { TelegramWebhookController } from "./telegram-webhook.controller";
import { RetargetRedisService } from "./retarget-redis.service";
import { RetargetTelegramBotService } from "./retarget-telegram-bot.service";

describe("TelegramWebhookController — digest link bridge", () => {
  let controller: TelegramWebhookController;
  let redis: {
    setLinkTokenChatId: jest.Mock;
    getLinkTokenChatId: jest.Mock;
  };
  let secret = "";

  beforeEach(async () => {
    redis = {
      setLinkTokenChatId: jest.fn().mockResolvedValue(undefined),
      getLinkTokenChatId: jest.fn().mockResolvedValue(null),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramWebhookController],
      providers: [
        { provide: RetargetRedisService, useValue: redis },
        {
          provide: RetargetTelegramBotService,
          useValue: { sendPlain: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => secret) },
        },
      ],
    }).compile();
    controller = module.get(TelegramWebhookController);
  });

  describe("linkComplete", () => {
    beforeEach(() => {
      secret = "";
    });

    it("stores token → chatId in Redis", async () => {
      await controller.linkComplete(undefined, {
        token: "lnk_1",
        chatId: "555",
      });
      expect(redis.setLinkTokenChatId).toHaveBeenCalledWith("lnk_1", "555");
    });

    it("rejects a missing token or chatId", async () => {
      await expect(
        controller.linkComplete(undefined, { token: "lnk_1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(redis.setLinkTokenChatId).not.toHaveBeenCalled();
    });

    it("enforces the secret when one is configured", async () => {
      secret = "s3cr3t";
      await expect(
        controller.linkComplete("wrong", { token: "lnk_1", chatId: "555" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      await controller.linkComplete("s3cr3t", {
        token: "lnk_1",
        chatId: "555",
      });
      expect(redis.setLinkTokenChatId).toHaveBeenCalledWith("lnk_1", "555");
    });
  });

  describe("linkStatus", () => {
    beforeEach(() => {
      secret = "";
    });

    it("returns linked + chatId when Redis has it", async () => {
      redis.getLinkTokenChatId.mockResolvedValue("777");
      expect(await controller.linkStatus(undefined, "lnk_9")).toEqual({
        ok: true,
        status: "linked",
        chatId: "777",
      });
    });

    it("returns missing when Redis has nothing (still polling)", async () => {
      redis.getLinkTokenChatId.mockResolvedValue(null);
      expect(await controller.linkStatus(undefined, "lnk_9")).toEqual({
        ok: true,
        status: "missing",
      });
    });

    it("rejects a missing token", async () => {
      await expect(
        controller.linkStatus(undefined, undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
