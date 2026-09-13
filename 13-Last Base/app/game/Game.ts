import { AudioManager } from './AudioManager';
import { BASE_RADIUS, BUILDINGS, BUILD_KEYS, BUILD_RADIUS, DAY_DURATION, DEFAULT_SETTINGS, DEFAULT_STATS, DIFFICULTIES, NIGHT_DURATION, OPERATORS, RECALL_CHANNEL_TIME, RECALL_COOLDOWN, WORLD_SIZE, nightEnemyBudget } from './config';
import { BOSS_PROFILES, BOSS_VARIANTS, enemyIntroFor } from './EnemyCatalog';
import { AI_UPGRADE_IDS, UpgradeSystem } from './UpgradeSystem';
import type { AICommand, AIPersonality, BossVariant, Building, BuildingKind, CompanionState, Difficulty, EliteAffix, Enemy, EnemyIntroInfo, EnemyKind, EnvironmentProp, FloatText, GameSettings, GameSnapshot, OperatorId, Particle, Pickup, PickupKind, PlayerState, Projectile, RuntimeStats, StatusEffect, UpgradeChoice, Vec2, WeaponMode } from './types';

const TAU = Math.PI * 2;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.y - b.y);
const length = (x: number, y: number) => Math.hypot(x, y) || 1;
const randomRange = (min: number, max: number) => min + Math.random() * (max - min);
const turnToward = (current: number, target: number, amount: number) => current + Math.atan2(Math.sin(target - current), Math.cos(target - current)) * clamp(amount, 0, 1);
const traceVertex = (ctx: CanvasRenderingContext2D, index: number, x: number, y: number) => { if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); };

type SnapshotHandler = (snapshot: GameSnapshot) => void;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: AudioManager;
  private onSnapshot: SnapshotHandler;
  private stats: RuntimeStats = { ...DEFAULT_STATS };
  private upgrades = new UpgradeSystem();
  private player: PlayerState = {
    x: 150, y: 70, vx: 0, vy: 0, radius: 17, hp: 100, maxHp: 100,
    angle: 0, dashCooldown: 0, dashTimer: 0, invulnerable: 0, hurtTimer: 0,
    fireTimer: 0, weapon: 'rifle',
  };
  private companion: CompanionState = {
    x: 105, y: -70, vx: 0, vy: 0, radius: 16, hp: 150, maxHp: 150,
    angle: 0, fireTimer: 0, invulnerable: 0, downTimer: 0, ally: true,
  };
  private enemies: Enemy[] = [];
  private buildings: Building[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private particles: Particle[] = [];
  private floatTexts: FloatText[] = [];
  private props: EnvironmentProp[] = [];
  private keys = new Set<string>();
  private mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, inside: false };
  private width = 1280;
  private height = 720;
  private dpr = 1;
  private camera = { x: 0, y: 0 };
  private frameId = 0;
  private suspended = false;
  private lastTime = 0;
  private id = 1;
  private phase: GameSnapshot['phase'] = 'day';
  private day = 1;
  private phaseTime = DAY_DURATION;
  private metal = 110;
  private energy = 18;
  private baseHp = 1000;
  private readonly baseMaxHp = 1000;
  private kills = 0;
  private built = 0;
  private buildMode = false;
  private buildKind: BuildingKind | null = null;
  private selectedBuildingId: number | null = null;
  private demolishArmedId: number | null = null;
  private spawnTimer = 1;
  private daySpawnTimer = 8;
  private spawned = 0;
  private enemyBudget = 0;
  private bossIntro = 0;
  private bossSpawnTimer = 0;
  private bossQueue: BossVariant[] = [];
  private currentBossVariant: BossVariant = 'hive';
  private debugBossIndex = 0;
  private enemyIntro: EnemyIntroInfo | null = null;
  private seenEnemyIntros = new Set<string>();
  private baseAlarm = 0;
  private screenShake = 0;
  private hitStop = 0;
  private notification = '';
  private notificationTimer = 0;
  private tutorialTime = 0;
  private upgradeChoices: UpgradeChoice[] = [];
  private snapshotTimer = 0;
  private gameOverTimer = 0;
  private gameOverReady = false;
  private droneTimers: number[] = [];
  private adminBuffer = '';
  private adminEnabled = false;
  private debugOpen = false;
  private debugUpgradeReturn: { phase: 'day' | 'night'; phaseTime: number } | null = null;
  private easterBuffer = '';
  private easterEggs = new Set<string>();
  private fps = 60;
  private difficulty: Difficulty;
  private paused = false;
  private settings: GameSettings;
  private recallCooldown = 0;
  private recallCharge = 0;
  private recallCharging = false;
  private overdriveTimer = 0;
  private shieldTimer = 0;
  private healLockout = 0;
  private meleeSwingTimer = 0;
  private operatorSkillCooldown = 0;
  private operatorBoostTimer = 0;
  private operator: OperatorId;
  private companionTargetId: number | null = null;
  private companionRetargetTimer = 0;
  private companionStrafe = 1;
  private aiCommand: AICommand = 'guard';
  private aiCommandOpen = false;
  private aiFocusTargetId: number | null = null;
  private aiReply = '';
  private aiReplyTimer = 0;
  private readonly enemyGridSize = 160;
  private enemyGrid = new Map<string, Enemy[]>();

  constructor(canvas: HTMLCanvasElement, onSnapshot: SnapshotHandler, audio: AudioManager, difficulty: Difficulty = 'normal', settings: GameSettings = DEFAULT_SETTINGS, loadout: WeaponMode = 'rifle', operator: OperatorId = 'vanguard') {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable');
    this.ctx = context;
    this.onSnapshot = onSnapshot;
    this.audio = audio;
    this.difficulty = difficulty;
    this.operator = operator;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    this.player.weapon = loadout;
    this.stats.scatterUnlocked = loadout === 'scatter';
    this.stats.arcUnlocked = loadout === 'arc';
    this.stats.railUnlocked = loadout === 'rail';
    if (operator === 'vanguard') { this.player.maxHp = 130; this.player.hp = 130; }
    this.audio.setVolume(this.settings.volume);
  }

  start() {
    this.generateEnvironment();
    this.spawnResources(1);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.windowBlur);
    this.canvas.addEventListener('pointermove', this.pointerMove);
    this.canvas.addEventListener('pointerenter', this.pointerEnter);
    this.canvas.addEventListener('pointerdown', this.pointerDown);
    this.canvas.addEventListener('pointerup', this.pointerUp);
    this.canvas.addEventListener('pointerleave', this.pointerLeave);
    this.canvas.addEventListener('contextmenu', this.contextMenu);
    this.lastTime = performance.now();
    this.emitSnapshot();
    this.frameId = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.windowBlur);
    this.canvas.removeEventListener('pointermove', this.pointerMove);
    this.canvas.removeEventListener('pointerenter', this.pointerEnter);
    this.canvas.removeEventListener('pointerdown', this.pointerDown);
    this.canvas.removeEventListener('pointerup', this.pointerUp);
    this.canvas.removeEventListener('pointerleave', this.pointerLeave);
    this.canvas.removeEventListener('contextmenu', this.contextMenu);
  }

  setSuspended(suspended: boolean) {
    this.suspended = suspended;
    this.keys.clear();
    this.mouse.down = false;
    this.lastTime = performance.now();
  }

  chooseUpgrade(id: string) {
    if (this.phase !== 'upgrade') return;
    const companionWasUnlocked = this.stats.companionUnlocked;
    const previousCompanionMaxHp = this.companion.maxHp;
    if (!this.upgrades.apply(id, this.stats)) return;
    this.companion.maxHp = Math.round(150 * this.stats.companionHealth);
    if (this.companion.downTimer <= 0) this.companion.hp = Math.min(this.companion.maxHp, this.companion.hp + this.companion.maxHp - previousCompanionMaxHp);
    if (!companionWasUnlocked && this.stats.companionUnlocked) {
      this.companion.hp = this.companion.maxHp;
      this.companion.downTimer = 0;
      this.companion.x = this.player.x - 58;
      this.companion.y = this.player.y + 48;
      this.notification = '守望者-7 已加入防线';
      this.notificationTimer = 4;
      this.aiCommand = 'follow';
      this.speakAI('online');
    }
    this.audio.play('upgrade');
    if (this.debugUpgradeReturn) {
      const resume = this.debugUpgradeReturn;
      this.debugUpgradeReturn = null;
      this.phase = resume.phase;
      this.phaseTime = resume.phaseTime;
      this.upgradeChoices = [];
      this.notification = `DEBUG · ${id.toUpperCase()} 强化已装载`;
      this.notificationTimer = 2.5;
      this.emitSnapshot();
      return;
    }
    const recruitedCompanion = !companionWasUnlocked && this.stats.companionUnlocked;
    this.advanceToNextDay(recruitedCompanion ? undefined : `DAY ${this.day + 1} · 搜集并重建防线`);
  }

  private advanceToNextDay(notification?: string) {
    this.day += 1;
    this.phase = 'day';
    this.phaseTime = DAY_DURATION;
    this.daySpawnTimer = randomRange(8, 14);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
    this.spawnResources(this.day);
    this.upgradeChoices = [];
    this.keys.clear();
    this.mouse.down = false;
    this.recallCharging = false;
    this.recallCharge = 0;
    if (notification) {
      this.notification = notification;
      this.notificationTimer = 3;
    }
    this.emitSnapshot();
  }

  toggleBuildMode() {
    if (this.paused || this.phase === 'upgrade' || this.phase === 'gameover') return;
    if (Math.hypot(this.player.x, this.player.y) > BUILD_RADIUS + 120) {
      this.notification = '距离基地过远，无法接入建造网络';
      this.notificationTimer = 2;
      return;
    }
    this.buildMode = !this.buildMode;
    this.aiCommandOpen = false;
    this.buildKind = this.buildMode ? (this.buildKind || 'gun') : null;
    this.selectedBuildingId = null;
    this.demolishArmedId = null;
    this.emitSnapshot();
  }

  selectBuild(kind: BuildingKind) {
    if (this.paused) return;
    if (Math.hypot(this.player.x, this.player.y) > BUILD_RADIUS + 120) return;
    this.buildMode = true;
    this.buildKind = kind;
    this.selectedBuildingId = null;
    this.demolishArmedId = null;
    this.emitSnapshot();
  }

  cancelBuild() {
    this.buildMode = false;
    this.buildKind = null;
    this.selectedBuildingId = null;
    this.demolishArmedId = null;
    this.emitSnapshot();
  }

  upgradeSelected() {
    const building = this.buildings.find(item => item.id === this.selectedBuildingId);
    if (!building || building.level >= 3) return;
    const cost = this.buildingUpgradeCost(building);
    if (this.metal < cost) {
      this.notification = `金属不足 · 还需 ${cost - this.metal}`;
      this.notificationTimer = 2;
      return;
    }
    this.metal -= cost;
    building.level += 1;
    building.maxHp *= 1.25;
    building.hp = building.maxHp;
    this.audio.play('upgrade');
    this.burst(building.x, building.y, BUILDINGS[building.kind].color, 18, 120);
    this.emitSnapshot();
  }

  repairSelected() {
    const building = this.buildings.find(item => item.id === this.selectedBuildingId);
    if (!building || building.hp >= building.maxHp) return;
    const missing = 1 - building.hp / building.maxHp;
    const cost = Math.max(4, Math.ceil(missing * 22));
    if (this.metal < cost) {
      this.notification = '金属不足，无法修复';
      this.notificationTimer = 2;
      return;
    }
    this.metal -= cost;
    building.hp = building.maxHp;
    this.audio.play('build');
    this.burst(building.x, building.y, '#7fffb2', 12, 70);
    this.emitSnapshot();
  }

  demolishSelected() {
    const building = this.buildings.find(item => item.id === this.selectedBuildingId);
    if (!building || this.paused) return;
    if (this.demolishArmedId !== building.id) {
      this.demolishArmedId = building.id;
      this.notification = '再次点击确认拆除 · 将返还部分资源';
      this.notificationTimer = 2.5;
      this.emitSnapshot();
      return;
    }
    const refund = this.demolitionRefund(building);
    this.metal += refund.metal;
    this.energy += refund.energy;
    this.buildings = this.buildings.filter(item => item.id !== building.id);
    this.selectedBuildingId = null;
    this.demolishArmedId = null;
    this.audio.play('build');
    this.burst(building.x, building.y, '#f0b169', 22, 145);
    this.floatTexts.push({ x: building.x, y: building.y - 24, value: `拆除返还 +${refund.metal} 金属${refund.energy ? ` · +${refund.energy} 能源` : ''}`, color: '#ffc476', life: 1.6, big: true });
    this.emitSnapshot();
  }

  togglePause(force?: boolean) {
    if (this.phase === 'upgrade' || this.phase === 'gameover' || this.enemyIntro) return;
    this.paused = force ?? !this.paused;
    if (this.paused) this.aiCommandOpen = false;
    this.keys.clear();
    this.mouse.down = false;
    if (this.paused) this.cancelRecall();
    this.emitSnapshot();
  }

  toggleAICommand(force?: boolean) {
    if (!this.stats.companionUnlocked) {
      this.notification = '需要先在夜间强化中招募守望者-7';
      this.notificationTimer = 2.5;
      this.emitSnapshot();
      return;
    }
    if (this.paused || this.phase === 'upgrade' || this.phase === 'gameover' || this.enemyIntro) return;
    this.aiCommandOpen = force ?? !this.aiCommandOpen;
    if (this.aiCommandOpen && this.buildMode) {
      this.buildMode = false;
      this.buildKind = null;
      this.selectedBuildingId = null;
    }
    if (this.aiCommandOpen && !this.aiReply) this.speakAI('online');
    this.emitSnapshot();
  }

  commandCompanion(command: AICommand) {
    if (!this.stats.companionUnlocked || this.companion.downTimer > 0) return;
    this.aiCommand = command;
    this.aiFocusTargetId = null;
    if (command === 'focus') {
      const target = this.mostUrgentEnemy();
      if (!target) { this.speakAI('noTarget'); this.emitSnapshot(); return; }
      this.aiFocusTargetId = target.id;
      this.companionTargetId = target.id;
    }
    this.companionRetargetTimer = 0;
    this.speakAI(command);
    this.emitSnapshot();
  }

  private speakAI(intent: AICommand | 'online' | 'noTarget' | 'personality') {
    const replies: Record<AIPersonality, Record<typeof intent, string>> = {
      calm: { online: '通讯正常。等待你的战术指令。', follow: '收到，保持队形并掩护你的侧翼。', guard: '确认。建立基地环形防区。', hunt: '进入自主猎杀，优先清除高威胁目标。', focus: '目标已锁定，火力转移。', noTarget: '扫描完成，当前没有可集火目标。', personality: '逻辑参数已更新，继续执行任务。' },
      bold: { online: '频道接通。告诉我先拆谁。', follow: '跟紧了，我来撕开前路。', guard: '守城可以，但我会把防线往外推。', hunt: '正合我意。猎杀模式全开。', focus: '看见了。这个交给我。', noTarget: '没目标？那我就去找一个。', personality: '限制解除。现在火力说话。' },
      guardian: { online: '守护协议在线。基地与作战员优先。', follow: '收到，我不会让敌人靠近你。', guard: '确认。基地核心由我守护。', hunt: '允许追击，但不会脱离防区。', focus: '威胁确认，立即拦截。', noTarget: '防区安全，继续警戒。', personality: '守护协议已加载。' },
    };
    this.aiReply = replies[this.settings.aiPersonality][intent];
    this.aiReplyTimer = 4.8;
  }

  private mostUrgentEnemy() {
    let target: Enemy | null = null;
    let bestScore = Infinity;
    const priority: Partial<Record<EnemyKind, number>> = { boss: 520, jammer: 330, siphon: 310, bomber: 280, medic: 250, phase: 235, crusher: 220, ranged: 150, stalker: 110 };
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const score = Math.hypot(enemy.x, enemy.y) - (priority[enemy.kind] || 0);
      if (score < bestScore) { bestScore = score; target = enemy; }
    }
    return target;
  }

  dismissEnemyIntro() {
    if (!this.enemyIntro) return;
    this.enemyIntro = null;
    this.paused = false;
    this.keys.clear();
    this.mouse.down = false;
    this.lastTime = performance.now();
    this.emitSnapshot();
  }

  updateSettings(settings: GameSettings) {
    const personalityChanged = settings.aiPersonality !== this.settings.aiPersonality;
    this.settings = {
      volume: clamp(settings.volume, 0, 100),
      shake: clamp(settings.shake, 0, 100),
      particles: clamp(settings.particles, 0, 100),
      autoPause: settings.autoPause,
      aiPersonality: settings.aiPersonality,
    };
    this.audio.setVolume(this.settings.volume);
    if (personalityChanged && this.stats.companionUnlocked) this.speakAI('personality');
    this.emitSnapshot();
  }

  beginRecall() {
    if (this.paused || this.phase === 'upgrade' || this.phase === 'gameover' || this.recallCooldown > 0) return;
    this.recallCharging = true;
    this.recallCharge = 0;
    this.emitSnapshot();
  }

  cancelRecall() {
    if (!this.recallCharging) return;
    this.recallCharging = false;
    this.recallCharge = 0;
    this.emitSnapshot();
  }

  meleeAttack() {
    if (this.paused || this.phase === 'upgrade' || this.phase === 'gameover') return;
    const facingX = Math.cos(this.player.angle);
    const facingY = Math.sin(this.player.angle);
    const meleeDamage = (48 + this.day * 2.4) * (this.operator === 'vanguard' ? 1.4 : 1);
    let hits = 0;
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const range = Math.hypot(dx, dy);
      if (range > 108 + enemy.radius || range < 1) continue;
      const forward = (dx * facingX + dy * facingY) / range;
      if (forward < .18) continue;
      this.damageEnemy(enemy, meleeDamage, Math.random() < this.stats.critChance);
      enemy.vx += dx / range * 250;
      enemy.vy += dy / range * 250;
      enemy.slow = Math.max(enemy.slow, .32);
      hits += 1;
    }
    const impact = { x: this.player.x + facingX * 64, y: this.player.y + facingY * 64 };
    this.burst(impact.x, impact.y, OPERATORS[this.operator].color, 10 + hits * 2, 145);
    this.player.vx -= facingX * 24;
    this.player.vy -= facingY * 24;
    this.meleeSwingTimer = this.adminEnabled ? .08 : .16;
    this.audio.play(hits ? 'hit' : 'shoot');
    this.emitSnapshot();
  }

  setMeleeHeld(held: boolean) {
    if (held) {
      this.keys.add('v');
      this.meleeAttack();
    } else this.keys.delete('v');
  }

  useOperatorSkill() {
    if (this.paused || this.phase === 'upgrade' || this.phase === 'gameover' || this.operatorSkillCooldown > 0) return;
    if (this.operator === 'vanguard') {
      for (const enemy of this.enemies) {
        if (enemy.dead) continue;
        const range = distance(this.player, enemy);
        if (range > 185 + enemy.radius || range < 1) continue;
        this.damageEnemy(enemy, 92 + this.day * 4, false);
        enemy.vx += (enemy.x - this.player.x) / range * 430;
        enemy.vy += (enemy.y - this.player.y) / range * 430;
        enemy.slow = Math.max(enemy.slow, 1.1);
      }
      this.burst(this.player.x, this.player.y, OPERATORS.vanguard.color, 42, 330);
      this.screenShake = Math.max(this.screenShake, 5);
    } else if (this.operator === 'ranger') {
      this.operatorBoostTimer = 7;
      this.overdriveTimer = Math.max(this.overdriveTimer, 7);
      this.burst(this.player.x, this.player.y, OPERATORS.ranger.color, 28, 210);
    } else {
      this.baseHp = Math.min(this.baseMaxHp, this.baseHp + 170);
      for (const building of this.buildings) {
        if (distance(this.player, building) < 470) building.hp = Math.min(building.maxHp, building.hp + building.maxHp * .32);
      }
      if (this.stats.companionUnlocked && this.companion.downTimer <= 0) this.companion.hp = Math.min(this.companion.maxHp, this.companion.hp + this.companion.maxHp * .45);
      this.burst(this.player.x, this.player.y, OPERATORS.engineer.color, 38, 290);
    }
    this.operatorSkillCooldown = this.adminEnabled ? 0 : this.operatorSkillCooldownMax();
    this.audio.play('upgrade');
    this.notification = `${OPERATORS[this.operator].callsign} · ${OPERATORS[this.operator].skill}`;
    this.notificationTimer = 2.2;
    this.emitSnapshot();
  }

  private operatorSkillCooldownMax() {
    return this.operator === 'vanguard' ? 13 : this.operator === 'ranger' ? 15 : 17;
  }

  private completeRecall() {
    if (!this.recallCharging) return;
    this.recallCharging = false;
    this.recallCharge = 0;
    this.burst(this.player.x, this.player.y, '#67f5e5', 24, 175);
    const angle = Math.atan2(this.player.y, this.player.x) || 0;
    this.player.x = Math.cos(angle) * (BASE_RADIUS + 58);
    this.player.y = Math.sin(angle) * (BASE_RADIUS + 58);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerable = Math.max(this.player.invulnerable, 1.2);
    this.recallCooldown = this.adminEnabled ? 0 : RECALL_COOLDOWN;
    this.burst(this.player.x, this.player.y, '#67f5e5', 34, 210);
    this.audio.play('upgrade');
    this.notification = '归航信标 · 已折跃至基地医疗圈';
    this.notificationTimer = 2.2;
    this.emitSnapshot();
  }

  toggleDebug() {
    if (!this.adminEnabled) return;
    this.debugOpen = !this.debugOpen;
    this.emitSnapshot();
  }

  debugAction(action: 'resources' | 'repair' | 'clear' | 'swarm' | 'boss' | 'night' | 'upgrade') {
    if (!this.adminEnabled) return;
    if (action === 'resources') { this.metal = 9999; this.energy = 9999; }
    if (action === 'repair') {
      this.baseHp = this.baseMaxHp;
      this.player.hp = this.player.maxHp;
      this.companion.hp = this.companion.maxHp;
      this.companion.downTimer = 0;
      this.buildings.forEach(building => { building.hp = building.maxHp; });
    }
    if (action === 'clear') {
      for (const enemy of [...this.enemies]) this.killEnemy(enemy);
      this.enemies = [];
    }
    if (action === 'swarm') {
      const debugKinds: EnemyKind[] = ['infected', 'charger', 'armored', 'ranged', 'bomber', 'leaper', 'stalker', 'medic', 'crusher', 'phase', 'siphon', 'jammer'];
      for (let i = 0; i < 24; i += 1) this.spawnEnemy(debugKinds[i % debugKinds.length], true, randomRange(480, 760));
    }
    if (action === 'boss') {
      const variant = BOSS_VARIANTS[this.debugBossIndex++ % BOSS_VARIANTS.length];
      this.currentBossVariant = variant;
      this.spawnEnemy('boss', false, 620, undefined, variant);
    }
    if (action === 'night' && this.phase !== 'night') this.startNight();
    if (action === 'upgrade') {
      if (this.phase === 'upgrade' || this.phase === 'gameover') return;
      this.debugUpgradeReturn = { phase: this.phase, phaseTime: this.phaseTime };
      this.phase = 'upgrade';
      this.paused = false;
      this.keys.clear();
      this.mouse.down = false;
      this.recallCharging = false;
      this.recallCharge = 0;
      this.upgradeChoices = this.upgrades.choices(3, [], this.stats.companionUnlocked ? AI_UPGRADE_IDS : ['warden']);
      this.audio.play('upgrade');
    }
    this.notification = 'DEBUG · ' + action.toUpperCase() + ' 执行完成';
    this.notificationTimer = 2;
    this.emitSnapshot();
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  private keyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.captureAdminCode(event.key);
    this.captureEasterEgg(event.key);
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'b', 'e', 'p', 'r', 'v', 'k', 'f1', '1', '2', '3', '4', '5', '6', '7', 'escape', 'enter'].includes(key)) event.preventDefault();
    if (event.repeat) return;
    this.audio.unlock();
    if (this.enemyIntro) {
      if (key === 'escape' || key === 'enter' || key === ' ') this.dismissEnemyIntro();
      return;
    }
    if (this.adminEnabled && (key === 'f2' || event.code === 'Backquote')) { event.preventDefault(); this.toggleDebug(); return; }
    if (key === 'f1') { this.toggleAICommand(); return; }
    if (key === 'p') { this.togglePause(); return; }
    if (key === 'escape') {
      if (this.paused) this.togglePause(false);
      else if (this.buildMode || this.selectedBuildingId) this.cancelBuild();
      else this.togglePause(true);
      return;
    }
    if (this.paused) return;
    this.keys.add(key);
    if (key === ' ' || event.code === 'Space') this.tryDash();
    if (key === 'r') this.beginRecall();
    if (key === 'v') this.meleeAttack();
    if (key === 'k') this.useOperatorSkill();
    if (key === 'e') this.interact();
    if (key === 'b') this.toggleBuildMode();
    if (['1', '2', '3', '4', '5', '6', '7'].includes(key)) {
      if (this.buildMode) this.selectBuild(BUILD_KEYS[Number(key) - 1]);
      else this.changeWeapon(Number(key));
    }
  };

  private keyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.keys.delete(key);
    if (key === 'r') this.cancelRecall();
  };
  private windowBlur = () => {
    this.keys.clear();
    this.mouse.down = false;
    this.cancelRecall();
    if (this.settings.autoPause && !this.paused && this.phase !== 'upgrade' && this.phase !== 'gameover') this.togglePause(true);
  };

  private pointerMove = (event: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
    this.mouse.inside = true;
  };

  private pointerEnter = () => { this.mouse.inside = true; };
  private pointerLeave = () => { this.mouse.inside = false; this.mouse.down = false; };

  private pointerDown = (event: PointerEvent) => {
    this.audio.unlock();
    if (this.paused) return;
    if (event.button === 2) {
      if (this.buildMode) { this.cancelBuild(); return; }
      const clicked = this.findBuildingAt(this.mouse.worldX, this.mouse.worldY);
      if (clicked) {
        this.buildMode = false;
        this.buildKind = null;
        if (this.selectedBuildingId !== clicked.id) this.demolishArmedId = null;
        this.selectedBuildingId = clicked.id;
        this.emitSnapshot();
      } else this.cancelBuild();
      return;
    }
    if (event.button !== 0 || this.phase === 'upgrade' || this.phase === 'gameover') return;
    if (this.buildMode) {
      this.tryBuild();
      return;
    }
    this.selectedBuildingId = null;
    this.mouse.down = true;
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private pointerUp = () => { this.mouse.down = false; };
  private contextMenu = (event: Event) => { event.preventDefault(); };

  private loop = (now: number) => {
    if (this.suspended) {
      this.lastTime = now;
      this.frameId = requestAnimationFrame(this.loop);
      return;
    }
    const rawDt = Math.min(.04, Math.max(0, (now - this.lastTime) / 1000));
    if (rawDt > 0) this.fps += (1 / rawDt - this.fps) * .08;
    this.lastTime = now;
    const slowMotion = this.phase === 'gameover' ? .18 : 1;
    const dt = rawDt * slowMotion;
    if (!this.paused) {
      if (this.hitStop > 0) this.hitStop -= rawDt;
      else if (this.phase !== 'upgrade') this.update(dt, rawDt);
    }
    this.render();
    this.frameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, realDt: number) {
    this.tutorialTime += realDt;
    this.snapshotTimer -= realDt;
    this.notificationTimer = Math.max(0, this.notificationTimer - realDt);
    this.aiReplyTimer = Math.max(0, this.aiReplyTimer - realDt);
    this.baseAlarm = Math.max(0, this.baseAlarm - realDt);
    this.screenShake = Math.max(0, this.screenShake - realDt * 18);

    if (this.adminEnabled) {
      this.baseHp = this.baseMaxHp;
      this.player.hp = this.player.maxHp;
      this.player.invulnerable = Math.max(this.player.invulnerable, .5);
      this.companion.hp = this.companion.maxHp;
      this.companion.downTimer = 0;
      this.companion.invulnerable = Math.max(this.companion.invulnerable, .5);
      this.stats.companionUnlocked = true;
      for (const building of this.buildings) building.hp = building.maxHp;
    }

    if (this.phase === 'gameover') {
      this.gameOverTimer -= realDt;
      if (this.gameOverTimer <= 0 && !this.gameOverReady) {
        this.gameOverReady = true;
        this.emitSnapshot();
      }
      this.updateParticles(dt);
      return;
    }

    // First-contact dossiers are a true tactical pause: timers, waves and actors all stop.
    if (this.enemyIntro) { this.emitSnapshot(); return; }

    this.phaseTime -= dt;
    if (this.phase === 'day') this.updateDay(dt);
    if (this.phase === 'night') this.updateNight(dt);
    if (this.enemyIntro) { this.emitSnapshot(); return; }

    this.updatePlayer(dt);
    this.rebuildEnemyGrid();
    this.updateCompanion(dt);
    this.updateBuildings(dt);
    this.updateEnemies(dt);
    this.rebuildEnemyGrid();
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateDrones(dt);
    this.updateParticles(dt);
    this.camera.x += (this.player.x - this.camera.x) * Math.min(1, dt * 5.5);
    this.camera.y += (this.player.y - this.camera.y) * Math.min(1, dt * 5.5);
    this.mouse.worldX = this.mouse.x - this.width / 2 + this.camera.x;
    this.mouse.worldY = this.mouse.y - this.height / 2 + this.camera.y;

    if (this.snapshotTimer <= 0) {
      this.snapshotTimer = .1;
      this.emitSnapshot();
    }
  }

  private updateDay(dt: number) {
    this.daySpawnTimer -= dt;
    if (this.daySpawnTimer <= 0 && this.enemies.length < Math.min(4, 1 + Math.ceil(this.day / 3))) {
      this.daySpawnTimer = randomRange(14, 22);
      this.spawnEnemy(Math.random() < .14 && this.day >= 3 ? 'charger' : 'infected', false);
    }
    if (this.phaseTime <= 0) this.startNight();
  }

  private startNight() {
    this.phase = 'night';
    this.phaseTime = NIGHT_DURATION(this.day);
    this.enemyBudget = Math.ceil(nightEnemyBudget(this.day) * DIFFICULTIES[this.difficulty].budget);
    this.spawned = 0;
    this.spawnTimer = .4;
    this.bossQueue = [];
    this.bossSpawnTimer = 0;
    {
      const bossRound = this.day - 1;
      const bossCount = Math.min(BOSS_VARIANTS.length, 1 + Math.floor(bossRound / 5));
      const progression: BossVariant[] = ['hive', 'tempest', 'siege'];
      const startIndex = bossRound % progression.length;
      for (let index = 0; index < bossCount; index += 1) this.bossQueue.push(progression[(startIndex + index) % progression.length]);
      this.currentBossVariant = this.bossQueue[0];
    }
    this.bossIntro = this.bossQueue.length ? 2.2 : 0;
    if (this.stats.autoRepair > 0) this.baseHp = Math.min(this.baseMaxHp, this.baseHp + this.baseMaxHp * this.stats.autoRepair);
    this.audio.play('alarm');
    this.notification = this.bossQueue.length > 1 ? `多重首领信号 · ${this.bossQueue.length} 个高危目标` : this.day === 1 ? '第一夜 · 守住基地' : `第 ${this.day} 夜 · 敌袭开始`;
    this.notificationTimer = 2.5;
  }

  private updateNight(dt: number) {
    if (this.bossIntro > 0) {
      const before = this.bossIntro;
      this.bossIntro -= dt;
      if (before > 0 && this.bossIntro <= 0) this.spawnNextBoss();
      return;
    }
    if (this.bossSpawnTimer > 0) {
      this.bossSpawnTimer -= dt;
      if (this.bossSpawnTimer <= 0) this.spawnNextBoss();
    }
    this.spawnTimer -= dt;
    if (this.spawned < this.enemyBudget && this.spawnTimer <= 0) {
      const burstRoll = Math.random();
      const burst = this.day >= 4 && burstRoll < .36 ? 4 : this.day >= 2 && burstRoll < .62 ? 3 : burstRoll < .58 ? 2 : 1;
      for (let i = 0; i < burst && this.spawned < this.enemyBudget; i += 1) {
        this.spawnEnemy(this.rollEnemyKind(), true);
        this.spawned += 1;
      }
      this.spawnTimer = Math.max(.16, .86 - this.day * .045) * randomRange(.7, 1.08);
    }
    if (this.phaseTime <= 0 && this.spawned >= this.enemyBudget && this.enemies.every(enemy => enemy.dead || enemy.kind !== 'boss' && enemy.hp <= 0)) {
      if (this.enemies.filter(enemy => !enemy.dead).length === 0) this.completeNight();
    }
  }

  private spawnNextBoss() {
    const variant = this.bossQueue.shift();
    if (!variant) return;
    this.currentBossVariant = variant;
    this.spawnEnemy('boss', false, undefined, undefined, variant);
    this.bossSpawnTimer = this.bossQueue.length ? 3.4 : 0;
    this.audio.play('boss');
    this.screenShake = 5;
    if (this.bossQueue.length) {
      this.notification = `多重首领 · 仍有 ${this.bossQueue.length} 个信号正在接近`;
      this.notificationTimer = 2.8;
    }
  }

  private completeNight() {
    const generators = this.buildings.filter(item => item.kind === 'generator');
    const generated = Math.floor(generators.reduce((sum, item) => sum + this.stats.generatorYield * (1 + (item.level - 1) * .5), 0));
    if (generated > 0) {
      this.energy += generated;
      this.floatTexts.push({ x: 0, y: -100, value: `发电机 +${generated} ⚡`, color: '#ffe070', life: 2, big: true });
    }
    this.buildings.forEach(building => { building.hp = Math.min(building.maxHp, building.hp + building.maxHp * .08); });
    this.phase = 'upgrade';
    this.paused = false;
    this.keys.clear();
    this.mouse.down = false;
    this.recallCharging = false;
    this.recallCharge = 0;
    this.upgradeChoices = this.upgrades.choices(3, this.stats.companionUnlocked ? [] : ['warden'], this.stats.companionUnlocked ? AI_UPGRADE_IDS : []);
    this.audio.play('upgrade');
    this.emitSnapshot();
  }

  private rollEnemyKind(): EnemyKind {
    const roll = Math.random();
    if (this.day === 1) return 'infected';
    if (this.day === 2) return roll < .08 ? 'phase' : roll < .2 ? 'stalker' : roll < .44 ? 'charger' : 'infected';
    if (this.day === 3) return roll < .07 ? 'siphon' : roll < .14 ? 'medic' : roll < .25 ? 'bomber' : roll < .39 ? 'armored' : roll < .59 ? 'charger' : roll < .7 ? 'stalker' : 'infected';
    if (this.day === 4) return roll < .07 ? 'jammer' : roll < .14 ? 'phase' : roll < .21 ? 'crusher' : roll < .29 ? 'medic' : roll < .39 ? 'leaper' : roll < .5 ? 'ranged' : roll < .61 ? 'bomber' : roll < .71 ? 'armored' : roll < .84 ? 'charger' : roll < .92 ? 'stalker' : 'infected';
    return roll < .055 ? 'jammer' : roll < .11 ? 'siphon' : roll < .17 ? 'phase' : roll < .245 ? 'crusher' : roll < .32 ? 'medic' : roll < .4 ? 'leaper' : roll < .49 ? 'bomber' : roll < .58 ? 'ranged' : roll < .68 ? 'armored' : roll < .8 ? 'charger' : roll < .89 ? 'stalker' : 'infected';
  }

  private updatePlayer(dt: number) {
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    this.player.hurtTimer = Math.max(0, this.player.hurtTimer - dt);
    this.player.fireTimer = Math.max(0, this.player.fireTimer - dt);
    this.recallCooldown = Math.max(0, this.recallCooldown - dt);
    this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    this.healLockout = Math.max(0, this.healLockout - dt);
    this.meleeSwingTimer = Math.max(0, this.meleeSwingTimer - dt);
    this.operatorSkillCooldown = Math.max(0, this.operatorSkillCooldown - dt);
    this.operatorBoostTimer = Math.max(0, this.operatorBoostTimer - dt);
    if (this.adminEnabled) {
      this.player.dashCooldown = 0;
      this.player.fireTimer = 0;
      this.recallCooldown = 0;
      this.operatorSkillCooldown = 0;
    }
    if (this.keys.has('v') && this.meleeSwingTimer <= 0) this.meleeAttack();
    if (this.recallCharging) {
      this.recallCharge += dt;
      if (Math.random() < dt * 20) this.particles.push({ x: this.player.x + randomRange(-28, 28), y: this.player.y + randomRange(-28, 28), vx: (this.player.x * -.02), vy: (this.player.y * -.02), life: .45, maxLife: .45, size: 2.5, color: '#70f6e6', glow: true });
      if (this.recallCharge >= RECALL_CHANNEL_TIME) this.completeRecall();
    }
    if (this.player.dashTimer > 0 && Math.random() < dt * 48 * this.settings.particles / 100) {
      const speed = Math.hypot(this.player.vx, this.player.vy) || 1;
      this.particles.push({
        x: this.player.x - this.player.vx / speed * 18 + randomRange(-6, 6),
        y: this.player.y - this.player.vy / speed * 18 + randomRange(-6, 6),
        vx: -this.player.vx * .12 + randomRange(-28, 28),
        vy: -this.player.vy * .12 + randomRange(-28, 28),
        life: .38, maxLife: .38, size: randomRange(2.5, 5.5), color: '#76fff0', glow: true,
      });
    }

    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    const moveLength = length(dx, dy);
    if (dx || dy) { dx /= moveLength; dy /= moveLength; }
    const operatorSpeed = this.operator === 'ranger' ? 1.12 : 1;
    const skillSpeed = this.operatorBoostTimer > 0 ? 1.28 : 1;
    const speed = this.player.dashTimer > 0 ? 650 : 245 * operatorSpeed * skillSpeed;
    const response = this.player.dashTimer > 0 ? 26 : 13;
    this.player.vx += (dx * speed - this.player.vx) * Math.min(1, dt * response);
    this.player.vy += (dy * speed - this.player.vy) * Math.min(1, dt * response);
    if (!dx && !dy) {
      this.player.vx *= Math.pow(.001, dt);
      this.player.vy *= Math.pow(.001, dt);
    }
    this.player.x = clamp(this.player.x + this.player.vx * dt, -WORLD_SIZE / 2 + 30, WORLD_SIZE / 2 - 30);
    this.player.y = clamp(this.player.y + this.player.vy * dt, -WORLD_SIZE / 2 + 30, WORLD_SIZE / 2 - 30);
    this.player.angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);

    if (Math.hypot(this.player.x, this.player.y) < BASE_RADIUS + 82 && this.healLockout <= 0 && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 7.5 * dt);
      if (Math.random() < dt * 5) this.particles.push({ x: this.player.x + randomRange(-18, 18), y: this.player.y + randomRange(-18, 18), vx: 0, vy: -24, life: .7, maxLife: .7, size: 2.5, color: '#67f5bd', glow: true });
    }

    if (this.operator === 'engineer' && Math.hypot(this.player.x, this.player.y) < BASE_RADIUS + 350) {
      this.baseHp = Math.min(this.baseMaxHp, this.baseHp + .7 * dt);
      for (const building of this.buildings) {
        if (distance(this.player, building) < 370) building.hp = Math.min(building.maxHp, building.hp + 3.2 * dt);
      }
      if (this.stats.companionUnlocked && this.companion.downTimer <= 0 && distance(this.player, this.companion) < 300) this.companion.hp = Math.min(this.companion.maxHp, this.companion.hp + 3 * dt);
    }

    if (this.mouse.down && !this.buildMode) this.firePlayerWeapon();
  }

  private updateCompanion(dt: number) {
    if (!this.stats.companionUnlocked) return;
    const ally = this.companion;
    if (ally.downTimer > 0) {
      this.companionTargetId = null;
      ally.downTimer = Math.max(0, ally.downTimer - dt);
      if (ally.downTimer <= 0) {
        ally.hp = ally.maxHp;
        ally.x = 105; ally.y = -70; ally.vx = 0; ally.vy = 0; ally.invulnerable = 2;
        this.notification = '守望者-7 · 重构完成'; this.notificationTimer = 2;
        this.speakAI('online');
        this.burst(ally.x, ally.y, '#72e9ff', 26, 150);
      }
      return;
    }
    ally.fireTimer = Math.max(0, ally.fireTimer - dt);
    ally.invulnerable = Math.max(0, ally.invulnerable - dt);
    this.companionRetargetTimer = Math.max(0, this.companionRetargetTimer - dt);
    if (Math.hypot(ally.x, ally.y) < BASE_RADIUS + 95 && ally.hp < ally.maxHp) ally.hp = Math.min(ally.maxHp, ally.hp + 10 * this.stats.companionRepairRate * dt);

    const personality = this.settings.aiPersonality;
    const commandRange = this.aiCommand === 'hunt' ? 1120 : this.aiCommand === 'focus' ? 1500 : this.aiCommand === 'follow' ? 760 : 680;
    let target = this.enemies.find(enemy => enemy.id === this.companionTargetId && !enemy.dead && distance(ally, enemy) < commandRange) || null;
    if (this.aiCommand === 'focus' && this.aiFocusTargetId) target = this.enemies.find(enemy => enemy.id === this.aiFocusTargetId && !enemy.dead) || null;
    if (!target || this.companionRetargetTimer <= 0) {
      const nextTarget = this.companionTarget();
      if (nextTarget?.id !== this.companionTargetId) this.companionStrafe = nextTarget && nextTarget.id % 2 ? 1 : -1;
      target = nextTarget;
      this.companionTargetId = target?.id || null;
      this.companionRetargetTimer = randomRange(.82, 1.12);
    }
    const playerMoving = Math.hypot(this.player.vx, this.player.vy) > 28;
    const followAngle = playerMoving ? Math.atan2(this.player.vy, this.player.vx) : Math.PI * .25;
    let goalX = this.player.x - Math.cos(followAngle) * 68;
    let goalY = this.player.y - Math.sin(followAngle) * 68;
    if (this.aiCommand === 'guard') {
      const guardAngle = (this.id * .17 + performance.now() / 12000) % TAU;
      const guardRadius = personality === 'bold' ? 265 : personality === 'guardian' ? 175 : 215;
      goalX = Math.cos(guardAngle) * guardRadius;
      goalY = Math.sin(guardAngle) * guardRadius;
    }
    if (target && this.aiCommand !== 'follow') {
      const dx = target.x - ally.x;
      const dy = target.y - ally.y;
      const dist = length(dx, dy);
      const basePreferred = personality === 'bold' ? 170 : personality === 'guardian' ? 250 : 215;
      const preferred = target.kind === 'bomber' || target.kind === 'crusher' ? basePreferred + 70 : basePreferred;
      const radial = dist > preferred + 45 ? 1 : dist < preferred - 70 ? -.72 : 0;
      goalX = ally.x + dx / dist * 120 * radial + -dy / dist * 66 * this.companionStrafe;
      goalY = ally.y + dy / dist * 120 * radial + dx / dist * 66 * this.companionStrafe;
      ally.angle = turnToward(ally.angle, Math.atan2(dy, dx), dt * 8);
    } else if (target) {
      ally.angle = turnToward(ally.angle, Math.atan2(target.y - ally.y, target.x - ally.x), dt * 8);
    }
    const leash = this.aiCommand === 'hunt' || this.aiCommand === 'focus' ? (personality === 'guardian' ? 680 : 1350) : this.aiCommand === 'guard' ? 520 : WORLD_SIZE;
    if (Math.hypot(goalX, goalY) > leash) {
      const magnitude = length(goalX, goalY); goalX = goalX / magnitude * leash; goalY = goalY / magnitude * leash;
    }
    let avoidX = 0; let avoidY = 0;
    for (const enemy of this.nearbyEnemies(ally, 180)) {
      if (enemy.dead) continue;
      const dx = ally.x - enemy.x; const dy = ally.y - enemy.y; const dist = Math.hypot(dx, dy);
      const danger = enemy.kind === 'bomber' ? 150 : enemy.radius + 58;
      if (dist > 0 && dist < danger) { avoidX += dx / dist * (danger - dist) / danger; avoidY += dy / dist * (danger - dist) / danger; }
    }
    const baseDistance = Math.hypot(ally.x, ally.y);
    const baseClearance = BASE_RADIUS + ally.radius + 18;
    if (baseDistance > 0 && baseDistance < baseClearance) {
      const push = (baseClearance - baseDistance) / baseClearance;
      avoidX += ally.x / baseDistance * push * 1.4;
      avoidY += ally.y / baseDistance * push * 1.4;
    }
    const avoidLength = Math.hypot(avoidX, avoidY);
    if (avoidLength > 1.15) { avoidX = avoidX / avoidLength * 1.15; avoidY = avoidY / avoidLength * 1.15; }
    const moveX = goalX - ally.x + avoidX * 155;
    const moveY = goalY - ally.y + avoidY * 155;
    const moveLength = Math.hypot(moveX, moveY);
    const speedBoost = personality === 'bold' ? 1.13 : personality === 'guardian' ? .95 : 1;
    const speed = (target ? 225 : 205) * speedBoost * this.stats.companionSpeed;
    const desiredVx = moveLength >= 20 ? moveX / moveLength * speed : 0;
    const desiredVy = moveLength >= 20 ? moveY / moveLength * speed : 0;
    ally.vx += (desiredVx - ally.vx) * Math.min(1, dt * 5.2);
    ally.vy += (desiredVy - ally.vy) * Math.min(1, dt * 5.2);
    ally.x = clamp(ally.x + ally.vx * dt, -WORLD_SIZE / 2 + 25, WORLD_SIZE / 2 - 25);
    ally.y = clamp(ally.y + ally.vy * dt, -WORLD_SIZE / 2 + 25, WORLD_SIZE / 2 - 25);
    if (!target && Math.hypot(ally.vx, ally.vy) > 15) ally.angle = turnToward(ally.angle, Math.atan2(ally.vy, ally.vx), dt * 5);

    const fireRange = personality === 'bold' ? 560 : personality === 'guardian' ? 520 : 540;
    if (target && distance(ally, target) < fireRange && ally.fireTimer <= 0) {
      const angle = Math.atan2(target.y - ally.y, target.x - ally.x);
      const damageScale = personality === 'bold' ? 1.2 : personality === 'guardian' ? .92 : 1;
      const projectileCount = this.stats.companionProjectiles;
      for (let index = 0; index < projectileCount; index += 1) {
        const offset = projectileCount === 1 ? 0 : (index / (projectileCount - 1) - .5) * .13;
        const shotAngle = angle + offset;
        this.projectiles.push({ id: this.id++, team: 'tower', kind: 'bullet', x: ally.x + Math.cos(shotAngle) * 25, y: ally.y + Math.sin(shotAngle) * 25, vx: Math.cos(shotAngle) * 760, vy: Math.sin(shotAngle) * 760, radius: 4, damage: (13 + this.day * 1.6) * damageScale * this.stats.companionDamage * (projectileCount > 1 ? .72 : 1), life: 3.2, penetration: 1, explosive: false, hit: new Set() });
      }
      const baseCooldown = personality === 'bold' ? .22 : personality === 'guardian' ? .34 : .28;
      ally.fireTimer = this.adminEnabled ? 0 : baseCooldown / this.stats.companionFireRate;
      this.muzzle(ally.x + Math.cos(angle) * 25, ally.y + Math.sin(angle) * 25, '#79e9ff');
      this.audio.play('tower');
    }
  }

  private companionTarget() {
    if (this.aiCommand === 'focus' && this.aiFocusTargetId) {
      const focused = this.enemies.find(enemy => enemy.id === this.aiFocusTargetId && !enemy.dead);
      if (focused) return focused;
      this.aiFocusTargetId = null;
    }
    let best: Enemy | null = null;
    let bestScore = Infinity;
    const priority: Partial<Record<EnemyKind, number>> = { jammer: 270, siphon: 250, medic: 230, bomber: 190, phase: 175, stalker: 150, ranged: 115, crusher: 105, charger: 70 };
    const scanRange = this.aiCommand === 'hunt' || this.aiCommand === 'focus' ? 1120 : this.aiCommand === 'follow' ? 780 : 680;
    for (const enemy of this.nearbyEnemies(this.companion, scanRange)) {
      if (enemy.dead) continue;
      const allyDistance = distance(this.companion, enemy);
      if (allyDistance > scanRange) continue;
      const baseDistance = Math.hypot(enemy.x, enemy.y);
      const playerThreat = distance(this.player, enemy) < 200 ? 95 : 0;
      const commandScore = this.aiCommand === 'guard' ? baseDistance * .82 + allyDistance * .22 : this.aiCommand === 'follow' ? allyDistance * .45 + distance(this.player, enemy) * .48 - playerThreat * 1.7 : allyDistance * .72 + baseDistance * .08;
      const personalityBias = this.settings.aiPersonality === 'guardian' ? baseDistance * .22 - playerThreat : this.settings.aiPersonality === 'bold' ? -enemy.maxHp * .08 : 0;
      const score = commandScore + personalityBias - (priority[enemy.kind] || 0);
      if (score < bestScore) { bestScore = score; best = enemy; }
    }
    return best;
  }

  private damageCompanion(amount: number) {
    if (!this.stats.companionUnlocked) return;
    const ally = this.companion;
    if (ally.downTimer > 0 || ally.invulnerable > 0 || this.adminEnabled) return;
    ally.hp -= amount * Math.max(.35, 1 - this.stats.companionArmor);
    ally.invulnerable = .25;
    this.burst(ally.x, ally.y, '#72dfff', 7, 75);
    if (ally.hp <= 0) {
      ally.hp = 0;
      ally.downTimer = this.stats.companionRebootTime;
      ally.vx = 0; ally.vy = 0;
      this.notification = `守望者-7 离线 · ${this.stats.companionRebootTime.toFixed(1)} 秒后基地重构`; this.notificationTimer = 3;
      this.aiReply = '系统受损……切换至基地重构频道。';
      this.aiReplyTimer = 4.8;
      this.aiCommandOpen = false;
      this.burst(ally.x, ally.y, '#ff765d', 24, 160);
    }
  }

  private tryDash() {
    if (this.paused || this.phase === 'upgrade' || this.phase === 'gameover' || this.player.dashCooldown > 0) return;
    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    if (!dx && !dy) { dx = Math.cos(this.player.angle); dy = Math.sin(this.player.angle); }
    const magnitude = length(dx, dy);
    this.player.vx = dx / magnitude * 680;
    this.player.vy = dy / magnitude * 680;
    this.player.dashTimer = .2;
    this.player.invulnerable = .32;
    this.player.dashCooldown = this.stats.dashCooldown;
    this.burst(this.player.x, this.player.y, '#91eaff', 12, 120);
    if (this.stats.frostDash) {
      for (const enemy of this.enemies) {
        if (!enemy.dead && distance(this.player, enemy) < 150) {
          enemy.slow = Math.max(enemy.slow, 2.5);
          this.damageEnemy(enemy, 18, false);
        }
      }
    }
  }

  private changeWeapon(slot: number) {
    if (slot === 1) this.player.weapon = 'rifle';
    if (slot === 2) {
      if (!this.stats.scatterUnlocked) { this.notification = '散射协议尚未解锁'; this.notificationTimer = 1.5; return; }
      this.player.weapon = 'scatter';
    }
    if (slot === 3) {
      if (!this.stats.arcUnlocked) { this.notification = '电弧线圈尚未解锁'; this.notificationTimer = 1.5; return; }
      this.player.weapon = 'arc';
    }
    if (slot === 4) {
      if (!this.stats.railUnlocked) { this.notification = '磁轨枪机尚未解锁'; this.notificationTimer = 1.5; return; }
      this.player.weapon = 'rail';
    }
    this.emitSnapshot();
  }

  private firePlayerWeapon() {
    if (this.player.fireTimer > 0) return;
    if (this.player.weapon === 'arc') {
      this.fireArc();
      return;
    }
    const scatter = this.player.weapon === 'scatter';
    const rail = this.player.weapon === 'rail';
    const count = scatter ? 7 : rail ? Math.min(3, this.stats.projectiles) : this.stats.projectiles;
    const spread = scatter ? .62 : rail ? .025 * Math.max(1, count - 1) : this.stats.spread * Math.max(1, count - 1);
    const damage = scatter ? this.stats.bulletDamage * .54 : rail ? this.stats.bulletDamage * 3.25 : this.stats.bulletDamage;
    const overdrive = this.overdriveTimer > 0 ? 1.65 : 1;
    const operatorRate = this.operator === 'ranger' ? 1.12 : 1;
    const rate = (scatter ? 1.45 : rail ? 1.05 : this.stats.fireRate) * overdrive * operatorRate;
    for (let index = 0; index < count; index += 1) {
      const ratio = count === 1 ? 0 : index / (count - 1) - .5;
      const angle = this.player.angle + ratio * spread + randomRange(-.018, .018);
      const speed = scatter ? this.stats.bulletSpeed * .8 : rail ? 1480 : this.stats.bulletSpeed;
      this.projectiles.push({
        id: this.id++, team: 'player', kind: rail ? 'rail' : 'bullet',
        x: this.player.x + Math.cos(angle) * 25, y: this.player.y + Math.sin(angle) * 25,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        radius: this.stats.bulletSize * (scatter ? .85 : rail ? 1.55 : 1), damage, life: 99,
        penetration: this.stats.penetration + (rail ? 5 : 0), explosive: !rail && Math.random() < this.stats.explosionChance, hit: new Set(),
      });
    }
    this.player.fireTimer = 1 / rate;
    this.audio.play('shoot');
    const recoil = scatter ? 28 : rail ? 42 : 8;
    this.player.vx -= Math.cos(this.player.angle) * recoil;
    this.player.vy -= Math.sin(this.player.angle) * recoil;
    this.muzzle(this.player.x + Math.cos(this.player.angle) * 25, this.player.y + Math.sin(this.player.angle) * 25, rail ? '#bea4ff' : '#ffd081');
  }

  private fireArc() {
    const range = WORLD_SIZE * 2;
    const aim = { x: Math.cos(this.player.angle), y: Math.sin(this.player.angle) };
    const candidates = this.enemies.filter(enemy => !enemy.dead && distance(this.player, enemy) < range);
    if (!candidates.length) {
      const end = { x: this.player.x + aim.x * 420, y: this.player.y + aim.y * 420 };
      this.arcParticles(this.player, end);
      this.player.fireTimer = .1;
      this.audio.play('arc');
      return;
    }
    const aimed = candidates.map(enemy => {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const forward = dx * aim.x + dy * aim.y;
      const side = Math.abs(dx * aim.y - dy * aim.x);
      return { enemy, forward, side, score: side * 2.4 + Math.hypot(dx, dy) * .08 };
    }).filter(item => item.forward > 0 && item.side < 115 + item.enemy.radius).sort((a, b) => a.score - b.score);
    let current = aimed[0]?.enemy || candidates.sort((a, b) => distance(this.player, a) - distance(this.player, b))[0];
    const hit = new Set<number>();
    let origin: Vec2 = this.player;
    for (let chain = 0; current && chain < 8; chain += 1) {
      hit.add(current.id);
      this.arcParticles(origin, current);
      const dealt = this.damageEnemy(current, this.stats.bulletDamage * 2.35 * Math.pow(.9, chain), Math.random() < this.stats.critChance);
      if (this.stats.lifeSteal > 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.min(3, dealt * this.stats.lifeSteal));
      current.slow = Math.max(current.slow, 1.15);
      if (Math.random() < this.stats.explosionChance * .55) this.explode(current.x, current.y, 58, this.stats.bulletDamage * .6, current.id);
      origin = current;
      current = candidates.filter(enemy => !enemy.dead && !hit.has(enemy.id) && distance(origin, enemy) < 285).sort((a, b) => distance(origin, a) - distance(origin, b))[0];
    }
    const overdrive = this.overdriveTimer > 0 ? 1.65 : 1;
    const operatorRate = this.operator === 'ranger' ? 1.12 : 1;
    this.player.fireTimer = 1 / (Math.max(5.4, this.stats.fireRate * .86) * overdrive * operatorRate);
    this.screenShake = Math.max(this.screenShake, 1.5);
    this.audio.play('arc');
  }

  private updateBuildings(dt: number) {
    for (const building of this.buildings) {
      building.cooldown -= dt;
      building.flash = Math.max(0, building.flash - dt * 8);
      if (building.kind === 'wall' || building.kind === 'generator') continue;
      const config = BUILDINGS[building.kind];
      if (building.kind === 'repair') {
        if (building.cooldown > 0) continue;
        let repaired = 0;
        for (const other of this.buildings) {
          if (distance(building, other) > config.range || other.hp >= other.maxHp) continue;
          other.hp = Math.min(other.maxHp, other.hp + other.maxHp * (.045 + building.level * .012));
          repaired += 1;
        }
        if (Math.hypot(building.x, building.y) < config.range && this.baseHp < this.baseMaxHp) {
          this.baseHp = Math.min(this.baseMaxHp, this.baseHp + 5 + building.level * 3);
          repaired += 1;
        }
        if (repaired > 0) { this.burst(building.x, building.y, config.color, 9, 80); building.flash = 1; }
        building.cooldown = this.towerCooldown(config.rate, 4);
        continue;
      }
      const range = config.range * (1 + (building.level - 1) * .08);
      const target = this.closestEnemy(building, range);
      if (!target) continue;
      building.angle = Math.atan2(target.y - building.y, target.x - building.x);
      if (building.cooldown > 0) continue;
      const levelDamage = config.damage * (1 + (building.level - 1) * .3);
      if (building.kind === 'gun') {
        this.shootProjectile(building, target, 'bullet', levelDamage * .56, 720, 3.5, false, -6);
        this.shootProjectile(building, target, 'bullet', levelDamage * .56, 720, 3.5, false, 6);
        building.cooldown = this.towerCooldown(config.rate * (1 + (building.level - 1) * .12), 12);
        this.audio.play('tower');
      } else if (building.kind === 'freeze') {
        this.shootProjectile(building, target, 'ice', levelDamage, 440, 7 + building.level * 2, false);
        building.cooldown = this.towerCooldown(config.rate, 6);
        this.audio.play('ice');
      } else if (building.kind === 'tesla') {
        let current: Enemy | undefined = target;
        let origin: Vec2 = building;
        const hit = new Set<number>();
        for (let chain = 0; current && chain < 3 + building.level; chain += 1) {
          hit.add(current.id);
          this.arcParticles(origin, current);
          this.damageEnemy(current, levelDamage * Math.pow(.88, chain), false);
          current.slow = Math.max(current.slow, .55);
          origin = current;
          current = this.nearbyEnemies(origin, 205).filter(enemy => !enemy.dead && !hit.has(enemy.id) && distance(origin, enemy) < 205).sort((a, b) => distance(origin, a) - distance(origin, b))[0];
        }
        building.cooldown = this.towerCooldown(config.rate * (1 + (building.level - 1) * .1), 7);
        this.audio.play('arc');
      } else {
        this.shootProjectile(building, target, 'missile', levelDamage, 330, 8, true);
        building.cooldown = this.towerCooldown(config.rate, 4);
      }
      building.flash = 1;
    }
  }

  private towerCooldown(baseRate: number, adminCap: number) {
    const rate = baseRate * this.stats.towerFireRate;
    return 1 / Math.max(.01, this.adminEnabled ? Math.min(rate, adminCap) : rate);
  }

  private shootProjectile(from: Building, target: Enemy, kind: Projectile['kind'], damage: number, speed: number, radius: number, explosive: boolean, lateralOffset = 0) {
    const angle = Math.atan2(target.y - from.y, target.x - from.x);
    const muzzleX = from.x + Math.cos(angle) * 25 - Math.sin(angle) * lateralOffset;
    const muzzleY = from.y + Math.sin(angle) * 25 + Math.cos(angle) * lateralOffset;
    this.projectiles.push({ id: this.id++, team: 'tower', kind, x: muzzleX, y: muzzleY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius, damage, life: 2, penetration: 0, explosive, hit: new Set() });
    this.muzzle(muzzleX, muzzleY, BUILDINGS[from.kind].color);
  }

  private updateEnemies(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      enemy.attackCooldown -= dt;
      enemy.fireTimer -= dt;
      enemy.flash = Math.max(0, enemy.flash - dt * 9);
      enemy.slow = Math.max(0, enemy.slow - dt);
      enemy.specialTimer -= dt;

      if (enemy.kind === 'boss' && enemy.specialTimer <= 0) {
        const cadence = clamp(1.38 - (this.day - 1) * .055, .72, 1.38);
        if (enemy.bossVariant === 'hive') { enemy.specialTimer = 5.1 * cadence; this.bossHiveBurst(enemy); }
        else if (enemy.bossVariant === 'tempest') { enemy.specialTimer = 4.4 * cadence; this.bossTempestStrike(enemy); }
        else { enemy.specialTimer = 6.5 * cadence; this.bossSiegePulse(enemy); }
      }
      if (enemy.kind === 'medic' && enemy.specialTimer <= 0) {
        enemy.specialTimer = 5.4;
        let healed = 0;
        for (const other of this.nearbyEnemies(enemy, 220)) {
          if (other.dead || other === enemy || distance(enemy, other) > 220 || other.hp >= other.maxHp) continue;
          other.hp = Math.min(other.maxHp, other.hp + other.maxHp * .16);
          healed += 1;
        }
        if (healed > 0) { this.burst(enemy.x, enemy.y, '#71ef9e', 18, 150); this.floatTexts.push({ x: enemy.x, y: enemy.y - 30, value: `群体修复 ×${healed}`, color: '#7affab', life: 1, big: false }); }
      }
      if (enemy.kind === 'siphon' && enemy.specialTimer <= 0 && Math.hypot(enemy.x, enemy.y) < 640) {
        const stolen = Math.min(this.energy, 5 + Math.ceil(this.day * 1.5));
        this.energy -= stolen;
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * .22);
        enemy.specialTimer = 6.2;
        this.floatTexts.push({ x: enemy.x, y: enemy.y - 28, value: stolen ? `窃取 ${stolen} 能源` : '能量虹吸', color: '#ffe66d', life: 1.4, big: true });
        this.burst(enemy.x, enemy.y, '#f1d15b', 19, 165);
      }
      if (enemy.kind === 'jammer' && enemy.specialTimer <= 0) {
        let jammed = 0;
        for (const building of this.buildings) {
          if (building.kind === 'wall' || building.kind === 'generator' || distance(enemy, building) > 335) continue;
          building.cooldown = Math.max(building.cooldown, 2.8);
          building.flash = 1;
          jammed += 1;
        }
        enemy.specialTimer = jammed ? 6.4 : 1.2;
        if (jammed) {
          this.floatTexts.push({ x: enemy.x, y: enemy.y - 30, value: `炮塔封锁 ×${jammed}`, color: '#66d9ff', life: 1.3, big: true });
          this.burst(enemy.x, enemy.y, '#55c8ff', 24, 300);
        }
      }

      const target = this.pickEnemyTarget(enemy);
      if (!target) continue;
      const targetRadius = 'radius' in target ? (target.radius ?? BASE_RADIUS) : BASE_RADIUS;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = length(dx, dy);
      if (enemy.kind === 'leaper' && enemy.specialTimer <= 0) {
        enemy.specialTimer = 3.2;
        enemy.x += dx / dist * 82;
        enemy.y += dy / dist * 82;
        this.burst(enemy.x, enemy.y, '#df75ff', 9, 95);
      }
      if (enemy.kind === 'phase' && enemy.specialTimer <= 0 && dist > 145) {
        enemy.specialTimer = 4.7;
        this.burst(enemy.x, enemy.y, '#8c7dff', 13, 105);
        enemy.x += dx / dist * Math.min(210, dist - 80);
        enemy.y += dy / dist * Math.min(210, dist - 80);
        this.burst(enemy.x, enemy.y, '#b0a6ff', 16, 130);
      }
      if (enemy.kind === 'crusher' && enemy.specialTimer <= 0) {
        enemy.specialTimer = 4.6;
        enemy.x += dx / dist * 48;
        enemy.y += dy / dist * 48;
        this.burst(enemy.x, enemy.y, '#ff8658', 12, 125);
      }
      const speedScale = enemy.slow > 0 ? Math.max(.24, .52 / this.stats.freezePower) : 1;
      const backliner = enemy.kind === 'ranged' || enemy.kind === 'medic' || enemy.kind === 'boss' && enemy.bossVariant === 'tempest';
      const desired = backliner ? (enemy.kind === 'medic' ? 285 : enemy.kind === 'boss' ? 315 : 225) : enemy.radius + targetRadius + 5;
      const separation = this.enemySeparation(enemy);

      if (backliner && dist <= 410) {
        const nearDistance = enemy.kind === 'medic' ? 230 : enemy.kind === 'boss' ? 265 : 185;
        const farDistance = enemy.kind === 'medic' ? 340 : enemy.kind === 'boss' ? 380 : 285;
        const retreat = dist < nearDistance ? -1 : dist > farDistance ? .55 : 0;
        const orbit = enemy.id % 2 ? 1 : -1;
        enemy.vx += ((dx / dist * enemy.speed * retreat) + (-dy / dist * enemy.speed * .34 * orbit) + separation.x * enemy.speed - enemy.vx) * Math.min(1, dt * 6);
        enemy.vy += ((dy / dist * enemy.speed * retreat) + (dx / dist * enemy.speed * .34 * orbit) + separation.y * enemy.speed - enemy.vy) * Math.min(1, dt * 6);
        if (enemy.fireTimer <= 0) {
          const angle = Math.atan2(dy, dx);
          this.projectiles.push({ id: this.id++, team: 'enemy', kind: 'plasma', x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 260, vy: Math.sin(angle) * 260, radius: 7, damage: enemy.damage, life: 2.2, penetration: 0, explosive: false, hit: new Set() });
          enemy.fireTimer = enemy.kind === 'medic' ? randomRange(2, 2.6) : enemy.kind === 'boss' ? randomRange(.75, 1.05) : randomRange(1.5, 2.1);
          this.muzzle(enemy.x, enemy.y, enemy.kind === 'medic' ? '#74ef9e' : enemy.kind === 'boss' ? '#69eaff' : '#ff586c');
        }
      } else if (dist > desired) {
        const weaveAmount = enemy.kind === 'stalker' ? .28 : .11;
        const weave = enemy.kind === 'charger' || enemy.kind === 'boss' || enemy.kind === 'crusher' ? 0 : Math.sin(performance.now() / 700 + enemy.id * 1.7) * weaveAmount;
        const charge = enemy.kind === 'charger' && dist > 180 ? 1.18 : 1;
        const desiredVx = (dx / dist + -dy / dist * weave + separation.x * .82) * enemy.speed * speedScale * charge;
        const desiredVy = (dy / dist + dx / dist * weave + separation.y * .82) * enemy.speed * speedScale * charge;
        enemy.vx += (desiredVx - enemy.vx) * Math.min(1, dt * 7);
        enemy.vy += (desiredVy - enemy.vy) * Math.min(1, dt * 7);
      } else {
        enemy.vx *= .72;
        enemy.vy *= .72;
        if (enemy.attackCooldown <= 0) this.enemyAttack(enemy, target);
      }

      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
    }
    this.enemies = this.enemies.filter(enemy => !enemy.dead);
  }

  private pickEnemyTarget(enemy: Enemy): (Vec2 & { radius?: number; id?: number; hp?: number; kind?: BuildingKind; ally?: true }) {
    const playerDistance = distance(enemy, this.player);
    const allyDistance = !this.stats.companionUnlocked || this.companion.downTimer > 0 ? Infinity : distance(enemy, this.companion);
    const huntsSquad = enemy.kind === 'stalker' || enemy.kind === 'charger' || enemy.kind === 'leaper' || enemy.kind === 'ranged';
    if (huntsSquad && allyDistance < playerDistance && allyDistance < (enemy.kind === 'stalker' ? 520 : 390)) return this.companion;
    const playerAggro: Record<EnemyKind, number> = { infected: 220, charger: 390, armored: 145, ranged: 430, bomber: 175, leaper: 470, stalker: 540, medic: 170, crusher: 130, phase: 450, siphon: 190, jammer: 180, boss: 250, spawn: 280 };
    if (playerDistance < playerAggro[enemy.kind] && enemy.kind !== 'armored' && enemy.kind !== 'bomber') return this.player;
    let closestBuilding: Building | null = null;
    let closestScore = Infinity;
    const buildingAggro: Record<EnemyKind, number> = { infected: 145, charger: 210, armored: 430, ranged: 460, bomber: 560, leaper: 180, stalker: 150, medic: 300, crusher: 650, phase: 120, siphon: 180, jammer: 520, boss: 520, spawn: 150 };
    for (const building of this.buildings) {
      const dist = distance(enemy, building);
      const priority = enemy.kind === 'bomber' && building.kind !== 'wall' ? 95 : enemy.kind === 'armored' && building.kind === 'wall' ? 75 : enemy.kind === 'crusher' && building.kind !== 'wall' ? 150 : enemy.kind === 'boss' && building.kind === 'wall' ? 120 : 0;
      const score = dist - priority;
      if (score < closestScore && dist < buildingAggro[enemy.kind]) {
        closestScore = score;
        closestBuilding = building;
      }
    }
    if (closestBuilding) return closestBuilding;
    const lane = enemy.id * 2.399963;
    return { x: Math.cos(lane) * 22, y: Math.sin(lane) * 22, radius: BASE_RADIUS };
  }

  private enemySeparation(enemy: Enemy) {
    let x = 0;
    let y = 0;
    let neighbors = 0;
    for (const other of this.nearbyEnemies(enemy, enemy.radius + 90)) {
      if (other === enemy || other.dead) continue;
      const dx = enemy.x - other.x;
      const dy = enemy.y - other.y;
      const dist = Math.hypot(dx, dy);
      const avoid = enemy.radius + other.radius + 18;
      if (dist <= 0 || dist >= avoid) continue;
      const force = (avoid - dist) / avoid;
      x += dx / dist * force;
      y += dy / dist * force;
      neighbors += 1;
      if (neighbors >= 7) break;
    }
    const magnitude = Math.hypot(x, y);
    return magnitude > 1 ? { x: x / magnitude, y: y / magnitude } : { x, y };
  }

  private enemyAttack(enemy: Enemy, target: Vec2 & { id?: number; hp?: number; kind?: BuildingKind; ally?: true }) {
    enemy.attackCooldown = enemy.kind === 'charger' || enemy.kind === 'stalker' ? .72 : enemy.kind === 'crusher' ? 1.3 : enemy.kind === 'boss' ? 1.4 : 1;
    if (enemy.kind === 'bomber') {
      this.detonateBomber(enemy);
      return;
    }
    if (target === this.player) {
      this.damagePlayer(enemy.damage, enemy.elite === 'shock');
      return;
    }
    if (target.ally) {
      this.damageCompanion(enemy.damage);
      return;
    }
    if (target.id) {
      const building = this.buildings.find(item => item.id === target.id);
      if (!building) return;
      let damage = enemy.damage * (enemy.kind === 'boss' && enemy.bossVariant === 'siege' && building.kind === 'wall' ? 2.2 : enemy.kind === 'crusher' ? 1.65 : 1);
      if (building.kind === 'wall') damage *= Math.max(.2, 1 - this.stats.wallArmor);
      building.hp -= damage;
      building.flash = 1;
      this.screenShake = Math.max(this.screenShake, enemy.kind === 'boss' ? 7 : 2.5);
      if (building.hp <= 0) {
        this.burst(building.x, building.y, '#b8a99b', 28, 170);
        this.buildings = this.buildings.filter(item => item.id !== building.id);
        if (this.selectedBuildingId === building.id) this.selectedBuildingId = null;
      }
      return;
    }
    if (this.adminEnabled) return;
    const reduced = enemy.damage * Math.max(.15, 1 - this.stats.baseShield);
    this.baseHp -= reduced;
    this.baseAlarm = 1.1;
    this.screenShake = Math.max(this.screenShake, enemy.kind === 'boss' ? 8 : 4);
    this.audio.play('base');
    if (this.baseHp <= 0) this.triggerGameOver();
  }

  private damagePlayer(amount: number, shock = false) {
    if (this.adminEnabled) return;
    if (this.shieldTimer > 0) {
      this.burst(this.player.x, this.player.y, '#66e8ff', 7, 65);
      return;
    }
    if (this.player.invulnerable > 0) return;
    this.player.hp -= amount;
    this.healLockout = 4.5;
    this.player.hurtTimer = .45;
    this.player.invulnerable = .28;
    this.screenShake = Math.max(this.screenShake, 6);
    if (shock) { this.player.vx *= .25; this.player.vy *= .25; }
    this.audio.play('hurt');
    if (this.player.hp <= 0) {
      this.metal = Math.max(0, this.metal - 15);
      this.player.x = 100;
      this.player.y = 0;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.hp = this.player.maxHp;
      this.player.invulnerable = 2;
      this.notification = '作战员重构完成 · 遗失 15 金属';
      this.notificationTimer = 2.5;
    }
  }

  private detonateBomber(enemy: Enemy) {
    enemy.dead = true;
    this.audio.play('missile');
    this.screenShake = Math.max(this.screenShake, 6);
    this.burst(enemy.x, enemy.y, '#ffca55', 30, 230);
    if (distance(enemy, this.player) < 115) this.damagePlayer(enemy.damage);
    if (this.stats.companionUnlocked && this.companion.downTimer <= 0 && distance(enemy, this.companion) < 115) this.damageCompanion(enemy.damage);
    for (const building of this.buildings) if (distance(enemy, building) < 115) building.hp -= enemy.damage;
    this.buildings = this.buildings.filter(building => building.hp > 0);
    if (Math.hypot(enemy.x, enemy.y) < BASE_RADIUS + 110 && !this.adminEnabled) {
      this.baseHp -= enemy.damage * Math.max(.15, 1 - this.stats.baseShield);
      this.baseAlarm = 1;
      if (this.baseHp <= 0) this.triggerGameOver();
    }
  }

  private bossSiegePulse(boss: Enemy) {
    this.floatTexts.push({ x: boss.x, y: boss.y - 95, value: '震荡波', color: '#ff6d5d', life: 1.2, big: true });
    this.screenShake = 5;
    this.burst(boss.x, boss.y, '#ff5f55', 34, 330);
    if (distance(boss, this.player) < 330) this.damagePlayer(19);
    if (this.stats.companionUnlocked && this.companion.downTimer <= 0 && distance(boss, this.companion) < 330) this.damageCompanion(19);
    for (const building of [...this.buildings]) {
      if (distance(boss, building) < 330) building.hp -= 24;
    }
    for (let i = 0; i < 3; i += 1) this.spawnEnemy('spawn', false, 0, { x: boss.x + randomRange(-90, 90), y: boss.y + randomRange(-90, 90) });
  }

  private bossHiveBurst(boss: Enemy) {
    this.floatTexts.push({ x: boss.x, y: boss.y - 88, value: '裂巢孵化', color: '#e68aff', life: 1.2, big: true });
    this.burst(boss.x, boss.y, '#d96cff', 30, 245);
    let healed = 0;
    for (const enemy of this.nearbyEnemies(boss, 360)) {
      if (enemy === boss || enemy.dead || enemy.hp >= enemy.maxHp) continue;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * .18);
      healed += 1;
    }
    for (let i = 0; i < 5; i += 1) {
      const angle = i / 5 * TAU + Math.random() * .25;
      this.spawnEnemy('spawn', false, 0, { x: boss.x + Math.cos(angle) * 92, y: boss.y + Math.sin(angle) * 92 });
    }
    if (healed) this.floatTexts.push({ x: boss.x, y: boss.y - 112, value: `群体再生 ×${healed}`, color: '#f2b1ff', life: 1, big: false });
  }

  private bossTempestStrike(boss: Enemy) {
    this.floatTexts.push({ x: boss.x, y: boss.y - 82, value: '电磁风暴', color: '#7cecff', life: 1.2, big: true });
    this.burst(boss.x, boss.y, '#63ddff', 26, 300);
    if (distance(boss, this.player) < 460) { this.arcParticles(boss, this.player); this.damagePlayer(15); }
    if (this.stats.companionUnlocked && this.companion.downTimer <= 0 && distance(boss, this.companion) < 460) {
      this.arcParticles(boss, this.companion);
      this.damageCompanion(13);
    }
    const disrupted = [...this.buildings].sort((a, b) => distance(boss, a) - distance(boss, b)).slice(0, 4);
    for (const building of disrupted) {
      if (distance(boss, building) > 520) continue;
      this.arcParticles(boss, building);
      building.cooldown = Math.max(building.cooldown, 2.6);
      building.hp -= 10;
    }
    const dx = boss.x || 1;
    const dy = boss.y;
    const magnitude = length(dx, dy);
    const direction = boss.id % 2 ? 1 : -1;
    boss.x = clamp(boss.x + -dy / magnitude * 105 * direction, -WORLD_SIZE / 2 + 90, WORLD_SIZE / 2 - 90);
    boss.y = clamp(boss.y + dx / magnitude * 105 * direction, -WORLD_SIZE / 2 + 90, WORLD_SIZE / 2 - 90);
  }

  private updateProjectiles(dt: number) {
    for (const projectile of this.projectiles) {
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (Math.abs(projectile.x) > WORLD_SIZE / 2 + 100 || Math.abs(projectile.y) > WORLD_SIZE / 2 + 100) projectile.life = 0;
      if (projectile.life <= 0) continue;

      if (projectile.team === 'enemy') {
        if (distance(projectile, this.player) < projectile.radius + this.player.radius) {
          this.damagePlayer(projectile.damage);
          projectile.life = 0;
          continue;
        }
        if (this.stats.companionUnlocked && this.companion.downTimer <= 0 && distance(projectile, this.companion) < projectile.radius + this.companion.radius) {
          this.damageCompanion(projectile.damage);
          projectile.life = 0;
          continue;
        }
        const hitBuilding = this.buildings.find(building => distance(projectile, building) < projectile.radius + building.radius);
        if (hitBuilding) {
          hitBuilding.hp -= projectile.damage;
          hitBuilding.flash = 1;
          projectile.life = 0;
          continue;
        }
        if (Math.hypot(projectile.x, projectile.y) < BASE_RADIUS + projectile.radius) {
          if (this.adminEnabled) { projectile.life = 0; continue; }
          this.baseHp -= projectile.damage * Math.max(.15, 1 - this.stats.baseShield);
          this.baseAlarm = 1;
          projectile.life = 0;
          if (this.baseHp <= 0) this.triggerGameOver();
        }
        continue;
      }

      for (const enemy of this.nearbyEnemies(projectile, projectile.radius + 84)) {
        if (enemy.dead || projectile.hit.has(enemy.id)) continue;
        if (distance(projectile, enemy) > projectile.radius + enemy.radius) continue;
        projectile.hit.add(enemy.id);
        const critical = projectile.team === 'player' && Math.random() < this.stats.critChance;
        const dealt = this.damageEnemy(enemy, projectile.damage, critical);
        if (projectile.team === 'player' && this.stats.lifeSteal > 0) this.player.hp = Math.min(this.player.maxHp, this.player.hp + Math.min(3, dealt * this.stats.lifeSteal));
        if (projectile.kind === 'ice') {
          enemy.slow = Math.max(enemy.slow, 2.1 * this.stats.freezePower);
          if (this.stats.freezePower > 1.4) {
            for (const other of this.nearbyEnemies(enemy, 62 * this.stats.freezePower)) if (!other.dead) other.slow = Math.max(other.slow, 1.3);
          }
        }
        if (projectile.kind === 'missile' || projectile.explosive) {
          const radius = projectile.kind === 'missile' ? 92 * this.stats.missileRadius : this.stats.explosionRadius;
          this.explode(projectile.x, projectile.y, radius, projectile.damage * .68, enemy.id);
          projectile.life = 0;
          break;
        }
        if (projectile.penetration > 0) projectile.penetration -= 1;
        else { projectile.life = 0; break; }
      }
    }
    this.projectiles = this.projectiles.filter(projectile => projectile.life > 0);
  }

  private damageEnemy(enemy: Enemy, damage: number, critical: boolean) {
    let dealt = critical ? damage * 2 : damage;
    if (enemy.elite === 'armor') dealt *= .65;
    enemy.hp -= dealt;
    enemy.flash = 1;
    this.floatTexts.push({ x: enemy.x + randomRange(-8, 8), y: enemy.y - enemy.radius, value: `${critical ? '✦ ' : ''}${Math.round(dealt)}`, color: critical ? '#ffe575' : '#f1eee8', life: .72, big: critical });
    this.audio.play('hit');
    this.hitParticles(enemy.x, enemy.y, critical ? '#ffe575' : '#ff6a5d', critical ? 8 : 4);
    if (enemy.hp <= 0) this.killEnemy(enemy);
    return dealt;
  }

  private killEnemy(enemy: Enemy) {
    if (enemy.dead) return;
    enemy.dead = true;
    this.kills += 1;
    this.audio.play('kill');
    this.burst(enemy.x, enemy.y, enemy.kind === 'boss' ? '#ff9d57' : '#b94c4f', enemy.kind === 'boss' ? 70 : 13, enemy.kind === 'boss' ? 330 : 100);
    if (enemy.kind === 'bomber') this.detonateBomber(enemy);
    if (this.easterEggs.has('gift')) {
      const colors = ['#ff5a66', '#ffe263', '#70e7ff', '#b97aff'];
      for (const color of colors) this.burst(enemy.x, enemy.y, color, 5, 155);
    }
    if (enemy.kind === 'boss') {
      this.screenShake = 6;
      const bossName = enemy.bossVariant ? BOSS_PROFILES[enemy.bossVariant].name : '首领';
      this.notification = `${bossName}已摧毁 · 最后的基地仍在运转`;
      this.notificationTimer = 4;
      if (enemy.bossVariant === 'hive') {
        for (let i = 0; i < 7; i += 1) this.spawnEnemy('spawn', false, 0, { x: enemy.x + randomRange(-75, 75), y: enemy.y + randomRange(-75, 75) });
      }
    }
    if (Math.random() < this.stats.killMetalChance) this.pickups.push({ id: this.id++, kind: 'metal', x: enemy.x, y: enemy.y, amount: 3 + Math.floor(this.day / 2), radius: 13, opened: false, pulse: 0 });
    if (enemy.kind !== 'boss' && Math.random() < .035) {
      const fieldItems: PickupKind[] = ['medkit', 'overdrive', 'shield', 'nanokit', 'emp'];
      this.pickups.push({ id: this.id++, kind: fieldItems[Math.floor(Math.random() * fieldItems.length)], x: enemy.x, y: enemy.y, amount: 1, radius: 14, opened: false, pulse: Math.random() * TAU });
    }
    if (Math.random() < this.stats.chainExplosion) this.explode(enemy.x, enemy.y, 88, 24 + this.day * 2, enemy.id);
    if (enemy.elite === 'split') {
      for (let i = 0; i < 2; i += 1) this.spawnEnemy('spawn', false, 0, { x: enemy.x + randomRange(-20, 20), y: enemy.y + randomRange(-20, 20) });
    }
  }

  private explode(x: number, y: number, radius: number, damage: number, ignoreId?: number) {
    this.audio.play('missile');
    this.screenShake = Math.max(this.screenShake, Math.min(6, radius / 15));
    this.burst(x, y, '#ff784c', Math.min(34, Math.floor(radius / 3)), radius * 1.7);
    for (const enemy of this.nearbyEnemies({ x, y }, radius)) {
      if (enemy.dead || enemy.id === ignoreId) continue;
      const dist = distance({ x, y }, enemy);
      if (dist < radius) this.damageEnemy(enemy, damage * (1 - dist / radius * .45), false);
    }
  }

  private updatePickups(dt: number) {
    const magnetRange = Math.max(270, this.stats.pickupRadius * 4);
    let collected: Pickup | null = null;
    for (const pickup of this.pickups) {
      pickup.pulse += dt;
      if (this.isManualPickup(pickup)) continue;
      const playerDistance = distance(this.player, pickup);
      const allyCanCollect = this.stats.companionUnlocked && this.companion.downTimer <= 0 && (pickup.kind === 'metal' || pickup.kind === 'energy');
      const allyDistance = allyCanCollect ? distance(this.companion, pickup) : Infinity;
      const collector = allyDistance < playerDistance ? this.companion : this.player;
      const dist = Math.min(playerDistance, allyDistance);
      if (dist < magnetRange && dist > 1) {
        const pull = 210 + (1 - dist / magnetRange) * 760;
        pickup.x += (collector.x - pickup.x) / dist * pull * dt;
        pickup.y += (collector.y - pickup.y) / dist * pull * dt;
      }
      if (dist < collector.radius + pickup.radius + 9) { collected = pickup; break; }
    }
    if (collected) this.collectPickup(collected);
  }

  private interact() {
    if (this.phase === 'upgrade' || this.phase === 'gameover') return;
    const pickup = this.nearestPickup(true);
    if (pickup && distance(this.player, pickup) <= this.stats.pickupRadius) {
      this.collectPickup(pickup);
      return;
    }
    const building = this.buildings.find(item => distance(this.player, item) < item.radius + 45);
    if (building) {
      this.selectedBuildingId = building.id;
      this.emitSnapshot();
    }
  }

  private collectPickup(pickup: Pickup) {
    const distanceFromBase = Math.hypot(pickup.x, pickup.y);
    const bonus = this.stats.pickupRadius > 100 ? 1.2 : 1;
    let metal = 0;
    let energy = 0;
    let label = '';
    let color = '#8fd5ff';
    if (pickup.kind === 'metal') metal = pickup.amount;
    if (pickup.kind === 'energy') energy = pickup.amount;
    if (pickup.kind === 'chest') { metal = pickup.amount + Math.floor(distanceFromBase / 150); energy = 3 + Math.floor(pickup.amount / 4); }
    if (pickup.kind === 'rare') { metal = pickup.amount; energy = Math.ceil(pickup.amount * .72); this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15); }
    if (pickup.kind === 'medkit') {
      const before = this.player.hp;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 38);
      label = `医疗注射 +${Math.ceil(this.player.hp - before)} HP`;
      color = '#66f2a7';
    }
    if (pickup.kind === 'overdrive') { this.overdriveTimer = Math.max(this.overdriveTimer, 12); label = '武器超频 · 12s'; color = '#ffb052'; }
    if (pickup.kind === 'shield') { this.shieldTimer = Math.max(this.shieldTimer, 10); label = '相位护盾 · 10s'; color = '#65dfff'; }
    if (pickup.kind === 'nanokit') {
      const repaired = Math.min(120, this.baseMaxHp - this.baseHp);
      this.baseHp = Math.min(this.baseMaxHp, this.baseHp + 120);
      for (const building of this.buildings) building.hp = Math.min(building.maxHp, building.hp + building.maxHp * .22);
      label = `纳米维修 · 基地 +${Math.ceil(repaired)}`;
      color = '#a5f4c1';
    }
    if (pickup.kind === 'emp') {
      let targets = 0;
      for (const enemy of this.enemies) {
        if (enemy.dead || distance(this.player, enemy) > 520) continue;
        targets += 1;
        enemy.slow = Math.max(enemy.slow, 4.5);
        this.damageEnemy(enemy, 64 + this.day * 5, false);
      }
      label = `EMP 脉冲 · 命中 ${targets}`;
      color = '#b78cff';
      this.burst(this.player.x, this.player.y, color, 38, 360);
    }
    metal = Math.floor(metal * bonus);
    energy = Math.floor(energy * bonus);
    this.metal += metal;
    this.energy += energy;
    if (!label) label = [metal ? `+${metal} 金属` : '', energy ? `+${energy} 能源` : ''].filter(Boolean).join(' · ');
    if (energy) color = '#ffe06a';
    this.floatTexts.push({ x: pickup.x, y: pickup.y - 16, value: label, color, life: 1.25, big: pickup.kind === 'rare' || !['metal', 'energy'].includes(pickup.kind) });
    this.audio.play('pickup');
    this.burst(pickup.x, pickup.y, color, pickup.kind === 'rare' ? 20 : 10, 95);
    this.pickups = this.pickups.filter(item => item.id !== pickup.id);
  }

  private isManualPickup(pickup: Pickup) {
    return pickup.kind === 'chest' || pickup.kind === 'rare';
  }

  private nearestPickup(manualOnly = false) {
    let nearest: Pickup | null = null;
    let nearestDistance = Infinity;
    for (const pickup of this.pickups) {
      if (manualOnly && !this.isManualPickup(pickup)) continue;
      const dist = distance(this.player, pickup);
      if (dist < nearestDistance) { nearestDistance = dist; nearest = pickup; }
    }
    return nearest;
  }

  private updateDrones(dt: number) {
    while (this.droneTimers.length < this.stats.droneCount) this.droneTimers.push(randomRange(0, .5));
    for (let i = 0; i < this.stats.droneCount; i += 1) {
      this.droneTimers[i] -= dt;
      if (this.droneTimers[i] > 0) continue;
      const angle = performance.now() / 950 + i / Math.max(1, this.stats.droneCount) * TAU;
      const orbitRadius = 54 + Math.min(24, this.stats.droneCount * 3);
      const origin = { x: this.player.x + Math.cos(angle) * orbitRadius, y: this.player.y + Math.sin(angle) * orbitRadius };
      const target = this.closestEnemy(origin, 360);
      if (target) {
        const shotAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
        this.projectiles.push({ id: this.id++, team: 'tower', kind: 'bullet', x: origin.x, y: origin.y, vx: Math.cos(shotAngle) * 700, vy: Math.sin(shotAngle) * 700, radius: 3, damage: 9 + this.day, life: .8, penetration: 0, explosive: false, hit: new Set() });
        this.muzzle(origin.x, origin.y, '#7fffd3');
        this.audio.play('tower');
      }
      this.droneTimers[i] = this.adminEnabled ? .08 : .72 / this.stats.droneFireRate;
    }
  }

  private updateParticles(dt: number) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(.08, dt);
      particle.vy *= Math.pow(.08, dt);
    }
    for (const text of this.floatTexts) { text.life -= dt; text.y -= dt * 30; }
    this.particles = this.particles.filter(particle => particle.life > 0).slice(-600);
    this.floatTexts = this.floatTexts.filter(text => text.life > 0).slice(-80);
  }

  private spawnEnemy(kind: EnemyKind, allowElite: boolean, radius?: number, position?: Vec2, bossVariant = this.currentBossVariant) {
    const configs: Record<EnemyKind, { hp: number; speed: number; damage: number; radius: number }> = {
      infected: { hp: 34, speed: 72, damage: 11, radius: 17 },
      charger: { hp: 28, speed: 132, damage: 15, radius: 14 },
      armored: { hp: 148, speed: 43, damage: 22, radius: 25 },
      ranged: { hp: 58, speed: 56, damage: 10, radius: 19 },
      bomber: { hp: 46, speed: 84, damage: 34, radius: 20 },
      leaper: { hp: 72, speed: 92, damage: 18, radius: 21 },
      stalker: { hp: 44, speed: 118, damage: 14, radius: 16 },
      medic: { hp: 76, speed: 54, damage: 8, radius: 20 },
      crusher: { hp: 235, speed: 38, damage: 32, radius: 30 },
      phase: { hp: 64, speed: 96, damage: 17, radius: 18 },
      siphon: { hp: 102, speed: 60, damage: 12, radius: 21 },
      jammer: { hp: 176, speed: 45, damage: 14, radius: 25 },
      boss: BOSS_PROFILES[bossVariant],
      spawn: { hp: 20 + this.day * 2, speed: 104, damage: 8, radius: 11 },
    };
    const config = configs[kind];
    const angle = Math.random() * TAU;
    const point = position || (radius === undefined ? this.randomBoundaryPoint(kind === 'boss' ? 110 : 38) : { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    let elite: EliteAffix | undefined;
    if (allowElite && this.day >= 6 && Math.random() < Math.min(.32, .06 + this.day * .018)) {
      elite = (['frenzy', 'armor', 'shock', 'split'] as EliteAffix[])[Math.floor(Math.random() * 4)];
    }
    const healthScale = (1 + Math.max(0, this.day - 1) * .105) * DIFFICULTIES[this.difficulty].health;
    const bossHealth = kind === 'boss' ? Math.min(1.35, .3 + this.day * .1) : 1;
    const bossDamage = kind === 'boss' ? Math.min(1.38, .55 + this.day * .07) : 1;
    const bossSpeed = kind === 'boss' ? Math.min(1.12, .82 + this.day * .035) : 1;
    const bossSize = kind === 'boss' ? Math.min(1, .7 + this.day * .04) : 1;
    const enemy: Enemy = {
      id: this.id++, kind, bossVariant: kind === 'boss' ? bossVariant : undefined, elite, x: point.x, y: point.y, vx: 0, vy: 0, radius: config.radius * bossSize,
      hp: config.hp * healthScale * bossHealth, maxHp: config.hp * healthScale * bossHealth, speed: config.speed * bossSpeed * (elite === 'frenzy' ? 1.45 : 1),
      damage: config.damage * bossDamage * (1 + Math.max(0, this.day - 1) * .055) * DIFFICULTIES[this.difficulty].damage, attackCooldown: randomRange(.1, .8), fireTimer: randomRange(.4, 1.4), flash: 0, slow: 0, dead: false, specialTimer: kind === 'boss' ? 6.6 : 3.8,
    };
    if (elite === 'armor') { enemy.hp *= 1.45; enemy.maxHp = enemy.hp; }
    this.enemies.push(enemy);
    this.maybeShowEnemyIntro(enemy);
  }

  private randomBoundaryPoint(inset: number): Vec2 {
    const half = WORLD_SIZE / 2 - inset;
    const along = randomRange(-half, half);
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return { x: along, y: -half };
    if (side === 1) return { x: half, y: along };
    if (side === 2) return { x: along, y: half };
    return { x: -half, y: along };
  }

  private spawnResources(day: number) {
    const count = Math.floor((42 + Math.min(24, day * 4)) * DIFFICULTIES[this.difficulty].resources);
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * TAU;
      const radius = randomRange(210, WORLD_SIZE * .46);
      const risk = radius / (WORLD_SIZE * .46);
      let kind: PickupKind = Math.random() < .65 ? 'metal' : 'energy';
      const itemRoll = Math.random();
      if (itemRoll < .075) kind = 'chest';
      else if (risk > .72 && itemRoll < .115) kind = 'rare';
      else if (itemRoll < .14) kind = 'medkit';
      else if (itemRoll < .165) kind = 'overdrive';
      else if (itemRoll < .19) kind = 'shield';
      else if (itemRoll < .212) kind = 'nanokit';
      else if (itemRoll < .23) kind = 'emp';
      const baseAmount = kind === 'metal' ? randomRange(4, 8) : randomRange(2, 5);
      const amount = ['metal', 'energy', 'chest'].includes(kind) ? Math.max(1, Math.floor(baseAmount * (1 + risk * 1.25) * DIFFICULTIES[this.difficulty].resources)) : 1;
      this.pickups.push({ id: this.id++, kind, x: Math.cos(angle) * radius + randomRange(-80, 80), y: Math.sin(angle) * radius + randomRange(-80, 80), amount: kind === 'rare' ? 16 + day * 2 : amount, radius: kind === 'chest' || kind === 'rare' ? 22 : 13, opened: false, pulse: Math.random() * TAU });
    }
  }

  private generateEnvironment() {
    const kinds: EnvironmentProp['kind'][] = ['car', 'rock', 'container', 'ruin', 'lamp', 'wreck'];
    let seed = 1337;
    const seeded = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    for (let index = 0; index < 230; index += 1) {
      const angle = seeded() * TAU;
      const radius = 260 + seeded() * (WORLD_SIZE * .47 - 260);
      this.props.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, kind: kinds[Math.floor(seeded() * kinds.length)], size: 16 + seeded() * 34, rot: seeded() * TAU });
    }
  }

  private tryBuild() {
    if (!this.buildKind) return;
    const kind = this.buildKind;
    const config = BUILDINGS[kind];
    if (!this.canBuildAt(this.mouse.worldX, this.mouse.worldY, config.radius)) {
      this.notification = '此处无法建造';
      this.notificationTimer = 1;
      return;
    }
    if (this.metal < config.metal || this.energy < config.energy) {
      this.notification = `资源不足 · 需要 🔩${config.metal} ⚡${config.energy}`;
      this.notificationTimer = 2;
      return;
    }
    this.metal -= config.metal;
    this.energy -= config.energy;
    const building: Building = { id: this.id++, kind, x: this.mouse.worldX, y: this.mouse.worldY, radius: config.radius, hp: config.hp, maxHp: config.hp, level: 1, cooldown: randomRange(0, .25), angle: 0, flash: 0 };
    this.buildings.push(building);
    this.built += 1;
    this.audio.play('build');
    this.burst(building.x, building.y, config.color, 20, 120);
    this.emitSnapshot();
  }

  private canBuildAt(x: number, y: number, radius: number) {
    const baseDistance = Math.hypot(x, y);
    if (baseDistance > BUILD_RADIUS || baseDistance < BASE_RADIUS + radius + 24) return false;
    if (distance({ x, y }, this.player) < radius + this.player.radius + 8) return false;
    return !this.buildings.some(building => distance({ x, y }, building) < radius + building.radius + 12);
  }

  private findBuildingAt(x: number, y: number) {
    return this.buildings.find(building => distance({ x, y }, building) < building.radius + 9) || null;
  }

  private closestEnemy(origin: Vec2, range: number) {
    let nearest: Enemy | null = null;
    let nearestDistance = range;
    for (const enemy of this.nearbyEnemies(origin, range)) {
      if (enemy.dead) continue;
      const dist = distance(origin, enemy);
      if (dist < nearestDistance) { nearestDistance = dist; nearest = enemy; }
    }
    return nearest;
  }

  private gridKey(x: number, y: number) {
    return `${Math.floor(x / this.enemyGridSize)},${Math.floor(y / this.enemyGridSize)}`;
  }

  private rebuildEnemyGrid() {
    this.enemyGrid.clear();
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const key = this.gridKey(enemy.x, enemy.y);
      const cell = this.enemyGrid.get(key);
      if (cell) cell.push(enemy);
      else this.enemyGrid.set(key, [enemy]);
    }
  }

  private nearbyEnemies(origin: Vec2, radius: number) {
    if (radius >= WORLD_SIZE) return this.enemies;
    const result: Enemy[] = [];
    const minX = Math.floor((origin.x - radius) / this.enemyGridSize);
    const maxX = Math.floor((origin.x + radius) / this.enemyGridSize);
    const minY = Math.floor((origin.y - radius) / this.enemyGridSize);
    const maxY = Math.floor((origin.y + radius) / this.enemyGridSize);
    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        const cell = this.enemyGrid.get(`${x},${y}`);
        if (cell) result.push(...cell);
      }
    }
    return result;
  }

  private maybeShowEnemyIntro(enemy: Enemy) {
    if (this.enemyIntro || enemy.kind === 'infected' || enemy.kind === 'spawn') return;
    const intro = enemyIntroFor(enemy.kind, enemy.bossVariant);
    if (!intro || this.seenEnemyIntros.has(intro.key)) return;
    this.seenEnemyIntros.add(intro.key);
    this.enemyIntro = intro;
    this.paused = true;
    this.keys.clear();
    this.mouse.down = false;
    this.cancelRecall();
    this.audio.play(enemy.kind === 'boss' ? 'boss' : 'alarm');
    this.emitSnapshot();
  }

  private buildingUpgradeCost(building: Building) {
    return Math.ceil(BUILDINGS[building.kind].metal * .55 + building.level * 24);
  }

  private demolitionRefund(building: Building) {
    const config = BUILDINGS[building.kind];
    let upgradeInvestment = 0;
    for (let level = 1; level < building.level; level += 1) upgradeInvestment += Math.ceil(config.metal * .55 + level * 24);
    return {
      metal: Math.floor(config.metal * .6 + upgradeInvestment * .35),
      energy: Math.floor(config.energy * .6),
    };
  }

  private triggerGameOver() {
    if (this.adminEnabled) { this.baseHp = this.baseMaxHp; return; }
    if (this.phase === 'gameover') return;
    this.baseHp = 0;
    this.phase = 'gameover';
    this.recallCharging = false;
    this.recallCharge = 0;
    this.gameOverTimer = 1;
    this.gameOverReady = false;
    this.mouse.down = false;
    this.audio.play('boss');
    this.screenShake = 12;
    this.burst(0, 0, '#ff6b4a', 90, 450);
    this.emitSnapshot();
  }

  private emitSnapshot() {
    const selected = this.buildings.find(item => item.id === this.selectedBuildingId);
    const config = selected ? BUILDINGS[selected.kind] : null;
    const bosses = this.enemies.filter(enemy => enemy.kind === 'boss' && !enemy.dead);
    const bossHp = bosses.reduce((total, boss) => total + boss.hp, 0);
    const bossMaxHp = bosses.reduce((total, boss) => total + boss.maxHp, 0);
    const nearPickup = this.nearestPickup(true);
    const nearBuilding = this.buildings.find(item => distance(this.player, item) < item.radius + 70);
    let warning = '';
    let prompt = '';
    if (this.baseAlarm > 0) warning = '⚠ 基地正在遭受攻击';
    else if (this.bossIntro > 0) warning = this.bossIntro > 1.25 ? '⚠ WARNING' : `BOSS · ${BOSS_PROFILES[this.currentBossVariant].name}`;
    else if (this.phase === 'day' && this.phaseTime <= 5) warning = `${Math.max(1, Math.ceil(this.phaseTime))}`;
    else if (this.phase === 'day' && this.phaseTime <= 10) warning = '夜幕即将降临';
    else if (this.notificationTimer > 0) warning = this.notification;

    if (this.buildMode) prompt = '左键建造 · 右键取消';
    else if (nearPickup && distance(this.player, nearPickup) <= this.stats.pickupRadius) {
      const names: Partial<Record<PickupKind, string>> = { chest: '废土宝箱', rare: '稀有能源核心' };
      prompt = `E · 开启 ${names[nearPickup.kind] || '空投物资'}`;
    } else if (Math.hypot(this.player.x, this.player.y) < BASE_RADIUS + 82 && this.player.hp < this.player.maxHp && this.healLockout <= 0) prompt = '基地医疗圈 · 正在恢复生命';
    else if (this.tutorialTime < 6) prompt = 'WASD 移动 · 鼠标瞄准 · 左键射击';
    else if (this.tutorialTime < 12) prompt = '资源与战场道具会自动吸附 · 宝箱按 E 开启';
    else if (this.tutorialTime < 17) prompt = '按住 V 近战连击 · 空格冲刺 · 长按 R 归航';
    else if (this.tutorialTime < 22) prompt = '守住第一夜后，可在强化中招募战术人机';
    else if (nearBuilding && !this.buildMode) prompt = '右键炮台 · 升级 / 修复 / 拆除';
    else if (Math.hypot(this.player.x, this.player.y) < BUILD_RADIUS + 80 && !this.buildMode) prompt = 'B · 接入基地建造网络';

    const statusEffects: StatusEffect[] = [];
    if (this.overdriveTimer > 0) statusEffects.push({ label: '武器超频', time: this.overdriveTimer, color: '#ffad58', icon: '»' });
    if (this.shieldTimer > 0) statusEffects.push({ label: '相位护盾', time: this.shieldTimer, color: '#69e8ff', icon: '◇' });
    if (this.operatorBoostTimer > 0) statusEffects.push({ label: '猎杀超频', time: this.operatorBoostTimer, color: OPERATORS.ranger.color, icon: '⌁' });
    if (Math.hypot(this.player.x, this.player.y) < BASE_RADIUS + 82 && this.player.hp < this.player.maxHp && this.healLockout <= 0) statusEffects.push({ label: '医疗恢复', time: 0, color: '#68efaa', icon: '+' });

    this.onSnapshot({
      phase: this.phase, day: this.day, phaseTime: Math.max(0, this.phaseTime), metal: this.metal, energy: this.energy,
      baseHp: Math.max(0, this.baseHp), baseMaxHp: this.baseMaxHp, playerHp: Math.max(0, this.player.hp), playerMaxHp: this.player.maxHp,
      companionHp: Math.max(0, this.companion.hp), companionMaxHp: this.companion.maxHp,
      companionDown: this.companion.downTimer > 0, companionReboot: this.companion.downTimer, companionUnlocked: this.stats.companionUnlocked, companionLevel: this.stats.companionLevel,
      aiCommand: this.aiCommand, aiCommandOpen: this.aiCommandOpen, aiPersonality: this.settings.aiPersonality, aiReply: this.aiReplyTimer > 0 ? this.aiReply : '',
      dashCooldown: this.player.dashCooldown, dashCooldownMax: this.stats.dashCooldown, recallCooldown: this.recallCooldown, recallCooldownMax: RECALL_COOLDOWN,
      recallCharge: this.recallCharge, recallChargeMax: RECALL_CHANNEL_TIME, recallCharging: this.recallCharging, kills: this.kills, built: this.built,
      warning, prompt, buildMode: this.buildMode, buildKind: this.buildKind, weapon: this.player.weapon, operator: this.operator,
      operatorSkillCooldown: this.operatorSkillCooldown, operatorSkillCooldownMax: this.operatorSkillCooldownMax(),
      scatterUnlocked: this.stats.scatterUnlocked, arcUnlocked: this.stats.arcUnlocked, railUnlocked: this.stats.railUnlocked, upgradeChoices: this.upgradeChoices,
      bossHp, bossMaxHp, bossName: bosses.length > 1 ? `多重首领 ×${bosses.length}` : bosses[0]?.bossVariant ? BOSS_PROFILES[bosses[0].bossVariant].name : '', enemyIntro: this.enemyIntro, gameOverReady: this.gameOverReady,
      adminEnabled: this.adminEnabled,
      debugOpen: this.debugOpen, easterEggs: [...this.easterEggs], enemyCount: this.enemies.length, droneCount: this.stats.droneCount,
      projectileCount: this.projectiles.length, fps: Math.round(this.fps), difficulty: this.difficulty, paused: this.paused, settings: this.settings, statusEffects,
      selectedBuilding: selected && config ? {
        id: selected.id, kind: selected.kind, name: config.name, level: selected.level, hp: selected.hp, maxHp: selected.maxHp,
        damage: selected.kind === 'repair' ? `维修 ${Math.round((.045 + selected.level * .012) * 100)}%` : config.damage ? `${Math.round(config.damage * (1 + (selected.level - 1) * .3))}` : '—',
        rate: selected.kind === 'repair' ? `${(1 / (config.rate * this.stats.towerFireRate)).toFixed(1)}s/次` : config.rate ? `${(config.rate * this.stats.towerFireRate).toFixed(1)}/s` : selected.kind === 'generator' ? `+${Math.round(this.stats.generatorYield * (1 + (selected.level - 1) * .5))}⚡/夜` : '—',
        upgradeCost: this.buildingUpgradeCost(selected), canUpgrade: selected.level < 3,
        refundMetal: this.demolitionRefund(selected).metal, refundEnergy: this.demolitionRefund(selected).energy,
        demolishArmed: this.demolishArmedId === selected.id,
      } : null,
    });
  }

  private burst(x: number, y: number, color: string, count: number, speed: number) {
    const densityCount = this.settings.particles <= 0 ? 0 : Math.max(1, Math.round(count * this.settings.particles / 100));
    for (let i = 0; i < densityCount; i += 1) {
      const angle = Math.random() * TAU;
      const velocity = Math.random() * speed;
      const life = randomRange(.25, .75);
      this.particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, maxLife: life, size: randomRange(2, 7), color, glow: true });
    }
  }

  private hitParticles(x: number, y: number, color: string, count: number) { this.burst(x, y, color, count, 90); }

  private muzzle(x: number, y: number, color: string) {
    for (let i = 0; i < 3; i += 1) this.particles.push({ x, y, vx: randomRange(-35, 35), vy: randomRange(-35, 35), life: .12, maxLife: .12, size: randomRange(3, 7), color, glow: true });
  }

  private arcParticles(from: Vec2, to: Vec2) {
    const segments = 13;
    for (let i = 0; i <= segments; i += 1) {
      const ratio = i / segments;
      const edge = i === 0 || i === segments ? 0 : randomRange(-8, 8);
      this.particles.push({ x: from.x + (to.x - from.x) * ratio + edge, y: from.y + (to.y - from.y) * ratio + randomRange(-6, 6), vx: 0, vy: 0, life: .18, maxLife: .18, size: i % 2 ? 3.2 : 2, color: i % 3 ? '#8ef5ff' : '#f2ffff', glow: true });
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const night = (this.phase === 'night' || this.phase === 'upgrade' || this.phase === 'gameover') && !this.easterEggs.has('lux');
    ctx.fillStyle = night ? '#080d16' : '#27231d';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.save();
    const shakeAmount = this.screenShake * this.settings.shake / 100;
    const shakeX = shakeAmount ? randomRange(-shakeAmount, shakeAmount) : 0;
    const shakeY = shakeAmount ? randomRange(-shakeAmount, shakeAmount) : 0;
    ctx.translate(this.width / 2 - this.camera.x + shakeX, this.height / 2 - this.camera.y + shakeY);
    this.drawGround(night);
    this.drawProps();
    this.drawPickups();
    this.drawBase(night);
    this.drawBuildings();
    this.drawEnemies();
    this.drawProjectiles();
    this.drawCompanion();
    this.drawPlayer();
    this.drawDrones();
    this.drawParticles();
    if (this.buildMode && this.buildKind) this.drawBuildPreview();
    this.drawFloatTexts();
    ctx.restore();

    if (night) {
      const gradient = ctx.createRadialGradient(this.width / 2, this.height / 2, Math.min(this.width, this.height) * .2, this.width / 2, this.height / 2, Math.max(this.width, this.height) * .75);
      gradient.addColorStop(0, 'rgba(4,10,22,0)');
      gradient.addColorStop(1, this.phase === 'gameover' ? 'rgba(70,0,0,.7)' : 'rgba(1,5,15,.56)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    if (this.baseAlarm > 0 || this.player.hurtTimer > 0) {
      const alpha = Math.min(.36, (this.baseAlarm + this.player.hurtTimer) * .28);
      const red = ctx.createRadialGradient(this.width / 2, this.height / 2, Math.min(this.width, this.height) * .3, this.width / 2, this.height / 2, Math.max(this.width, this.height) * .72);
      red.addColorStop(0, 'rgba(255,0,0,0)'); red.addColorStop(1, `rgba(255,37,31,${alpha})`);
      ctx.fillStyle = red; ctx.fillRect(0, 0, this.width, this.height);
    }
    this.drawAimCursor();
  }

  private drawAimCursor() {
    if (!this.mouse.inside || this.phase === 'gameover') return;
    const ctx = this.ctx;
    let color = '#f2a35f';
    if (this.buildMode && this.buildKind) {
      const config = BUILDINGS[this.buildKind];
      const valid = this.canBuildAt(this.mouse.worldX, this.mouse.worldY, config.radius) && this.metal >= config.metal && this.energy >= config.energy;
      color = valid ? '#74edb5' : '#ff6d64';
    }
    const pressed = this.mouse.down ? .84 : 1;
    const radius = 15 * pressed;
    const rotation = performance.now() / 2100;
    ctx.save(); ctx.translate(this.mouse.x, this.mouse.y);
    ctx.strokeStyle = '#061014cc'; ctx.lineWidth = 5;
    for (let i = 0; i < 4; i += 1) {
      const angle = rotation + i * Math.PI / 2;
      ctx.beginPath(); ctx.arc(0, 0, radius + 2, angle - .22, angle + .22); ctx.stroke();
    }
    ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const angle = rotation + i * Math.PI / 2;
      ctx.beginPath(); ctx.arc(0, 0, radius + 2, angle - .22, angle + .22); ctx.stroke();
    }
    ctx.rotate(-rotation * .55);
    ctx.strokeStyle = '#f4f1e8'; ctx.shadowBlur = 3; ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -radius - 7); ctx.lineTo(0, -radius + 1); ctx.stroke();
    }
    ctx.fillStyle = color; ctx.shadowBlur = 9; ctx.beginPath(); ctx.arc(0, 0, this.mouse.down ? 2.8 : 2.1, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }

  private visible(x: number, y: number, margin = 100) {
    return Math.abs(x - this.camera.x) < this.width / 2 + margin && Math.abs(y - this.camera.y) < this.height / 2 + margin;
  }

  private drawGround(night: boolean) {
    const ctx = this.ctx;
    const half = WORLD_SIZE / 2;
    ctx.fillStyle = night ? '#101722' : '#373229';
    ctx.fillRect(-half, -half, WORLD_SIZE, WORLD_SIZE);
    ctx.strokeStyle = night ? '#27334233' : '#6b5b4030';
    ctx.lineWidth = 1;
    const grid = 100;
    const left = Math.floor((this.camera.x - this.width / 2 - 100) / grid) * grid;
    const right = this.camera.x + this.width / 2 + 100;
    const top = Math.floor((this.camera.y - this.height / 2 - 100) / grid) * grid;
    const bottom = this.camera.y + this.height / 2 + 100;
    for (let x = left; x < right; x += grid) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); }
    for (let y = top; y < bottom; y += grid) { ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); }
    ctx.fillStyle = night ? '#9f24320c' : '#a85d2c0b';
    const dangerDepth = 260;
    ctx.fillRect(-half, -half, WORLD_SIZE, dangerDepth);
    ctx.fillRect(-half, half - dangerDepth, WORLD_SIZE, dangerDepth);
    ctx.fillRect(-half, -half + dangerDepth, dangerDepth, WORLD_SIZE - dangerDepth * 2);
    ctx.fillRect(half - dangerDepth, -half + dangerDepth, dangerDepth, WORLD_SIZE - dangerDepth * 2);
    ctx.strokeStyle = night ? '#6d39414a' : '#79604342';
    ctx.lineWidth = 86;
    ctx.beginPath(); ctx.moveTo(-half, 0); ctx.lineTo(half, 0); ctx.moveTo(0, -half); ctx.lineTo(0, half); ctx.stroke();
    ctx.strokeStyle = night ? '#b05d6b46' : '#d2a66b3d';
    ctx.lineWidth = 2; ctx.setLineDash([24, 31]);
    ctx.beginPath(); ctx.moveTo(-half, 0); ctx.lineTo(half, 0); ctx.moveTo(0, -half); ctx.lineTo(0, half); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = night ? '#253d4e66' : '#7f684955'; ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(-half, half * .58); ctx.lineTo(half, -half * .58); ctx.stroke();
    ctx.strokeStyle = night ? '#e5575740' : '#d3844530'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 950, 0, TAU); ctx.stroke();
    ctx.fillStyle = night ? '#e5575709' : '#b5672c09'; ctx.beginPath(); ctx.arc(0, 0, 1200, 0, TAU); ctx.arc(0, 0, 950, 0, TAU, true); ctx.fill();
    ctx.strokeStyle = '#ff725568'; ctx.lineWidth = 8; ctx.setLineDash([44, 18]); ctx.strokeRect(-half, -half, WORLD_SIZE, WORLD_SIZE); ctx.setLineDash([]);
    ctx.fillStyle = night ? '#ff6558' : '#d8894f'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
    for (const [x, y, w, h] of [[-90, -half, 180, 16], [-90, half - 16, 180, 16], [-half, -90, 16, 180], [half - 16, -90, 16, 180]]) ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  private drawProps() {
    const ctx = this.ctx;
    for (const prop of this.props) {
      if (!this.visible(prop.x, prop.y, 80)) continue;
      ctx.save(); ctx.translate(prop.x, prop.y); ctx.rotate(prop.rot);
      if (prop.kind === 'rock') { ctx.fillStyle = '#34383b'; ctx.beginPath(); ctx.moveTo(-prop.size, 4); ctx.lineTo(-prop.size * .3, -prop.size * .55); ctx.lineTo(prop.size * .7, -prop.size * .25); ctx.lineTo(prop.size, prop.size * .5); ctx.lineTo(-prop.size * .4, prop.size * .6); ctx.closePath(); ctx.fill(); }
      else if (prop.kind === 'car') { ctx.fillStyle = '#3e3e3c'; ctx.fillRect(-prop.size, -prop.size * .42, prop.size * 2, prop.size * .84); ctx.fillStyle = '#1a2024'; ctx.fillRect(-prop.size * .35, -prop.size * .44, prop.size * .82, prop.size * .88); ctx.fillStyle = '#a748364d'; ctx.fillRect(prop.size * .72, -prop.size * .3, 5, 7); }
      else if (prop.kind === 'container') { ctx.fillStyle = '#403d3a'; ctx.fillRect(-prop.size, -prop.size * .5, prop.size * 2, prop.size); ctx.strokeStyle = '#81705a42'; for (let x = -prop.size * .7; x < prop.size; x += 8) { ctx.beginPath(); ctx.moveTo(x, -prop.size * .5); ctx.lineTo(x, prop.size * .5); ctx.stroke(); } }
      else if (prop.kind === 'ruin') { ctx.fillStyle = '#292d30'; ctx.fillRect(-prop.size, -prop.size, prop.size * 1.6, prop.size * .25); ctx.fillRect(-prop.size, -prop.size, prop.size * .28, prop.size * 1.7); }
      else if (prop.kind === 'lamp') { ctx.strokeStyle = '#555c61'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, prop.size); ctx.lineTo(0, -prop.size); ctx.stroke(); ctx.fillStyle = this.phase === 'night' ? '#ffd480' : '#776952'; ctx.shadowColor = '#ffb44e'; ctx.shadowBlur = this.phase === 'night' ? 18 : 0; ctx.fillRect(-5, -prop.size - 4, 10, 7); }
      else { ctx.fillStyle = '#302d2c'; ctx.fillRect(-prop.size, -4, prop.size * 2, 8); ctx.fillRect(-4, -prop.size * .6, 8, prop.size * 1.2); }
      ctx.restore();
    }
  }

  private drawBase(night: boolean) {
    const ctx = this.ctx;
    if (!this.visible(0, 0, 210)) return;
    ctx.save();
    const time = performance.now();
    const pulse = 1 + Math.sin(time / 420) * .045;
    const coreColor = this.baseAlarm > 0 ? '#ff5148' : '#ffad52';
    const groundGlow = ctx.createRadialGradient(0, 0, 18, 0, 0, 175);
    groundGlow.addColorStop(0, this.baseAlarm > 0 ? '#ff49333d' : '#ff9c3a33');
    groundGlow.addColorStop(.55, night ? '#e8812720' : '#d98d2014');
    groundGlow.addColorStop(1, '#0000');
    ctx.fillStyle = groundGlow; ctx.beginPath(); ctx.arc(0, 0, 175, 0, TAU); ctx.fill();

    ctx.strokeStyle = '#62e0bb35'; ctx.lineWidth = 2; ctx.setLineDash([10, 12]);
    ctx.beginPath(); ctx.arc(0, 0, BASE_RADIUS + 82, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#172028'; ctx.strokeStyle = '#52616b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 98, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2e3d46'; ctx.lineWidth = 12; ctx.setLineDash([32, 19]);
    ctx.beginPath(); ctx.arc(0, 0, 87, 0, TAU); ctx.stroke(); ctx.setLineDash([]);

    ctx.save(); ctx.rotate(time / 8000);
    for (let i = 0; i < 6; i += 1) {
      const angle = i / 6 * TAU;
      ctx.save(); ctx.rotate(angle); ctx.translate(118, 0);
      ctx.fillStyle = '#29343c'; ctx.strokeStyle = '#70808a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-18, -11); ctx.lineTo(15, -7); ctx.lineTo(22, 0); ctx.lineTo(15, 7); ctx.lineTo(-18, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = i % 2 ? '#5fe8c2' : coreColor; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10; ctx.fillRect(6, -2, 10, 4);
      ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle = '#0d151b'; ctx.strokeStyle = '#88969d'; ctx.lineWidth = 5;
    ctx.beginPath(); for (let i = 0; i < 6; i += 1) { const a = i / 6 * TAU; traceVertex(ctx, i, Math.cos(a) * 69, Math.sin(a) * 69); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = coreColor; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 52, 0, TAU); ctx.stroke();
    ctx.fillStyle = coreColor; ctx.shadowColor = coreColor; ctx.shadowBlur = night ? 34 : 22;
    ctx.beginPath(); for (let i = 0; i < 6; i += 1) { const a = i / 6 * TAU; traceVertex(ctx, i, Math.cos(a) * 34 * pulse, Math.sin(a) * 34 * pulse); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff4d0'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(-8, -9, 8, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawPickups() {
    const ctx = this.ctx;
    for (const pickup of this.pickups) {
      if (!this.visible(pickup.x, pickup.y, 50)) continue;
      const pulse = 1 + Math.sin(pickup.pulse * 3) * .1;
      ctx.save(); ctx.translate(pickup.x, pickup.y); ctx.scale(pulse, pulse);
      if (pickup.kind === 'metal') { ctx.fillStyle = '#84bdd0'; ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.fillStyle = '#d9f2f5'; ctx.fillRect(-3, -9, 6, 18); }
      if (pickup.kind === 'energy') { ctx.fillStyle = '#ffd85c'; ctx.shadowColor = '#ffd85c'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(3, -14); ctx.lineTo(-8, 2); ctx.lineTo(-1, 2); ctx.lineTo(-4, 14); ctx.lineTo(10, -4); ctx.lineTo(2, -4); ctx.closePath(); ctx.fill(); }
      if (pickup.kind === 'chest') { ctx.fillStyle = '#8a6744'; ctx.fillRect(-17, -11, 34, 24); ctx.fillStyle = '#d49e53'; ctx.fillRect(-17, -3, 34, 5); ctx.fillRect(-3, -11, 6, 24); }
      if (pickup.kind === 'rare') { ctx.fillStyle = '#9c7bff'; ctx.shadowColor = '#8a60ff'; ctx.shadowBlur = 26; ctx.rotate(Math.PI / 4); ctx.fillRect(-14, -14, 28, 28); ctx.fillStyle = '#e8ddff'; ctx.fillRect(-5, -5, 10, 10); }
      if (pickup.kind === 'medkit') { ctx.fillStyle = '#143d32'; ctx.strokeStyle = '#66f2a7'; ctx.lineWidth = 2; ctx.fillRect(-12, -10, 24, 20); ctx.strokeRect(-12, -10, 24, 20); ctx.fillStyle = '#8affbd'; ctx.fillRect(-3, -7, 6, 14); ctx.fillRect(-8, -2, 16, 5); }
      if (pickup.kind === 'overdrive') { ctx.fillStyle = '#ff9e42'; ctx.shadowColor = '#ff8b32'; ctx.shadowBlur = 14; for (const offset of [-7, 4]) { ctx.beginPath(); ctx.moveTo(offset - 5, -10); ctx.lineTo(offset + 6, 0); ctx.lineTo(offset - 5, 10); ctx.lineTo(offset, 0); ctx.closePath(); ctx.fill(); } }
      if (pickup.kind === 'shield') { ctx.fillStyle = '#163d4a'; ctx.strokeStyle = '#66e8ff'; ctx.shadowColor = '#66e8ff'; ctx.shadowBlur = 14; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(12, -8); ctx.lineTo(9, 8); ctx.lineTo(0, 15); ctx.lineTo(-9, 8); ctx.lineTo(-12, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if (pickup.kind === 'nanokit') { ctx.fillStyle = '#9fe4bd'; ctx.shadowColor = '#75dca0'; ctx.shadowBlur = 12; ctx.fillRect(-3, -12, 6, 24); ctx.fillRect(-11, -3, 22, 6); ctx.strokeStyle = '#173a2d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 11, .25, 1.3); ctx.stroke(); }
      if (pickup.kind === 'emp') { ctx.strokeStyle = '#c599ff'; ctx.shadowColor = '#a46bff'; ctx.shadowBlur = 16; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#eee3ff'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }

  private drawBuildings() {
    const ctx = this.ctx;
    for (const building of this.buildings) {
      if (!this.visible(building.x, building.y, 80)) continue;
      const config = BUILDINGS[building.kind];
      ctx.save(); ctx.translate(building.x, building.y);
      if (building.id === this.selectedBuildingId) {
        ctx.strokeStyle = this.demolishArmedId === building.id ? '#ff695f' : '#fff0a8'; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.arc(0, 0, building.radius + 12, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        if (config.range) { ctx.strokeStyle = `${config.color}26`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, config.range, 0, TAU); ctx.stroke(); }
      }
      ctx.fillStyle = building.flash > 0 ? '#f7ffff' : '#111a21'; ctx.strokeStyle = '#53636e'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let i = 0; i < 8; i += 1) { const a = i / 8 * TAU + Math.PI / 8; traceVertex(ctx, i, Math.cos(a) * building.radius, Math.sin(a) * building.radius); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = config.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, building.radius - 6, 0, TAU); ctx.stroke();
      for (let i = 0; i < 4; i += 1) { const a = i / 4 * TAU + Math.PI / 4; ctx.fillStyle = '#7d8990'; ctx.fillRect(Math.cos(a) * (building.radius - 4) - 3, Math.sin(a) * (building.radius - 4) - 3, 6, 6); }

      if (building.kind === 'wall') {
        ctx.rotate(Math.PI / 4); ctx.fillStyle = '#66737b'; ctx.strokeStyle = '#a5b0b4'; ctx.lineWidth = 2; ctx.fillRect(-27, -19, 54, 38); ctx.strokeRect(-27, -19, 54, 38);
        ctx.fillStyle = '#28323a'; for (let x = -20; x <= 16; x += 12) ctx.fillRect(x, -18, 6, 36);
        ctx.fillStyle = '#d98b4f'; ctx.fillRect(-25, -3, 50, 6);
      } else if (building.kind === 'generator') {
        ctx.save(); ctx.rotate(performance.now() / 1400); ctx.strokeStyle = '#f2d561'; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.fillStyle = '#f7dd67'; ctx.shadowColor = '#f2d561'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(4, -16); ctx.lineTo(-8, 1); ctx.lineTo(-1, 1); ctx.lineTo(-5, 16); ctx.lineTo(12, -5); ctx.lineTo(3, -5); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      } else if (building.kind === 'repair') {
        ctx.save(); ctx.rotate(performance.now() / 1900); ctx.strokeStyle = '#6df0ad'; ctx.lineWidth = 3; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.fillStyle = '#173d31'; ctx.strokeStyle = '#83f4bb'; ctx.lineWidth = 2; ctx.fillRect(-12, -12, 24, 24); ctx.strokeRect(-12, -12, 24, 24); ctx.fillStyle = '#8affc2'; ctx.fillRect(-3, -9, 6, 18); ctx.fillRect(-9, -3, 18, 6);
      } else {
        ctx.save(); ctx.rotate(building.angle);
        if (building.kind === 'gun') {
          ctx.fillStyle = '#8b9aa2'; ctx.fillRect(-3, -10, 23, 20); ctx.fillStyle = config.color; ctx.fillRect(13, -8, 22, 5); ctx.fillRect(13, 3, 22, 5); ctx.fillStyle = '#202b31'; ctx.fillRect(22, -8, 5, 16);
        } else if (building.kind === 'freeze') {
          ctx.strokeStyle = '#a8f4ff'; ctx.lineWidth = 4; for (let i = 0; i < 4; i += 1) { const a = i / 4 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.stroke(); }
          ctx.fillStyle = '#7eeaff'; ctx.shadowColor = '#6fe7ff'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(11, 0); ctx.lineTo(0, 13); ctx.lineTo(-11, 0); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
        } else if (building.kind === 'tesla') {
          ctx.strokeStyle = '#8ef4ff'; ctx.shadowColor = '#68eaff'; ctx.shadowBlur = 14; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(9, 0, 12, -.9, .9); ctx.stroke(); ctx.beginPath(); ctx.arc(9, 0, 6, -.9, .9); ctx.stroke(); ctx.fillStyle = '#b7fbff'; ctx.beginPath(); ctx.arc(19, 0, 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#8a969d'; ctx.fillRect(-5, -14, 27, 28);
          ctx.fillStyle = '#3f4b52'; ctx.fillRect(7, -11, 16, 22);
          ctx.fillStyle = '#ff755d'; ctx.fillRect(14, -8, 33, 16);
          ctx.fillStyle = '#762f2b'; ctx.fillRect(22, -6, 15, 12);
          ctx.fillStyle = '#ffd2b6'; ctx.fillRect(43, -6, 8, 12);
        }
        ctx.fillStyle = '#53636c'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b6c2c7'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      this.drawWorldBar(ctx, -building.radius, building.radius + 8, building.radius * 2, 4, building.hp / building.maxHp, '#72e393');
      if (distance({ x: this.mouse.worldX, y: this.mouse.worldY }, building) < building.radius + 9) {
        ctx.fillStyle = '#f4efe3'; ctx.font = '800 9px ui-monospace'; ctx.textAlign = 'center'; ctx.fillText(`LV ${building.level}`, 0, -building.radius - 8);
      }
      ctx.restore();
    }
  }

  private drawEnemies() {
    const ctx = this.ctx;
    for (const enemy of this.enemies) {
      if (enemy.dead || !this.visible(enemy.x, enemy.y, 120)) continue;
      const heading = Math.atan2(enemy.vy, enemy.vx);
      ctx.save(); ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = '#00000055'; ctx.beginPath(); ctx.ellipse(-3, 7, enemy.radius * 1.08, enemy.radius * .58, 0, 0, TAU); ctx.fill();
      ctx.rotate(heading);
      if (this.easterEggs.has('jig')) ctx.rotate(Math.sin(performance.now() / 130 + enemy.id) * .42);
      const colors: Record<EnemyKind, string> = { infected: '#bb4657', charger: '#ee633f', armored: '#607887', ranged: '#a94f9b', bomber: '#c88b2f', leaper: '#884db2', stalker: '#4f9e91', medic: '#4d9d68', crusher: '#9a4e3b', phase: '#7564cc', siphon: '#b99a31', jammer: '#347fa7', boss: '#762d3a', spawn: '#d44c68' };
      const enemyColor = enemy.kind === 'boss' && enemy.bossVariant ? BOSS_PROFILES[enemy.bossVariant].color : colors[enemy.kind];
      ctx.fillStyle = enemy.flash > 0 ? '#fff' : enemyColor;
      ctx.strokeStyle = '#210e14'; ctx.lineWidth = enemy.kind === 'boss' ? 7 : 3; ctx.shadowColor = enemyColor; ctx.shadowBlur = enemy.kind === 'boss' ? 20 : 5;
      if (enemy.kind === 'charger') {
        ctx.beginPath(); ctx.moveTo(enemy.radius + 11, 0); ctx.lineTo(3, -enemy.radius * .68); ctx.lineTo(-enemy.radius - 7, -enemy.radius); ctx.lineTo(-enemy.radius * .55, 0); ctx.lineTo(-enemy.radius - 7, enemy.radius); ctx.lineTo(3, enemy.radius * .68); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#402027'; ctx.fillRect(-enemy.radius, -5, enemy.radius * 1.6, 10); ctx.fillStyle = '#ffb15d'; ctx.fillRect(enemy.radius * .45, -3, 11, 6);
      } else if (enemy.kind === 'bomber') {
        ctx.beginPath(); for (let i = 0; i < 16; i += 1) { const a = i / 16 * TAU; const r = i % 2 ? enemy.radius * .78 : enemy.radius * 1.25; traceVertex(ctx, i, Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#242128'; ctx.beginPath(); ctx.arc(0, 0, enemy.radius * .64, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe46e'; ctx.shadowColor = '#ffbc35'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(3, 0, 7 + Math.sin(performance.now() / 90) * 2, 0, TAU); ctx.fill();
      } else if (enemy.kind === 'leaper') {
        ctx.beginPath(); ctx.ellipse(-3, 0, enemy.radius * .9, enemy.radius * .56, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#d78cff'; ctx.lineWidth = 5; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-5, side * 7); ctx.lineTo(enemy.radius + 11, side * (enemy.radius + 7)); ctx.lineTo(enemy.radius + 5, side * 3); ctx.stroke(); }
        ctx.fillStyle = '#e9b2ff'; ctx.beginPath(); ctx.moveTo(enemy.radius + 7, 0); ctx.lineTo(3, -7); ctx.lineTo(3, 7); ctx.closePath(); ctx.fill();
      } else if (enemy.kind === 'stalker') {
        ctx.globalAlpha *= .82 + Math.sin(performance.now() / 170 + enemy.id) * .1;
        ctx.beginPath(); ctx.moveTo(enemy.radius + 12, 0); ctx.lineTo(-2, -enemy.radius * .62); ctx.lineTo(-enemy.radius - 6, -5); ctx.lineTo(-enemy.radius - 12, 0); ctx.lineTo(-enemy.radius - 6, 5); ctx.lineTo(-2, enemy.radius * .62); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#8df5df'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(-enemy.radius - 5, -enemy.radius); ctx.moveTo(-5, 7); ctx.lineTo(-enemy.radius - 5, enemy.radius); ctx.stroke();
      } else if (enemy.kind === 'medic') {
        ctx.beginPath(); ctx.arc(0, 0, enemy.radius, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#83f2a6'; ctx.lineWidth = 4; for (let i = 0; i < 3; i += 1) { const a = i / 3 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); ctx.lineTo(Math.cos(a) * (enemy.radius + 10), Math.sin(a) * (enemy.radius + 10)); ctx.stroke(); }
        ctx.fillStyle = '#a3ffc0'; ctx.fillRect(-3, -10, 6, 20); ctx.fillRect(-10, -3, 20, 6);
      } else if (enemy.kind === 'crusher') {
        ctx.beginPath(); ctx.moveTo(enemy.radius + 13, 0); ctx.lineTo(enemy.radius * .35, -enemy.radius); ctx.lineTo(-enemy.radius, -enemy.radius * .78); ctx.lineTo(-enemy.radius, enemy.radius * .78); ctx.lineTo(enemy.radius * .35, enemy.radius); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3a2727'; ctx.fillRect(-enemy.radius * .65, -enemy.radius * .65, enemy.radius * 1.15, enemy.radius * 1.3);
        ctx.strokeStyle = '#e2a184'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(enemy.radius * .25, -enemy.radius * .65); ctx.lineTo(enemy.radius + 14, 0); ctx.lineTo(enemy.radius * .25, enemy.radius * .65); ctx.stroke();
      } else if (enemy.kind === 'ranged') {
        ctx.beginPath(); ctx.moveTo(enemy.radius, 0); ctx.lineTo(3, -enemy.radius * .72); ctx.lineTo(-enemy.radius, -enemy.radius * .48); ctx.lineTo(-enemy.radius, enemy.radius * .48); ctx.lineTo(3, enemy.radius * .72); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#d779cf'; ctx.lineWidth = 4; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-7, side * 6); ctx.lineTo(-enemy.radius - 9, side * (enemy.radius + 5)); ctx.moveTo(3, side * 7); ctx.lineTo(enemy.radius * .5, side * (enemy.radius + 9)); ctx.stroke(); }
        ctx.fillStyle = '#332033'; ctx.fillRect(-3, -5, enemy.radius + 20, 10); ctx.fillStyle = '#ff9ae9'; ctx.fillRect(enemy.radius + 10, -3, 8, 6);
      } else if (enemy.kind === 'armored') {
        ctx.beginPath(); for (let i = 0; i < 8; i += 1) { const a = i / 8 * TAU + Math.PI / 8; traceVertex(ctx, i, Math.cos(a) * enemy.radius, Math.sin(a) * enemy.radius); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#263a45'; ctx.beginPath(); ctx.ellipse(-5, 0, enemy.radius * .58, enemy.radius * .76, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#c0d0d7'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(2, 0, enemy.radius * .72, -.9, .9); ctx.stroke();
        ctx.fillStyle = '#8ed4ea'; ctx.fillRect(enemy.radius * .25, -4, 9, 8);
      } else if (enemy.kind === 'phase') {
        ctx.globalAlpha *= .72 + Math.sin(performance.now() / 120 + enemy.id) * .18;
        for (const offset of [-7, 7]) { ctx.beginPath(); ctx.moveTo(enemy.radius + 9 + offset, 0); ctx.lineTo(offset, -enemy.radius); ctx.lineTo(-enemy.radius + offset, 0); ctx.lineTo(offset, enemy.radius); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.strokeStyle = '#c8c1ff'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(0, 0, enemy.radius + 8, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      } else if (enemy.kind === 'siphon') {
        ctx.beginPath(); ctx.arc(0, 0, enemy.radius, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#302c1c'; ctx.beginPath(); ctx.arc(-5, 0, enemy.radius * .64, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff18a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(4, 0, enemy.radius * .55, -.95, .95); ctx.stroke();
        ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.moveTo(5, -12); ctx.lineTo(-3, 1); ctx.lineTo(3, 1); ctx.lineTo(-2, 13); ctx.lineTo(13, -4); ctx.lineTo(6, -4); ctx.closePath(); ctx.fill();
      } else if (enemy.kind === 'jammer') {
        ctx.beginPath(); for (let i = 0; i < 8; i += 1) { const a = i / 8 * TAU + Math.PI / 8; traceVertex(ctx, i, Math.cos(a) * enemy.radius, Math.sin(a) * enemy.radius); } ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#132b38'; ctx.fillRect(-enemy.radius * .65, -enemy.radius * .65, enemy.radius * 1.3, enemy.radius * 1.3);
        ctx.strokeStyle = '#8ee8ff'; ctx.lineWidth = 3; for (const r of [7, 14]) { ctx.beginPath(); ctx.arc(5, 0, r, -.9, .9); ctx.stroke(); }
        ctx.fillStyle = '#b7f3ff'; ctx.beginPath(); ctx.arc(6, 0, 3, 0, TAU); ctx.fill();
      } else if (enemy.kind === 'boss') {
        if (enemy.bossVariant === 'hive') {
          ctx.beginPath(); for (let i = 0; i < 14; i += 1) { const a = i / 14 * TAU; const r = i % 2 ? enemy.radius * .78 : enemy.radius; traceVertex(ctx, i, Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#27142e'; ctx.beginPath(); ctx.ellipse(-8, 0, 43, 52, 0, 0, TAU); ctx.fill();
          for (let i = 0; i < 6; i += 1) { const a = i / 6 * TAU; ctx.fillStyle = i % 2 ? '#ec8dff' : '#8d43a6'; ctx.beginPath(); ctx.arc(Math.cos(a) * 40, Math.sin(a) * 40, 13, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#f5c1ff'; ctx.shadowColor = '#d96cff'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(19, 0, 16 + Math.sin(performance.now() / 140) * 2, 0, TAU); ctx.fill();
        } else if (enemy.bossVariant === 'tempest') {
          ctx.beginPath(); for (let i = 0; i < 8; i += 1) { const a = i / 8 * TAU + Math.PI / 8; traceVertex(ctx, i, Math.cos(a) * enemy.radius, Math.sin(a) * enemy.radius); } ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#122631'; ctx.beginPath(); ctx.arc(0, 0, 43, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#9af2ff'; ctx.lineWidth = 5; ctx.setLineDash([13, 9]); ctx.beginPath(); ctx.arc(0, 0, 51, performance.now() / 800, performance.now() / 800 + TAU); ctx.stroke(); ctx.setLineDash([]);
          for (const side of [-1, 1]) { ctx.fillStyle = '#2c5865'; ctx.beginPath(); ctx.moveTo(-25, side * 28); ctx.lineTo(8, side * 58); ctx.lineTo(30, side * 28); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = '#d9fbff'; ctx.shadowColor = '#63ddff'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.moveTo(36, -16); ctx.lineTo(54, 0); ctx.lineTo(36, 16); ctx.lineTo(21, 0); ctx.closePath(); ctx.fill();
        } else {
          ctx.beginPath(); for (let i = 0; i < 12; i += 1) { const a = i / 12 * TAU; const r = i % 2 ? enemy.radius * .82 : enemy.radius; traceVertex(ctx, i, Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#24171d'; ctx.fillRect(-44, -55, 80, 110); ctx.strokeStyle = '#b34c4e'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-25, -50); ctx.lineTo(25, -75); ctx.moveTo(-25, 50); ctx.lineTo(25, 75); ctx.stroke();
          ctx.strokeStyle = '#c6c8c5'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(8, 0, 46, -.9, .9); ctx.stroke();
          for (const side of [-1, 1]) { ctx.fillStyle = '#421f27'; ctx.fillRect(-60, side * 48 - 11, 78, 22); ctx.fillStyle = '#7f3b42'; for (let x = -53; x < 12; x += 17) ctx.fillRect(x, side * 48 - 8, 9, 16); }
          ctx.fillStyle = '#ff7a59'; ctx.shadowColor = '#ff4c43'; ctx.shadowBlur = 20; ctx.fillRect(26, -12, 23, 24);
        }
      } else if (enemy.kind === 'infected') {
        const gait = Math.sin(performance.now() / 105 + enemy.id * 1.9) * 4;
        ctx.strokeStyle = '#6c2636'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-enemy.radius - 8, -enemy.radius - gait); ctx.moveTo(-5, 6); ctx.lineTo(-enemy.radius - 8, enemy.radius + gait); ctx.moveTo(4, -7); ctx.lineTo(enemy.radius * .1, -enemy.radius - 7 + gait); ctx.moveTo(4, 7); ctx.lineTo(enemy.radius * .1, enemy.radius + 7 - gait); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(enemy.radius + 7, 0); ctx.bezierCurveTo(enemy.radius * .5, -enemy.radius, -enemy.radius * .7, -enemy.radius * .85, -enemy.radius, -2); ctx.bezierCurveTo(-enemy.radius * .7, enemy.radius, enemy.radius * .45, enemy.radius * .85, enemy.radius + 7, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3f1722'; ctx.beginPath(); ctx.ellipse(-3, 0, enemy.radius * .48, enemy.radius * .62, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#ef6d73'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -9); ctx.lineTo(8, -3); ctx.lineTo(-1, 8); ctx.stroke();
      } else {
        const twitch = Math.sin(performance.now() / 75 + enemy.id) * 3;
        ctx.strokeStyle = '#ff768a'; ctx.lineWidth = 3;
        for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-3, side * 3); ctx.lineTo(-enemy.radius - 6, side * (enemy.radius + twitch)); ctx.moveTo(1, side * 4); ctx.lineTo(enemy.radius + 4, side * (enemy.radius + 3 - twitch)); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(enemy.radius + 8, 0); ctx.lineTo(-enemy.radius, -enemy.radius * .72); ctx.lineTo(-enemy.radius * .5, 0); ctx.lineTo(-enemy.radius, enemy.radius * .72); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff9aac'; ctx.beginPath(); ctx.arc(3, 0, 4, 0, TAU); ctx.fill();
      }
      ctx.shadowBlur = 0;
      const eyeColor = enemy.kind === 'armored' ? '#a9edff' : enemy.kind === 'ranged' ? '#ff9bea' : '#ffe0a1';
      ctx.fillStyle = eyeColor; ctx.shadowColor = eyeColor; ctx.shadowBlur = 7; ctx.beginPath(); ctx.arc(enemy.radius * .42, -enemy.radius * .24, Math.max(2, enemy.radius * .085), 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(enemy.radius * .42, enemy.radius * .24, Math.max(2, enemy.radius * .085), 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      if (this.easterEggs.has('ion')) { ctx.fillStyle = '#63f5ff'; ctx.shadowColor = '#63f5ff'; ctx.shadowBlur = 12; ctx.fillRect(enemy.radius * .18, -enemy.radius * .43, 5, enemy.radius * .86); ctx.shadowBlur = 0; }
      if (this.easterEggs.has('cog')) { ctx.save(); ctx.rotate(performance.now() / 900); ctx.strokeStyle = '#d8a85c'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(0, 0, enemy.radius + 10, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
      if (this.easterEggs.has('jig') && Math.sin(performance.now() / 180 + enemy.id) > .75) { ctx.fillStyle = '#f3a7ff'; ctx.font = '700 13px sans-serif'; ctx.fillText('♪', -4, -enemy.radius - 13); }
      if (enemy.elite) { const eliteColor = enemy.elite === 'frenzy' ? '#ff6a31' : enemy.elite === 'armor' ? '#8ec6ff' : enemy.elite === 'shock' ? '#ffe34d' : '#cf75ff'; ctx.strokeStyle = eliteColor; ctx.lineWidth = 2; ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(0, 0, enemy.radius + 7, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      ctx.rotate(-heading);
      ctx.restore();
    }
  }

  private drawProjectiles() {
    const ctx = this.ctx;
    for (const projectile of this.projectiles) {
      if (!this.visible(projectile.x, projectile.y, 40)) continue;
      const color = projectile.kind === 'rail' ? '#bca5ff' : projectile.kind === 'ice' ? '#76e6ff' : projectile.kind === 'missile' ? '#ff7a4e' : projectile.kind === 'plasma' ? '#ff4771' : projectile.team === 'player' ? '#ffe09a' : '#9effca';
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(projectile.x, projectile.y, projectile.radius, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  private drawPlayer() {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.player.x, this.player.y);
    if (this.player.hurtTimer > 0 && Math.floor(performance.now() / 70) % 2) ctx.globalAlpha = .55;
    ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(-3, 8, 23, 12, 0, 0, TAU); ctx.fill();
    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#71eaff'; ctx.shadowColor = '#58ddff'; ctx.shadowBlur = 15; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.arc(0, 0, 29 + Math.sin(performance.now() / 120) * 2, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
    }
    ctx.rotate(this.player.angle);
    const operatorColor = OPERATORS[this.operator].color;
    ctx.fillStyle = '#0c171d'; ctx.strokeStyle = operatorColor; ctx.lineWidth = this.operator === 'vanguard' ? 3.5 : 2;
    if (this.operator === 'ranger') { ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-5, -16); ctx.lineTo(15, -9); ctx.lineTo(19, 0); ctx.lineTo(15, 9); ctx.lineTo(-5, 16); ctx.closePath(); }
    else if (this.operator === 'engineer') { ctx.beginPath(); ctx.moveTo(-16, -13); ctx.lineTo(11, -13); ctx.lineTo(18, -6); ctx.lineTo(18, 6); ctx.lineTo(11, 13); ctx.lineTo(-16, 13); ctx.closePath(); }
    else { ctx.beginPath(); ctx.moveTo(-19, -12); ctx.lineTo(-8, -18); ctx.lineTo(10, -15); ctx.lineTo(18, 0); ctx.lineTo(10, 15); ctx.lineTo(-8, 18); ctx.lineTo(-19, 12); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.operator === 'engineer' ? '#263f36' : this.operator === 'ranger' ? '#203947' : '#3f302a'; ctx.strokeStyle = operatorColor; ctx.shadowColor = operatorColor; ctx.shadowBlur = 7; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(7, -12); ctx.lineTo(14, -6); ctx.lineTo(14, 6); ctx.lineTo(7, 12); ctx.lineTo(-8, 12); ctx.lineTo(-12, 6); ctx.lineTo(-12, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#e1e8e5'; ctx.strokeStyle = '#60777c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(8, 0, 8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = operatorColor; ctx.shadowColor = operatorColor; ctx.shadowBlur = 10; ctx.fillRect(10, -5, 6, 10); ctx.shadowBlur = 0;
    ctx.fillStyle = '#74e8d8'; ctx.shadowColor = '#65e2d2'; ctx.shadowBlur = 8; ctx.fillRect(-24, -4, 7, 8); ctx.shadowBlur = 0;
    const weaponColor = this.player.weapon === 'arc' ? '#74efff' : this.player.weapon === 'scatter' ? '#ff9c61' : this.player.weapon === 'rail' ? '#bba2ff' : '#ffbf69';
    ctx.fillStyle = '#273b42'; ctx.strokeStyle = '#84999d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(13, -5, 31, 10, 2); ctx.fill(); ctx.stroke();
    if (this.player.weapon === 'scatter') { ctx.fillStyle = weaponColor; ctx.fillRect(39, -7, 10, 5); ctx.fillRect(39, 2, 10, 5); }
    else if (this.player.weapon === 'arc') { ctx.strokeStyle = weaponColor; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(41, 0, 7, -1.25, 1.25); ctx.stroke(); ctx.fillStyle = weaponColor; ctx.beginPath(); ctx.arc(46, 0, 3, 0, TAU); ctx.fill(); }
    else if (this.player.weapon === 'rail') { ctx.fillStyle = weaponColor; ctx.fillRect(35, -3, 20, 6); ctx.fillStyle = '#efe9ff'; ctx.fillRect(49, -1, 10, 2); }
    else { ctx.fillStyle = weaponColor; ctx.fillRect(40, -2, 10, 4); }
    if (this.overdriveTimer > 0) { ctx.strokeStyle = '#ffb052'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, 0, 22, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  private drawCompanion() {
    const ctx = this.ctx;
    const ally = this.companion;
    if (!this.stats.companionUnlocked) return;
    if (!this.visible(ally.x, ally.y, 70)) return;
    ctx.save(); ctx.translate(ally.x, ally.y);
    if (ally.downTimer > 0) {
      ctx.strokeStyle = '#65dff0'; ctx.lineWidth = 3; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.arc(0, 0, 20, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - ally.downTimer / this.stats.companionRebootTime)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#14252b'; ctx.fillRect(-9, -9, 18, 18); ctx.fillStyle = '#7eeeff'; ctx.font = '800 8px ui-monospace'; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(ally.downTimer).toString(), 0, 3); ctx.restore(); return;
    }
    ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(-2, 7, 20, 10, 0, 0, TAU); ctx.fill();
    ctx.rotate(ally.angle);
    ctx.fillStyle = '#0b1c23'; ctx.strokeStyle = '#72e7f3'; ctx.lineWidth = 2.5; ctx.shadowColor = '#5bdcea'; ctx.shadowBlur = 9;
    ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-9, -13); ctx.lineTo(7, -14); ctx.lineTo(16, 0); ctx.lineTo(7, 14); ctx.lineTo(-9, 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#6de7f2'; ctx.shadowColor = '#58dce9'; ctx.shadowBlur = 8; ctx.fillRect(-23, -4, 8, 8); ctx.shadowBlur = 0;
    ctx.fillStyle = '#dce9e9'; ctx.strokeStyle = '#5d7b83'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(7, 0, 8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#73efff'; ctx.shadowColor = '#73efff'; ctx.shadowBlur = 11; ctx.beginPath(); ctx.arc(10, 0, 3.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#263a43'; ctx.strokeStyle = '#718b92'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(12, -4, 32, 8, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#75e7f3'; ctx.fillRect(40, -2, 9, 4);
    ctx.strokeStyle = '#78ecf6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-6, 0, 5, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  private drawDrones() {
    const ctx = this.ctx;
    for (let i = 0; i < this.stats.droneCount; i += 1) {
      const angle = performance.now() / 950 + i / Math.max(1, this.stats.droneCount) * TAU;
      const orbitRadius = 54 + Math.min(24, this.stats.droneCount * 3);
      const x = this.player.x + Math.cos(angle) * orbitRadius;
      const y = this.player.y + Math.sin(angle) * orbitRadius;
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = '#132a2d'; ctx.strokeStyle = '#65f0d2'; ctx.lineWidth = 2; ctx.shadowColor = '#55e8c9'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#55e8c9'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = '#52696d'; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-17, -8); ctx.lineTo(-13, 1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(17, -8); ctx.lineTo(13, 1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#eafff9'; ctx.fillRect(-2, 6, 4, 7); ctx.restore();
    }
  }

  private drawParticles() {
    const ctx = this.ctx;
    for (const particle of this.particles) {
      if (!this.visible(particle.x, particle.y, 40)) continue;
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      if (particle.glow) { ctx.shadowColor = particle.color; ctx.shadowBlur = 9; }
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * Math.max(.2, particle.life / particle.maxLife), 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  private drawBuildPreview() {
    if (!this.buildKind) return;
    const ctx = this.ctx;
    const config = BUILDINGS[this.buildKind];
    const valid = this.canBuildAt(this.mouse.worldX, this.mouse.worldY, config.radius) && this.metal >= config.metal && this.energy >= config.energy;
    ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = valid ? '#54e98b' : '#ff5151'; ctx.strokeStyle = valid ? '#a0ffbd' : '#ff9b92'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.mouse.worldX, this.mouse.worldY, config.radius, 0, TAU); ctx.fill(); ctx.stroke();
    if (config.range) { ctx.globalAlpha = .18; ctx.beginPath(); ctx.arc(this.mouse.worldX, this.mouse.worldY, config.range, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#65d48a35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, BUILD_RADIUS, 0, TAU); ctx.stroke();
  }

  private drawFloatTexts() {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    for (const text of this.floatTexts) {
      ctx.globalAlpha = clamp(text.life, 0, 1);
      ctx.fillStyle = text.color; ctx.font = `${text.big ? 800 : 700} ${text.big ? 18 : 12}px var(--font-geist-mono), monospace`; ctx.shadowColor = '#000'; ctx.shadowBlur = 5; ctx.fillText(text.value, text.x, text.y); ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  private drawWorldBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, ratio: number, color: string) {
    ctx.fillStyle = '#080b0dcc'; ctx.fillRect(x, y, width, height); ctx.fillStyle = color; ctx.fillRect(x, y, width * clamp(ratio, 0, 1), height);
  }

  private captureAdminCode(key: string) {
    if (this.adminEnabled || key.length !== 1) return;
    const secret = 'hqmhqm141128';
    this.adminBuffer = (this.adminBuffer + key.toLowerCase()).slice(-secret.length);
    if (this.adminBuffer !== secret) return;
    this.adminEnabled = true;
    this.metal = 9999;
    this.energy = 9999;
    this.baseHp = this.baseMaxHp;
    this.player.hp = this.player.maxHp;
    this.player.invulnerable = 999999;
    this.stats.bulletDamage *= 8;
    this.stats.fireRate *= 2.4;
    this.stats.bulletSize *= 1.5;
    this.stats.penetration = Math.max(this.stats.penetration, 6);
    this.stats.projectiles = Math.max(this.stats.projectiles, 3);
    this.stats.critChance = 1;
    this.stats.dashCooldown = 0;
    this.player.dashCooldown = 0;
    this.player.fireTimer = 0;
    this.recallCooldown = 0;
    this.stats.towerFireRate *= 3;
    this.stats.freezePower *= 3;
    this.stats.missileRadius *= 2;
    this.stats.baseShield = .98;
    this.stats.wallArmor = .9;
    this.stats.autoRepair = 1;
    this.stats.generatorYield = 99;
    this.stats.droneCount = Math.max(this.stats.droneCount, 6);
    this.stats.droneFireRate *= 3;
    this.stats.scatterUnlocked = true;
    this.stats.arcUnlocked = true;
    this.stats.railUnlocked = true;
    this.stats.frostDash = true;
    this.stats.pickupRadius = 999;
    this.stats.companionUnlocked = true;
    this.buildings.forEach(building => { building.hp = building.maxHp; });
    this.notification = '管理员权限已开启 · 无敌 / 无冷却 / 全武器 / 火力超载';
    this.notificationTimer = 5;
    this.audio.play('upgrade');
    this.screenShake = 12;
    this.burst(this.player.x, this.player.y, '#8bfff4', 55, 240);
    this.emitSnapshot();
  }

  private captureEasterEgg(key: string) {
    if (key.length !== 1 || !/[a-z]/i.test(key) || /[wasdberp]/i.test(key)) return;
    this.easterBuffer = (this.easterBuffer + key.toLowerCase()).slice(-12);
    const codes: Record<string, string> = {
      cog: '感染体启动了旋转机械光环',
      ion: '未来滤镜已接入',
      jig: '怪潮开始踩点',
      gift: '击杀庆典模式已开启（仅特效）',
      lux: '永昼照明已开启',
    };
    for (const [code, message] of Object.entries(codes)) {
      if (!this.easterBuffer.endsWith(code)) continue;
      if (this.easterEggs.has(code)) this.easterEggs.delete(code);
      else this.easterEggs.add(code);
      this.notification = '彩蛋 · ' + message;
      this.notificationTimer = 3;
      this.audio.play('upgrade');
      this.emitSnapshot();
      this.easterBuffer = '';
      break;
    }
  }
}
