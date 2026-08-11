import { describe, expect, it } from "vitest";
import { moveCircleWithCollision } from "./collision";

const bounds = { minX: 0, minY: 0, maxX: 500, maxY: 500 };
const walls = [{ x: 200, y: 100, width: 30, height: 220 }];

describe("moveCircleWithCollision", () => {
  it("does not tunnel through a wall during a large frame step", () => {
    const position = moveCircleWithCollision(
      { x: 100, y: 200 },
      { x: 260, y: 0 },
      20,
      walls,
      bounds
    );

    expect(position.x).toBeLessThanOrEqual(180);
  });

  it("slides along an obstacle instead of entering it", () => {
    const position = moveCircleWithCollision(
      { x: 160, y: 80 },
      { x: 90, y: 140 },
      20,
      walls,
      bounds
    );

    expect(position.x).toBeLessThanOrEqual(180);
    expect(position.y).toBeGreaterThan(80);
  });
});
