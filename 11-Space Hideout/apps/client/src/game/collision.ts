export type CollisionPoint = { x: number; y: number };
export type CollisionWall = { x: number; y: number; width: number; height: number };
export type CollisionBounds = { minX: number; minY: number; maxX: number; maxY: number };

export function isCircleBlocked(
  point: CollisionPoint,
  radius: number,
  walls: CollisionWall[],
  bounds: CollisionBounds
): boolean {
  if (
    point.x < bounds.minX + radius ||
    point.y < bounds.minY + radius ||
    point.x > bounds.maxX - radius ||
    point.y > bounds.maxY - radius
  ) {
    return true;
  }

  return walls.some(
    (wall) =>
      point.x + radius > wall.x &&
      point.x - radius < wall.x + wall.width &&
      point.y + radius > wall.y &&
      point.y - radius < wall.y + wall.height
  );
}

export function moveCircleWithCollision(
  point: CollisionPoint,
  delta: CollisionPoint,
  radius: number,
  walls: CollisionWall[],
  bounds: CollisionBounds
): CollisionPoint {
  const distance = Math.hypot(delta.x, delta.y);
  const steps = Math.max(1, Math.ceil(distance / 5));
  const stepX = delta.x / steps;
  const stepY = delta.y / steps;
  const next = { ...point };

  for (let step = 0; step < steps; step += 1) {
    const horizontal = { x: next.x + stepX, y: next.y };
    if (!isCircleBlocked(horizontal, radius, walls, bounds)) next.x = horizontal.x;

    const vertical = { x: next.x, y: next.y + stepY };
    if (!isCircleBlocked(vertical, radius, walls, bounds)) next.y = vertical.y;
  }

  return next;
}
