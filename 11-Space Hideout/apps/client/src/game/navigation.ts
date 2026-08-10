export type NavigationNode = {
  id: string;
  x: number;
  y: number;
  links: string[];
};

export function nearestNavigationNode(
  nodes: NavigationNode[],
  x: number,
  y: number
): NavigationNode {
  return nodes.reduce((closest, node) => {
    const closestDistance = Math.hypot(closest.x - x, closest.y - y);
    const nodeDistance = Math.hypot(node.x - x, node.y - y);
    return nodeDistance < closestDistance ? node : closest;
  });
}

export function findNavigationPath(
  nodes: NavigationNode[],
  startId: string,
  targetId: string
): string[] {
  if (startId === targetId) return [startId];

  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (!byId.has(startId) || !byId.has(targetId)) return [];

  const distances = new Map(nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<string, string>();
  const remaining = new Set(nodes.map((node) => node.id));
  distances.set(startId, 0);

  while (remaining.size > 0) {
    const currentId = Array.from(remaining).reduce((bestId, id) =>
      (distances.get(id) ?? Number.POSITIVE_INFINITY) <
      (distances.get(bestId) ?? Number.POSITIVE_INFINITY)
        ? id
        : bestId
    );
    if (currentId === targetId) break;
    if (!Number.isFinite(distances.get(currentId))) break;
    remaining.delete(currentId);

    const current = byId.get(currentId);
    if (!current) continue;
    for (const nextId of current.links) {
      if (!remaining.has(nextId)) continue;
      const next = byId.get(nextId);
      if (!next) continue;
      const candidate =
        (distances.get(currentId) ?? Number.POSITIVE_INFINITY) +
        Math.hypot(current.x - next.x, current.y - next.y);
      if (candidate < (distances.get(nextId) ?? Number.POSITIVE_INFINITY)) {
        distances.set(nextId, candidate);
        previous.set(nextId, currentId);
      }
    }
  }

  if (!previous.has(targetId)) return [];
  const path = [targetId];
  while (path[0] !== startId) {
    const currentId = path[0];
    if (!currentId) return [];
    const parent = previous.get(currentId);
    if (!parent) return [];
    path.unshift(parent);
  }
  return path;
}
