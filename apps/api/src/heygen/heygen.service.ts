import { HttpService } from "@nestjs/axios";
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { GeneratePhotoAvatarDto } from "./dtos/generate-photo-avatar.dto";

const HEYGEN_BASE = "https://api.heygen.com";

type HeyGenGender = "Woman" | "Man" | "Unspecified";
type HeyGenAge =
  | "Young Adult"
  | "Early Middle Age"
  | "Late Middle Age"
  | "Senior"
  | "Unspecified";
type HeyGenEthnicity =
  | "White"
  | "Black"
  | "Asian American"
  | "East Asian"
  | "South East Asian"
  | "South Asian"
  | "Middle Eastern"
  | "Pacific"
  | "Hispanic"
  | "Unspecified";

@Injectable()
export class HeygenService {
  private readonly logger = new Logger(HeygenService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private apiKey(): string | undefined {
    const k = this.config.get<string>("HEYGEN_API_KEY");
    return k?.trim() || undefined;
  }

  ensureConfigured(): string {
    const key = this.apiKey();
    if (!key) {
      throw new ServiceUnavailableException(
        "HeyGen is not configured. Set HEYGEN_API_KEY on the API server.",
      );
    }
    return key;
  }

  mapGender(g: GeneratePhotoAvatarDto["gender"]): HeyGenGender {
    if (g === "male") return "Man";
    if (g === "female") return "Woman";
    return "Unspecified";
  }

  mapAge(a: GeneratePhotoAvatarDto["age"]): HeyGenAge {
    if (a === "young") return "Young Adult";
    if (a === "middle") return "Early Middle Age";
    if (a === "senior") return "Senior";
    return "Unspecified";
  }

  mapEthnicity(code: string): HeyGenEthnicity {
    const m: Record<string, HeyGenEthnicity> = {
      any: "Unspecified",
      caucasian: "White",
      black: "Black",
      "east-asian": "East Asian",
      "south-asian": "South Asian",
      hispanic: "Hispanic",
      "middle-eastern": "Middle Eastern",
      mixed: "Unspecified",
    };
    return m[code] ?? "Unspecified";
  }

  mapPose(shooting?: string): "half_body" | "close_up" | "full_body" {
    if (shooting === "selfie") return "close_up";
    return "half_body";
  }

  mapHeygenStyle(visual?: string): "Realistic" | "Pixar" | "Cinematic" | "Vintage" | "Noir" | "Cyberpunk" | "Unspecified" {
    if (visual === "ugc") return "Realistic";
    if (visual === "professional") return "Cinematic";
    if (visual === "casual") return "Realistic";
    return "Unspecified";
  }

  buildAppearance(dto: GeneratePhotoAvatarDto): string {
    const skipPreset = (p?: string) => !p || p.toLowerCase() === "randomize";
    const parts = [
      !skipPreset(dto.outfitPreset) ? `Outfit: ${dto.outfitPreset}` : "",
      dto.outfitDescription?.trim(),
      !skipPreset(dto.scenePreset) ? `Scene: ${dto.scenePreset}` : "",
      dto.sceneDescription?.trim(),
      dto.additionalDetails?.trim(),
      dto.shootingStyle ? `Framing: ${dto.shootingStyle}` : "",
    ].filter(Boolean);
    let s = parts.join(". ").slice(0, 1000);
    if (!s.trim()) {
      s = "Professional marketing presenter, neutral expression, soft studio lighting.";
    }
    return s;
  }

  async generatePhotoAvatar(dto: GeneratePhotoAvatarDto): Promise<{ generationId: string }> {
    const key = this.ensureConfigured();
    const body = {
      name: dto.name.trim(),
      age: this.mapAge(dto.age),
      gender: this.mapGender(dto.gender),
      ethnicity: this.mapEthnicity(dto.ethnicity),
      orientation: "square" as const,
      pose: this.mapPose(dto.shootingStyle),
      style: this.mapHeygenStyle(dto.visualStyle),
      appearance: this.buildAppearance(dto),
    };

    try {
      const res = await firstValueFrom(
        this.http.post<{ error?: string | null; data?: { generation_id?: string } }>(
          `${HEYGEN_BASE}/v2/photo_avatar/photo/generate`,
          body,
          {
            headers: {
              "x-api-key": key,
              "Content-Type": "application/json",
            },
            timeout: 60_000,
          },
        ),
      );
      const payload = res.data;
      if (payload?.error) {
        this.logger.warn({ msg: "HeyGen generate error field", error: payload.error });
        throw new BadGatewayException(String(payload.error));
      }
      const generationId = payload?.data?.generation_id;
      if (!generationId) {
        this.logger.error({ msg: "HeyGen missing generation_id", payload });
        throw new BadGatewayException("HeyGen response missing generation_id");
      }
      return { generationId };
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const raw =
        (typeof data === "object" && data && (data.message || data.error)) ||
        (typeof data === "string" ? data : null);
      const msg = raw || e?.message || "HeyGen request failed";
      this.logger.error({ msg: "HeyGen generate failed", status, data: typeof data === "object" ? data : String(data) });
      if (e instanceof BadGatewayException || e instanceof ServiceUnavailableException) throw e;
      throw new BadGatewayException(typeof msg === "string" ? msg : "HeyGen request failed");
    }
  }

  async getPhotoGenerationStatus(generationId: string): Promise<{
    id: string;
    status: string;
    imageUrlList: string[] | null;
    message: string | null;
  }> {
    const key = this.ensureConfigured();
    try {
      const res = await firstValueFrom(
        this.http.get<{
          error?: string | null;
          data?: {
            id?: string;
            status?: string;
            msg?: string | null;
            image_url_list?: string[] | null;
          };
        }>(`${HEYGEN_BASE}/v2/photo_avatar/generation/${encodeURIComponent(generationId)}`, {
          headers: { "x-api-key": key },
          timeout: 30_000,
        }),
      );
      const payload = res.data;
      if (payload?.error) {
        throw new BadGatewayException(String(payload.error));
      }
      const d = payload?.data;
      if (!d?.id || !d.status) {
        throw new BadGatewayException("Invalid HeyGen status response");
      }
      return {
        id: d.id,
        status: d.status,
        imageUrlList: d.image_url_list ?? null,
        message: d.msg ?? null,
      };
    } catch (e: any) {
      if (e instanceof BadGatewayException || e instanceof ServiceUnavailableException) throw e;
      const msg = e?.response?.data?.message || e?.message || "HeyGen status failed";
      throw new BadGatewayException(String(msg));
    }
  }
}
