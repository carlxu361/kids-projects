import type { RoundPhase } from "@space-hideout/shared";

export interface RoundState {
  phase: RoundPhase;
  createdAt: number;
}

export function createInitialRoundState(now = Date.now()): RoundState {
  return {
    phase: "lobby",
    createdAt: now
  };
}
