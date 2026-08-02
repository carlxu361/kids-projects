export type RoundPhase = "lobby" | "intro" | "head_start" | "hide" | "final_hide" | "ended";

export type PlayerRole = "hunter" | "crewmate";

export type PlayerLifeState = "alive" | "death_animation" | "ghost";

export type TaskLength = "common" | "short" | "long";

export type VentState = "outside" | "entering" | "inside" | "exiting";

export interface Vector2 {
  x: number;
  y: number;
}

export interface DangerUpdate {
  value: number;
  timestamp: number;
}
