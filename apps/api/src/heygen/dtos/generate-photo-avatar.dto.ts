import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

/** Client-facing actor spec → mapped to HeyGen photo avatar API enums. */
export class GeneratePhotoAvatarDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsIn(["male", "female", "other"])
  gender!: "male" | "female" | "other";

  @IsIn(["young", "middle", "senior"])
  age!: "young" | "middle" | "senior";

  @IsIn([
    "any",
    "caucasian",
    "black",
    "east-asian",
    "south-asian",
    "hispanic",
    "middle-eastern",
    "mixed",
  ])
  ethnicity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  outfitPreset?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  outfitDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  scenePreset?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sceneDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  additionalDetails?: string;

  @IsOptional()
  @IsIn(["selfie", "presenter"])
  shootingStyle?: "selfie" | "presenter";

  @IsOptional()
  @IsIn(["professional", "casual", "ugc"])
  visualStyle?: "professional" | "casual" | "ugc";
}
