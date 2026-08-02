import type { LobbySkillTag } from "@space-hideout/shared";

export function tagsMatchExactly(a: LobbySkillTag[], b: LobbySkillTag[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((tag, index) => tag === sortedB[index]);
}
