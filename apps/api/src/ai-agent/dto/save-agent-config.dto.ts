import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import type { AgentGoal } from "@adspectr/shared";

/**
 * Payload the dashboard sends when a user activates / updates the AI Agent.
 * The funnel allocation is derived server-side from goal + budget, so it is
 * never accepted from the client.
 */
export class SaveAgentConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  link?: string;

  @IsIn(["sales", "brand"])
  goal: AgentGoal;

  @IsInt()
  @Min(0)
  @Max(10_000_000)
  budget: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stopLossUsd?: number;
}
