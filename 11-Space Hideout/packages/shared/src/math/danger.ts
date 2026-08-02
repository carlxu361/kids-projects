export function calculateDangerLevel(
  distance: number,
  maxDistance = 750,
  criticalDistance = 90
): number {
  if (distance >= maxDistance) {
    return 0;
  }

  if (distance <= criticalDistance) {
    return 1;
  }

  return 1 - (distance - criticalDistance) / (maxDistance - criticalDistance);
}

export function calculateEffectiveDistance(
  horizontalDistance: number,
  floorDifference: number,
  floorPenalty = 220
): number {
  return horizontalDistance + Math.abs(floorDifference) * floorPenalty;
}
