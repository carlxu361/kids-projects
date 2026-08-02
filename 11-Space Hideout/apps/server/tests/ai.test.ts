import { describe, expect, it } from "vitest";
import type { AiDecisionContext } from "@space-hideout/shared";
import {
  createBotName,
  decideCrewmateIntent,
  decideHunterIntent,
  isBotName
} from "../src/ai/index.js";

const baseCrewmateContext: AiDecisionContext = {
  role: "crewmate",
  phase: "hide",
  lifeState: "alive",
  personality: "balanced",
  dangerLevel: 0.1,
  assignedTaskCount: 2,
  ventUsesRemaining: 3,
  isInTaskSession: false,
  visibleTargets: [],
  hasFinalHidePingLead: false,
  hasSeekMapZoneLead: false
};

const baseHunterContext: AiDecisionContext = {
  role: "hunter",
  phase: "hide",
  lifeState: "alive",
  personality: "balanced",
  dangerLevel: 0,
  assignedTaskCount: 0,
  ventUsesRemaining: 0,
  isInTaskSession: false,
  visibleTargets: [],
  hasFinalHidePingLead: false,
  hasSeekMapZoneLead: false
};

describe("bot names", () => {
  it("always creates visible BOT-prefixed names", () => {
    expect(createBotName(0)).toMatch(/^BOT-/);
    expect(isBotName(createBotName(15))).toBe(true);
  });
});

describe("crewmate AI intent", () => {
  it("finds tasks during Hide when danger is low", () => {
    expect(decideCrewmateIntent(baseCrewmateContext).intent).toBe("crewmate_find_task");
  });

  it("escapes and may use vents when danger is high", () => {
    const decision = decideCrewmateIntent({
      ...baseCrewmateContext,
      dangerLevel: 0.9
    });

    expect(decision.intent).toBe("crewmate_escape");
    expect(decision.useVent).toBe(true);
  });

  it("removes task goals during Final Hide", () => {
    const decision = decideCrewmateIntent({
      ...baseCrewmateContext,
      phase: "final_hide",
      assignedTaskCount: 99,
      dangerLevel: 0.2
    });

    expect(decision.intent).toBe("crewmate_hide");
    expect(decision.reason).toContain("Final Hide removes task goals");
  });
});

describe("hunter AI intent", () => {
  it("chases the nearest visible living crewmate on the same floor", () => {
    const decision = decideHunterIntent({
      ...baseHunterContext,
      visibleTargets: [
        {
          playerId: "far",
          role: "crewmate",
          lifeState: "alive",
          distance: 400,
          sameFloor: true,
          lineOfSight: true
        },
        {
          playerId: "near",
          role: "crewmate",
          lifeState: "alive",
          distance: 120,
          sameFloor: true,
          lineOfSight: true
        }
      ]
    });

    expect(decision.intent).toBe("hunter_chase");
    expect(decision.targetPlayerId).toBe("near");
    expect(decision.useVent).toBe(false);
  });

  it("uses Final Hide Ping before Seek map zones", () => {
    const decision = decideHunterIntent({
      ...baseHunterContext,
      phase: "final_hide",
      hasFinalHidePingLead: true,
      hasSeekMapZoneLead: true
    });

    expect(decision.intent).toBe("hunter_investigate_ping");
    expect(decision.reason).toContain("snapshot");
  });

  it("patrols when no legal information is available", () => {
    expect(decideHunterIntent(baseHunterContext).intent).toBe("hunter_patrol");
  });
});
