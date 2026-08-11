import Phaser from "phaser";
import { findNavigationPath, nearestNavigationNode, type NavigationNode } from "../game/navigation";
import { isCircleBlocked, moveCircleWithCollision } from "../game/collision";

const MAP_WIDTH = 3500;
const MAP_HEIGHT = 2200;
const PLAYER_RADIUS = 22;
const ROUND_HIDE_MS = 90_000;
const FINAL_HIDE_MS = 25_000;
const TERMINAL_TIME_REDUCTION_MS = 8_000;
const CAPTURE_DISTANCE = 48;
const MAX_VENT_USES = 3;
const BOT_RADIUS = 18;
const HUNTER_SIGHT_RANGE = 520;
const HUNTER_TRACK_REFRESH_MS = 1_250;

type Appearance = {
  color: string;
  hat: string;
  mask: string;
  pack: string;
  expression: string;
};

type Point = { x: number; y: number };
type Wall = { x: number; y: number; width: number; height: number };
type KeySet = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  sprint: Phaser.Input.Keyboard.Key;
  interact: Phaser.Input.Keyboard.Key;
};

type Terminal = Point & { id: string; label: string; done: boolean };
type Vent = Point & { id: string; label: string; networkId: string };
type ZiplinePair = { id: string; a: Point; b: Point };
type Transit = {
  kind: "zipline";
  from: Point;
  to: Point;
  startedAt: number;
  durationMs: number;
  label: string;
};
type BotState = "patrol" | "chase" | "search" | "repair" | "flee";
type BotAgent = {
  id: string;
  label: string;
  position: Point;
  state: BotState;
  route: string[];
  routeTarget?: string;
  patrolIndex: number;
  patrolNodes: string[];
  preferredTaskOffset: number;
  taskStartedAt?: number;
  lastSeen?: Point;
  nextTrackRefreshAt?: number;
  trackedNodeId?: string;
  ventUses: number;
};

const DEFAULT_APPEARANCE: Appearance = {
  color: "#31d8c8",
  hat: "cap",
  mask: "clear",
  pack: "utility",
  expression: "calm"
};

const WALLS: Wall[] = [
  { x: 580, y: 1020, width: 250, height: 72 },
  { x: 1050, y: 350, width: 96, height: 270 },
  { x: 1440, y: 1050, width: 330, height: 80 },
  { x: 1860, y: 310, width: 120, height: 290 },
  { x: 2070, y: 860, width: 230, height: 90 },
  { x: 340, y: 490, width: 180, height: 80 },
  { x: 990, y: 1280, width: 110, height: 190 },
  { x: 2280, y: 1220, width: 120, height: 170 },
  { x: 2540, y: 820, width: 340, height: 86 },
  { x: 2930, y: 350, width: 110, height: 280 },
  { x: 3050, y: 1130, width: 160, height: 250 },
  { x: 2460, y: 1690, width: 360, height: 90 },
  { x: 1450, y: 1670, width: 420, height: 100 },
  { x: 560, y: 1710, width: 270, height: 80 }
];

const NAVIGATION_NODES: NavigationNode[] = [
  { id: "spawn", x: 285, y: 1180, links: ["cargo", "observation", "south-west"] },
  { id: "cargo", x: 500, y: 1160, links: ["spawn", "lower-west"] },
  { id: "lower-west", x: 790, y: 1190, links: ["cargo", "maintenance", "south-west"] },
  { id: "maintenance", x: 940, y: 1160, links: ["lower-west", "central-south"] },
  { id: "central-south", x: 1260, y: 980, links: ["maintenance", "comms", "engine", "south-loop"] },
  { id: "comms", x: 1470, y: 680, links: ["central-south", "upper-mid", "reactor-entry"] },
  { id: "engine", x: 1980, y: 1110, links: ["central-south", "engine-east", "south-loop"] },
  { id: "engine-east", x: 2220, y: 1100, links: ["engine", "reactor-entry", "docking"] },
  { id: "observation", x: 430, y: 760, links: ["spawn", "upper-west"] },
  { id: "upper-west", x: 720, y: 650, links: ["observation", "upper-mid"] },
  { id: "upper-mid", x: 1100, y: 660, links: ["upper-west", "comms"] },
  { id: "reactor-entry", x: 2040, y: 660, links: ["comms", "engine-east", "reactor", "science"] },
  { id: "reactor", x: 2180, y: 390, links: ["reactor-entry"] },
  { id: "science", x: 2680, y: 520, links: ["reactor-entry", "relay"] },
  { id: "relay", x: 2920, y: 760, links: ["science", "docking"] },
  { id: "docking", x: 3180, y: 1220, links: ["relay", "engine-east", "archive"] },
  { id: "archive", x: 2790, y: 1510, links: ["docking", "coolant"] },
  { id: "coolant", x: 2260, y: 1680, links: ["archive", "south-loop"] },
  {
    id: "south-loop",
    x: 1550,
    y: 1740,
    links: ["coolant", "central-south", "engine", "south-west"]
  },
  { id: "south-west", x: 680, y: 1780, links: ["south-loop", "spawn", "lower-west"] }
];

const VENTS: Vent[] = [
  { id: "cargo-duct", label: "货运出口", x: 650, y: 1360, networkId: "aqua" },
  { id: "observation-duct", label: "观察出口", x: 420, y: 700, networkId: "aqua" },
  { id: "south-duct", label: "南环出口", x: 680, y: 1770, networkId: "aqua" },
  { id: "comms-duct", label: "通讯出口", x: 1360, y: 840, networkId: "pulse" },
  { id: "engine-duct", label: "引擎出口", x: 1950, y: 1160, networkId: "pulse" },
  { id: "science-duct", label: "阵列出口", x: 2680, y: 580, networkId: "pulse" },
  { id: "reactor-duct", label: "反应堆出口", x: 2260, y: 580, networkId: "ion" },
  { id: "maintenance-duct", label: "维修出口", x: 900, y: 1150, networkId: "ion" },
  { id: "archive-duct", label: "档案出口", x: 2800, y: 1460, networkId: "ion" }
];

const ZIPLINES: ZiplinePair[] = [
  { id: "cargo-pulse", a: { x: 320, y: 1150 }, b: { x: 650, y: 1360 } },
  { id: "observation-pulse", a: { x: 720, y: 720 }, b: { x: 1130, y: 690 } },
  { id: "engine-pulse", a: { x: 1670, y: 900 }, b: { x: 2020, y: 1080 } }
];

export class BootScene extends Phaser.Scene {
  private mapGraphics?: Phaser.GameObjects.Graphics;
  private dynamicGraphics?: Phaser.GameObjects.Graphics;
  private playerAnchor?: Phaser.GameObjects.Zone;
  private keys?: KeySet;
  private player: Point = { x: 285, y: 1180 };
  private facing = -Math.PI / 2;
  private appearance: Appearance = { ...DEFAULT_APPEARANCE };
  private terminals: Terminal[] = [
    { id: "cargo", label: "货舱继电器", x: 500, y: 1160, done: false },
    { id: "observation", label: "观察镜阵", x: 430, y: 760, done: false },
    { id: "upper-west", label: "医护净化器", x: 720, y: 650, done: false },
    { id: "upper-mid", label: "导航陀螺仪", x: 1100, y: 660, done: false },
    { id: "maintenance", label: "维修矩阵", x: 940, y: 1160, done: false },
    { id: "central-south", label: "核心分流器", x: 1260, y: 980, done: false },
    { id: "comms", label: "通讯阵列", x: 1470, y: 680, done: false },
    { id: "reactor", label: "反应堆调相器", x: 2180, y: 390, done: false },
    { id: "engine", label: "引擎矢量器", x: 1980, y: 1110, done: false },
    { id: "science", label: "星图校准台", x: 2680, y: 520, done: false },
    { id: "docking", label: "停泊引导器", x: 3180, y: 1220, done: false },
    { id: "archive", label: "冷库索引台", x: 2790, y: 1510, done: false }
  ];
  private crewBots: BotAgent[] = [
    {
      id: "crew-a",
      label: "BOT-星尘",
      position: { x: 360, y: 1240 },
      state: "repair",
      route: [],
      patrolIndex: 0,
      patrolNodes: ["cargo", "maintenance", "upper-west"],
      preferredTaskOffset: 0,
      ventUses: 2
    },
    {
      id: "crew-b",
      label: "BOT-轨道",
      position: { x: 2190, y: 1160 },
      state: "repair",
      route: [],
      patrolIndex: 0,
      patrolNodes: ["engine", "reactor", "comms"],
      preferredTaskOffset: 1,
      ventUses: 2
    }
  ];
  private hunterBot: BotAgent = {
    id: "hunter",
    label: "BOT-棱镜",
    position: { x: 2110, y: 530 },
    state: "patrol",
    route: [],
    patrolIndex: 0,
    patrolNodes: ["reactor", "comms", "central-south", "engine", "reactor-entry"],
    preferredTaskOffset: 0,
    ventUses: 0
  };
  private botLabels: Phaser.GameObjects.Text[] = [];
  private lastTelemetryAt = 0;
  private remainingRoundMs = ROUND_HIDE_MS;
  private roundStarted = false;
  private roundOver = false;
  private announcedFinalHide = false;
  private playerVentUses = MAX_VENT_USES;
  private deathMarker?: Point;
  private transit?: Transit;
  private activeVentId?: string;
  private ventHideOrigin?: Point;
  private ventHiddenUntil?: number;
  private readonly onAppearance = (event: Event): void => {
    const customEvent = event as CustomEvent<Partial<Appearance>>;
    this.appearance = { ...this.appearance, ...customEvent.detail };
  };
  private readonly onReset = (): void => {
    this.player = { x: 285, y: 1180 };
    this.facing = -Math.PI / 2;
    this.resetRound();
    this.roundStarted = false;
    window.dispatchEvent(new Event("space-hideout:round-reset"));
  };
  private readonly onStart = (): void => {
    if (this.roundStarted) return;
    this.roundStarted = true;
    this.publishStatus("猎手信号已激活：BOT-棱镜正在开始搜索");
    window.dispatchEvent(new Event("space-hideout:round-started"));
  };
  private readonly onVentChoice = (event: Event): void => {
    const targetId = (event as CustomEvent<{ targetId?: string }>).detail?.targetId;
    if (!targetId) return;
    this.resolveVentChoice(targetId);
  };
  private readonly onOverview = (): void => {
    const camera = this.cameras.main;
    camera.zoomTo(0.29, 380);
    this.time.delayedCall(2400, () => camera.zoomTo(1.05, 480));
  };

  constructor() {
    super("BootScene");
  }

  create(): void {
    this.mapGraphics = this.add.graphics();
    this.dynamicGraphics = this.add.graphics();
    this.drawStaticFacility();

    this.playerAnchor = this.add.zone(this.player.x, this.player.y, 1, 1);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.setZoom(1.05);
    this.cameras.main.startFollow(this.playerAnchor, true, 0.14, 0.14);

    this.keys = this.input.keyboard?.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      sprint: "SHIFT",
      interact: "E"
    }) as KeySet | undefined;
    this.game.canvas.setAttribute("tabindex", "0");
    this.input.on("pointerdown", () => this.game.canvas.focus());

    this.botLabels = [
      this.createLabel("BOT-星尘", "#b9f6ec"),
      this.createLabel("BOT-轨道", "#b9f6ec"),
      this.createLabel("BOT-棱镜", "#f7c65b")
    ];

    window.addEventListener("space-hideout:appearance", this.onAppearance);
    window.addEventListener("space-hideout:reset", this.onReset);
    window.addEventListener("space-hideout:start", this.onStart);
    window.addEventListener("space-hideout:vent-choice", this.onVentChoice);
    window.addEventListener("space-hideout:overview", this.onOverview);
    document.body.dataset.sceneReady = "true";
    window.dispatchEvent(new Event("space-hideout:scene-ready"));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("space-hideout:appearance", this.onAppearance);
      window.removeEventListener("space-hideout:reset", this.onReset);
      window.removeEventListener("space-hideout:start", this.onStart);
      window.removeEventListener("space-hideout:vent-choice", this.onVentChoice);
      window.removeEventListener("space-hideout:overview", this.onOverview);
      delete document.body.dataset.sceneReady;
    });

    this.publishStatus("准备舱待命：确认猎手信号后开始躲藏");
    this.publishTelemetry(0, 0);
    window.dispatchEvent(
      new CustomEvent("space-hideout:task", {
        detail: { completed: 0, total: this.terminals.length }
      })
    );
  }

  update(time: number, delta: number): void {
    if (!this.dynamicGraphics || !this.playerAnchor) {
      return;
    }

    if (this.roundStarted && !this.roundOver) {
      if (this.ventHiddenUntil) this.updateVentHide(time);
      else if (this.transit) this.updateTransit(time);
      else this.updatePlayer(delta);
    }
    if (
      this.roundStarted &&
      !this.roundOver &&
      !this.transit &&
      !this.ventHiddenUntil &&
      this.keys &&
      Phaser.Input.Keyboard.JustDown(this.keys.interact)
    ) {
      this.tryInteract();
    }

    if (this.roundStarted && !this.roundOver) {
      this.remainingRoundMs = Math.max(0, this.remainingRoundMs - delta);
      if (this.isFinalHide() && !this.announcedFinalHide) {
        this.announcedFinalHide = true;
        this.publishStatus("FINAL HIDE：终端关闭，猎手正在加速追踪");
      }
      this.updateBots(time, delta);
    }
    const positions = this.getBotPositions();
    this.dynamicGraphics.clear();
    this.drawFacilityMotion(this.dynamicGraphics, time);
    this.drawTerminals(this.dynamicGraphics, time);
    this.drawVents(this.dynamicGraphics, time);
    this.drawZiplines(this.dynamicGraphics, time);
    this.drawBots(this.dynamicGraphics, positions, time);
    this.drawPlayer(this.dynamicGraphics, time);
    this.drawDeathMarker(this.dynamicGraphics, time);
    this.positionLabels(positions);

    const hunter = positions.hunter;
    const danger = this.ventHiddenUntil
      ? 0
      : Phaser.Math.Clamp(
          1 - Phaser.Math.Distance.Between(this.player.x, this.player.y, hunter.x, hunter.y) / 780,
          0,
          1
        );
    if (
      this.roundStarted &&
      !this.roundOver &&
      !this.transit &&
      !this.ventHiddenUntil &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, hunter.x, hunter.y) <=
        CAPTURE_DISTANCE
    ) {
      this.finishRound("caught");
    } else if (this.roundStarted && !this.roundOver && this.remainingRoundMs <= 0) {
      this.finishRound("escaped");
    }
    if (time - this.lastTelemetryAt > 90) {
      this.publishTelemetry(danger, time);
      this.lastTelemetryAt = time;
    }
  }

  private drawStaticFacility(): void {
    const g = this.mapGraphics;
    if (!g) {
      return;
    }

    g.fillStyle(0x0a1c20, 1);
    g.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    g.fillStyle(0x0d2729, 0.92);
    g.fillRoundedRect(70, 70, MAP_WIDTH - 140, MAP_HEIGHT - 140, 36);

    g.lineStyle(1, 0x35d9c7, 0.1);
    for (let x = 110; x < MAP_WIDTH - 100; x += 80) {
      g.lineBetween(x, 110, x, MAP_HEIGHT - 110);
    }
    for (let y = 110; y < MAP_HEIGHT - 100; y += 80) {
      g.lineBetween(110, y, MAP_WIDTH - 110, y);
    }

    this.drawRoom(g, 150, 1000, 570, 410, "货运大厅", 0x35d9c7);
    this.drawRoom(g, 790, 1030, 520, 300, "维修走廊", 0x8be16c);
    this.drawRoom(g, 1240, 500, 530, 450, "中央控制", 0x35d9c7);
    this.drawRoom(g, 1870, 160, 520, 530, "反应堆穹舱", 0xf7c65b);
    this.drawRoom(g, 1850, 980, 520, 320, "引擎回路", 0xf0647c);
    this.drawRoom(g, 210, 260, 560, 490, "观察与医疗区", 0x8be16c);
    this.drawRoom(g, 2450, 260, 620, 470, "远端星图阵列", 0x6c7dff);
    this.drawRoom(g, 2970, 1030, 310, 420, "停泊闸门", 0xf7c65b);
    this.drawRoom(g, 2460, 1370, 620, 420, "冷藏档案库", 0x8be16c);
    this.drawRoom(g, 1100, 1540, 1120, 370, "下层循环道", 0x35d9c7);
    this.drawRoom(g, 170, 1510, 720, 420, "外环货运带", 0xf0647c);

    g.lineStyle(34, 0x173d3f, 0.96);
    g.lineBetween(700, 1200, 990, 1180);
    g.lineBetween(1200, 1030, 1470, 900);
    g.lineBetween(1730, 690, 1900, 470);
    g.lineBetween(1700, 900, 1990, 1110);
    g.lineBetween(760, 620, 1240, 660);
    g.lineBetween(2390, 490, 2680, 520);
    g.lineBetween(2850, 690, 3020, 940);
    g.lineBetween(2380, 1180, 3120, 1220);
    g.lineBetween(2800, 1450, 2260, 1680);
    g.lineBetween(2200, 1740, 1550, 1740);
    g.lineBetween(1550, 1740, 680, 1780);
    g.lineBetween(680, 1780, 500, 1400);
    g.lineStyle(3, 0x35d9c7, 0.33);
    g.lineBetween(700, 1200, 990, 1180);
    g.lineBetween(1200, 1030, 1470, 900);
    g.lineBetween(1730, 690, 1900, 470);
    g.lineBetween(1700, 900, 1990, 1110);
    g.lineBetween(760, 620, 1240, 660);
    g.lineBetween(2390, 490, 2680, 520);
    g.lineBetween(2850, 690, 3020, 940);
    g.lineBetween(2380, 1180, 3120, 1220);
    g.lineBetween(2800, 1450, 2260, 1680);
    g.lineBetween(2200, 1740, 1550, 1740);
    g.lineBetween(1550, 1740, 680, 1780);
    g.lineBetween(680, 1780, 500, 1400);

    for (const wall of WALLS) {
      g.fillStyle(0x122f33, 1);
      g.fillRoundedRect(wall.x, wall.y, wall.width, wall.height, 10);
      g.lineStyle(2, 0x5b9291, 0.5);
      g.strokeRoundedRect(wall.x, wall.y, wall.width, wall.height, 10);
      g.lineStyle(1, 0x35d9c7, 0.18);
      g.lineBetween(wall.x + 12, wall.y + 16, wall.x + wall.width - 12, wall.y + 16);
    }

    this.add
      .text(205, 1325, "SPAWN BAY / OUTER DECK", {
        color: "#9fc6c1",
        fontFamily: "Courier New, monospace",
        fontSize: "14px"
      })
      .setAlpha(0.72);
  }

  private drawRoom(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: number
  ): void {
    g.fillStyle(0x0c2528, 0.78);
    g.fillRoundedRect(x, y, width, height, 25);
    g.lineStyle(3, color, 0.42);
    g.strokeRoundedRect(x, y, width, height, 25);
    g.lineStyle(1, 0xeefbf8, 0.12);
    g.strokeRoundedRect(x + 18, y + 18, width - 36, height - 36, 17);
    this.add
      .text(x + 28, y + 28, label, {
        color: "#a2c5c0",
        fontFamily: "Courier New, monospace",
        fontSize: "17px"
      })
      .setAlpha(0.66);
  }

  private updatePlayer(delta: number): void {
    if (!this.keys || !this.playerAnchor) {
      return;
    }

    let directionX = 0;
    let directionY = 0;
    if (this.keys.left.isDown) directionX -= 1;
    if (this.keys.right.isDown) directionX += 1;
    if (this.keys.up.isDown) directionY -= 1;
    if (this.keys.down.isDown) directionY += 1;
    if (directionX === 0 && directionY === 0) {
      return;
    }

    const length = Math.hypot(directionX, directionY);
    directionX /= length;
    directionY /= length;
    this.facing = Math.atan2(directionY, directionX);
    const speed = this.keys.sprint.isDown ? 285 : 178;
    const step = (speed * Math.min(delta, 70)) / 1000;
    this.player = moveCircleWithCollision(
      this.player,
      { x: directionX * step, y: directionY * step },
      PLAYER_RADIUS,
      WALLS,
      { minX: 115, minY: 115, maxX: MAP_WIDTH - 115, maxY: MAP_HEIGHT - 115 }
    );
    this.playerAnchor.setPosition(this.player.x, this.player.y);
  }

  private isBlocked(x: number, y: number, radius = PLAYER_RADIUS): boolean {
    return isCircleBlocked({ x, y }, radius, WALLS, {
      minX: 115,
      minY: 115,
      maxX: MAP_WIDTH - 115,
      maxY: MAP_HEIGHT - 115
    });
  }

  private tryInteract(): void {
    if (this.tryRepairTerminal()) return;
    if (this.tryUseVent()) return;
    if (this.tryUseZipline()) return;
    this.publishStatus("附近没有终端、跃迁管或双向滑索");
  }

  private tryRepairTerminal(): boolean {
    if (this.isFinalHide()) {
      this.publishStatus("FINAL HIDE 中终端已关闭，只能继续逃跑");
      return true;
    }
    const terminal = this.terminals.find(
      (item) =>
        !item.done &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 78
    );
    if (!terminal) {
      return false;
    }
    this.completeTerminal(terminal, "你");
    return true;
  }

  private completeTerminal(terminal: Terminal, operator: string): void {
    if (terminal.done || this.isFinalHide()) return;
    terminal.done = true;
    const completed = this.terminals.filter((item) => item.done).length;
    const reducibleTime = Math.max(0, this.remainingRoundMs - FINAL_HIDE_MS);
    const reduction = Math.min(TERMINAL_TIME_REDUCTION_MS, reducibleTime);
    this.remainingRoundMs -= reduction;
    this.publishStatus(
      `${operator}修复了${terminal.label}，猎手搜索时间减少 ${Math.ceil(reduction / 1000)} 秒`
    );
    window.dispatchEvent(
      new CustomEvent("space-hideout:task", { detail: { completed, total: this.terminals.length } })
    );
  }

  private tryUseVent(): boolean {
    const vent = VENTS.find(
      (item) => Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 70
    );
    if (!vent) return false;
    if (this.playerVentUses <= 0) {
      this.publishStatus("跃迁管电量已耗尽");
      return true;
    }
    const exits = VENTS.filter((item) => item.networkId === vent.networkId && item.id !== vent.id);
    if (exits.length === 0) return true;
    this.activeVentId = vent.id;
    window.dispatchEvent(
      new CustomEvent("space-hideout:vent-select", {
        detail: {
          exits: exits.map((exit) => ({ id: exit.id, label: exit.label })),
          hideSeconds: 10
        }
      })
    );
    this.publishStatus("跃迁管已接通：选择出口，或在管内躲 10 秒");
    return true;
  }

  private tryUseZipline(): boolean {
    const zipline = ZIPLINES.find((item) => {
      const nearA =
        Phaser.Math.Distance.Between(this.player.x, this.player.y, item.a.x, item.a.y) < 72;
      const nearB =
        Phaser.Math.Distance.Between(this.player.x, this.player.y, item.b.x, item.b.y) < 72;
      return nearA || nearB;
    });
    if (!zipline) return false;
    const nearA =
      Phaser.Math.Distance.Between(this.player.x, this.player.y, zipline.a.x, zipline.a.y) < 72;
    const from = nearA ? zipline.a : zipline.b;
    const to = nearA ? zipline.b : zipline.a;
    this.startTransit("zipline", from, to, 780, "双向滑索加速中");
    return true;
  }

  private resolveVentChoice(targetId: string): void {
    const source = this.activeVentId
      ? VENTS.find((item) => item.id === this.activeVentId)
      : undefined;
    if (!source || this.playerVentUses <= 0 || this.roundOver || !this.roundStarted) return;

    if (targetId === "hide") {
      this.playerVentUses -= 1;
      this.ventHideOrigin = { x: source.x, y: source.y };
      this.ventHiddenUntil = this.time.now + 10_000;
      this.activeVentId = undefined;
      window.dispatchEvent(
        new CustomEvent("space-hideout:vent", { detail: { uses: this.playerVentUses } })
      );
      window.dispatchEvent(new Event("space-hideout:vent-close"));
      this.publishStatus("已藏入跃迁管，10 秒后自动弹出");
      return;
    }

    const target = VENTS.find(
      (item) => item.id === targetId && item.networkId === source.networkId
    );
    if (!target || target.id === source.id) return;
    this.playerVentUses -= 1;
    this.player = { x: target.x, y: target.y };
    this.playerAnchor?.setPosition(this.player.x, this.player.y);
    this.activeVentId = undefined;
    window.dispatchEvent(
      new CustomEvent("space-hideout:vent", { detail: { uses: this.playerVentUses } })
    );
    window.dispatchEvent(new Event("space-hideout:vent-close"));
    this.publishStatus(`你从${target.label}甩开了追踪`);
  }

  private updateVentHide(time: number): void {
    if (!this.ventHiddenUntil || time < this.ventHiddenUntil) return;
    if (this.ventHideOrigin) {
      this.player = { ...this.ventHideOrigin };
      this.playerAnchor?.setPosition(this.player.x, this.player.y);
    }
    this.ventHideOrigin = undefined;
    this.ventHiddenUntil = undefined;
    this.publishStatus("跃迁管超时，已自动弹出");
  }

  private startTransit(
    kind: Transit["kind"],
    from: Point,
    to: Point,
    durationMs: number,
    label: string
  ): void {
    this.transit = { kind, from, to, startedAt: this.time.now, durationMs, label };
    this.player = { ...from };
    this.playerAnchor?.setPosition(this.player.x, this.player.y);
    this.publishStatus(label);
  }

  private updateTransit(time: number): void {
    const transit = this.transit;
    if (!transit) return;
    const progress = Phaser.Math.Clamp((time - transit.startedAt) / transit.durationMs, 0, 1);
    const eased = 1 - (1 - progress) * (1 - progress);
    this.player = {
      x: Phaser.Math.Linear(transit.from.x, transit.to.x, eased),
      y: Phaser.Math.Linear(transit.from.y, transit.to.y, eased)
    };
    this.playerAnchor?.setPosition(this.player.x, this.player.y);
    if (progress >= 1) {
      this.transit = undefined;
      this.publishStatus("滑索落地，继续躲藏");
    }
  }

  private getBotPositions(): { crewA: Point; crewB: Point; hunter: Point } {
    return {
      crewA: this.crewBots[0]?.position ?? { x: 360, y: 1240 },
      crewB: this.crewBots[1]?.position ?? { x: 2190, y: 1160 },
      hunter: this.hunterBot.position
    };
  }

  private updateBots(time: number, delta: number): void {
    this.updateHunter(time, delta);
    this.crewBots.forEach((bot) => this.updateCrewBot(bot, time, delta));
  }

  private updateHunter(time: number, delta: number): void {
    const hunter = this.hunterBot;
    const distanceToPlayer = Phaser.Math.Distance.Between(
      hunter.position.x,
      hunter.position.y,
      this.player.x,
      this.player.y
    );
    const canSeePlayer =
      distanceToPlayer < HUNTER_SIGHT_RANGE && this.hasClearPath(hunter.position, this.player);
    const finalHideMultiplier = this.isFinalHide() ? 1.25 : 1;

    if (canSeePlayer) {
      hunter.state = "chase";
      hunter.lastSeen = { ...this.player };
      hunter.trackedNodeId = nearestNavigationNode(
        NAVIGATION_NODES,
        this.player.x,
        this.player.y
      ).id;
      this.moveAgentToward(hunter, this.player, 300 * finalHideMultiplier, delta);
      return;
    }

    // The hunter only gets a coarse route ping. It must still follow corridors and
    // regain line of sight before switching back to the fast direct pursuit.
    if (!hunter.nextTrackRefreshAt || time >= hunter.nextTrackRefreshAt) {
      hunter.trackedNodeId = nearestNavigationNode(
        NAVIGATION_NODES,
        this.player.x,
        this.player.y
      ).id;
      hunter.nextTrackRefreshAt = time + HUNTER_TRACK_REFRESH_MS;
    }

    if (hunter.trackedNodeId || hunter.lastSeen) {
      hunter.state = "search";
      const target =
        hunter.trackedNodeId ??
        nearestNavigationNode(
          NAVIGATION_NODES,
          hunter.lastSeen?.x ?? this.player.x,
          hunter.lastSeen?.y ?? this.player.y
        ).id;
      this.routeAgentTo(hunter, target);
      this.moveAgentAlongRoute(hunter, 212 * finalHideMultiplier, delta);
      return;
    }

    hunter.state = "patrol";
    const target = hunter.patrolNodes[hunter.patrolIndex] ?? "reactor";
    this.routeAgentTo(hunter, target);
    this.moveAgentAlongRoute(hunter, 180 * finalHideMultiplier, delta);
    if (this.isAtNavigationNode(hunter, target)) {
      hunter.patrolIndex = (hunter.patrolIndex + 1) % hunter.patrolNodes.length;
      hunter.routeTarget = undefined;
    }
  }

  private updateCrewBot(bot: BotAgent, time: number, delta: number): void {
    const hunterDistance = Phaser.Math.Distance.Between(
      bot.position.x,
      bot.position.y,
      this.hunterBot.position.x,
      this.hunterBot.position.y
    );
    if (hunterDistance < 300) {
      bot.state = "flee";
      if (hunterDistance < 115 && this.tryBotVent(bot)) return;
      const safeNode = NAVIGATION_NODES.reduce((best, node) => {
        const bestDistance = Phaser.Math.Distance.Between(
          best.x,
          best.y,
          this.hunterBot.position.x,
          this.hunterBot.position.y
        );
        const nodeDistance = Phaser.Math.Distance.Between(
          node.x,
          node.y,
          this.hunterBot.position.x,
          this.hunterBot.position.y
        );
        return nodeDistance > bestDistance ? node : best;
      });
      this.routeAgentTo(bot, safeNode.id);
      this.moveAgentAlongRoute(bot, 188, delta);
      return;
    }

    const remainingTasks = this.terminals.filter((terminal) => !terminal.done);
    if (remainingTasks.length === 0 || this.isFinalHide()) {
      bot.state = "patrol";
      const target = bot.patrolNodes[bot.patrolIndex] ?? "cargo";
      this.routeAgentTo(bot, target);
      this.moveAgentAlongRoute(bot, 126, delta);
      if (this.isAtNavigationNode(bot, target)) {
        bot.patrolIndex = (bot.patrolIndex + 1) % bot.patrolNodes.length;
        bot.routeTarget = undefined;
      }
      return;
    }

    const terminal = remainingTasks[bot.preferredTaskOffset % remainingTasks.length];
    if (!terminal) return;
    bot.state = "repair";
    this.routeAgentTo(bot, terminal.id);
    this.moveAgentAlongRoute(bot, 142, delta);
    if (Phaser.Math.Distance.Between(bot.position.x, bot.position.y, terminal.x, terminal.y) < 62) {
      if (!bot.taskStartedAt) bot.taskStartedAt = time;
      if (time - bot.taskStartedAt > 2_400) {
        this.completeTerminal(terminal, bot.label);
        bot.taskStartedAt = undefined;
        bot.routeTarget = undefined;
      }
    } else {
      bot.taskStartedAt = undefined;
    }
  }

  private routeAgentTo(agent: BotAgent, targetId: string): void {
    if (agent.routeTarget === targetId && agent.route.length > 0) return;
    const start = nearestNavigationNode(NAVIGATION_NODES, agent.position.x, agent.position.y).id;
    agent.route = findNavigationPath(NAVIGATION_NODES, start, targetId).slice(1);
    agent.routeTarget = targetId;
  }

  private moveAgentAlongRoute(agent: BotAgent, speed: number, delta: number): void {
    const targetId = agent.route[0];
    if (!targetId) return;
    const target = NAVIGATION_NODES.find((node) => node.id === targetId);
    if (!target) return;
    this.moveAgentToward(agent, target, speed, delta);
    if (Phaser.Math.Distance.Between(agent.position.x, agent.position.y, target.x, target.y) < 14) {
      agent.position = { x: target.x, y: target.y };
      agent.route.shift();
    }
  }

  private moveAgentToward(agent: BotAgent, target: Point, speed: number, delta: number): void {
    const distance = Phaser.Math.Distance.Between(
      agent.position.x,
      agent.position.y,
      target.x,
      target.y
    );
    if (distance < 1) return;
    const step = Math.min(distance, (speed * Math.min(delta, 70)) / 1000);
    agent.position = moveCircleWithCollision(
      agent.position,
      {
        x: ((target.x - agent.position.x) / distance) * step,
        y: ((target.y - agent.position.y) / distance) * step
      },
      BOT_RADIUS,
      WALLS,
      { minX: 0, minY: 0, maxX: MAP_WIDTH, maxY: MAP_HEIGHT }
    );
  }

  private isAtNavigationNode(agent: BotAgent, nodeId: string): boolean {
    const node = NAVIGATION_NODES.find((item) => item.id === nodeId);
    return Boolean(
      node && Phaser.Math.Distance.Between(agent.position.x, agent.position.y, node.x, node.y) < 18
    );
  }

  private hasClearPath(start: Point, end: Point): boolean {
    const distance = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
    const samples = Math.ceil(distance / 16);
    for (let index = 1; index < samples; index += 1) {
      const ratio = index / samples;
      if (
        this.isBlocked(
          Phaser.Math.Linear(start.x, end.x, ratio),
          Phaser.Math.Linear(start.y, end.y, ratio),
          BOT_RADIUS
        )
      ) {
        return false;
      }
    }
    return true;
  }

  private tryBotVent(bot: BotAgent): boolean {
    if (bot.ventUses <= 0) return false;
    const vent = VENTS.find(
      (item) => Phaser.Math.Distance.Between(bot.position.x, bot.position.y, item.x, item.y) < 92
    );
    const exit = vent
      ? VENTS.filter((item) => item.networkId === vent.networkId && item.id !== vent.id).sort(
          (first, second) =>
            Phaser.Math.Distance.Between(
              second.x,
              second.y,
              this.hunterBot.position.x,
              this.hunterBot.position.y
            ) -
            Phaser.Math.Distance.Between(
              first.x,
              first.y,
              this.hunterBot.position.x,
              this.hunterBot.position.y
            )
        )[0]
      : undefined;
    if (!exit) return false;
    bot.position = { x: exit.x, y: exit.y };
    bot.ventUses -= 1;
    bot.route = [];
    bot.routeTarget = undefined;
    return true;
  }

  private drawFacilityMotion(g: Phaser.GameObjects.Graphics, time: number): void {
    const reactorAngle = time / 900;
    const reactorX = 2140;
    const reactorY = 420;
    g.lineStyle(5, 0xf7c65b, 0.18);
    g.strokeCircle(reactorX, reactorY, 118 + Math.sin(time / 280) * 6);
    g.lineStyle(2, 0xf7c65b, 0.66);
    for (let i = 0; i < 4; i += 1) {
      const angle = reactorAngle + (Math.PI / 2) * i;
      g.lineBetween(
        reactorX + Math.cos(angle) * 46,
        reactorY + Math.sin(angle) * 46,
        reactorX + Math.cos(angle) * 104,
        reactorY + Math.sin(angle) * 104
      );
    }
    g.fillStyle(0xf7c65b, 0.72 + Math.sin(time / 170) * 0.16);
    g.fillCircle(reactorX, reactorY, 28);

    g.fillStyle(0x35d9c7, 0.28);
    for (let i = 0; i < 22; i += 1) {
      const x = 160 + ((i * 193 + time / 13) % 2240);
      const y = 150 + ((i * 97 + time / 23) % 1260);
      g.fillCircle(x, y, i % 4 === 0 ? 3 : 1.5);
    }

    const doorAlpha = 0.26 + Math.sin(time / 500) * 0.14;
    g.fillStyle(0x35d9c7, doorAlpha);
    g.fillRect(1170, 674, 10, 48);
    g.fillRect(1780, 745, 10, 48);
    g.fillRect(830, 1154, 10, 48);
  }

  private drawTerminals(g: Phaser.GameObjects.Graphics, time: number): void {
    for (const terminal of this.terminals) {
      const pulse = (Math.sin(time / 280 + terminal.x) + 1) / 2;
      const color = terminal.done ? 0x8be16c : 0xf7c65b;
      g.fillStyle(color, terminal.done ? 0.22 : 0.1 + pulse * 0.16);
      g.fillCircle(terminal.x, terminal.y, 46 + pulse * 10);
      g.fillStyle(0x16363a, 1);
      g.fillRoundedRect(terminal.x - 20, terminal.y - 28, 40, 56, 8);
      g.lineStyle(2, color, 0.9);
      g.strokeRoundedRect(terminal.x - 20, terminal.y - 28, 40, 56, 8);
      g.fillStyle(color, terminal.done ? 0.95 : 0.65 + pulse * 0.3);
      g.fillCircle(terminal.x, terminal.y - 7, 7);
      if (terminal.done) {
        g.lineStyle(3, 0xeffbf8, 0.86);
        g.lineBetween(terminal.x - 10, terminal.y + 10, terminal.x - 2, terminal.y + 18);
        g.lineBetween(terminal.x - 2, terminal.y + 18, terminal.x + 13, terminal.y + 2);
      }
    }
  }

  private drawVents(g: Phaser.GameObjects.Graphics, time: number): void {
    for (const vent of VENTS) {
      const pulse = 0.6 + Math.sin(time / 250 + vent.x) * 0.22;
      g.lineStyle(2, 0x6c7dff, pulse);
      g.strokeCircle(vent.x, vent.y, 20);
      g.lineStyle(3, 0x35d9c7, 0.72);
      g.strokeCircle(vent.x, vent.y, 12);
      g.fillStyle(0x112e40, 1);
      g.fillCircle(vent.x, vent.y, 8);
      g.lineStyle(1, 0xeefbf8, 0.45);
      g.lineBetween(vent.x - 5, vent.y - 2, vent.x + 5, vent.y - 2);
      g.lineBetween(vent.x - 5, vent.y + 3, vent.x + 5, vent.y + 3);
    }
  }

  private drawZiplines(g: Phaser.GameObjects.Graphics, time: number): void {
    for (const zipline of ZIPLINES) {
      g.lineStyle(3, 0xf0647c, 0.72);
      g.lineBetween(zipline.a.x, zipline.a.y, zipline.b.x, zipline.b.y);
      for (const endpoint of [zipline.a, zipline.b]) {
        g.fillStyle(0x251e24, 1);
        g.fillCircle(endpoint.x, endpoint.y, 18);
        g.lineStyle(3, 0xf0647c, 0.9);
        g.strokeCircle(endpoint.x, endpoint.y, 18 + Math.sin(time / 150 + endpoint.x) * 2);
        g.fillStyle(0xf7c65b, 0.9);
        g.fillCircle(endpoint.x, endpoint.y, 6);
      }
    }
  }

  private drawBots(
    g: Phaser.GameObjects.Graphics,
    positions: { crewA: Point; crewB: Point; hunter: Point },
    time: number
  ): void {
    const hunterAngle = Phaser.Math.Angle.Between(
      positions.hunter.x,
      positions.hunter.y,
      this.player.x,
      this.player.y
    );
    const spread = Phaser.Math.DegToRad(23);
    g.fillStyle(0xf0647c, 0.13);
    g.fillTriangle(
      positions.hunter.x,
      positions.hunter.y,
      positions.hunter.x + Math.cos(hunterAngle - spread) * 280,
      positions.hunter.y + Math.sin(hunterAngle - spread) * 280,
      positions.hunter.x + Math.cos(hunterAngle + spread) * 280,
      positions.hunter.y + Math.sin(hunterAngle + spread) * 280
    );
    this.drawAgent(g, positions.crewA, 0x8be16c, time, false);
    this.drawAgent(g, positions.crewB, 0x6c7dff, time + 540, false);
    this.drawAgent(g, positions.hunter, 0xf0647c, time, true);
  }

  private drawPlayer(g: Phaser.GameObjects.Graphics, time: number): void {
    if (this.deathMarker || this.ventHiddenUntil) return;
    const spread = Phaser.Math.DegToRad(28);
    const range = 235;
    g.fillStyle(0xeffbf8, 0.1);
    g.fillTriangle(
      this.player.x,
      this.player.y,
      this.player.x + Math.cos(this.facing - spread) * range,
      this.player.y + Math.sin(this.facing - spread) * range,
      this.player.x + Math.cos(this.facing + spread) * range,
      this.player.y + Math.sin(this.facing + spread) * range
    );
    this.drawAgent(
      g,
      this.player,
      this.toColor(this.appearance.color),
      time,
      false,
      this.appearance
    );
    g.lineStyle(2, 0xeffbf8, 0.74);
    g.strokeCircle(this.player.x, this.player.y, 31 + Math.sin(time / 220) * 2);
  }

  private drawDeathMarker(g: Phaser.GameObjects.Graphics, time: number): void {
    const marker = this.deathMarker;
    if (!marker) return;
    const flicker = 0.58 + Math.sin(time / 120) * 0.16;
    g.fillStyle(0x000000, 0.34);
    g.fillEllipse(marker.x, marker.y + 18, 62, 18);
    g.fillStyle(this.toColor(this.appearance.color), 0.58);
    g.fillRoundedRect(marker.x - 26, marker.y - 8, 52, 28, 12);
    g.fillStyle(0x102126, 0.96);
    g.fillRoundedRect(marker.x - 8, marker.y - 19, 35, 18, 8);
    g.lineStyle(2, 0xf7c65b, flicker);
    g.strokeCircle(marker.x, marker.y, 36 + Math.sin(time / 180) * 3);
    g.fillStyle(0xf0647c, flicker);
    g.fillCircle(marker.x - 18, marker.y + 7, 3);
    g.fillCircle(marker.x + 4, marker.y + 20, 2);
  }

  private drawAgent(
    g: Phaser.GameObjects.Graphics,
    position: Point,
    color: number,
    time: number,
    hunter: boolean,
    appearance?: Appearance
  ): void {
    const bob = Math.sin(time / 180 + position.x) * 2.5;
    const x = position.x;
    const y = position.y + bob;
    g.fillStyle(0x000000, 0.26);
    g.fillEllipse(x, y + 24, 48, 14);

    const packColor =
      appearance?.pack === "signal" ? 0x8be16c : appearance?.pack === "jet" ? 0xf0647c : 0x5d8587;
    g.fillStyle(packColor, 1);
    g.fillRoundedRect(x - 27, y - 8, 12, 31, 5);
    if (appearance?.pack === "jet") {
      g.fillStyle(0xf7c65b, 0.76 + Math.sin(time / 90) * 0.24);
      g.fillTriangle(x - 23, y + 24, x - 30, y + 40, x - 16, y + 40);
    }
    if (appearance?.pack === "cargo") {
      g.fillStyle(0x89784f, 1);
      g.fillRoundedRect(x - 31, y - 8, 16, 38, 4);
    }

    g.fillStyle(color, 1);
    g.fillRoundedRect(x - 17, y - 30, 34, 53, 16);
    g.fillStyle(0x061116, 0.18);
    g.fillRoundedRect(x - 9, y + 9, 18, 14, 6);
    g.fillStyle(0xeaffff, 1);
    g.fillRoundedRect(x + 1, y - 17, 26, 16, 8);
    g.fillStyle(0x4f9ab5, 0.75);
    g.fillRoundedRect(x + 5, y - 14, 18, 7, 4);

    if (appearance?.mask === "grid") {
      g.lineStyle(1, 0xf7c65b, 0.9);
      for (let i = 0; i < 4; i += 1) g.lineBetween(x + 3 + i * 5, y - 18, x + 3 + i * 5, y - 1);
    }
    if (appearance?.mask === "pulse") {
      g.fillStyle(0xf0647c, 0.72 + Math.sin(time / 100) * 0.28);
      g.fillCircle(x + 15, y - 9, 5);
    }

    if (hunter) {
      g.lineStyle(3, 0xf7c65b, 0.86);
      g.lineBetween(x - 10, y - 34, x + 12, y - 46);
    } else if (appearance?.hat === "cap") {
      g.fillStyle(0xf7c65b, 1);
      g.fillRoundedRect(x - 11, y - 43, 24, 12, 6);
    } else if (appearance?.hat === "antenna") {
      g.lineStyle(3, 0xf7c65b, 1);
      g.lineBetween(x, y - 31, x, y - 52);
      g.fillStyle(0xf0647c, 0.7 + Math.sin(time / 100) * 0.3);
      g.fillCircle(x, y - 55, 5);
    } else if (appearance?.hat === "halo") {
      g.lineStyle(3, 0xf7c65b, 0.92);
      g.strokeEllipse(x, y - 43, 46, 13);
    } else if (appearance?.hat === "visor") {
      g.fillStyle(0xf0647c, 1);
      g.fillRect(x - 6, y - 28, 28, 6);
    } else if (appearance?.hat === "beacon") {
      g.fillStyle(0xf0647c, 0.6 + Math.sin(time / 90) * 0.4);
      g.fillCircle(x, y - 40, 8);
    }

    if (appearance?.expression === "alert") {
      g.fillStyle(0xf0647c, 0.95);
      g.fillTriangle(x + 27, y - 33, x + 34, y - 20, x + 20, y - 20);
    }
    if (appearance?.expression === "wave") {
      g.lineStyle(3, 0xeffbf8, 0.9);
      g.lineBetween(x + 18, y - 3, x + 31, y - 17 + Math.sin(time / 80) * 5);
    }
    if (appearance?.expression === "scan") {
      g.lineStyle(2, 0x35d9c7, 0.8);
      g.lineBetween(x + 1, y - 9, x + 26, y - 9);
    }
  }

  private positionLabels(positions: { crewA: Point; crewB: Point; hunter: Point }): void {
    const labelData = [
      [
        positions.crewA,
        `${this.crewBots[0]?.label ?? "BOT-星尘"} · ${this.botStateCopy(this.crewBots[0]?.state)}`
      ],
      [
        positions.crewB,
        `${this.crewBots[1]?.label ?? "BOT-轨道"} · ${this.botStateCopy(this.crewBots[1]?.state)}`
      ],
      [positions.hunter, `${this.hunterBot.label} · ${this.botStateCopy(this.hunterBot.state)}`]
    ] as const;
    labelData.forEach(([position, label], index) => {
      this.botLabels[index]?.setText(label).setPosition(position.x, position.y + 42);
    });
  }

  private botStateCopy(state: BotState | undefined): string {
    if (state === "chase") return "追击";
    if (state === "search") return "搜索";
    if (state === "repair") return "修复";
    if (state === "flee") return "撤离";
    return "巡逻";
  }

  private createLabel(text: string, color: string): Phaser.GameObjects.Text {
    return this.add
      .text(0, 0, text, {
        color,
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        backgroundColor: "#071116aa",
        padding: { x: 5, y: 3 }
      })
      .setOrigin(0.5)
      .setDepth(3);
  }

  private publishTelemetry(danger: number, time: number): void {
    window.dispatchEvent(
      new CustomEvent("space-hideout:telemetry", {
        detail: {
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          danger,
          time,
          remainingSeconds: Math.ceil(this.remainingRoundMs / 1000),
          phase: this.roundPhase()
        }
      })
    );
  }

  private resetRound(): void {
    const crewA = this.crewBots[0];
    const crewB = this.crewBots[1];
    if (!crewA || !crewB) return;
    this.remainingRoundMs = ROUND_HIDE_MS;
    this.roundOver = false;
    this.announcedFinalHide = false;
    this.deathMarker = undefined;
    this.transit = undefined;
    this.activeVentId = undefined;
    this.ventHideOrigin = undefined;
    this.ventHiddenUntil = undefined;
    this.playerVentUses = MAX_VENT_USES;
    this.crewBots = [
      {
        ...crewA,
        position: { x: 360, y: 1240 },
        state: "repair",
        route: [],
        routeTarget: undefined,
        taskStartedAt: undefined,
        lastSeen: undefined,
        ventUses: 2
      },
      {
        ...crewB,
        position: { x: 2190, y: 1160 },
        state: "repair",
        route: [],
        routeTarget: undefined,
        taskStartedAt: undefined,
        lastSeen: undefined,
        ventUses: 2
      }
    ];
    this.hunterBot = {
      ...this.hunterBot,
      position: { x: 2110, y: 530 },
      state: "patrol",
      route: [],
      routeTarget: undefined,
      lastSeen: undefined,
      nextTrackRefreshAt: undefined,
      trackedNodeId: undefined,
      patrolIndex: 0
    };
    this.terminals.forEach((terminal) => {
      terminal.done = false;
    });
    window.dispatchEvent(
      new CustomEvent("space-hideout:task", {
        detail: { completed: 0, total: this.terminals.length }
      })
    );
    window.dispatchEvent(
      new CustomEvent("space-hideout:vent", { detail: { uses: this.playerVentUses } })
    );
    window.dispatchEvent(new Event("space-hideout:vent-close"));
    this.publishStatus("已回到出生舱，新的躲藏回合开始");
  }

  private finishRound(outcome: "caught" | "escaped"): void {
    this.roundOver = true;
    if (outcome === "caught") this.deathMarker = { ...this.player };
    this.cameras.main.shake(220, outcome === "caught" ? 0.006 : 0.003);
    this.publishStatus(
      outcome === "caught"
        ? "猎手已捕获你，点击回到出生舱重新开始"
        : "你成功存活，点击回到出生舱再来一局"
    );
  }

  private isFinalHide(): boolean {
    return !this.roundOver && this.remainingRoundMs <= FINAL_HIDE_MS;
  }

  private roundPhase(): "hide" | "final_hide" | "ended" {
    if (this.roundOver) return "ended";
    return this.isFinalHide() ? "final_hide" : "hide";
  }

  private publishStatus(message: string): void {
    window.dispatchEvent(new CustomEvent("space-hideout:status", { detail: { message } }));
  }

  private toColor(hex: string): number {
    return Phaser.Display.Color.HexStringToColor(hex).color;
  }
}
