export type Vec2 = { x: number; y: number };
export type Phase = 'day' | 'night' | 'upgrade' | 'gameover';
export type EnemyKind = 'infected' | 'charger' | 'armored' | 'ranged' | 'bomber' | 'leaper' | 'stalker' | 'medic' | 'crusher' | 'phase' | 'siphon' | 'jammer' | 'boss' | 'spawn';
export type BossVariant = 'siege' | 'hive' | 'tempest';
export type EliteAffix = 'frenzy' | 'armor' | 'shock' | 'split';
export type BuildingKind = 'gun' | 'freeze' | 'missile' | 'wall' | 'generator' | 'tesla' | 'repair';
export type PickupKind = 'metal' | 'energy' | 'chest' | 'rare' | 'medkit' | 'overdrive' | 'shield' | 'nanokit' | 'emp';
export type WeaponMode = 'rifle' | 'scatter' | 'arc' | 'rail';
export type OperatorId = 'vanguard' | 'ranger' | 'engineer';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type AICommand = 'follow' | 'guard' | 'hunt' | 'focus';
export type AIPersonality = 'calm' | 'bold' | 'guardian';

export interface GameSettings {
  volume: number;
  shake: number;
  particles: number;
  autoPause: boolean;
  aiPersonality: AIPersonality;
}

export interface StatusEffect {
  label: string;
  time: number;
  color: string;
  icon: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  angle: number;
  dashCooldown: number;
  dashTimer: number;
  invulnerable: number;
  hurtTimer: number;
  fireTimer: number;
  weapon: WeaponMode;
}

export interface CompanionState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  angle: number;
  fireTimer: number;
  invulnerable: number;
  downTimer: number;
  ally: true;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  bossVariant?: BossVariant;
  elite?: EliteAffix;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  fireTimer: number;
  flash: number;
  slow: number;
  dead: boolean;
  specialTimer: number;
}

export interface Building {
  id: number;
  kind: BuildingKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  level: number;
  cooldown: number;
  angle: number;
  flash: number;
}

export interface Projectile {
  id: number;
  team: 'player' | 'tower' | 'enemy';
  kind: 'bullet' | 'rail' | 'ice' | 'missile' | 'plasma';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  penetration: number;
  explosive: boolean;
  hit: Set<number>;
}

export interface Pickup {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  amount: number;
  radius: number;
  opened: boolean;
  pulse: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glow?: boolean;
}

export interface FloatText {
  x: number;
  y: number;
  value: string;
  color: string;
  life: number;
  big?: boolean;
}

export interface EnvironmentProp {
  x: number;
  y: number;
  kind: 'car' | 'rock' | 'container' | 'ruin' | 'lamp' | 'wreck';
  size: number;
  rot: number;
}

export interface RuntimeStats {
  bulletDamage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletSize: number;
  penetration: number;
  projectiles: number;
  spread: number;
  explosionChance: number;
  explosionRadius: number;
  critChance: number;
  lifeSteal: number;
  dashCooldown: number;
  chainExplosion: number;
  killMetalChance: number;
  towerFireRate: number;
  freezePower: number;
  missileRadius: number;
  generatorYield: number;
  autoRepair: number;
  wallArmor: number;
  baseShield: number;
  droneCount: number;
  droneFireRate: number;
  scatterUnlocked: boolean;
  arcUnlocked: boolean;
  railUnlocked: boolean;
  frostDash: boolean;
  pickupRadius: number;
  companionUnlocked: boolean;
  companionLevel: number;
  companionDamage: number;
  companionFireRate: number;
  companionSpeed: number;
  companionHealth: number;
  companionArmor: number;
  companionProjectiles: number;
  companionRebootTime: number;
  companionRepairRate: number;
}

export interface EnemyIntroInfo {
  key: string;
  icon: string;
  name: string;
  role: string;
  description: string;
  intel: {
    speed: string;
    defense: string;
    skill: string;
  };
  color: string;
}

export interface Upgrade {
  id: string;
  icon: string;
  name: string;
  description: string;
  tag: string;
  maxStacks: number;
  apply: (stats: RuntimeStats) => void;
}

export interface UpgradeChoice extends Omit<Upgrade, 'apply'> {
  stacks: number;
}

export interface SelectedBuildingInfo {
  id: number;
  kind: BuildingKind;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  damage: string;
  rate: string;
  upgradeCost: number;
  canUpgrade: boolean;
  refundMetal: number;
  refundEnergy: number;
  demolishArmed: boolean;
}

export interface GameSnapshot {
  phase: Phase;
  day: number;
  phaseTime: number;
  metal: number;
  energy: number;
  baseHp: number;
  baseMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  dashCooldown: number;
  dashCooldownMax: number;
  recallCooldown: number;
  recallCooldownMax: number;
  recallCharge: number;
  recallChargeMax: number;
  recallCharging: boolean;
  kills: number;
  built: number;
  warning: string;
  prompt: string;
  buildMode: boolean;
  buildKind: BuildingKind | null;
  selectedBuilding: SelectedBuildingInfo | null;
  weapon: WeaponMode;
  operator: OperatorId;
  operatorSkillCooldown: number;
  operatorSkillCooldownMax: number;
  scatterUnlocked: boolean;
  arcUnlocked: boolean;
  railUnlocked: boolean;
  upgradeChoices: UpgradeChoice[];
  bossHp: number;
  bossMaxHp: number;
  gameOverReady: boolean;
  adminEnabled: boolean;
  debugOpen: boolean;
  easterEggs: string[];
  enemyCount: number;
  droneCount: number;
  projectileCount: number;
  fps: number;
  difficulty: Difficulty;
  paused: boolean;
  settings: GameSettings;
  statusEffects: StatusEffect[];
  companionHp: number;
  companionMaxHp: number;
  companionDown: boolean;
  companionReboot: number;
  companionUnlocked: boolean;
  companionLevel: number;
  bossName: string;
  enemyIntro: EnemyIntroInfo | null;
  aiCommand: AICommand;
  aiCommandOpen: boolean;
  aiPersonality: AIPersonality;
  aiReply: string;
}
