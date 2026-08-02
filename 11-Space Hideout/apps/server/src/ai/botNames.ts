const BOT_NAME_POOL = [
  "星尘",
  "磁轨",
  "月港",
  "小彗",
  "蓝焰",
  "回声",
  "夜航",
  "银芯",
  "灯塔",
  "轨道",
  "棱镜",
  "流星"
] as const;

export function createBotName(index: number): string {
  const name = BOT_NAME_POOL[index % BOT_NAME_POOL.length] ?? "星尘";
  const lap = Math.floor(index / BOT_NAME_POOL.length);
  return lap === 0 ? `BOT-${name}` : `BOT-${name}-${lap + 1}`;
}

export function isBotName(name: string): boolean {
  return name.toUpperCase().startsWith("BOT-");
}
