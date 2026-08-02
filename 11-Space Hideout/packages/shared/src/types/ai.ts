import type { PlayerLifeState, PlayerRole, RoundPhase } from "./state.js";

export type AiPersonality = "cautious" | "balanced" | "bold";

export type AiIntent =
  | "idle"
  | "crewmate_find_task"
  | "crewmate_escape"
  | "crewmate_hide"
  | "hunter_patrol"
  | "hunter_chase"
  | "hunter_investigate_ping"
  | "hunter_search_seek_zone";

export interface AiVisibleTarget {
  playerId: string;
  role: PlayerRole;
  lifeState: PlayerLifeState;
  distance: number;
  sameFloor: boolean;
  lineOfSight: boolean;
}

export interface AiDecisionContext {
  role: PlayerRole;
  phase: RoundPhase;
  lifeState: PlayerLifeState;
  personality: AiPersonality;
  dangerLevel: number;
  assignedTaskCount: number;
  ventUsesRemaining: number;
  isInTaskSession: boolean;
  visibleTargets: AiVisibleTarget[];
  hasFinalHidePingLead: boolean;
  hasSeekMapZoneLead: boolean;
}

export interface AiDecision {
  intent: AiIntent;
  useVent: boolean;
  targetPlayerId?: string;
  utility: number;
  reason: string;
}
