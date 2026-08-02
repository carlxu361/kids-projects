import { PROTOCOL_VERSION } from "@space-hideout/shared";
import type { HealthResponse, RoundPhase } from "@space-hideout/shared";

const serverStartedAt = Date.now();

export function createHealthResponse(phase: RoundPhase): HealthResponse {
  return {
    ok: true,
    service: "space-hideout-server",
    protocolVersion: PROTOCOL_VERSION,
    phase,
    uptimeSeconds: Math.max(0, Math.floor((Date.now() - serverStartedAt) / 1000))
  };
}
