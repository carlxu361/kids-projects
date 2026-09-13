import type { BossVariant, EnemyIntroInfo, EnemyKind } from './types';

export interface BossProfile extends EnemyIntroInfo {
  hp: number;
  speed: number;
  damage: number;
  radius: number;
}

export const BOSS_VARIANTS: BossVariant[] = ['siege', 'hive', 'tempest'];

export const BOSS_PROFILES: Record<BossVariant, BossProfile> = {
  siege: {
    key: 'boss-siege', icon: '▰', name: '攻城者', role: '城墙粉碎者', color: '#ff6a52',
    description: '旧时代重型工程机被感染后形成的移动攻城平台，会正面碾碎防线。',
    intel: { speed: '缓慢 · 持续推进', defense: '极高 · 重型装甲', skill: '撞墙增伤 / 震荡波 / 召唤' },
    hp: 2200, speed: 29, damage: 52, radius: 76,
  },
  hive: {
    key: 'boss-hive', icon: '◉', name: '裂巢母体', role: '怪潮增殖核心', color: '#d96cff',
    description: '把废墟当作孵化巢穴的巨型母体，越拖延，战场上的感染体就越密集。',
    intel: { speed: '缓慢 · 后排游走', defense: '高 · 生物护甲', skill: '孵化幼体 / 群体修复 / 死亡分裂' },
    hp: 1750, speed: 34, damage: 38, radius: 70,
  },
  tempest: {
    key: 'boss-tempest', icon: 'ϟ', name: '风暴泰坦', role: '远程电磁压制', color: '#63ddff',
    description: '失控的军用电磁巨像，会在射程外游走，并让成片炮塔暂时停火。',
    intel: { speed: '中等 · 侧向游走', defense: '高 · 电磁外壳', skill: '电磁风暴 / 炮塔干扰 / 远程压制' },
    hp: 1550, speed: 46, damage: 34, radius: 64,
  },
};

export const SPECIAL_ENEMY_INTROS: Partial<Record<EnemyKind, EnemyIntroInfo>> = {
  charger: { key: 'charger', icon: '»', name: '冲锋怪', role: '高速突破', color: '#ee633f', description: '装甲很薄，但会高速切入玩家或守望者所在的位置。', intel: { speed: '极快', defense: '低', skill: '锁定作战单位冲锋' } },
  armored: { key: 'armored', icon: '⬢', name: '装甲怪', role: '前排吸收火力', color: '#8eb2c6', description: '由厚重残骸包裹的感染体，会主动啃噬阻挡路线的城墙。', intel: { speed: '缓慢', defense: '极高', skill: '优先攻击城墙' } },
  ranged: { key: 'ranged', icon: '⌁', name: '蚀射者', role: '远程火力', color: '#d779cf', description: '会保持安全距离发射腐蚀弹，攻击玩家、炮塔或基地。', intel: { speed: '中等', defense: '较低', skill: '远程射击并主动后撤' } },
  bomber: { key: 'bomber', icon: '✹', name: '爆囊体', role: '建筑爆破', color: '#ffbd42', description: '锁定高价值建筑后自爆，成群出现时必须优先击杀。', intel: { speed: '较快', defense: '低', skill: '接触目标或死亡时爆炸' } },
  leaper: { key: 'leaper', icon: '⌃', name: '跃袭兽', role: '跳跃突进', color: '#ca78ff', description: '周期性越过短距离防线，能迅速贴近玩家。', intel: { speed: '快', defense: '中等', skill: '短距跳跃突破防线' } },
  stalker: { key: 'stalker', icon: '◇', name: '潜猎者', role: '侧翼猎杀', color: '#73d8c4', description: '沿侧翼高速游走，专门追踪落单的玩家或守望者。', intel: { speed: '极快', defense: '较低', skill: '超远锁定落单作战单位' } },
  medic: { key: 'medic', icon: '✚', name: '缝合者', role: '怪群支援', color: '#76ee9d', description: '藏在怪潮后方，周期修复附近所有受伤感染体。', intel: { speed: '中等', defense: '中等', skill: '范围治疗附近感染体' } },
  crusher: { key: 'crusher', icon: '◆', name: '破城兽', role: '重型拆塔', color: '#ef8a60', description: '会绕开无关目标直扑防御设施，对建筑造成高额伤害。', intel: { speed: '缓慢', defense: '极高', skill: '周期冲撞并对建筑增伤' } },
  phase: { key: 'phase', icon: '◌', name: '相位潜行者', role: '防线穿透', color: '#8c7dff', description: '身体会短暂脱离实体空间，周期性向基地跃迁并越过前排防线。', intel: { speed: '快', defense: '低', skill: '相位跃迁 / 越过阻挡' } },
  siphon: { key: 'siphon', icon: 'ϟ', name: '窃能虫', role: '经济破坏', color: '#f1d15b', description: '靠近基地后抽取储备能源并修复自身，拖延越久损失越大。', intel: { speed: '中等', defense: '中等', skill: '窃取能源并吸血' } },
  jammer: { key: 'jammer', icon: '⊘', name: '静默者', role: '炮塔压制', color: '#55c8ff', description: '释放干扰脉冲，让附近自动炮塔短时间无法射击。', intel: { speed: '缓慢', defense: '高', skill: '范围封锁炮塔' } },
};

export function enemyIntroFor(kind: EnemyKind, bossVariant?: BossVariant) {
  if (kind === 'boss' && bossVariant) return BOSS_PROFILES[bossVariant];
  return SPECIAL_ENEMY_INTROS[kind] || null;
}
