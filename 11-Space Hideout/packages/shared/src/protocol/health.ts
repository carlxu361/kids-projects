import type { RoundPhase } from "../types/state.js";

export interface HealthResponse {
  ok: true;
  service: "space-hideout-server";
  protocolVersion: string;
  phase: RoundPhase;
  uptimeSeconds: number;
}
