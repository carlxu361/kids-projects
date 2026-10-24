import { describe, expect, it } from "vitest";
import { isSpellReady, remainingCooldown } from "../src/spells/cooldown";

describe("spell cooldown rules", () => {
  it("allows a spell that has never been cast", () => {
    expect(isSpellReady(null, 10, 1)).toBe(true);
  });

  it("blocks until the cooldown has elapsed", () => {
    expect(isSpellReady(10, 10.2, 0.35)).toBe(false);
    expect(isSpellReady(10, 10.351, 0.35)).toBe(true);
  });

  it("never reports a negative remaining cooldown", () => {
    expect(remainingCooldown(10, 10.2, 0.35)).toBeCloseTo(0.15);
    expect(remainingCooldown(10, 11, 0.35)).toBe(0);
  });
});
