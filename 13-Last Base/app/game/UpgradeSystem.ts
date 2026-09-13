import type { RuntimeStats, Upgrade, UpgradeChoice } from './types';

export const AI_UPGRADE_IDS = ['ai-targeting', 'ai-overclock', 'ai-armor', 'ai-twin', 'ai-recovery'];

const upgrades: Upgrade[] = [
  { id: 'warden', icon: 'AI', name: '守望者协议', description: '招募守望者-7：自主判断威胁、拉扯危险敌人并协助守城。', tag: '援军', maxStacks: 1, apply: s => { s.companionUnlocked = true; } },
  { id: 'ai-targeting', icon: '◎', name: 'AI · 猎杀矩阵', description: '守望者伤害 +32%，并提高高威胁目标的处决效率。', tag: 'AI改装', maxStacks: 3, apply: s => { s.companionDamage *= 1.32; s.companionLevel += 1; } },
  { id: 'ai-overclock', icon: '⌁', name: 'AI · 超频关节', description: '守望者射速 +25%、移动速度 +10%，更快响应战术命令。', tag: 'AI改装', maxStacks: 3, apply: s => { s.companionFireRate *= 1.25; s.companionSpeed *= 1.1; s.companionLevel += 1; } },
  { id: 'ai-armor', icon: '⬡', name: 'AI · 复合装甲', description: '守望者最大生命 +35%，并获得 12% 伤害减免。', tag: 'AI改装', maxStacks: 3, apply: s => { s.companionHealth *= 1.35; s.companionArmor += .12; s.companionLevel += 1; } },
  { id: 'ai-twin', icon: '⋮', name: 'AI · 并联枪机', description: '守望者每轮增加一条弹道，形成可见的交叉火力。', tag: 'AI改装', maxStacks: 2, apply: s => { s.companionProjectiles += 1; s.companionLevel += 1; } },
  { id: 'ai-recovery', icon: '✚', name: 'AI · 自愈内核', description: '基地圈内修复速度 +50%，离线重构时间缩短 30%。', tag: 'AI改装', maxStacks: 3, apply: s => { s.companionRepairRate *= 1.5; s.companionRebootTime *= .7; s.companionLevel += 1; } },
  { id: 'overload', icon: 'ϟ', name: '超载核心', description: '所有防御塔攻击速度 +20%。塔防流的发动机。', tag: '塔防', maxStacks: 4, apply: s => { s.towerFireRate *= 1.2; } },
  { id: 'pierce', icon: '➟', name: '穿甲弹', description: '玩家子弹额外穿透 1 个敌人。', tag: '枪械', maxStacks: 3, apply: s => { s.penetration += 1; } },
  { id: 'repair', icon: '✚', name: '自动修复', description: '每天夜幕降临时，基地恢复 10% 最大生命。', tag: '生存', maxStacks: 3, apply: s => { s.autoRepair += .1; } },
  { id: 'drone', icon: '◈', name: '蜂群协议', description: '生成一架环绕玩家、自动索敌的战斗无人机。', tag: '无人机', maxStacks: 4, apply: s => { s.droneCount += 1; } },
  { id: 'chain', icon: '✹', name: '连锁爆炸', description: '敌人死亡时有 20% 概率爆炸，伤及附近敌人。', tag: '爆炸', maxStacks: 3, apply: s => { s.chainExplosion += .2; } },
  { id: 'deep-freeze', icon: '❄', name: '极寒协议', description: '冰冻塔减速效果提升 50%，冰弹范围增加。', tag: '控制', maxStacks: 3, apply: s => { s.freezePower *= 1.5; } },
  { id: 'warhead', icon: '◆', name: '重型弹头', description: '导弹爆炸范围 +35%，中心伤害更稳定。', tag: '爆炸', maxStacks: 3, apply: s => { s.missileRadius *= 1.35; } },
  { id: 'dash', icon: '»', name: '战术冲刺', description: '冲刺冷却 -25%，无敌时间略微延长。', tag: '机动', maxStacks: 3, apply: s => { s.dashCooldown *= .75; } },
  { id: 'critical', icon: '✦', name: '暴击模块', description: '玩家暴击率 +15%，暴击造成双倍伤害。', tag: '枪械', maxStacks: 4, apply: s => { s.critChance += .15; } },
  { id: 'economy', icon: '⌬', name: '战争经济', description: '击杀敌人有 28% 概率掉落金属。', tag: '经济', maxStacks: 3, apply: s => { s.killMetalChance += .28; } },
  { id: 'triple', icon: '⋰', name: '三联枪机', description: '每次射击额外发射 2 枚偏转子弹，但单发伤害略降。', tag: '枪械', maxStacks: 1, apply: s => { s.projectiles += 2; s.bulletDamage *= .82; s.spread += .1; } },
  { id: 'explosive', icon: '✺', name: '爆裂弹药', description: '玩家子弹有 22% 概率触发小范围爆炸。', tag: '枪械', maxStacks: 3, apply: s => { s.explosionChance += .22; s.explosionRadius += 8; } },
  { id: 'vampire', icon: '♥', name: '猩红回路', description: '玩家造成伤害的 2.5% 转化为生命，单次最多恢复 3。', tag: '生存', maxStacks: 3, apply: s => { s.lifeSteal += .025; } },
  { id: 'caliber', icon: '●', name: '大口径改装', description: '子弹尺寸 +45%、伤害 +18%，命中感更强。', tag: '枪械', maxStacks: 3, apply: s => { s.bulletSize *= 1.45; s.bulletDamage *= 1.18; } },
  { id: 'generator', icon: '⚡', name: '增殖电网', description: '发电机每晚能源产量 +75%。', tag: '经济', maxStacks: 3, apply: s => { s.generatorYield *= 1.75; } },
  { id: 'fortress', icon: '▰', name: '堡垒合金', description: '城墙受到的伤害降低 25%，基地获得 8% 护盾。', tag: '塔防', maxStacks: 3, apply: s => { s.wallArmor += .25; s.baseShield += .08; } },
  { id: 'scatter', icon: '⫷', name: '散射协议', description: '解锁 [2] 散射炮：近距离一次发射 7 枚弹丸。', tag: '武器', maxStacks: 1, apply: s => { s.scatterUnlocked = true; } },
  { id: 'arc', icon: 'ϟ', name: '电弧线圈', description: '解锁 [3] 电弧枪：瞄准锁定目标，并在最多 8 个敌人之间连锁。', tag: '武器', maxStacks: 1, apply: s => { s.arcUnlocked = true; } },
  { id: 'rail', icon: '━', name: '磁轨枪机', description: '解锁 [4] 磁轨炮：高伤害、超高速并贯穿多个目标。', tag: '武器', maxStacks: 1, apply: s => { s.railUnlocked = true; } },
  { id: 'frost-dash', icon: '❆', name: '零度冲刺', description: '冲刺轨迹冻结附近敌人，并造成少量伤害。', tag: '控制', maxStacks: 1, apply: s => { s.frostDash = true; } },
  { id: 'magnet', icon: '⊕', name: '废料磁场', description: '自动吸附范围大幅增加，所有资源获得量 +20%。', tag: '探索', maxStacks: 2, apply: s => { s.pickupRadius *= 1.7; } },
  { id: 'drone-speed', icon: '⌁', name: '蜂巢时钟', description: '额外生成一架无人机，并使全部无人机攻击速度 +35%。', tag: '无人机', maxStacks: 3, apply: s => { s.droneFireRate *= 1.35; s.droneCount += 1; } },
];

export class UpgradeSystem {
  private stacks = new Map<string, number>();

  choices(count = 3, forcedIds: string[] = [], preferredIds: string[] = []): UpgradeChoice[] {
    const available = upgrades.filter(upgrade => (this.stacks.get(upgrade.id) || 0) < upgrade.maxStacks);
    const forced = forcedIds.map(id => available.find(upgrade => upgrade.id === id)).filter((upgrade): upgrade is Upgrade => Boolean(upgrade));
    const selected: UpgradeChoice[] = forced.slice(0, count).map(upgrade => ({ ...upgrade, stacks: this.stacks.get(upgrade.id) || 0 }));
    const selectedIds = new Set(selected.map(upgrade => upgrade.id));
    const preferred = preferredIds
      .map(id => available.find(upgrade => upgrade.id === id))
      .filter((upgrade): upgrade is Upgrade => Boolean(upgrade))
      .filter(upgrade => !selectedIds.has(upgrade.id));
    if (selected.length < count && preferred.length) {
      const upgrade = preferred[Math.floor(Math.random() * preferred.length)];
      selected.push({ ...upgrade, stacks: this.stacks.get(upgrade.id) || 0 });
      selectedIds.add(upgrade.id);
    }
    const pool = available.filter(upgrade => !selectedIds.has(upgrade.id));
    while (selected.length < count && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      const upgrade = pool.splice(index, 1)[0];
      selected.push({ ...upgrade, stacks: this.stacks.get(upgrade.id) || 0 });
    }
    return selected;
  }

  apply(id: string, stats: RuntimeStats) {
    const upgrade = upgrades.find(item => item.id === id);
    if (!upgrade) return false;
    const current = this.stacks.get(id) || 0;
    if (current >= upgrade.maxStacks) return false;
    upgrade.apply(stats);
    this.stacks.set(id, current + 1);
    return true;
  }
}
