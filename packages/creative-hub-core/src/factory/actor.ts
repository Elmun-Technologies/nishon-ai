/**
 * AI Actor — HeyGen / D-ID lip-sync, ElevenLabs ovoz, Pika/Runway video stub kontraktlari.
 */

export type ActorGender = "female" | "male";
export type ActorLocalePreset = "uz-central-asia-1" | "uz-central-asia-2";

export interface ActorScriptInput {
  scriptUz: string;
  avatarPresetId: string;
  voicePresetId: string;
  brandShirtLogoUrl?: string;
}

export interface ActorPipelineStages {
  scriptDraft: string;
  humanEditedScript?: string;
  audioUrl?: string;
  videoJobId?: string;
}

/** Hybrid: AI skript → odam tahrirlaydi → TTS + video (keyin API). */
export function describeActorHybridFlow(): string[] {
  return [
    "1) AI skript (Uzbek, brend toni)",
    "2) Targetolog tahrirlaydi",
    "3) ElevenLabs (yoki boshqa) — ovoz",
    "4) HeyGen / D-ID — lip-sync + UGC layout",
    "5) Tasdiq va Project ga versiya",
  ];
}
