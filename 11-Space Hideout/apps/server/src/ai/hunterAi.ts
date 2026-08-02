import type { AiDecision, AiDecisionContext, AiVisibleTarget } from "@space-hideout/shared";
import { clampUtility } from "./utility.js";

export function decideHunterIntent(context: AiDecisionContext): AiDecision {
  if (context.role !== "hunter" || context.lifeState !== "alive") {
    return {
      intent: "idle",
      useVent: false,
      utility: 0,
      reason: "Only the living hunter uses hunter AI."
    };
  }

  const visibleCrewmate = nearestVisibleCrewmate(context.visibleTargets);
  if (visibleCrewmate) {
    return {
      intent: "hunter_chase",
      useVent: false,
      targetPlayerId: visibleCrewmate.playerId,
      utility: clampUtility(1 - visibleCrewmate.distance / 900),
      reason: "A living crewmate is visible, so chase uses legal sight information."
    };
  }

  if (context.phase === "final_hide") {
    if (context.hasFinalHidePingLead) {
      return {
        intent: "hunter_investigate_ping",
        useVent: false,
        utility: 0.78,
        reason: "Final Hide Ping gives a snapshot lead without continuous tracking."
      };
    }

    if (context.hasSeekMapZoneLead) {
      return {
        intent: "hunter_search_seek_zone",
        useVent: false,
        utility: 0.68,
        reason: "Seek map gives a zone lead, not exact player coordinates."
      };
    }
  }

  return {
    intent: "hunter_patrol",
    useVent: false,
    utility: 0.42,
    reason: "No legal target or Final Hide lead is available, so patrol likely task areas."
  };
}

function nearestVisibleCrewmate(targets: AiVisibleTarget[]): AiVisibleTarget | undefined {
  return targets
    .filter(
      (target) =>
        target.role === "crewmate" &&
        target.lifeState === "alive" &&
        target.lineOfSight &&
        target.sameFloor
    )
    .sort((a, b) => a.distance - b.distance)[0];
}
