import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, HUNTER_COUNT, ROUND_DEFAULTS } from "../src/index.js";

describe("hide n seek baseline config", () => {
  it("locks every round to one hunter", () => {
    expect(HUNTER_COUNT).toBe(1);
  });

  it("uses the required default round timings", () => {
    expect(ROUND_DEFAULTS).toEqual({
      introSeconds: 8,
      headStartSeconds: 10,
      hideSeconds: 240,
      finalHideSeconds: 60
    });
  });

  it("defaults public rooms to random hunter selection", () => {
    expect(DEFAULT_SETTINGS.hunterSelectionMode).toBe("random");
  });
});
