import { describe, expect, it } from "vitest";
import {
  INITIAL_MOONWELL_QUEST,
  reduceMoonwellQuest,
  type MoonwellQuestEvent,
} from "../src/quests/quest-machine";

function apply(events: MoonwellQuestEvent[]) {
  return events.reduce(reduceMoonwellQuest, INITIAL_MOONWELL_QUEST);
}

describe("moonwell story rules", () => {
  it("starts the lesson only when the player speaks to the mentor", () => {
    const wrongTarget = reduceMoonwellQuest(INITIAL_MOONWELL_QUEST, {
      type: "INTERACT",
      targetId: "relic",
    });
    expect(wrongTarget).toBe(INITIAL_MOONWELL_QUEST);

    expect(
      reduceMoonwellQuest(INITIAL_MOONWELL_QUEST, {
        type: "INTERACT",
        targetId: "mentor",
      }).stage,
    ).toBe("lesson");
  });

  it("reveals the rune lesson only after Lumos is switched on", () => {
    const lesson = reduceMoonwellQuest(INITIAL_MOONWELL_QUEST, {
      type: "INTERACT",
      targetId: "mentor",
    });
    const runeBeforeLumos = reduceMoonwellQuest(lesson, {
      type: "INTERACT",
      targetId: "rune-dawn",
    });
    expect(runeBeforeLumos).toBe(lesson);

    const revealed = reduceMoonwellQuest(lesson, { type: "TOGGLE_LUMOS" });
    expect(revealed.stage).toBe("revealRunes");
    expect(revealed.lumosEnabled).toBe(true);
  });

  it("requires Lumos and counts each rune once", () => {
    const revealed = apply([
      { type: "INTERACT", targetId: "mentor" },
      { type: "TOGGLE_LUMOS" },
    ]);
    const firstRune = reduceMoonwellQuest(revealed, {
      type: "INTERACT",
      targetId: "rune-dawn",
    });
    expect(firstRune.activatedRunes).toEqual(["rune-dawn"]);
    expect(
      reduceMoonwellQuest(firstRune, {
        type: "INTERACT",
        targetId: "rune-dawn",
      }),
    ).toBe(firstRune);

    const LumosOff = reduceMoonwellQuest(firstRune, { type: "TOGGLE_LUMOS" });
    expect(
      reduceMoonwellQuest(LumosOff, {
        type: "INTERACT",
        targetId: "rune-tide",
      }),
    ).toBe(LumosOff);
  });

  it("opens the hidden study only after all three distinct runes", () => {
    const beforeLastRune = apply([
      { type: "INTERACT", targetId: "mentor" },
      { type: "TOGGLE_LUMOS" },
      { type: "INTERACT", targetId: "rune-dawn" },
      { type: "INTERACT", targetId: "rune-tide" },
    ]);
    expect(beforeLastRune.stage).toBe("revealRunes");

    const unlocked = reduceMoonwellQuest(beforeLastRune, {
      type: "INTERACT",
      targetId: "rune-dusk",
    });
    expect(unlocked.stage).toBe("openStudy");
    expect(unlocked.activatedRunes).toHaveLength(3);
  });

  it("requires crossing the open doorway before collecting the relic", () => {
    const unlocked = apply([
      { type: "INTERACT", targetId: "mentor" },
      { type: "TOGGLE_LUMOS" },
      { type: "INTERACT", targetId: "rune-dawn" },
      { type: "INTERACT", targetId: "rune-tide" },
      { type: "INTERACT", targetId: "rune-dusk" },
    ]);
    expect(
      reduceMoonwellQuest(unlocked, { type: "INTERACT", targetId: "relic" }),
    ).toBe(unlocked);

    const inside = reduceMoonwellQuest(unlocked, { type: "ENTER_STUDY" });
    expect(inside.stage).toBe("insideStudy");
    expect(
      reduceMoonwellQuest(inside, { type: "INTERACT", targetId: "relic" }).stage,
    ).toBe("complete");
  });

  it("keeps a completed story stable when stale input arrives", () => {
    const complete = apply([
      { type: "INTERACT", targetId: "mentor" },
      { type: "TOGGLE_LUMOS" },
      { type: "INTERACT", targetId: "rune-dawn" },
      { type: "INTERACT", targetId: "rune-tide" },
      { type: "INTERACT", targetId: "rune-dusk" },
      { type: "ENTER_STUDY" },
      { type: "INTERACT", targetId: "relic" },
    ]);
    expect(complete.stage).toBe("complete");
    expect(
      reduceMoonwellQuest(complete, { type: "INTERACT", targetId: "mentor" }),
    ).toBe(complete);
    expect(reduceMoonwellQuest(complete, { type: "TOGGLE_LUMOS" })).toBe(complete);
  });
});
