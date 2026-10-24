import type {
  MoonwellQuestState,
  MoonwellTargetId,
} from "../../quests/quest-machine";

export interface PlayerGroundPosition {
  x: number;
  z: number;
}

interface MoonwellTarget {
  id: MoonwellTargetId;
  x: number;
  z: number;
  radius: number;
}

export const MOONWELL_TARGETS: readonly MoonwellTarget[] = [
  { id: "mentor", x: 3.35, z: 7.4, radius: 4.6 },
  { id: "rune-dawn", x: -7, z: 0, radius: 2.7 },
  { id: "rune-tide", x: 0, z: -5.4, radius: 2.7 },
  { id: "rune-dusk", x: 7, z: 0, radius: 2.7 },
  { id: "relic", x: 0, z: -18, radius: 2.8 },
];

export function findNearbyMoonwellTarget(
  quest: MoonwellQuestState,
  player: PlayerGroundPosition,
): MoonwellTargetId | null {
  let closest: MoonwellTarget | null = null;
  let closestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const target of getAvailableTargets(quest)) {
    const dx = player.x - target.x;
    const dz = player.z - target.z;
    const distanceSquared = dx * dx + dz * dz;
    if (distanceSquared > target.radius * target.radius) continue;
    if (distanceSquared >= closestDistanceSquared) continue;
    closest = target;
    closestDistanceSquared = distanceSquared;
  }

  return closest?.id ?? null;
}

function getAvailableTargets(quest: MoonwellQuestState): MoonwellTarget[] {
  if (quest.stage === "arrival") return [MOONWELL_TARGETS[0]];
  if (quest.stage === "revealRunes" && quest.lumosEnabled) {
    return MOONWELL_TARGETS.slice(1, 4).filter(
      (target) => !quest.activatedRunes.includes(target.id),
    );
  }
  if (quest.stage === "insideStudy") return [MOONWELL_TARGETS[4]];
  return [];
}
