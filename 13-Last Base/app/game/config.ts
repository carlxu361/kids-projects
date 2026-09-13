import type { BuildingKind, Difficulty, GameSettings, OperatorId, RuntimeStats, WeaponMode } from './types';

export const WORLD_SIZE = 4200;
export const BASE_RADIUS = 76;
export const BUILD_RADIUS = 430;
export const DAY_DURATION = 60;
export const NIGHT_DURATION = (day: number) => Math.min(82, 40 + day * 6);
export const RECALL_COOLDOWN = 32;
export const RECALL_CHANNEL_TIME = 1.2;

export const DEFAULT_SETTINGS: GameSettings = {
  volume: 68,
  shake: 32,
  particles: 72,
  autoPause: true,
  aiPersonality: 'calm',
};

export const DIFFICULTIES: Record<Difficulty, { label: string; hint: string; health: number; damage: number; budget: number; resources: number }> = {
  easy: { label: '新兵', hint: '资源更多，敌人较弱', health: .78, damage: .72, budget: .78, resources: 1.25 },
  normal: { label: '标准', hint: '推荐的生存压力', health: 1, damage: 1, budget: 1, resources: 1 },
  hard: { label: '老兵', hint: '更多敌人，更高伤害', health: 1.2, damage: 1.28, budget: 1.25, resources: .88 },
};

export const WEAPON_LOADOUTS: Record<WeaponMode, { name: string; icon: string; role: string; description: string; stats: [string, string, string]; color: string }> = {
  rifle: { name: 'R-7 突击步枪', icon: '⌁', role: '全距自动火力', description: '稳定、灵活且没有明显短板，适合第一次深入荒地。', stats: ['射速：高', '贯穿：低', '控制：低'], color: '#ffbd70' },
  scatter: { name: 'SG-4 散射炮', icon: '⫷', role: '扇形清场', description: '一次射出七枚弹丸，贴近怪潮时能制造爆发性伤害。', stats: ['射速：低', '弹幕：极高', '控制：中'], color: '#ff875d' },
  arc: { name: 'ARC 电弧枪', icon: 'ϟ', role: '连锁控场', description: '自动锁定瞄准方向的目标，并在密集敌群间连续跳跃。', stats: ['射速：高', '连锁：极高', '控制：高'], color: '#65eaff' },
  rail: { name: 'MR-1 磁轨炮', icon: '━', role: '重型贯穿', description: '射速缓慢，但弹丸高速贯穿整条战线并造成高额伤害。', stats: ['射速：低', '贯穿：极高', '伤害：极高'], color: '#bca0ff' },
};

export const OPERATORS: Record<OperatorId, { name: string; callsign: string; icon: string; color: string; passive: string; skill: string; skillDescription: string }> = {
  vanguard: { name: '陈锋', callsign: '壁垒', icon: '◆', color: '#ff9b62', passive: '最大生命 +30%，近战伤害 +40%', skill: '动能震荡', skillDescription: '击退并重创身边的全部敌人。' },
  ranger: { name: '林澈', callsign: '游隼', icon: '⌁', color: '#63e6ff', passive: '移动速度 +12%，射击速度 +12%', skill: '猎杀超频', skillDescription: '短时间大幅提高移动与射击速度。' },
  engineer: { name: '许岚', callsign: '铸星', icon: '⬡', color: '#77efb0', passive: '基地圈内持续维修基地与建筑', skill: '纳米修复', skillDescription: '立即修复附近建筑、基地和守望者。' },
};

export const BUILDINGS: Record<BuildingKind, {
  name: string;
  icon: string;
  metal: number;
  energy: number;
  radius: number;
  hp: number;
  damage: number;
  rate: number;
  range: number;
  color: string;
}> = {
  gun: { name: '机枪塔', icon: '▥', metal: 40, energy: 0, radius: 25, hp: 190, damage: 12, rate: 4, range: 340, color: '#ffb25d' },
  freeze: { name: '冰冻塔', icon: '❄', metal: 52, energy: 12, radius: 27, hp: 170, damage: 7, rate: 1.35, range: 285, color: '#64d9ff' },
  missile: { name: '导弹塔', icon: '◆', metal: 78, energy: 22, radius: 30, hp: 205, damage: 48, rate: .58, range: 410, color: '#ff755d' },
  wall: { name: '城墙', icon: '▰', metal: 24, energy: 0, radius: 34, hp: 520, damage: 0, rate: 0, range: 0, color: '#818a91' },
  generator: { name: '发电机', icon: 'ϟ', metal: 62, energy: 0, radius: 31, hp: 155, damage: 0, rate: 0, range: 0, color: '#f3d35d' },
  tesla: { name: '电弧塔', icon: '⌁', metal: 68, energy: 26, radius: 29, hp: 180, damage: 24, rate: .9, range: 345, color: '#72ebff' },
  repair: { name: '维修站', icon: '✚', metal: 58, energy: 16, radius: 30, hp: 210, damage: 0, rate: .35, range: 255, color: '#65e6a4' },
};

export const DEFAULT_STATS: RuntimeStats = {
  bulletDamage: 17,
  fireRate: 7.2,
  bulletSpeed: 810,
  bulletSize: 4,
  penetration: 0,
  projectiles: 1,
  spread: .055,
  explosionChance: 0,
  explosionRadius: 74,
  critChance: .05,
  lifeSteal: 0,
  dashCooldown: 2.4,
  chainExplosion: 0,
  killMetalChance: 0,
  towerFireRate: 1,
  freezePower: 1,
  missileRadius: 1,
  generatorYield: 8,
  autoRepair: 0,
  wallArmor: 0,
  baseShield: 0,
  droneCount: 0,
  droneFireRate: 1,
  scatterUnlocked: false,
  arcUnlocked: false,
  railUnlocked: false,
  frostDash: false,
  pickupRadius: 74,
  companionUnlocked: false,
  companionLevel: 0,
  companionDamage: 1,
  companionFireRate: 1,
  companionSpeed: 1,
  companionHealth: 1,
  companionArmor: 0,
  companionProjectiles: 1,
  companionRebootTime: 10,
  companionRepairRate: 1,
};

export const BUILD_KEYS: BuildingKind[] = ['gun', 'freeze', 'missile', 'wall', 'generator', 'tesla', 'repair'];

export function nightEnemyBudget(day: number) {
  return 18 + day * 10 + Math.floor(day * day * 1.5);
}
