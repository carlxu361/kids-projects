import type { AiPersonality } from "@space-hideout/shared";

export function dangerThresholdFor(personality: AiPersonality): number {
  switch (personality) {
    case "cautious":
      return 0.35;
    case "balanced":
      return 0.55;
    case "bold":
      return 0.72;
  }

  return 0.55;
}

export function shouldUseVent(
  personality: AiPersonality,
  dangerLevel: number,
  ventUsesRemaining: number
): boolean {
  if (ventUsesRemaining <= 0) {
    return false;
  }

  const emergencyThreshold =
    personality === "cautious" ? 0.7 : personality === "balanced" ? 0.82 : 0.92;
  return dangerLevel >= emergencyThreshold;
}

export function clampUtility(value: number): number {
  return Math.max(0, Math.min(1, value));
}
