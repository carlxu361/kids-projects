import { describe, expect, it } from "vitest";
import { calculateDangerLevel, calculateEffectiveDistance } from "../src/index.js";

describe("danger math", () => {
  it("fills when the hunter is very close and empties when far away", () => {
    expect(calculateDangerLevel(80)).toBe(1);
    expect(calculateDangerLevel(900)).toBe(0);
    expect(calculateDangerLevel(420)).toBeGreaterThan(0);
  });

  it("adds floor penalty without ignoring distance", () => {
    expect(calculateEffectiveDistance(100, 1)).toBe(320);
    expect(calculateEffectiveDistance(100, -2)).toBe(540);
  });
});
