import type { AiDecision, AiDecisionContext } from "@space-hideout/shared";
import { clampUtility, dangerThresholdFor, shouldUseVent } from "./utility.js";

export function decideCrewmateIntent(context: AiDecisionContext): AiDecision {
  if (context.role !== "crewmate" || context.lifeState !== "alive") {
    return {
      intent: "idle",
      useVent: false,
      utility: 0,
      reason: "Only living crewmates use crewmate AI."
    };
  }

  if (context.phase === "final_hide") {
    return {
      intent: context.dangerLevel > 0.45 ? "crewmate_escape" : "crewmate_hide",
      useVent: shouldUseVent(context.personality, context.dangerLevel, context.ventUsesRemaining),
      utility: clampUtility(0.68 + context.dangerLevel * 0.32),
      reason: "Final Hide removes task goals; survival is the only crewmate objective."
    };
  }

  if (context.phase !== "hide") {
    return {
      intent: "idle",
      useVent: false,
      utility: 0.1,
      reason: "Crewmate AI waits until Hide or Final Hide."
    };
  }

  const threshold = dangerThresholdFor(context.personality);
  if (context.dangerLevel >= threshold) {
    return {
      intent: "crewmate_escape",
      useVent: shouldUseVent(context.personality, context.dangerLevel, context.ventUsesRemaining),
      utility: clampUtility(0.55 + context.dangerLevel * 0.45),
      reason: "Danger is high enough to interrupt tasks and escape."
    };
  }

  if (context.assignedTaskCount > 0 && !context.isInTaskSession) {
    return {
      intent: "crewmate_find_task",
      useVent: false,
      utility: clampUtility(0.62 - context.dangerLevel * 0.3),
      reason: "Low danger during Hide means tasks are worth doing to reduce Hide time."
    };
  }

  return {
    intent: "crewmate_hide",
    useVent: false,
    utility: 0.35,
    reason: "No task is currently useful, so the crewmate looks for a safer position."
  };
}
