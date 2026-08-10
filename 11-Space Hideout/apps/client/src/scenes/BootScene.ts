import Phaser from "phaser";

const MAP_WIDTH = 2600;
const MAP_HEIGHT = 1600;
const PLAYER_RADIUS = 22;
const ROUND_HIDE_MS = 90_000;
const FINAL_HIDE_MS = 25_000;
const TERMINAL_TIME_REDUCTION_MS = 8_000;
const CAPTURE_DISTANCE = 48;

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
  { x: 2280, y: 1220, width: 120, height: 170 }
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
    { id: "comms", label: "通讯阵列", x: 1470, y: 680, done: false },
    { id: "reactor", label: "反应堆调相器", x: 2180, y: 390, done: false }
  ];
  private botLabels: Phaser.GameObjects.Text[] = [];
  private lastTelemetryAt = 0;
  private remainingRoundMs = ROUND_HIDE_MS;
  private roundOver = false;
  private announcedFinalHide = false;
  private readonly onAppearance = (event: Event): void => {
    const customEvent = event as CustomEvent<Partial<Appearance>>;
    this.appearance = { ...this.appearance, ...customEvent.detail };
  };
  private readonly onReset = (): void => {
    this.player = { x: 285, y: 1180 };
    this.facing = -Math.PI / 2;
    this.resetRound();
  };
  private readonly onOverview = (): void => {
    const camera = this.cameras.main;
    camera.zoomTo(0.42, 380);
    this.time.delayedCall(1700, () => camera.zoomTo(1.05, 480));
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
    window.addEventListener("space-hideout:overview", this.onOverview);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("space-hideout:appearance", this.onAppearance);
      window.removeEventListener("space-hideout:reset", this.onReset);
      window.removeEventListener("space-hideout:overview", this.onOverview);
    });

    this.publishStatus("逃离猎手，修复终端可缩短普通躲藏时间");
    this.publishTelemetry(0, 0);
  }

  update(time: number, delta: number): void {
    if (!this.dynamicGraphics || !this.playerAnchor) {
      return;
    }

    if (!this.roundOver) this.updatePlayer(delta);
    if (!this.roundOver && this.keys && Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
      this.tryRepairTerminal();
    }

    const positions = this.getBotPositions(time);
    if (!this.roundOver) {
      this.remainingRoundMs = Math.max(0, this.remainingRoundMs - delta);
      if (this.isFinalHide() && !this.announcedFinalHide) {
        this.announcedFinalHide = true;
        this.publishStatus("FINAL HIDE：终端关闭，猎手正在加速追踪");
      }
    }
    this.dynamicGraphics.clear();
    this.drawFacilityMotion(this.dynamicGraphics, time);
    this.drawTerminals(this.dynamicGraphics, time);
    this.drawBots(this.dynamicGraphics, positions, time);
    this.drawPlayer(this.dynamicGraphics, time);
    this.positionLabels(positions);

    const hunter = positions.hunter;
    const danger = Phaser.Math.Clamp(
      1 - Phaser.Math.Distance.Between(this.player.x, this.player.y, hunter.x, hunter.y) / 680,
      0,
      1
    );
    if (
      !this.roundOver &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, hunter.x, hunter.y) <=
        CAPTURE_DISTANCE
    ) {
      this.finishRound("caught");
    } else if (!this.roundOver && this.remainingRoundMs <= 0) {
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

    g.lineStyle(34, 0x173d3f, 0.96);
    g.lineBetween(700, 1200, 990, 1180);
    g.lineBetween(1200, 1030, 1470, 900);
    g.lineBetween(1730, 690, 1900, 470);
    g.lineBetween(1700, 900, 1990, 1110);
    g.lineBetween(760, 620, 1240, 660);
    g.lineStyle(3, 0x35d9c7, 0.33);
    g.lineBetween(700, 1200, 990, 1180);
    g.lineBetween(1200, 1030, 1470, 900);
    g.lineBetween(1730, 690, 1900, 470);
    g.lineBetween(1700, 900, 1990, 1110);
    g.lineBetween(760, 620, 1240, 660);

    for (const wall of WALLS) {
      g.fillStyle(0x122f33, 1);
      g.fillRoundedRect(wall.x, wall.y, wall.width, wall.height, 10);
      g.lineStyle(2, 0x5b9291, 0.5);
      g.strokeRoundedRect(wall.x, wall.y, wall.width, wall.height, 10);
      g.lineStyle(1, 0x35d9c7, 0.18);
      g.lineBetween(wall.x + 12, wall.y + 16, wall.x + wall.width - 12, wall.y + 16);
    }

    this.add
      .text(205, 1325, "SPAWN BAY", {
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
    const step = (speed * delta) / 1000;
    const nextX = this.player.x + directionX * step;
    const nextY = this.player.y + directionY * step;

    if (!this.isBlocked(nextX, this.player.y)) this.player.x = nextX;
    if (!this.isBlocked(this.player.x, nextY)) this.player.y = nextY;
    this.playerAnchor.setPosition(this.player.x, this.player.y);
  }

  private isBlocked(x: number, y: number): boolean {
    if (
      x < 115 + PLAYER_RADIUS ||
      y < 115 + PLAYER_RADIUS ||
      x > MAP_WIDTH - 115 - PLAYER_RADIUS ||
      y > MAP_HEIGHT - 115 - PLAYER_RADIUS
    ) {
      return true;
    }
    return WALLS.some(
      (wall) =>
        x + PLAYER_RADIUS > wall.x &&
        x - PLAYER_RADIUS < wall.x + wall.width &&
        y + PLAYER_RADIUS > wall.y &&
        y - PLAYER_RADIUS < wall.y + wall.height
    );
  }

  private tryRepairTerminal(): void {
    if (this.isFinalHide()) {
      this.publishStatus("FINAL HIDE 中终端已关闭，只能继续逃跑");
      return;
    }
    const terminal = this.terminals.find(
      (item) =>
        !item.done &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) < 78
    );
    if (!terminal) {
      this.publishStatus("附近没有可修复的终端");
      return;
    }
    terminal.done = true;
    const completed = this.terminals.filter((item) => item.done).length;
    const reducibleTime = Math.max(0, this.remainingRoundMs - FINAL_HIDE_MS);
    const reduction = Math.min(TERMINAL_TIME_REDUCTION_MS, reducibleTime);
    this.remainingRoundMs -= reduction;
    this.publishStatus(
      `${terminal.label} 已修复，猎手搜索时间减少 ${Math.ceil(reduction / 1000)} 秒`
    );
    window.dispatchEvent(new CustomEvent("space-hideout:task", { detail: { completed } }));
  }

  private getBotPositions(time: number): { crewA: Point; crewB: Point; hunter: Point } {
    const hunterTime = time * (this.isFinalHide() ? 1.28 : 1);
    return {
      crewA: this.pointOnLoop(time / 8800, [
        { x: 360, y: 1240 },
        { x: 920, y: 1180 },
        { x: 1480, y: 780 },
        { x: 1260, y: 580 },
        { x: 620, y: 650 },
        { x: 300, y: 960 }
      ]),
      crewB: this.pointOnLoop(time / 9800 + 0.35, [
        { x: 2190, y: 1160 },
        { x: 1880, y: 840 },
        { x: 2100, y: 430 },
        { x: 1560, y: 650 },
        { x: 1740, y: 1050 }
      ]),
      hunter: this.pointOnLoop(hunterTime / 7600 + 0.12, [
        { x: 2110, y: 530 },
        { x: 1660, y: 620 },
        { x: 1420, y: 930 },
        { x: 2020, y: 1120 },
        { x: 2290, y: 880 }
      ])
    };
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
      [positions.crewA, "BOT-星尘"],
      [positions.crewB, "BOT-轨道"],
      [positions.hunter, "BOT-棱镜"]
    ] as const;
    labelData.forEach(([position], index) =>
      this.botLabels[index]?.setPosition(position.x, position.y + 42)
    );
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
    this.remainingRoundMs = ROUND_HIDE_MS;
    this.roundOver = false;
    this.announcedFinalHide = false;
    this.terminals.forEach((terminal) => {
      terminal.done = false;
    });
    window.dispatchEvent(new CustomEvent("space-hideout:task", { detail: { completed: 0 } }));
    this.publishStatus("已回到出生舱，新的躲藏回合开始");
  }

  private finishRound(outcome: "caught" | "escaped"): void {
    this.roundOver = true;
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

  private pointOnLoop(progress: number, points: Point[]): Point {
    const wrapped = Phaser.Math.Wrap(progress, 0, 1);
    const scaled = wrapped * points.length;
    const index = Math.floor(scaled);
    const nextIndex = (index + 1) % points.length;
    const local = scaled - index;
    const start = points[index] ?? points[0] ?? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const end = points[nextIndex] ?? start;
    return {
      x: Phaser.Math.Linear(start.x, end.x, local),
      y: Phaser.Math.Linear(start.y, end.y, local)
    };
  }

  private toColor(hex: string): number {
    return Phaser.Display.Color.HexStringToColor(hex).color;
  }
}
