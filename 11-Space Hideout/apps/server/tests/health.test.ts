import { describe, expect, it } from "vitest";
import { createHealthResponse } from "../src/server/createHealth.js";

describe("health response", () => {
  it("reports the rebuilt protocol and lobby phase", () => {
    const health = createHealthResponse("lobby");

    expect(health.ok).toBe(true);
    expect(health.service).toBe("space-hideout-server");
    expect(health.protocolVersion).toMatch(/^hns-rebuild-/);
    expect(health.phase).toBe("lobby");
  });
});
