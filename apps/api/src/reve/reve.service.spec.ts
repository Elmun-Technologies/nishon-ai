import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import {
  BadGatewayException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { of, throwError } from "rxjs";
import { ReveService } from "./reve.service";

describe("ReveService", () => {
  let service: ReveService;
  let http: { post: jest.Mock };
  let key: string | undefined;

  beforeEach(async () => {
    http = { post: jest.fn() };
    key = "fal-key";
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReveService,
        { provide: HttpService, useValue: http },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => key) },
        },
      ],
    }).compile();
    service = module.get(ReveService);
  });

  it("reports configured based on FAL_KEY", () => {
    expect(service.isConfigured()).toBe(true);
    key = "";
    expect(service.isConfigured()).toBe(false);
  });

  it("throws ServiceUnavailable when not configured", async () => {
    key = "";
    await expect(
      service.generateImageAd({ prompt: "a cat" }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(http.post).not.toHaveBeenCalled();
  });

  it("maps aspect ratio and returns image urls", async () => {
    http.post.mockReturnValue(
      of({ data: { images: [{ url: "https://img/1.png" }], seed: 42 } }),
    );
    const out = await service.generateImageAd({
      prompt: "product on a table",
      aspectRatio: "4:5",
      numImages: 2,
    });
    expect(out).toEqual({ images: ["https://img/1.png"], seed: 42 });
    const [url, body, opts] = http.post.mock.calls[0];
    expect(url).toContain("fal-ai/reve/text-to-image");
    expect(body.aspect_ratio).toBe("3:4"); // 4:5 → closest Reve ratio
    expect(body.num_images).toBe(2);
    expect(opts.headers.Authorization).toBe("Key fal-key");
  });

  it("throws BadGateway when the response has no images", async () => {
    http.post.mockReturnValue(of({ data: { images: [] } }));
    await expect(
      service.generateImageAd({ prompt: "x" }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it("surfaces upstream errors as BadGateway", async () => {
    http.post.mockReturnValue(
      throwError(() => ({
        response: { status: 401, data: { detail: "bad key" } },
      })),
    );
    await expect(
      service.generateImageAd({ prompt: "x" }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
