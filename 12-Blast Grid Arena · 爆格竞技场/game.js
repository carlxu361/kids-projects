(() => {
  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");

  const ui = {
    timeLabel: document.querySelector("#timeLabel"),
    gateLabel: document.querySelector("#gateLabel"),
    startButton: document.querySelector("#startButton"),
    totalPlayers: document.querySelector("#totalPlayers"),
    humanPlayers: document.querySelector("#humanPlayers"),
    controlMode: document.querySelector("#controlMode"),
    settingsButton: document.querySelector("#settingsButton"),
    settingsPanel: document.querySelector("#settingsPanel"),
    closeSettings: document.querySelector("#closeSettings"),
    skinMode: document.querySelector("#skinMode"),
    themeButtons: document.querySelector("#themeButtons"),
    roster: document.querySelector("#roster"),
    itemLegend: document.querySelector("#itemLegend"),
    scoreList: document.querySelector("#scoreList"),
    overlay: document.querySelector("#messageOverlay"),
    touchDock: document.querySelector("#touchDock"),
    muteButton: document.querySelector("#muteButton"),
  };

  const TILE = 44;
  const COLS = 19;
  const ROWS = 13;
  const WORLD_W = COLS * TILE;
  const WORLD_H = ROWS * TILE;
  const ROUND_SECONDS = 180;
  const PLAYER_RADIUS = 15;
  const BOMB_RADIUS = 16;
  const DEFAULT_BOMB_TIMER = 2.15;
  const AI_THINK_RATE = 0.16;
  const PRESSURE_START_SECONDS = 60;
  const PRESSURE_WARNING_SECONDS = 0.95;
  const INPUT_DEAD_ZONE = 0.18;
  const GRID_ALIGN_EPSILON = 0.65;
  const POISON_DURATION = 9;
  const POISON_SPREAD_COOLDOWN = 0.75;

  const roleDefs = [
    {
      id: "dasher",
      name: "脉冲穿梭者",
      short: "冲",
      color: "#42e8ca",
      bombLimit: 1,
      range: 1,
      speed: 136,
      kick: false,
      shield: 0,
      skill: "dash",
      skillName: "直冲",
      skillCooldown: 5.5,
      badge: "boltRing",
      perk: "直冲到墙",
    },
    {
      id: "tinker",
      name: "齿轮技师",
      short: "工",
      color: "#f8c84d",
      bombLimit: 2,
      range: 1,
      speed: 112,
      kick: false,
      shield: 0,
      skill: "remote",
      skillName: "遥爆",
      skillCooldown: 6,
      badge: "moduleChain",
      perk: "遥爆旧弹",
    },
    {
      id: "warden",
      name: "石盾守卫",
      short: "盾",
      color: "#a8d96b",
      bombLimit: 1,
      range: 2,
      speed: 96,
      kick: false,
      shield: 5,
      skill: "shield",
      skillName: "护盾",
      skillCooldown: 8,
      badge: "starCore",
      perk: "护盾脉冲",
    },
    {
      id: "striker",
      name: "弹脚骑手",
      short: "踢",
      color: "#ff7c67",
      bombLimit: 1,
      range: 1,
      speed: 122,
      kick: true,
      shield: 0,
      skill: "shockKick",
      skillName: "冲击踢",
      skillCooldown: 5,
      badge: "botFace",
      perk: "远距踢弹",
    },
  ];

  const badgeDefs = [
    { id: "boltRing", name: "环闪" },
    { id: "moduleChain", name: "模块链" },
    { id: "starCore", name: "星核" },
    { id: "botFace", name: "机脸" },
    { id: "softLoop", name: "蓝环" },
    { id: "knotCore", name: "结环" },
    { id: "cloudTerminal", name: "云端" },
    { id: "greenHelper", name: "绿助" },
    { id: "orangeBurst", name: "橙芒" },
    { id: "ribbonOrbit", name: "彩带环" },
    { id: "whaleWave", name: "蓝鲸" },
    { id: "violetBlocks", name: "紫块" },
    { id: "catBot", name: "猫机" },
  ];

  const pickupDefs = [
    { type: "gem", name: "宝石", short: "宝石", effect: "开门能量 +1 分", tone: "gem" },
    { type: "bombUp", name: "炸弹包", short: "+弹", effect: "可同时多放 1 颗炸弹", tone: "good" },
    { type: "fireUp", name: "火力芯", short: "+火", effect: "爆炸范围增加 1 格", tone: "good" },
    { type: "speedUp", name: "疾跑靴", short: "+速", effect: "移动速度提高", tone: "good" },
    { type: "kick", name: "踢弹靴", short: "踢", effect: "碰到炸弹会把它踢走", tone: "good" },
    { type: "shield", name: "护盾", short: "盾", effect: "挡下一次危险", tone: "shield" },
    { type: "poisonFastBomb", name: "急爆毒", short: "☠快弹", effect: "感染后新炸弹更快爆", tone: "poisonFastBomb" },
    { type: "poisonSlowBomb", name: "迟爆毒", short: "☠慢弹", effect: "感染后新炸弹更慢爆", tone: "poisonSlowBomb" },
    { type: "poisonHaste", name: "疾走毒", short: "☠加速", effect: "感染后移动更快", tone: "poisonHaste" },
    { type: "poisonSlow", name: "黏步毒", short: "☠减速", effect: "感染后移动更慢", tone: "poisonSlow" },
  ];

  const themeDefs = {
    arcade: {
      floorA: "#202026",
      floorB: "#292733",
      solid: "#0f1118",
      solidEdge: "#39d9c8",
      crate: "#654ab7",
      crateEdge: "#ffbf47",
      danger: "#ff5d6c",
      glow: "#39d9c8",
      gem: "#f6e665",
      gate: "#b7f7ff",
      portal: "#9c6bff",
      ice: "#62d8ff",
    },
    garden: {
      floorA: "#263420",
      floorB: "#304126",
      solid: "#182018",
      solidEdge: "#8cdc68",
      crate: "#6f5131",
      crateEdge: "#f6cf59",
      danger: "#ff7666",
      glow: "#8cdc68",
      gem: "#fff07a",
      gate: "#e7ffd0",
      portal: "#7bb0ff",
      ice: "#9be9d0",
    },
    forge: {
      floorA: "#2a2521",
      floorB: "#362e27",
      solid: "#17120f",
      solidEdge: "#ffbf47",
      crate: "#7b3f29",
      crateEdge: "#61d6ff",
      danger: "#ff6b4a",
      glow: "#ffbf47",
      gem: "#ffd56b",
      gate: "#bde9ff",
      portal: "#61d6ff",
      ice: "#9cc6d3",
    },
  };

  const keyControls = [
    { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", bomb: "Space", skill: "ShiftLeft" },
    { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", bomb: "Enter", skill: "Slash" },
    { up: "KeyI", down: "KeyK", left: "KeyJ", right: "KeyL", bomb: "KeyO", skill: "KeyU" },
    { up: "KeyT", down: "KeyG", left: "KeyF", right: "KeyH", bomb: "KeyY", skill: "KeyR" },
  ];

  let grid = [];
  let specialTiles = new Map();
  let players = [];
  let bombs = [];
  let blasts = [];
  let pickups = [];
  let pressureWarnings = [];
  let pressureOrder = [];
  let particles = [];
  let keys = new Set();
  let virtualInputs = [];
  let activeSticks = new Map();
  let roleSelections = ["dasher", "tinker", "warden", "striker"];
  let badgeSelections = ["boltRing", "moduleChain", "starCore", "botFace"];
  let audioCtx = null;
  let muted = false;
  let lastTime = performance.now();

  const state = {
    phase: "menu",
    theme: "arcade",
    timeLeft: ROUND_SECONDS,
    gateOpen: false,
    gateReason: "",
    pressureStarted: false,
    pressureNext: 0,
    pressureIndex: 0,
    skinMode: "ai",
    totalPlayers: 4,
    humanPlayers: 2,
    roundMessage: "调好人数、操作和角色，然后开始一局 3 分钟的爆格赛。",
    messageTimer: 0,
  };

  function keyOf(x, y) {
    return `${x},${y}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function gridX(px) {
    return Math.floor(px / TILE);
  }

  function gridY(py) {
    return Math.floor(py / TILE);
  }

  function centerOf(x, y) {
    return { px: x * TILE + TILE / 2, py: y * TILE + TILE / 2 };
  }

  function nearestCellOf(px, py) {
    return {
      x: clamp(Math.round((px - TILE / 2) / TILE), 0, COLS - 1),
      y: clamp(Math.round((py - TILE / 2) / TILE), 0, ROWS - 1),
    };
  }

  function moveToward(value, target, step) {
    if (Math.abs(target - value) <= step) return target;
    return value + Math.sign(target - value) * step;
  }

  function roleById(id) {
    return roleDefs.find((role) => role.id === id) || roleDefs[0];
  }

  function pickupInfo(type) {
    return pickupDefs.find((item) => item.type === type) || pickupDefs[0];
  }

  function isPoisonType(type) {
    return type.startsWith("poison");
  }

  function poisonColor(type) {
    if (type === "poisonFastBomb") return "#ff5d6c";
    if (type === "poisonSlowBomb") return "#62d8ff";
    if (type === "poisonHaste") return "#42e8ca";
    if (type === "poisonSlow") return "#b78cff";
    return "#d9ff66";
  }

  function poisonName(type) {
    return pickupInfo(type).name;
  }

  function playerHasPoison(player, type = null) {
    if (!player.poison || player.poison.timer <= 0) return false;
    return type ? player.poison.type === type : true;
  }

  function isInside(x, y) {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS;
  }

  function isWallCell(cell) {
    return cell === "solid" || cell === "pressure";
  }

  function seededChance(x, y, mod) {
    return Math.abs((x * 37 + y * 53 + x * y * 11 + 17) % mod);
  }

  function isSpawnSafe(x, y) {
    const spawns = [
      [1, 1],
      [COLS - 2, 1],
      [1, ROWS - 2],
      [COLS - 2, ROWS - 2],
    ];
    return spawns.some(([sx, sy]) => Math.abs(x - sx) + Math.abs(y - sy) <= 2);
  }

  function buildMap() {
    grid = [];
    specialTiles = new Map();
    const centerX = Math.floor(COLS / 2);
    const centerY = Math.floor(ROWS / 2);

    for (let y = 0; y < ROWS; y += 1) {
      const row = [];
      for (let x = 0; x < COLS; x += 1) {
        const border = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1;
        const pillar = x % 2 === 0 && y % 2 === 0;
        const reserved =
          isSpawnSafe(x, y) ||
          (x === centerX && y >= centerY - 3 && y <= centerY + 3) ||
          (y === centerY && x >= centerX - 4 && x <= centerX + 4);

        if (border || pillar) {
          row.push("solid");
        } else if (!reserved && seededChance(x, y, 10) < 5) {
          row.push("crate");
        } else {
          row.push("floor");
        }
      }
      grid.push(row);
    }

    [
      [3, 1],
      [5, 1],
      [COLS - 6, 1],
      [COLS - 4, 1],
      [3, ROWS - 2],
      [5, ROWS - 2],
      [COLS - 6, ROWS - 2],
      [COLS - 4, ROWS - 2],
      [centerX - 3, centerY - 3],
      [centerX + 3, centerY - 3],
      [centerX - 3, centerY + 3],
      [centerX + 3, centerY + 3],
      [centerX - 5, centerY - 1],
      [centerX + 5, centerY + 1],
    ].forEach(([x, y]) => {
      if (grid[y][x] === "floor") grid[y][x] = "crate";
    });

    specialTiles.set(keyOf(1, centerY), { type: "portal", pair: keyOf(COLS - 2, centerY) });
    specialTiles.set(keyOf(COLS - 2, centerY), { type: "portal", pair: keyOf(1, centerY) });
    specialTiles.set(keyOf(centerX - 4, centerY), { type: "ice" });
    specialTiles.set(keyOf(centerX + 4, centerY), { type: "ice" });
    specialTiles.set(keyOf(centerX, centerY - 3), { type: "spark" });
    specialTiles.set(keyOf(centerX, centerY + 3), { type: "spark" });
    specialTiles.set(keyOf(centerX, centerY), { type: "gate" });
    pressureOrder = makePressureOrder(centerX, centerY);
  }

  function makePressureOrder(centerX, centerY) {
    const order = [];
    const maxRing = Math.max(centerX, centerY);
    for (let ring = 1; ring <= maxRing; ring += 1) {
      const ringCells = [];
      for (let y = 1; y < ROWS - 1; y += 1) {
        for (let x = 1; x < COLS - 1; x += 1) {
          const distanceFromEdge = Math.min(x, y, COLS - 1 - x, ROWS - 1 - y);
          if (distanceFromEdge !== ring) continue;
          if (specialTiles.has(keyOf(x, y))) continue;
          ringCells.push({ x, y, sort: seededChance(x, y, 97) });
        }
      }
      ringCells.sort((a, b) => a.sort - b.sort);
      order.push(...ringCells.map(({ x, y }) => ({ x, y })));
    }
    return order.filter((cell) => !(cell.x === centerX && cell.y === centerY));
  }

  function createPlayers() {
    const spawns = [
      [1, 1],
      [COLS - 2, ROWS - 2],
      [COLS - 2, 1],
      [1, ROWS - 2],
    ];
    players = [];

    for (let index = 0; index < state.totalPlayers; index += 1) {
      const role = roleById(roleSelections[index]);
      const spawn = centerOf(spawns[index][0], spawns[index][1]);
      players.push({
        id: index,
        label: `P${index + 1}`,
        roleId: role.id,
        name: role.name,
        short: role.short,
        color: role.color,
        badge: badgeSelections[index] || role.badge,
        px: spawn.px,
        py: spawn.py,
        spawnX: spawn.px,
        spawnY: spawn.py,
        vx: 0,
        vy: 0,
        dirX: 0,
        dirY: 1,
        ai: index >= state.humanPlayers,
        alive: true,
        escaped: false,
        score: 0,
        gems: 0,
        bombLimit: role.bombLimit,
        range: role.range,
        speed: role.speed,
        baseSpeed: role.speed,
        canKick: role.kick,
        skill: role.skill,
        skillName: role.skillName,
        skillCooldown: role.skillCooldown,
        skillTimer: 0,
        shield: role.shield,
        poison: null,
        poisonSpreadCooldown: 0,
        dash: null,
        dashTrailTimer: 0,
        portalCooldown: 0,
        aiTimer: 0,
        aiTarget: null,
        aiMove: { x: 0, y: 0 },
      });
    }
  }

  function syncPlayerOptions() {
    state.totalPlayers = Number(ui.totalPlayers.value);
    state.humanPlayers = Math.min(Number(ui.humanPlayers.value), state.totalPlayers);
    ui.humanPlayers.value = String(state.humanPlayers);
    renderRoster();
    renderItemLegend();
    renderTouchControls();
  }

  function renderRoster() {
    const total = Number(ui.totalPlayers.value);
    ui.roster.innerHTML = "";

    for (let index = 0; index < total; index += 1) {
      const role = roleById(roleSelections[index]);
      const card = document.createElement("div");
      card.className = "player-card";
      card.innerHTML = `
        <div class="player-top">
          <div class="player-name">
            <span class="player-dot" style="background:${role.color}"></span>
            <span>P${index + 1}</span>
          </div>
          <span>${index < state.humanPlayers ? "真人" : "AI"}</span>
        </div>
        <select class="role-select" aria-label="P${index + 1} role"></select>
        <select class="badge-select" aria-label="P${index + 1} AI badge"></select>
        <div class="stat-line">
          <span>弹 ${role.bombLimit}</span>
          <span>火 ${role.range}</span>
          <span>${role.skillName}</span>
          <span>${role.perk}</span>
        </div>
      `;

      const select = card.querySelector(".role-select");
      roleDefs.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} · ${item.perk}`;
        option.selected = item.id === role.id;
        select.append(option);
      });
      select.addEventListener("change", () => {
        roleSelections[index] = select.value;
        if (!badgeSelections[index]) badgeSelections[index] = roleById(select.value).badge;
        renderRoster();
      });

      const badgeSelect = card.querySelector(".badge-select");
      badgeDefs.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `AI 徽章 · ${item.name}`;
        option.selected = item.id === (badgeSelections[index] || role.badge);
        badgeSelect.append(option);
      });
      badgeSelect.addEventListener("change", () => {
        badgeSelections[index] = badgeSelect.value;
        renderRoster();
      });

      ui.roster.append(card);
    }
  }

  function renderItemLegend() {
    if (!ui.itemLegend) return;
    const theme = themeDefs[state.theme];
    ui.itemLegend.innerHTML = "";

    pickupDefs.forEach((item) => {
      const row = document.createElement("div");
      row.className = `legend-item ${isPoisonType(item.type) ? "is-poison" : ""}`;
      row.style.setProperty("--item-color", pickupColor(item.type, theme));
      row.innerHTML = `
        <span class="legend-icon" aria-hidden="true">${legendGlyph(item.type)}</span>
        <span class="legend-copy">
          <strong>${item.name}</strong>
          <span>${item.effect}</span>
        </span>
      `;
      ui.itemLegend.append(row);
    });
  }

  function legendGlyph(type) {
    if (type === "gem") return "◆";
    if (type === "bombUp") return "●+";
    if (type === "fireUp") return "火+";
    if (type === "speedUp") return "▶";
    if (type === "kick") return "靴";
    if (type === "shield") return "盾";
    if (isPoisonType(type)) return "☠";
    return "?";
  }

  function renderTouchControls() {
    ui.touchDock.innerHTML = "";
    virtualInputs = Array.from({ length: 4 }, () => ({ x: 0, y: 0 }));
    document.body.classList.toggle("is-touch", ui.controlMode.value === "touch");

    if (ui.controlMode.value !== "touch") return;

    for (let index = 0; index < state.humanPlayers; index += 1) {
      const role = roleById(roleSelections[index]);
      const pad = document.createElement("div");
      pad.className = "touch-pad";
      pad.innerHTML = `
        <div class="pad-title">
          <span>P${index + 1} ${role.name}</span>
          <span>摇杆 / 炸弹</span>
        </div>
        <div class="joystick" data-player="${index}" data-stick="true">
          <div class="stick-base">
            <span class="stick-knob"></span>
          </div>
        </div>
        <div class="touch-actions">
          <button class="bomb-button" type="button" data-player="${index}" data-bomb="true">炸弹</button>
          <button class="skill-button" type="button" data-player="${index}" data-skill="true">${role.skillName}</button>
        </div>
      `;
      ui.touchDock.append(pad);
    }
  }

  function setOverlay(title, body, hidden = false) {
    ui.overlay.classList.toggle("is-hidden", hidden);
    if (!hidden) {
      ui.overlay.querySelector("h2").textContent = title;
      ui.overlay.querySelector("p").textContent = body;
    }
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(safe / 60);
    const secs = String(safe % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function startGame() {
    syncPlayerOptions();
    buildMap();
    createPlayers();
    bombs = [];
    blasts = [];
    pickups = [];
    pressureWarnings = [];
    particles = [];
    state.phase = "running";
    state.timeLeft = ROUND_SECONDS;
    state.gateOpen = false;
    state.gateReason = "";
    state.pressureStarted = false;
    state.pressureNext = 0;
    state.pressureIndex = 0;
    state.messageTimer = 0;
    ui.startButton.textContent = "重开";
    setOverlay("", "", true);
    closeSettings();
    playTone(220, 0.08, "square");
  }

  function openSettings() {
    renderItemLegend();
    ui.settingsPanel.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    ui.settingsPanel.setAttribute("aria-hidden", "true");
  }

  function openGate(reason) {
    if (state.gateOpen) return;
    state.gateOpen = true;
    state.gateReason = reason;
    flashMessage(reason);
    playTone(560, 0.12, "triangle");
  }

  function flashMessage(text) {
    state.roundMessage = text;
    state.messageTimer = 2.4;
  }

  function activeBombsFor(player) {
    return bombs.filter((bomb) => bomb.ownerId === player.id).length;
  }

  function bombAtCell(x, y) {
    return bombs.find((bomb) => gridX(bomb.px) === x && gridY(bomb.py) === y);
  }

  function isCellBlockedForPlayer(x, y, player, options = {}) {
    if (!isInside(x, y)) return true;
    if (isWallCell(grid[y][x]) || grid[y][x] === "crate") return true;
    const tile = specialTiles.get(keyOf(x, y));
    if (tile?.type === "gate" && !state.gateOpen) return true;

    if (!options.ignoreBombs) {
      const bomb = bombAtCell(x, y);
      if (bomb) {
        if (!bomb.passers.has(player.id)) return true;
      }
    }

    return false;
  }

  function cellWalkableForPath(x, y, options = {}) {
    if (!isInside(x, y)) return false;
    if (isWallCell(grid[y][x]) || grid[y][x] === "crate") return false;
    const tile = specialTiles.get(keyOf(x, y));
    if (tile?.type === "gate" && !state.gateOpen && !options.allowClosedGate) return false;
    if (!options.ignoreBombs && bombAtCell(x, y)) return false;
    return true;
  }

  function circleHitsRect(cx, cy, radius, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < radius * radius;
  }

  function canOccupy(px, py, player) {
    if (px < PLAYER_RADIUS || py < PLAYER_RADIUS || px > WORLD_W - PLAYER_RADIUS || py > WORLD_H - PLAYER_RADIUS) {
      return false;
    }

    const minX = gridX(px - PLAYER_RADIUS);
    const maxX = gridX(px + PLAYER_RADIUS);
    const minY = gridY(py - PLAYER_RADIUS);
    const maxY = gridY(py + PLAYER_RADIUS);

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (isCellBlockedForPlayer(x, y, player)) {
          if (circleHitsRect(px, py, PLAYER_RADIUS, x * TILE, y * TILE, TILE, TILE)) return false;
        }
      }
    }

    for (const bomb of bombs) {
      if (bomb.passers.has(player.id)) continue;
      const dx = px - bomb.px;
      const dy = py - bomb.py;
      if (dx * dx + dy * dy < (PLAYER_RADIUS + BOMB_RADIUS - 3) ** 2) return false;
    }

    return true;
  }

  function placeBomb(player) {
    if (state.phase !== "running" || !player.alive || player.escaped) return;
    if (activeBombsFor(player) >= player.bombLimit) return;
    const x = gridX(player.px);
    const y = gridY(player.py);
    if (bombAtCell(x, y)) return;
    if (grid[y][x] !== "floor") return;

    const center = centerOf(x, y);
    const timer = bombTimerFor(player);
    bombs.push({
      id: globalThis.crypto?.randomUUID?.() || String(Date.now() + Math.random()),
      ownerId: player.id,
      x,
      y,
      px: center.px,
      py: center.py,
      range: player.range,
      timer,
      maxTimer: timer,
      moving: null,
      passers: new Set([player.id]),
    });
    playTone(110, 0.04, "sine");
  }

  function bombTimerFor(player) {
    if (playerHasPoison(player, "poisonFastBomb")) return 1.15;
    if (playerHasPoison(player, "poisonSlowBomb")) return 3.45;
    return DEFAULT_BOMB_TIMER;
  }

  function infectPlayer(player, type, sourceLabel = "毒骷髅") {
    if (!isPoisonType(type) || !player.alive || player.escaped) return false;
    if (player.shield > 0) {
      player.shield = 0;
      spawnParticles(player.px, player.py, "#ffffff", 12);
      flashMessage(`${player.label} 的护盾挡住了 ${poisonName(type)}`);
      return false;
    }

    player.poison = { type, timer: POISON_DURATION };
    player.poisonSpreadCooldown = POISON_SPREAD_COOLDOWN;
    spawnParticles(player.px, player.py, poisonColor(type), 14);
    flashMessage(`${player.label} 感染 ${poisonName(type)}，可碰撞传给对手`);
    playTone(sourceLabel === "毒骷髅" ? 190 : 260, 0.05, "sawtooth");
    return true;
  }

  function clearPoison(player) {
    player.poison = null;
    player.poisonSpreadCooldown = POISON_SPREAD_COOLDOWN;
  }

  function useSkill(player) {
    if (state.phase !== "running" || !player.alive || player.escaped) return false;
    if (player.skillTimer > 0) return false;

    let used = false;
    if (player.skill === "dash") {
      used = startDashToWall(player);
    } else if (player.skill === "remote") {
      used = remoteDetonate(player);
    } else if (player.skill === "shield") {
      player.shield = 5.5;
      clearPoison(player);
      spawnParticles(player.px, player.py, "#ffffff", 16);
      playTone(520, 0.08, "triangle");
      used = true;
    } else if (player.skill === "shockKick") {
      used = shockKick(player);
    }

    if (used) {
      player.skillTimer = player.skillCooldown;
      flashMessage(`${player.label} 使用 ${player.skillName}`);
    }
    return used;
  }

  function facingDir(player) {
    if (player.dirX !== 0 || player.dirY !== 0) return { dx: player.dirX, dy: player.dirY };
    return { dx: 0, dy: 1 };
  }

  function startDashToWall(player) {
    const { dx, dy } = facingDir(player);
    if (dx === 0 && dy === 0) return false;

    let x = gridX(player.px);
    let y = gridY(player.py);
    let last = { x, y };
    const trail = [];

    for (let step = 0; step < 7; step += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if (!cellWalkableForPath(nx, ny, { ignoreBombs: false })) break;
      last = { x: nx, y: ny };
      trail.push(last);
      x = nx;
      y = ny;
    }

    if (trail.length === 0) return false;
    const center = centerOf(last.x, last.y);
    player.dash = {
      targetPx: center.px,
      targetPy: center.py,
      dx,
      dy,
      speed: 430,
    };
    player.portalCooldown = 0.25;
    playTone(720, 0.07, "sawtooth");
    return true;
  }

  function updateDashPlayer(player, dt) {
    if (!player.dash) return false;
    const dx = player.dash.targetPx - player.px;
    const dy = player.dash.targetPy - player.py;
    const distance = Math.hypot(dx, dy);
    const step = player.dash.speed * dt;

    player.dirX = player.dash.dx;
    player.dirY = player.dash.dy;
    player.dashTrailTimer -= dt;
    if (player.dashTrailTimer <= 0) {
      spawnParticles(player.px, player.py, player.color, 4);
      player.dashTrailTimer = 0.045;
    }

    if (distance <= step) {
      player.px = player.dash.targetPx;
      player.py = player.dash.targetPy;
      player.dash = null;
      return true;
    }

    const nx = player.px + (dx / distance) * step;
    const ny = player.py + (dy / distance) * step;
    if (canOccupy(nx, ny, player)) {
      player.px = nx;
      player.py = ny;
    } else {
      player.dash = null;
    }
    return true;
  }

  function remoteDetonate(player) {
    const ownBombs = bombs.filter((bomb) => bomb.ownerId === player.id).sort((a, b) => a.timer - b.timer);
    if (ownBombs.length === 0) {
      placeBomb(player);
      return true;
    }
    ownBombs[0].timer = 0.03;
    playTone(300, 0.05, "square");
    return true;
  }

  function shockKick(player) {
    const { dx, dy } = facingDir(player);
    if (dx === 0 && dy === 0) return false;
    const startX = gridX(player.px);
    const startY = gridY(player.py);

    for (let step = 1; step <= 4; step += 1) {
      const x = startX + dx * step;
      const y = startY + dy * step;
      if (!isInside(x, y) || isWallCell(grid[y][x]) || grid[y][x] === "crate") break;
      const bomb = bombAtCell(x, y);
      if (!bomb || bomb.moving) continue;

      const nextX = x + dx;
      const nextY = y + dy;
      if (!cellWalkableForPath(nextX, nextY, { ignoreBombs: false })) return false;
      bomb.moving = { dx, dy, speed: 330 };
      bomb.passers.clear();
      spawnParticles(bomb.px, bomb.py, player.color, 10);
      playTone(210, 0.05, "triangle");
      return true;
    }

    spawnParticles(player.px + dx * 18, player.py + dy * 18, player.color, 8);
    playTone(170, 0.04, "triangle");
    return true;
  }

  function tryKickBomb(player, dx, dy) {
    if (!player.canKick || (dx === 0 && dy === 0)) return false;
    const frontX = gridX(player.px + dx * (PLAYER_RADIUS + 10));
    const frontY = gridY(player.py + dy * (PLAYER_RADIUS + 10));
    const bomb = bombAtCell(frontX, frontY);
    if (!bomb || bomb.moving) return false;

    const nextX = frontX + dx;
    const nextY = frontY + dy;
    if (!cellWalkableForPath(nextX, nextY, { ignoreBombs: false })) return false;

    bomb.moving = { dx, dy, speed: 255 };
    bomb.passers.clear();
    playTone(180, 0.04, "triangle");
    return true;
  }

  function movePlayer(player, inputX, inputY, dt) {
    if (!player.alive || player.escaped) return;

    const direction = gridDirectionFromInput(inputX, inputY);
    const speed = playerMoveSpeed(player);
    const step = speed * dt;
    const cell = nearestCellOf(player.px, player.py);
    const center = centerOf(cell.x, cell.y);

    if (direction.x === 0 && direction.y === 0) {
      alignPlayerToGrid(player, center, step * 0.75);
      return;
    }

    player.dirX = direction.x;
    player.dirY = direction.y;

    if (direction.x !== 0) {
      if (Math.abs(player.py - center.py) > GRID_ALIGN_EPSILON) {
        tryMoveAxis(player, 0, Math.sign(center.py - player.py), step);
        return;
      }
      player.py = center.py;
      tryMoveAxis(player, direction.x, 0, step);
      return;
    }

    if (Math.abs(player.px - center.px) > GRID_ALIGN_EPSILON) {
      tryMoveAxis(player, Math.sign(center.px - player.px), 0, step);
      return;
    }
    player.px = center.px;
    tryMoveAxis(player, 0, direction.y, step);
  }

  function gridDirectionFromInput(inputX, inputY) {
    if (Math.hypot(inputX, inputY) < INPUT_DEAD_ZONE) return { x: 0, y: 0 };
    if (Math.abs(inputX) > Math.abs(inputY)) return { x: Math.sign(inputX), y: 0 };
    return { x: 0, y: Math.sign(inputY) };
  }

  function playerMoveSpeed(player) {
    const tile = specialTiles.get(keyOf(gridX(player.px), gridY(player.py)));
    const poisonFactor = playerHasPoison(player, "poisonHaste") ? 1.25 : playerHasPoison(player, "poisonSlow") ? 0.68 : 1;
    const iceFactor = tile?.type === "ice" ? 1.23 : 1;
    const sparkFactor = tile?.type === "spark" ? 1.14 : 1;
    return player.speed * poisonFactor * iceFactor * sparkFactor;
  }

  function alignPlayerToGrid(player, center, step) {
    const nx = moveToward(player.px, center.px, step);
    const ny = moveToward(player.py, center.py, step);
    if (canOccupy(nx, player.py, player)) player.px = nx;
    if (canOccupy(player.px, ny, player)) player.py = ny;
  }

  function tryMoveAxis(player, dx, dy, step) {
    if (dx === 0 && dy === 0) return false;
    const nx = player.px + dx * step;
    const ny = player.py + dy * step;
    if (canOccupy(nx, ny, player)) {
      player.px = nx;
      player.py = ny;
      return true;
    }
    tryKickBomb(player, dx, dy);
    return false;
  }

  function getHumanInput(playerIndex) {
    const controls = keyControls[playerIndex];
    const virtual = virtualInputs[playerIndex] || { x: 0, y: 0 };
    let x = virtual.x;
    let y = virtual.y;

    if (keys.has(controls.left)) x -= 1;
    if (keys.has(controls.right)) x += 1;
    if (keys.has(controls.up)) y -= 1;
    if (keys.has(controls.down)) y += 1;

    return { x, y };
  }

  function updatePlayers(dt) {
    for (const player of players) {
      if (player.shield > 0) player.shield -= dt;
      if (player.poisonSpreadCooldown > 0) player.poisonSpreadCooldown -= dt;
      if (player.poison) {
        player.poison.timer -= dt;
        if (player.poison.timer <= 0) clearPoison(player);
      }
      if (player.skillTimer > 0) player.skillTimer -= dt;
      if (player.portalCooldown > 0) player.portalCooldown -= dt;

      for (const bomb of bombs) {
        const dx = player.px - bomb.px;
        const dy = player.py - bomb.py;
        if (dx * dx + dy * dy > (PLAYER_RADIUS + BOMB_RADIUS + 5) ** 2) {
          bomb.passers.delete(player.id);
        }
      }

      if (player.dash) {
        updateDashPlayer(player, dt);
      } else if (player.ai) {
        updateAi(player, dt);
        movePlayer(player, player.aiMove.x, player.aiMove.y, dt);
      } else {
        const input = getHumanInput(player.id);
        movePlayer(player, input.x, input.y, dt);
      }

      applySpecialTile(player);
      collectPickups(player);
    }
    spreadPoisonBetweenPlayers();
  }

  function spreadPoisonBetweenPlayers() {
    const infections = [];
    for (const source of players) {
      if (!source.alive || source.escaped || !playerHasPoison(source) || source.poisonSpreadCooldown > 0) continue;
      for (const target of players) {
        if (target.id === source.id || !target.alive || target.escaped || target.poisonSpreadCooldown > 0) continue;
        if (playerHasPoison(target, source.poison.type)) continue;
        const dx = target.px - source.px;
        const dy = target.py - source.py;
        const sameCell = gridX(target.px) === gridX(source.px) && gridY(target.py) === gridY(source.py);
        if (!sameCell && dx * dx + dy * dy > (PLAYER_RADIUS * 2 + 6) ** 2) continue;
        infections.push({ source, target, type: source.poison.type });
      }
    }

    for (const infection of infections) {
      if (!playerHasPoison(infection.source, infection.type)) continue;
      if (infectPlayer(infection.target, infection.type, infection.source.label)) {
        infection.source.poisonSpreadCooldown = POISON_SPREAD_COOLDOWN;
        infection.target.poisonSpreadCooldown = POISON_SPREAD_COOLDOWN;
        flashMessage(`${infection.source.label} 把 ${poisonName(infection.type)} 传给 ${infection.target.label}`);
      }
    }
  }

  function applySpecialTile(player) {
    if (!player.alive || player.escaped) return;
    const x = gridX(player.px);
    const y = gridY(player.py);
    const tile = specialTiles.get(keyOf(x, y));

    if (tile?.type === "portal" && player.portalCooldown <= 0) {
      const pair = specialTiles.get(tile.pair);
      const [toX, toY] = tile.pair.split(",").map(Number);
      if (pair) {
        const center = centerOf(toX, toY);
        player.px = center.px;
        player.py = center.py;
        player.portalCooldown = 1.1;
        spawnParticles(player.px, player.py, themeDefs[state.theme].portal, 12);
        playTone(620, 0.07, "sine");
      }
    }

    if (tile?.type === "gate" && state.gateOpen) {
      player.escaped = true;
      player.score += 8;
      flashMessage(`${player.label} 逃离成功，拿到 8 分`);
      spawnParticles(player.px, player.py, themeDefs[state.theme].gate, 22);
      playTone(740, 0.12, "triangle");
    }
  }

  function collectPickups(player) {
    if (!player.alive || player.escaped) return;
    const x = gridX(player.px);
    const y = gridY(player.py);
    for (let i = pickups.length - 1; i >= 0; i -= 1) {
      const item = pickups[i];
      if (item.x !== x || item.y !== y) continue;
      pickups.splice(i, 1);
      applyPickup(player, item.type);
    }
  }

  function applyPickup(player, type) {
    const good = themeDefs[state.theme].glow;
    const bad = themeDefs[state.theme].danger;

    if (type === "gem") {
      player.gems += 1;
      player.score += 1;
      spawnParticles(player.px, player.py, themeDefs[state.theme].gem, 10);
      playTone(660, 0.05, "triangle");
    } else if (type === "bombUp") {
      player.bombLimit = clamp(player.bombLimit + 1, 1, 5);
      spawnParticles(player.px, player.py, good, 8);
    } else if (type === "fireUp") {
      player.range = clamp(player.range + 1, 1, 6);
      spawnParticles(player.px, player.py, good, 8);
    } else if (type === "speedUp") {
      player.speed = clamp(player.speed + 14, 80, 185);
      spawnParticles(player.px, player.py, good, 8);
    } else if (type === "kick") {
      player.canKick = true;
      spawnParticles(player.px, player.py, good, 8);
    } else if (type === "shield") {
      player.shield = 6;
      spawnParticles(player.px, player.py, good, 10);
    } else if (isPoisonType(type)) {
      infectPlayer(player, type);
      spawnParticles(player.px, player.py, bad, 8);
    }
  }

  function updateBombs(dt) {
    for (const bomb of bombs) {
      bomb.timer -= dt;
      if (bomb.moving) updateMovingBomb(bomb, dt);
    }

    for (let i = bombs.length - 1; i >= 0; i -= 1) {
      if (bombs[i].timer <= 0) {
        explodeBomb(bombs[i]);
      }
    }
  }

  function updatePressure(dt) {
    if (!state.pressureStarted && state.timeLeft <= PRESSURE_START_SECONDS) {
      state.pressureStarted = true;
      state.pressureNext = 0;
      flashMessage("最后 1 分钟，压力块开始落下");
    }

    if (state.pressureStarted) {
      state.pressureNext -= dt;
      if (state.pressureNext <= 0) {
        queuePressureDrop();
        state.pressureNext = 1.25;
      }
    }

    for (let i = pressureWarnings.length - 1; i >= 0; i -= 1) {
      const warning = pressureWarnings[i];
      warning.timer -= dt;
      if (warning.timer <= 0) {
        landPressureBlock(warning.x, warning.y);
        pressureWarnings.splice(i, 1);
      }
    }
  }

  function queuePressureDrop() {
    let queued = 0;
    while (state.pressureIndex < pressureOrder.length && queued < 2) {
      const cell = pressureOrder[state.pressureIndex];
      state.pressureIndex += 1;
      const key = keyOf(cell.x, cell.y);
      if (!isInside(cell.x, cell.y) || isWallCell(grid[cell.y][cell.x])) continue;
      if (specialTiles.has(key)) continue;
      if (pressureWarnings.some((warning) => warning.x === cell.x && warning.y === cell.y)) continue;
      pressureWarnings.push({ x: cell.x, y: cell.y, timer: PRESSURE_WARNING_SECONDS });
      queued += 1;
    }
  }

  function landPressureBlock(x, y) {
    if (!isInside(x, y) || specialTiles.has(keyOf(x, y))) return;
    if (isWallCell(grid[y][x])) return;
    grid[y][x] = "pressure";
    pickups = pickups.filter((item) => item.x !== x || item.y !== y);
    bombs.forEach((bomb) => {
      if (gridX(bomb.px) === x && gridY(bomb.py) === y) bomb.timer = Math.min(bomb.timer, 0.03);
    });

    players.forEach((player) => {
      if (!player.alive || player.escaped) return;
      if (gridX(player.px) !== x || gridY(player.py) !== y) return;
      pushPlayerToNearestSafeCell(player, x, y);
    });

    spawnParticles(x * TILE + TILE / 2, y * TILE + TILE / 2, themeDefs[state.theme].danger, 12);
    playTone(66, 0.05, "square");
  }

  function pushPlayerToNearestSafeCell(player, x, y) {
    const path = findPath(
      { x, y },
      (tx, ty, distance) => distance > 0 && cellWalkableForPath(tx, ty, { ignoreBombs: false }),
      { ignoreBombs: true, maxDepth: 8 },
    );

    if (path && path.length > 0) {
      const safe = centerOf(path[0].x, path[0].y);
      player.px = safe.px;
      player.py = safe.py;
      player.shield = Math.max(player.shield, 1.2);
      spawnParticles(player.px, player.py, player.color, 10);
      return;
    }

    if (player.shield > 0) {
      player.shield = 0;
      return;
    }
    player.alive = false;
    flashMessage(`${player.label} 被压力块压出局`);
  }

  function updateMovingBomb(bomb, dt) {
    const oldX = bomb.px;
    const oldY = bomb.py;
    bomb.px += bomb.moving.dx * bomb.moving.speed * dt;
    bomb.py += bomb.moving.dy * bomb.moving.speed * dt;

    const x = gridX(bomb.px);
    const y = gridY(bomb.py);
    const nextX = gridX(bomb.px + bomb.moving.dx * (BOMB_RADIUS + 4));
    const nextY = gridY(bomb.py + bomb.moving.dy * (BOMB_RADIUS + 4));

    if (!isInside(x, y) || !cellWalkableForPath(nextX, nextY, { ignoreBombs: false })) {
      bomb.px = oldX;
      bomb.py = oldY;
      const snap = centerOf(gridX(bomb.px), gridY(bomb.py));
      bomb.px = snap.px;
      bomb.py = snap.py;
      bomb.moving = null;
    }
  }

  function blastCellsFor(bomb, includeCrates = true) {
    const originX = gridX(bomb.px);
    const originY = gridY(bomb.py);
    const cells = [{ x: originX, y: originY }];
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dx, dy] of dirs) {
      for (let step = 1; step <= bomb.range; step += 1) {
        const x = originX + dx * step;
        const y = originY + dy * step;
        if (!isInside(x, y)) break;
        if (isWallCell(grid[y][x])) break;
        cells.push({ x, y });
        if (grid[y][x] === "crate" && includeCrates) break;
      }
    }

    return cells;
  }

  function explodeBomb(bomb) {
    const index = bombs.indexOf(bomb);
    if (index !== -1) bombs.splice(index, 1);

    const cells = blastCellsFor(bomb);
    blasts.push({ cells, ttl: 0.42, age: 0 });
    playTone(82, 0.08, "sawtooth");

    for (const cell of cells) {
      if (grid[cell.y][cell.x] === "crate") {
        grid[cell.y][cell.x] = "floor";
        maybeDropItem(cell.x, cell.y);
        spawnParticles(cell.x * TILE + TILE / 2, cell.y * TILE + TILE / 2, themeDefs[state.theme].crateEdge, 9);
      }

      const chained = bombs.find((other) => gridX(other.px) === cell.x && gridY(other.py) === cell.y);
      if (chained) chained.timer = Math.min(chained.timer, 0.04);
    }

    damagePlayers(cells, bomb.ownerId);
  }

  function maybeDropItem(x, y) {
    const roll = Math.random();
    if (roll < 0.22) {
      pickups.push({ x, y, type: "gem" });
    } else if (roll < 0.33) {
      pickups.push({ x, y, type: "bombUp" });
    } else if (roll < 0.44) {
      pickups.push({ x, y, type: "fireUp" });
    } else if (roll < 0.53) {
      pickups.push({ x, y, type: "speedUp" });
    } else if (roll < 0.61) {
      pickups.push({ x, y, type: "kick" });
    } else if (roll < 0.68) {
      pickups.push({ x, y, type: "shield" });
    } else if (roll < 0.75) {
      pickups.push({ x, y, type: "poisonFastBomb" });
    } else if (roll < 0.82) {
      pickups.push({ x, y, type: "poisonSlowBomb" });
    } else if (roll < 0.88) {
      pickups.push({ x, y, type: "poisonHaste" });
    } else if (roll < 0.94) {
      pickups.push({ x, y, type: "poisonSlow" });
    }
  }

  function damagePlayers(cells, ownerId) {
    const hitKeys = new Set(cells.map((cell) => keyOf(cell.x, cell.y)));
    for (const player of players) {
      if (!player.alive || player.escaped) continue;
      if (!hitKeys.has(keyOf(gridX(player.px), gridY(player.py)))) continue;

      if (player.shield > 0) {
        player.shield = 0;
        spawnParticles(player.px, player.py, "#ffffff", 12);
        continue;
      }

      player.alive = false;
      spawnParticles(player.px, player.py, player.color, 18);

      const owner = players.find((candidate) => candidate.id === ownerId);
      if (owner && owner.id !== player.id) {
        owner.score += 3;
        flashMessage(`${owner.label} 击倒 ${player.label}，拿到 3 分`);
      } else {
        flashMessage(`${player.label} 被自己的炸弹炸出局`);
      }
    }
  }

  function updateBlasts(dt) {
    for (let i = blasts.length - 1; i >= 0; i -= 1) {
      blasts[i].age += dt;
      blasts[i].ttl -= dt;
      if (blasts[i].ttl <= 0) blasts.splice(i, 1);
    }
  }

  function spawnParticles(px, py, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 125;
      particles.push({
        px,
        py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function dangerMap(extraBomb = null) {
    const map = new Map();
    const allBombs = extraBomb ? bombs.concat(extraBomb) : bombs;
    for (const bomb of allBombs) {
      const cells = blastCellsFor(bomb);
      for (const cell of cells) {
        const key = keyOf(cell.x, cell.y);
        const danger = Math.max(0.2, 2.4 - bomb.timer);
        map.set(key, Math.max(map.get(key) || 0, danger));
      }
    }
    return map;
  }

  function neighbors(x, y) {
    return [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];
  }

  function findPath(start, isTarget, options = {}) {
    const danger = options.danger || new Map();
    const queue = [{ x: start.x, y: start.y, path: [] }];
    const seen = new Set([keyOf(start.x, start.y)]);
    const maxDepth = options.maxDepth || 60;

    while (queue.length > 0) {
      const node = queue.shift();
      if (node.path.length > maxDepth) continue;
      if (isTarget(node.x, node.y, node.path.length)) return node.path;

      for (const next of neighbors(node.x, node.y)) {
        const key = keyOf(next.x, next.y);
        if (seen.has(key)) continue;
        if (!cellWalkableForPath(next.x, next.y, { ignoreBombs: options.ignoreBombs })) continue;
        if (options.avoidDanger && danger.has(key) && node.path.length < 8) continue;
        seen.add(key);
        queue.push({
          x: next.x,
          y: next.y,
          path: node.path.concat({ x: next.x, y: next.y }),
        });
      }
    }

    return null;
  }

  function hasEscapeAfterBomb(player) {
    const x = gridX(player.px);
    const y = gridY(player.py);
    const timer = bombTimerFor(player);
    const simulated = {
      px: x * TILE + TILE / 2,
      py: y * TILE + TILE / 2,
      range: player.range,
      timer,
      maxTimer: timer,
    };
    const danger = dangerMap(simulated);
    const path = findPath(
      { x, y },
      (tx, ty, distance) => distance > 0 && !danger.has(keyOf(tx, ty)),
      { danger, avoidDanger: false, ignoreBombs: true, maxDepth: 12 },
    );
    return Boolean(path);
  }

  function updateAi(player, dt) {
    player.aiTimer -= dt;
    if (player.aiTimer > 0) return;
    player.aiTimer = AI_THINK_RATE + Math.random() * 0.04;

    const x = gridX(player.px);
    const y = gridY(player.py);
    const danger = dangerMap();
    const currentDanger = danger.has(keyOf(x, y));

    if (currentDanger) {
      const escapePath = findPath(
        { x, y },
        (tx, ty, distance) => distance > 0 && !danger.has(keyOf(tx, ty)),
        { danger, avoidDanger: false, maxDepth: 14 },
      );
      setAiMoveFromPath(player, escapePath);
      if (player.skill === "dash" && player.skillTimer <= 0 && escapePath && escapePath.length >= 3) {
        faceTowardCell(player, escapePath[0]);
        useSkill(player);
      }
      return;
    }

    if (shouldAiBomb(player, x, y) && hasEscapeAfterBomb(player)) {
      placeBomb(player);
      const escapeDanger = dangerMap({
        px: x * TILE + TILE / 2,
        py: y * TILE + TILE / 2,
        range: player.range,
        timer: bombTimerFor(player),
      });
      const path = findPath(
        { x, y },
        (tx, ty, distance) => distance > 0 && !escapeDanger.has(keyOf(tx, ty)),
        { danger: escapeDanger, avoidDanger: false, ignoreBombs: true, maxDepth: 12 },
      );
      setAiMoveFromPath(player, path);
      return;
    }

    const targetPath = chooseAiTargetPath(player, x, y, danger);
    if (player.skill === "dash" && player.skillTimer <= 0 && targetPath && targetPath.length >= 5 && Math.random() < 0.2) {
      faceTowardCell(player, targetPath[0]);
      useSkill(player);
    }
    setAiMoveFromPath(player, targetPath);
  }

  function setAiMoveFromPath(player, path) {
    if (!path || path.length === 0) {
      player.aiMove = { x: 0, y: 0 };
      return;
    }
    let target = path[0];
    const currentX = gridX(player.px);
    const currentY = gridY(player.py);
    const ownCenter = centerOf(currentX, currentY);
    if (Math.hypot(player.px - centerOf(target.x, target.y).px, player.py - centerOf(target.x, target.y).py) < 4 && path[1]) {
      target = path[1];
    }
    const center = centerOf(target.x, target.y);
    const dx = center.px - player.px;
    const dy = center.py - player.py;

    if (target.x !== currentX && Math.abs(player.py - ownCenter.py) > 4) {
      player.aiMove = { x: 0, y: Math.sign(ownCenter.py - player.py) };
    } else if (target.y !== currentY && Math.abs(player.px - ownCenter.px) > 4) {
      player.aiMove = { x: Math.sign(ownCenter.px - player.px), y: 0 };
    } else if (Math.abs(dx) > Math.abs(dy)) {
      player.aiMove = { x: Math.sign(dx), y: 0 };
    } else {
      player.aiMove = { x: 0, y: Math.sign(dy) };
    }
  }

  function faceTowardCell(player, cell) {
    const dx = cell.x - gridX(player.px);
    const dy = cell.y - gridY(player.py);
    if (Math.abs(dx) > Math.abs(dy)) {
      player.dirX = Math.sign(dx);
      player.dirY = 0;
    } else if (dy !== 0) {
      player.dirX = 0;
      player.dirY = Math.sign(dy);
    }
  }

  function shouldAiBomb(player, x, y) {
    if (activeBombsFor(player) >= player.bombLimit) return false;
    if (bombAtCell(x, y)) return false;

    if (crateInBombRange(player, x, y)) return true;

    return players.some((other) => {
      if (other.id === player.id || !other.alive || other.escaped) return false;
      const ox = gridX(other.px);
      const oy = gridY(other.py);
      if (ox !== x && oy !== y) return false;
      const dist = Math.abs(ox - x) + Math.abs(oy - y);
      if (dist > player.range) return false;
      return hasLineOfSight(x, y, ox, oy);
    });
  }

  function crateInBombRange(player, x, y) {
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      for (let step = 1; step <= player.range; step += 1) {
        const tx = x + dx * step;
        const ty = y + dy * step;
        if (!isInside(tx, ty) || isWallCell(grid[ty][tx])) break;
        if (grid[ty][tx] === "crate") return true;
      }
    }
    return false;
  }

  function hasLineOfSight(x1, y1, x2, y2) {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1 + dx;
    let y = y1 + dy;
    while (x !== x2 || y !== y2) {
      if (isWallCell(grid[y][x]) || grid[y][x] === "crate") return false;
      x += dx;
      y += dy;
    }
    return true;
  }

  function chooseAiTargetPath(player, x, y, danger) {
    const current = { x, y };
    const wanted = new Set();

    pickups.forEach((item) => {
      const weight = item.type === "gem" ? 2 : 1;
      if (weight >= 1) wanted.add(keyOf(item.x, item.y));
    });

    if (state.gateOpen && player.gems >= 2) {
      wanted.add(keyOf(Math.floor(COLS / 2), Math.floor(ROWS / 2)));
    }

    if (wanted.size > 0) {
      const path = findPath(current, (tx, ty) => wanted.has(keyOf(tx, ty)), {
        danger,
        avoidDanger: true,
        maxDepth: 50,
      });
      if (path) return path;
    }

    const cratePath = findPath(
      current,
      (tx, ty, distance) => distance > 0 && crateInBombRange(player, tx, ty),
      { danger, avoidDanger: true, maxDepth: 36 },
    );
    if (cratePath) return cratePath;

    const livingTargets = players.filter((other) => other.id !== player.id && other.alive && !other.escaped);
    if (livingTargets.length > 0) {
      const nearest = livingTargets
        .map((other) => ({ other, dist: Math.abs(gridX(other.px) - x) + Math.abs(gridY(other.py) - y) }))
        .sort((a, b) => a.dist - b.dist)[0].other;
      return findPath(current, (tx, ty) => Math.abs(tx - gridX(nearest.px)) + Math.abs(ty - gridY(nearest.py)) <= 2, {
        danger,
        avoidDanger: true,
        maxDepth: 42,
      });
    }

    return null;
  }

  function updateRound(dt) {
    if (state.phase !== "running") return;
    state.timeLeft -= dt;

    const totalGems = players.reduce((sum, player) => sum + player.gems, 0);
    if (!state.gateOpen && totalGems >= 8) openGate("宝石能量够了，中心出口打开");
    if (!state.gateOpen && state.timeLeft <= 45) openGate("最后 45 秒，中心出口打开");
    updatePressure(dt);

    const stillActive = players.filter((player) => player.alive && !player.escaped);
    if (state.timeLeft <= 0) {
      endRound("时间到");
    } else if (stillActive.length === 0) {
      endRound("场上无人继续行动");
    } else if (stillActive.length === 1) {
      const survivor = stillActive[0];
      survivor.score += 5;
      endRound(`只剩 ${survivor.label} 留在场上`, survivor.id);
    }

    if (state.messageTimer > 0) state.messageTimer -= dt;
  }

  function endRound(reason, winnerId = null) {
    if (state.phase !== "running") return;
    state.phase = "ended";
    players.forEach((player) => {
      if (player.alive && !player.escaped) player.score += 2;
    });
    const ranked = [...players].sort((a, b) => {
      if (winnerId !== null) {
        if (a.id === winnerId) return -1;
        if (b.id === winnerId) return 1;
      }
      if (b.score !== a.score) return b.score - a.score;
      if (Number(b.escaped) !== Number(a.escaped)) return Number(b.escaped) - Number(a.escaped);
      if (Number(b.alive) !== Number(a.alive)) return Number(b.alive) - Number(a.alive);
      return b.gems - a.gems;
    });
    const winner = ranked[0];
    setOverlay(`${winner.label} 获胜`, `${reason}。得分最高的是 ${winner.name}：${winner.score} 分。`);
    playTone(420, 0.16, "triangle");
  }

  function update(dt) {
    if (state.phase === "running") {
      updateRound(dt);
      if (state.phase === "running") {
        updatePlayers(dt);
        updateBombs(dt);
        updateBlasts(dt);
      }
      updateParticles(dt);
    } else {
      updateParticles(dt);
    }
    updateUi();
  }

  function updateUi() {
    ui.timeLabel.textContent = formatTime(state.timeLeft);
    ui.gateLabel.textContent = state.gateOpen ? "已打开" : "封锁";

    ui.scoreList.innerHTML = "";
    players.forEach((player) => {
      const card = document.createElement("div");
      card.className = `score-card ${!player.alive || player.escaped ? "is-out" : ""}`;
      const status = player.escaped ? "已逃离" : player.alive ? (player.ai ? "AI 行动中" : "行动中") : "出局";
      const bombText = `${activeBombsFor(player)}/${player.bombLimit}`;
      const poisonText = playerHasPoison(player) ? `${poisonName(player.poison.type)} ${Math.ceil(player.poison.timer)}秒` : "无毒";
      card.innerHTML = `
        <div class="score-top">
          <div class="score-name">
            <span class="player-dot" style="background:${player.color}"></span>
            <span>${player.label}</span>
          </div>
          <span class="score-value">${player.score}</span>
        </div>
        <div class="score-meta">${player.name} · ${status}</div>
        <div class="score-meta">宝石 ${player.gems} · 炸弹 ${bombText} · 火力 ${player.range}${player.canKick ? " · 可踢" : ""}</div>
        <div class="score-meta">技能 ${player.skillName} · ${player.skillTimer > 0 ? Math.ceil(player.skillTimer) + " 秒" : "可用"}</div>
        <div class="score-meta poison-meta">毒 ${poisonText}</div>
        <div class="meter"><span style="width:${player.shield > 0 ? 100 : player.alive ? 62 : 0}%"></span></div>
      `;
      ui.scoreList.append(card);
    });

    if (state.phase === "running" && state.messageTimer > 0) {
      setOverlay("场上事件", state.roundMessage);
    } else if (state.phase === "running") {
      setOverlay("", "", true);
    }
  }

  function render() {
    const theme = themeDefs[state.theme];
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    drawFloor(theme);
    drawSpecialTiles(theme);
    drawGrid(theme);
    drawPressureWarnings(theme);
    drawPickups(theme);
    drawBombs(theme);
    drawBlasts(theme);
    drawPlayers();
    drawParticles();
    drawGateHint(theme);
  }

  function drawFloor(theme) {
    ctx.fillStyle = theme.floorA;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? theme.floorA : theme.floorB;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
  }

  function drawGrid(theme) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const cell = grid[y][x];
        if (cell === "solid") {
          drawBlock(x, y, theme.solid, theme.solidEdge, false);
        } else if (cell === "crate") {
          drawBlock(x, y, theme.crate, theme.crateEdge, true);
        } else if (cell === "pressure") {
          drawBlock(x, y, "#161616", theme.danger, false);
        }
      }
    }
  }

  function drawBlock(x, y, fill, edge, cracked) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = fill;
    ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 6, py + 6, TILE - 12, TILE - 12);

    if (cracked) {
      ctx.strokeStyle = "rgba(255,255,255,0.26)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 12, py + 14);
      ctx.lineTo(px + 25, py + 23);
      ctx.lineTo(px + 18, py + 35);
      ctx.moveTo(px + 31, py + 12);
      ctx.lineTo(px + 36, py + 25);
      ctx.lineTo(px + 29, py + 38);
      ctx.stroke();
    }
  }

  function drawSpecialTiles(theme) {
    for (const [key, tile] of specialTiles) {
      const [x, y] = key.split(",").map(Number);
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;

      if (tile.type === "portal") {
        ctx.strokeStyle = theme.portal;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 15, 20, Math.PI / 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, 7, 11, Math.PI / 5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tile.type === "ice") {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(x * TILE + 6, y * TILE + 6, TILE - 12, TILE - 12);
        ctx.strokeStyle = theme.ice;
        ctx.strokeRect(x * TILE + 10, y * TILE + 10, TILE - 20, TILE - 20);
      } else if (tile.type === "spark") {
        ctx.strokeStyle = theme.glow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 12);
        ctx.lineTo(cx, cy - 14);
        ctx.lineTo(cx + 10, cy + 12);
        ctx.stroke();
      } else if (tile.type === "gate") {
        ctx.fillStyle = state.gateOpen ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.42)";
        ctx.fillRect(x * TILE + 4, y * TILE + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = state.gateOpen ? theme.gate : theme.danger;
        ctx.lineWidth = 3;
        ctx.strokeRect(x * TILE + 9, y * TILE + 9, TILE - 18, TILE - 18);
      }
    }
  }

  function drawPressureWarnings(theme) {
    for (const warning of pressureWarnings) {
      const px = warning.x * TILE;
      const py = warning.y * TILE;
      const pulse = 0.45 + Math.sin(performance.now() * 0.022) * 0.22;
      ctx.fillStyle = hexToRgba(theme.danger, pulse);
      ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = "#fff7e6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 9, py + 9);
      ctx.lineTo(px + TILE - 9, py + TILE - 9);
      ctx.moveTo(px + TILE - 9, py + 9);
      ctx.lineTo(px + 9, py + TILE - 9);
      ctx.stroke();
    }
  }

  function drawPickups(theme) {
    for (const item of pickups) {
      const cx = item.x * TILE + TILE / 2;
      const cy = item.y * TILE + TILE / 2;
      ctx.save();
      ctx.translate(cx, cy);

      const color = pickupColor(item.type, theme);
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 2;

      if (item.type === "gem") {
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(14, -2);
        ctx.lineTo(7, 15);
        ctx.lineTo(-7, 15);
        ctx.lineTo(-14, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(-13, -13, 26, 26);
        ctx.strokeRect(-13, -13, 26, 26);
        drawPickupIcon(item.type);
      }

      ctx.restore();
    }
  }

  function drawPickupIcon(type) {
    ctx.save();
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#111";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "bombUp") {
      ctx.beginPath();
      ctx.arc(-3, 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff7e6";
      ctx.beginPath();
      ctx.moveTo(3, -5);
      ctx.quadraticCurveTo(8, -10, 12, -5);
      ctx.stroke();
      drawPlus(8, 7, "#111");
    } else if (type === "fireUp") {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.quadraticCurveTo(9, -3, 4, 9);
      ctx.quadraticCurveTo(0, 14, -5, 9);
      ctx.quadraticCurveTo(-11, 1, 0, -11);
      ctx.fill();
      ctx.fillStyle = "#fff7e6";
      ctx.beginPath();
      ctx.moveTo(1, -2);
      ctx.quadraticCurveTo(5, 4, 0, 9);
      ctx.quadraticCurveTo(-3, 5, 1, -2);
      ctx.fill();
    } else if (type === "speedUp") {
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(1, -6);
      ctx.lineTo(1, -11);
      ctx.lineTo(12, 0);
      ctx.lineTo(1, 11);
      ctx.lineTo(1, 6);
      ctx.lineTo(-10, 6);
      ctx.stroke();
    } else if (type === "kick") {
      ctx.beginPath();
      ctx.ellipse(-3, 2, 6, 10, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(12, 0);
      ctx.lineTo(8, -4);
      ctx.moveTo(12, 0);
      ctx.lineTo(8, 4);
      ctx.stroke();
    } else if (type === "shield") {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(10, -6);
      ctx.lineTo(7, 8);
      ctx.lineTo(0, 13);
      ctx.lineTo(-7, 8);
      ctx.lineTo(-10, -6);
      ctx.closePath();
      ctx.stroke();
    } else if (isPoisonType(type)) {
      drawPoisonSkull(type, 1);
    }

    ctx.restore();
  }

  function drawPoisonSkull(type, scale = 1) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -3, 8, Math.PI * 0.08, Math.PI * 0.92, true);
    ctx.quadraticCurveTo(-9, 4, -5, 10);
    ctx.lineTo(5, 10);
    ctx.quadraticCurveTo(9, 4, 8, -3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff7e6";
    ctx.beginPath();
    ctx.arc(-3.5, -3, 2.4, 0, Math.PI * 2);
    ctx.arc(3.5, -3, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-4, 7, 2, 3);
    ctx.fillRect(1, 7, 2, 3);

    ctx.strokeStyle = poisonColor(type);
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (type === "poisonFastBomb") {
      ctx.moveTo(-9, 13);
      ctx.lineTo(2, 13);
      ctx.lineTo(2, 9);
      ctx.lineTo(10, 15);
      ctx.lineTo(2, 21);
      ctx.lineTo(2, 17);
      ctx.lineTo(-9, 17);
    } else if (type === "poisonSlowBomb") {
      ctx.arc(0, 15, 5, 0, Math.PI * 2);
      ctx.moveTo(0, 15);
      ctx.lineTo(0, 11);
      ctx.moveTo(0, 15);
      ctx.lineTo(4, 17);
    } else if (type === "poisonHaste") {
      ctx.moveTo(-8, 16);
      ctx.lineTo(8, 10);
      ctx.moveTo(-7, 21);
      ctx.lineTo(9, 15);
    } else if (type === "poisonSlow") {
      ctx.moveTo(-9, 14);
      ctx.quadraticCurveTo(-2, 10, 4, 14);
      ctx.quadraticCurveTo(8, 17, 2, 19);
      ctx.lineTo(-7, 19);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPlus(x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
    ctx.restore();
  }

  function pickupColor(type, theme) {
    if (type === "gem") return theme.gem;
    if (isPoisonType(type)) return poisonColor(type);
    if (type === "shield") return "#ffffff";
    return theme.glow;
  }

  function drawBombs(theme) {
    for (const bomb of bombs) {
      const pulse = 1 + Math.sin(performance.now() * 0.012) * 0.08;
      const fuse = clamp(bomb.timer / (bomb.maxTimer || DEFAULT_BOMB_TIMER), 0, 1);
      const dangerPulse = 1 - fuse;
      ctx.save();
      ctx.translate(bomb.px, bomb.py);
      ctx.scale(pulse, pulse);

      const shell = ctx.createRadialGradient(-5, -7, 3, 0, 0, 22);
      shell.addColorStop(0, "#f7fbff");
      shell.addColorStop(0.22, theme.glow);
      shell.addColorStop(0.6, "#1a1d25");
      shell.addColorStop(1, "#050608");

      ctx.fillStyle = shell;
      ctx.beginPath();
      ctx.arc(0, 0, BOMB_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = hexToRgba(theme.danger, 0.7 + dangerPulse * 0.3);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, BOMB_RADIUS + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fuse);
      ctx.stroke();

      ctx.fillStyle = hexToRgba(theme.danger, 0.24 + dangerPulse * 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, 8 + dangerPulse * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.58)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(8, -2);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 8);
      ctx.stroke();

      ctx.strokeStyle = theme.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(7, -13);
      ctx.quadraticCurveTo(14, -25, 23, -19);
      ctx.stroke();

      ctx.fillStyle = theme.danger;
      ctx.beginPath();
      ctx.arc(24, -19, 4 + dangerPulse * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fff7e6";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(24, -26);
      ctx.lineTo(24, -13);
      ctx.moveTo(17, -19);
      ctx.lineTo(31, -19);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBlasts(theme) {
    for (const blast of blasts) {
      const alpha = clamp(blast.ttl / 0.42, 0, 1);
      for (const cell of blast.cells) {
        const px = cell.x * TILE;
        const py = cell.y * TILE;
        ctx.fillStyle = `rgba(255, 238, 140, ${0.55 * alpha})`;
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.fillStyle = hexToRgba(theme.danger, 0.42 * alpha);
        ctx.fillRect(px + 10, py + 10, TILE - 20, TILE - 20);
      }
    }
  }

  function drawPlayers() {
    for (const player of players) {
      if (!player.alive && !player.escaped) {
        drawOutMarker(player);
        continue;
      }
      if (player.escaped) continue;

      ctx.save();
      ctx.translate(player.px, player.py);
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 12;

      ctx.fillStyle = shadeColor(player.color, -36);
      ctx.beginPath();
      ctx.roundRect(10, -5, 11, 20, 6);
      ctx.fill();

      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.roundRect(-17, -19, 34, 39, 13);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.roundRect(-12, -15, 24, 7, 5);
      ctx.fill();

      ctx.fillStyle = "#0d1320";
      ctx.beginPath();
      ctx.roundRect(-12, -10, 24, 12, 7);
      ctx.fill();
      ctx.fillStyle = player.skillTimer > 0 ? "rgba(255,255,255,0.55)" : "#c8fbff";
      ctx.fillRect(-7, -6, 5, 4);
      ctx.fillRect(3, -6, 5, 4);

      if (state.skinMode === "ai") {
        drawAiBadge(player.badge, 0, 8, player.color);
      } else {
        drawArmorBadge(player);
      }

      ctx.fillStyle = shadeColor(player.color, -24);
      ctx.beginPath();
      ctx.roundRect(-14, 18, 10, 6, 3);
      ctx.roundRect(4, 18, 10, 6, 3);
      ctx.fill();

      if (player.shield > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      drawPoisonAura(player);

      ctx.fillStyle = "#fff7e6";
      ctx.font = "800 11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(player.label, 0, -25);
      ctx.restore();
    }
  }

  function drawPoisonAura(player) {
    if (!playerHasPoison(player)) return;
    const color = poisonColor(player.poison.type);
    const pulse = 1 + Math.sin(performance.now() * 0.013 + player.id) * 0.06;

    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.78);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 25 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.translate(18, -16);
    drawPoisonSkull(player.poison.type, 0.42);
    ctx.restore();
  }

  function drawArmorBadge(player) {
    ctx.fillStyle = "#111";
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player.short, 0, 5);
  }

  function shadeColor(hex, amount) {
    const clean = hex.replace("#", "");
    const r = clamp(parseInt(clean.slice(0, 2), 16) + amount, 0, 255);
    const g = clamp(parseInt(clean.slice(2, 4), 16) + amount, 0, 255);
    const b = clamp(parseInt(clean.slice(4, 6), 16) + amount, 0, 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawAiBadge(type, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "#f7fbff";
    ctx.beginPath();
    ctx.roundRect(-10, -10, 20, 20, 6);
    ctx.fill();

    if (type === "boltRing") {
      ctx.strokeStyle = "#111";
      ctx.beginPath();
      ctx.arc(0, 0, 6.4, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(5, -10);
      ctx.lineTo(-2, 0);
      ctx.lineTo(2, 0);
      ctx.lineTo(-6, 10);
      ctx.lineTo(7, -3);
      ctx.lineTo(2, -3);
      ctx.closePath();
      ctx.fill();
    } else if (type === "moduleChain") {
      ctx.fillStyle = color;
      drawBadgeHex(-4, -5, 5);
      drawBadgeHex(5, -1, 5);
      drawBadgeHex(-3, 7, 5);
    } else if (type === "starCore") {
      const gradient = ctx.createLinearGradient(-8, -8, 8, 8);
      gradient.addColorStop(0, "#ff5d6c");
      gradient.addColorStop(0.35, "#ffbf47");
      gradient.addColorStop(0.68, "#42e8ca");
      gradient.addColorStop(1, "#5478ff");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.quadraticCurveTo(3, -2, 9, 0);
      ctx.quadraticCurveTo(3, 2, 0, 9);
      ctx.quadraticCurveTo(-3, 2, -9, 0);
      ctx.quadraticCurveTo(-3, -2, 0, -9);
      ctx.fill();
    } else if (type === "botFace") {
      ctx.fillStyle = "#17cfa2";
      ctx.beginPath();
      ctx.roundRect(-8, -7, 16, 14, 5);
      ctx.fill();
      ctx.strokeStyle = "#17cfa2";
      ctx.beginPath();
      ctx.moveTo(-4, -7);
      ctx.lineTo(-8, -11);
      ctx.moveTo(4, -7);
      ctx.lineTo(8, -11);
      ctx.stroke();
      ctx.fillStyle = "#f7fbff";
      ctx.fillRect(-5, -1, 3, 5);
      ctx.fillRect(3, -1, 3, 5);
    } else if (type === "softLoop") {
      ctx.strokeStyle = "#1486ff";
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.ellipse(-4, 0, 6, 8, -0.35, 0, Math.PI * 2);
      ctx.ellipse(4, 0, 6, 8, 0.35, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === "knotCore") {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 4; i += 1) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.roundRect(-4, -10, 8, 13, 3);
        ctx.stroke();
      }
    } else if (type === "cloudTerminal") {
      const gradient = ctx.createLinearGradient(-8, -8, 8, 8);
      gradient.addColorStop(0, "#b78cff");
      gradient.addColorStop(1, "#2457ff");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(-5, 1, 5, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(0, -4, 6, Math.PI, Math.PI * 1.9);
      ctx.arc(6, 1, 5, Math.PI * 1.4, Math.PI * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#fff7e6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -1);
      ctx.lineTo(-1, 3);
      ctx.lineTo(-5, 7);
      ctx.moveTo(4, 7);
      ctx.lineTo(10, 7);
      ctx.stroke();
    } else if (type === "greenHelper") {
      ctx.fillStyle = "#09c979";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f7fbff";
      ctx.beginPath();
      ctx.roundRect(-6, -4, 12, 8, 5);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(-4, -2, 2, 5);
      ctx.beginPath();
      ctx.moveTo(3, -1);
      ctx.lineTo(6, 2);
      ctx.lineTo(3, 5);
      ctx.strokeStyle = "#111";
      ctx.stroke();
    } else if (type === "orangeBurst") {
      ctx.strokeStyle = "#de7654";
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i += 1) {
        const angle = (Math.PI * 2 * i) / 10 + 0.15;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 2.5, Math.sin(angle) * 2.5);
        ctx.lineTo(Math.cos(angle) * 9, Math.sin(angle) * 9);
        ctx.stroke();
      }
      ctx.fillStyle = "#de7654";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "ribbonOrbit") {
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = "#9a63ff";
      ctx.beginPath();
      ctx.ellipse(-3, 0, 7, 10, -0.35, 0.18 * Math.PI, 1.86 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = "#2457ff";
      ctx.beginPath();
      ctx.ellipse(3, 0, 7, 10, 0.35, 0.18 * Math.PI, 1.86 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = "#42e8ca";
      ctx.beginPath();
      ctx.arc(0, 0, 7.2, -0.12 * Math.PI, 0.88 * Math.PI);
      ctx.stroke();
    } else if (type === "whaleWave") {
      ctx.fillStyle = "#456bff";
      ctx.beginPath();
      ctx.moveTo(-9, 1);
      ctx.quadraticCurveTo(-4, -8, 5, -6);
      ctx.quadraticCurveTo(11, -4, 10, 2);
      ctx.quadraticCurveTo(6, 11, -5, 8);
      ctx.quadraticCurveTo(-10, 6, -9, 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(7, -5);
      ctx.lineTo(12, -10);
      ctx.lineTo(12, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f7fbff";
      ctx.beginPath();
      ctx.arc(2, -2, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#f7fbff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7, 3);
      ctx.quadraticCurveTo(-1, 8, 7, 4);
      ctx.stroke();
    } else if (type === "violetBlocks") {
      ctx.fillStyle = "#5b48ff";
      ctx.beginPath();
      ctx.roundRect(-9, -9, 18, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#fff7e6";
      ctx.save();
      ctx.rotate(-0.55);
      ctx.fillRect(-8, -7, 12, 5);
      ctx.fillRect(-1, 0, 13, 5);
      ctx.fillRect(-9, 6, 10, 5);
      ctx.restore();
    } else if (type === "catBot") {
      ctx.fillStyle = "#18c9ac";
      ctx.beginPath();
      ctx.roundRect(-9, -8, 18, 17, 5);
      ctx.fill();
      ctx.fillStyle = "#f7fbff";
      ctx.beginPath();
      ctx.moveTo(-8, -3);
      ctx.lineTo(-11, -10);
      ctx.lineTo(-3, -7);
      ctx.lineTo(4, -7);
      ctx.lineTo(11, -10);
      ctx.lineTo(8, -3);
      ctx.roundRect(-8, -5, 16, 13, 5);
      ctx.fill();
      ctx.fillStyle = "#18c9ac";
      ctx.beginPath();
      ctx.roundRect(-5, -1, 3, 6, 2);
      ctx.roundRect(3, -1, 3, 6, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBadgeHex(x, y, radius) {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = Math.PI / 6 + (Math.PI / 3) * i;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawOutMarker(player) {
    ctx.save();
    ctx.translate(player.px, player.py);
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(12, 12);
    ctx.moveTo(12, -12);
    ctx.lineTo(-12, 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = hexToRgba(p.color, alpha);
      ctx.fillRect(p.px - 2, p.py - 2, 4, 4);
    }
  }

  function drawGateHint(theme) {
    if (state.phase !== "running") return;
    const totalGems = players.reduce((sum, player) => sum + player.gems, 0);
    const text = state.gateOpen ? "出口已开" : `开门: ${totalGems}/8 宝石 或剩45秒`;
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(WORLD_W - 188, 7, 180, 24);
    ctx.fillStyle = state.gateOpen ? theme.gate : "rgba(255,255,255,0.82)";
    ctx.font = "900 12px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(text, WORLD_W - 14, 23);
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WORLD_W * dpr;
    canvas.height = WORLD_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function playTone(frequency, duration, type = "sine") {
    if (muted) return;
    try {
      audioCtx ||= new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch {
      muted = true;
      ui.muteButton.textContent = "静";
    }
  }

  function tick(now) {
    const dt = clamp((now - lastTime) / 1000, 0, 0.05);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(tick);
  }

  function initEvents() {
    ui.startButton.addEventListener("click", startGame);
    ui.totalPlayers.addEventListener("change", syncPlayerOptions);
    ui.humanPlayers.addEventListener("change", syncPlayerOptions);
    ui.controlMode.addEventListener("change", renderTouchControls);
    ui.settingsButton.addEventListener("click", openSettings);
    ui.closeSettings.addEventListener("click", closeSettings);
    ui.settingsPanel.addEventListener("click", (event) => {
      if (event.target.dataset.closeSettings) closeSettings();
    });
    ui.skinMode.addEventListener("change", () => {
      state.skinMode = ui.skinMode.value;
    });
    ui.muteButton.addEventListener("click", () => {
      muted = !muted;
      ui.muteButton.textContent = muted ? "静" : "声";
      ui.muteButton.setAttribute("aria-label", muted ? "sound off" : "sound on");
    });

    ui.themeButtons.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme]");
      if (!button) return;
      state.theme = button.dataset.theme;
      document.body.dataset.theme = state.theme;
      ui.themeButtons.querySelectorAll(".theme-chip").forEach((item) => item.classList.toggle("is-active", item === button));
      renderItemLegend();
    });

    window.addEventListener("keydown", (event) => {
      keys.add(event.code);
      const playerIndex = keyControls.findIndex((controls) => controls.bomb === event.code);
      if (playerIndex !== -1 && !event.repeat && players[playerIndex] && !players[playerIndex].ai) {
        event.preventDefault();
        placeBomb(players[playerIndex]);
      }
      const skillPlayerIndex = keyControls.findIndex((controls) => controls.skill === event.code);
      if (skillPlayerIndex !== -1 && !event.repeat && players[skillPlayerIndex] && !players[skillPlayerIndex].ai) {
        event.preventDefault();
        useSkill(players[skillPlayerIndex]);
      }
      if (["Space", "ShiftLeft", "Slash", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      keys.delete(event.code);
    });

    ui.touchDock.addEventListener("pointerdown", (event) => {
      const stick = event.target.closest("[data-stick]");
      if (stick) {
        event.preventDefault();
        stick.setPointerCapture(event.pointerId);
        activeSticks.set(event.pointerId, stick);
        updateJoystick(stick, event);
        return;
      }

      const button = event.target.closest("button");
      if (!button) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.classList.add("is-pressed");
      const playerIndex = Number(button.dataset.player);
      if (button.dataset.bomb) {
        if (players[playerIndex] && !players[playerIndex].ai) placeBomb(players[playerIndex]);
      } else if (button.dataset.skill) {
        if (players[playerIndex] && !players[playerIndex].ai) useSkill(players[playerIndex]);
      }
    });

    ui.touchDock.addEventListener("pointermove", (event) => {
      const stick = activeSticks.get(event.pointerId);
      if (stick) {
        event.preventDefault();
        updateJoystick(stick, event);
      }
    });

    ui.touchDock.addEventListener("pointerup", clearTouchButton);
    ui.touchDock.addEventListener("pointercancel", clearTouchButton);
    window.addEventListener("resize", resizeCanvas);
  }

  function clearTouchButton(event) {
    const stick = activeSticks.get(event.pointerId);
    if (stick) {
      const playerIndex = Number(stick.dataset.player);
      resetJoystick(stick);
      if (virtualInputs[playerIndex]) virtualInputs[playerIndex] = { x: 0, y: 0 };
      activeSticks.delete(event.pointerId);
      return;
    }

    const button = event.target.closest("button");
    if (!button) return;
    button.classList.remove("is-pressed");
  }

  function updateJoystick(stick, event) {
    const playerIndex = Number(stick.dataset.player);
    if (!virtualInputs[playerIndex]) return;

    const base = stick.querySelector(".stick-base");
    const knob = stick.querySelector(".stick-knob");
    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const max = rect.width * 0.33;
    const distance = Math.hypot(dx, dy);

    if (distance > max) {
      dx = (dx / distance) * max;
      dy = (dy / distance) * max;
    }

    const deadZone = 5;
    const next = distance < deadZone ? { x: 0, y: 0 } : { x: dx / max, y: dy / max };
    virtualInputs[playerIndex] = next;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  function resetJoystick(stick) {
    const knob = stick.querySelector(".stick-knob");
    if (knob) knob.style.transform = "translate(-50%, -50%)";
  }

  function boot() {
    resizeCanvas();
    syncPlayerOptions();
    buildMap();
    createPlayers();
    renderTouchControls();
    updateUi();
    render();
    initEvents();
    requestAnimationFrame(tick);
  }

  boot();
})();
