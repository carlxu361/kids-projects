import { describe, expect, it } from "vitest";
import {
  findNearbyMoonwellTarget,
  MOONWELL_TARGETS,
} from "../src/world/interactions/moonwell-targets";
import {
  INITIAL_MOONWELL_QUEST,
  reduceMoonwellQuest,
} from "../src/quests/quest-machine";

function questWithRunesRevealed() {
  const lesson = reduceMoonwellQuest(INITIAL_MOONWELL_QUEST, {
    type: "INTERACT",
    targetId: "mentor",
  });
  return reduceMoonwellQuest(lesson, { type: "TOGGLE_LUMOS" });
}

describe("moonwell interaction targeting", () => {
  it("offers the mentor only within speaking distance", () => {
    expect(findNearbyMoonwellTarget(INITIAL_MOONWELL_QUEST, { x: 3.35, z: 7.4 })).toBe("mentor");
    expect(findNearbyMoonwellTarget(INITIAL_MOONWELL_QUEST, { x: 0, z: 2 })).toBeNull();
  });

  it("hides rune interactions when Lumos is off", () => {
    const revealed = questWithRunesRevealed();
    expect(findNearbyMoonwellTarget(revealed, { x: -7, z: 0 })).toBe("rune-dawn");

    const withoutLight = reduceMoonwellQuest(revealed, { type: "TOGGLE_LUMOS" });
    expect(findNearbyMoonwellTarget(withoutLight, { x: -7, z: 0 })).toBeNull();
  });

  it("offers only unlit runes and selects the closest one", () => {
    const revealed = questWithRunesRevealed();
    const withFirstLit = reduceMoonwellQuest(revealed, {
      type: "INTERACT",
      targetId: "rune-dawn",
    });

    expect(findNearbyMoonwellTarget(withFirstLit, { x: -7, z: 0 })).toBeNull();
    expect(findNearbyMoonwellTarget(revealed, { x: 0, z: -5.4 })).toBe("rune-tide");
  });

  it("offers the relic only inside the study and only once the player is close", () => {
    const beforeDoor = questWithRunesRevealed();
    expect(findNearbyMoonwellTarget(beforeDoor, { x: 0, z: -18 })).toBeNull();

    const insideStudy = {
      ...beforeDoor,
      stage: "insideStudy" as const,
      activatedRunes: ["rune-dawn", "rune-tide", "rune-dusk"] as const,
    };
    expect(findNearbyMoonwellTarget(insideStudy, { x: 0, z: -18 })).toBe("relic");
    expect(findNearbyMoonwellTarget(insideStudy, { x: 0, z: -12 })).toBeNull();
  });

  it("keeps each target in the authored scene range", () => {
    expect(MOONWELL_TARGETS.map(({ id }) => id)).toEqual([
      "mentor",
      "rune-dawn",
      "rune-tide",
      "rune-dusk",
      "relic",
    ]);
  });
});
