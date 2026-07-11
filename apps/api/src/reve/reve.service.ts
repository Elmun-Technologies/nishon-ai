import { HttpService } from "@nestjs/axios";
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import {
  GenerateImageAdDto,
  ImageAdAspect,
} from "./dtos/generate-image-ad.dto";

/**
 * Reve image generation, proxied via fal.ai's hosted Reve model so the API key
 * stays server-side. fal's synchronous endpoint returns the finished image(s)
 * directly, which keeps the client flow simple (no polling).
 *
 * Configure with FAL_KEY on the API server (fal.ai account that has Reve
 * access). Without it, generation reports "not configured" rather than failing
 * silently or faking an image.
 */
const FAL_REVE_ENDPOINT = "https://fal.run/fal-ai/reve/text-to-image";

/** Wizard aspect → the closest ratio Reve/fal accepts. */
const ASPECT_MAP: Record<ImageAdAspect, string> = {
  "1:1": "1:1",
  "4:5": "3:4",
  "9:16": "9:16",
  "16:9": "16:9",
};

interface FalImageResponse {
  images?: Array<{ url?: string; width?: number; height?: number }>;
  seed?: number;
}

@Injectable()
export class ReveService {
  private readonly logger = new Logger(ReveService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private apiKey(): string | undefined {
    return this.config.get<string>("FAL_KEY")?.trim() || undefined;
  }

  /** True when a key is present — lets the UI show generation as available. */
  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  ensureConfigured(): string {
    const key = this.apiKey();
    if (!key) {
      throw new ServiceUnavailableException(
        "Image generation is not configured. Set FAL_KEY on the API server.",
      );
    }
    return key;
  }

  async generateImageAd(
    dto: GenerateImageAdDto,
  ): Promise<{ images: string[]; seed: number | null }> {
    const key = this.ensureConfigured();
    const body = {
      prompt: dto.prompt.trim(),
      aspect_ratio: ASPECT_MAP[dto.aspectRatio ?? "1:1"] ?? "1:1",
      num_images: Math.min(4, Math.max(1, dto.numImages ?? 1)),
    };

    try {
      const res = await firstValueFrom(
        this.http.post<FalImageResponse>(FAL_REVE_ENDPOINT, body, {
          headers: {
            Authorization: `Key ${key}`,
            "Content-Type": "application/json",
          },
          timeout: 120_000,
        }),
      );
      const images = (res.data?.images ?? [])
        .map((i) => i?.url)
        .filter((u): u is string => typeof u === "string" && u.length > 0);
      if (images.length === 0) {
        this.logger.error({ msg: "Reve returned no images", data: res.data });
        throw new BadGatewayException("Image generation returned no images");
      }
      return { images, seed: res.data?.seed ?? null };
    } catch (e: any) {
      if (
        e instanceof BadGatewayException ||
        e instanceof ServiceUnavailableException
      ) {
        throw e;
      }
      const status = e?.response?.status;
      const data = e?.response?.data;
      const raw =
        (typeof data === "object" && data && (data.detail || data.message)) ||
        (typeof data === "string" ? data : null);
      this.logger.error({
        msg: "Reve generate failed",
        status,
        data: typeof data === "object" ? data : String(data),
      });
      throw new BadGatewayException(
        typeof raw === "string" && raw ? raw : "Image generation failed",
      );
    }
  }
}
