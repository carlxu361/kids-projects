const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  raidName: document.querySelector("#raidName"),
  timer: document.querySelector("#timer"),
  objective: document.querySelector("#objective"),
  extractHint: document.querySelector("#extractHint"),
  weightText: document.querySelector("#weightText"),
  soundState: document.querySelector("#soundState"),
  hpBar: document.querySelector("#hpBar"),
  hpText: document.querySelector("#hpText"),
  staminaBar: document.querySelector("#staminaBar"),
  weaponName: document.querySelector("#weaponName"),
  ammoText: document.querySelector("#ammoText"),
  interactText: document.querySelector("#interactText"),
  log: document.querySelector("#log"),
  mapGrid: document.querySelector("#mapGrid"),
  startRaid: document.querySelector("#startRaid"),
  bagGrid: document.querySelector("#bagGrid"),
  secureGrid: document.querySelector("#secureGrid"),
  moneyText: document.querySelector("#moneyText"),
  stashCount: document.querySelector("#stashCount"),
  secureCount: document.querySelector("#secureCount"),
  killsText: document.querySelector("#killsText"),
  stashList: document.querySelector("#stashList"),
  clearSave: document.querySelector("#clearSave"),
  toggleInventory: document.querySelector("#toggleInventory"),
  damageVignette: document.querySelector("#damageVignette"),
  resultDialog: document.querySelector("#resultDialog"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultCopy: document.querySelector("#resultCopy"),
  resultLoot: document.querySelector("#resultLoot"),
  closeResult: document.querySelector("#closeResult")
};

const TILE = 1;
const FOV = Math.PI / 3;
const RAYS = 260;
const MAX_DEPTH = 22;
const SAVE_KEY = "extractionRaidPrototype.v1";

const maps = [
  {
    id: "sluice",
    name: "闸门水坝",
    size: "小",
    note: "短路线，适合快速练习撤离",
    time: 30 * 60,
    spawn: [2.5, 2.5, 0],
    fixedExtract: [16.5, 2.5],
    randomExtracts: [[2.5, 12.5], [16.5, 13.5]],
    switchPos: [9.5, 7.5],
    switchExtract: [17.5, 12.5],
    layout: [
      "####################",
      "#..L....#......L..E#",
      "#.......#..........#",
      "#..###..#..####....#",
      "#....#.....#..#....#",
      "#L...#..L..#..#..L.#",
      "###..######...#....#",
      "#.......S.....#....#",
      "#..####...###.#..###",
      "#..#..#...#...#....#",
      "#..#..#####........#",
      "#..L.........L...X.#",
      "#.......####.......#",
      "#E......#..L.......#",
      "####################"
    ]
  },
  {
    id: "orbital",
    name: "轨道基地",
    size: "中",
    note: "中等路线，有更多仓库和巡逻 AI",
    time: 30 * 60,
    spawn: [2.5, 14.5, -0.3],
    fixedExtract: [23.5, 2.5],
    randomExtracts: [[3.5, 2.5], [23.5, 14.5]],
    switchPos: [13.5, 8.5],
    switchExtract: [24.5, 8.5],
    layout: [
      "############################",
      "#..L....#........#....L...E#",
      "#.......#..####..#.........#",
      "#..###.....#..#.....####...#",
      "#....#..L..#..#..L..#..#...#",
      "###..######...######...#...#",
      "#.............#......L.#...#",
      "#..####...###.#..#######...#",
      "#..#..#...#...#.....S......#",
      "#..#..#####...#####..#######",
      "#..L.........L.......#.....#",
      "#.......####.....###.#..L..#",
      "#..###..#..#.....#...#.....#",
      "#....#.....#..L..#...#####.#",
      "#E...#..L..#...............#",
      "############################"
    ]
  },
  {
    id: "az3",
    name: "灰区三号",
    size: "大",
    note: "路线更长，物资更多，风险更高",
    time: 30 * 60,
    spawn: [2.5, 17.5, -0.15],
    fixedExtract: [30.5, 2.5],
    randomExtracts: [[2.5, 2.5], [30.5, 17.5], [16.5, 9.5]],
    switchPos: [16.5, 5.5],
    switchExtract: [31.5, 10.5],
    layout: [
      "##################################",
      "#..L....#......L...#......#....E#",
      "#.......#..........#..L...#.....#",
      "#..###..#..####....#..#######...#",
      "#....#.....#..#....#.......#....#",
      "#L...#..L..#..#..L.#####...#..L.#",
      "###..######...#........#...#....#",
      "#.......S.....#..####..#...#....#",
      "#..####...###.#..#..#..#...#..###",
      "#..#..#...#...#..#..#......#....#",
      "#..#..#####......#..#####..#....#",
      "#..L.........L...#......#..#..L.#",
      "#.......####.....#..L...#.......#",
      "#..###..#..#.....#####..#########",
      "#....#.....#..L.................#",
      "#E...#..L..#......#######..L....#",
      "#....#.....#...........X........#",
      "#....L........L.................#",
      "##################################"
    ]
  }
];

const itemTypes = [
  { id: "cash", name: "现金卷", value: 900, weight: 0.2, slots: 1, color: "#62d68b" },
  { id: "med", name: "急救包", value: 450, weight: 1.2, slots: 1, color: "#e66761", use: "heal" },
  { id: "ammo", name: "步枪弹", value: 260, weight: 0.8, slots: 1, color: "#f0b84f", use: "ammo" },
  { id: "chip", name: "数据芯片", value: 1800, weight: 0.4, slots: 1, color: "#71a7ff" },
  { id: "armor", name: "轻甲片", value: 1200, weight: 4.5, slots: 2, color: "#b8c4c1" },
  { id: "tool", name: "闸机钥匙", value: 1500, weight: 1.0, slots: 1, color: "#bd8cff" },
  { id: "gold", name: "金属样本", value: 3200, weight: 3.0, slots: 2, color: "#ffd36a" }
];

const weapons = [
  { name: "R-9 Carbine", mag: 24, ammo: 72, damage: 38, delay: 150, spread: 0.025, range: 12 },
  { name: "K-17 Pistol", mag: 12, ammo: 36, damage: 30, delay: 230, spread: 0.04, range: 9 },
  { name: "Field Knife", mag: 1, ammo: 0, damage: 55, delay: 420, spread: 0.18, range: 1.4, melee: true }
];

let save = loadSave();
let selectedMapId = save.lastMap || "sluice";
let audioCtx = null;
let soundOn = true;
let keys = {};
let mouseDx = 0;
let lastTime = performance.now();
let game = null;

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY)) || { money: 0, stash: [], lastMap: "sluice" };
  } catch {
    return { money: 0, stash: [], lastMap: "sluice" };
  }
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function cloneItem(typeId) {
  const type = itemTypes.find(item => item.id === typeId) || itemTypes[0];
  return { ...type, uid: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}` };
}

function pickLoot(rare = false) {
  const pool = rare ? ["cash", "cash", "med", "ammo", "chip", "armor", "tool", "gold"] : ["cash", "cash", "med", "ammo", "chip", "armor"];
  return cloneItem(pool[Math.floor(Math.random() * pool.length)]);
}

function addLog(text) {
  const p = document.createElement("p");
  p.textContent = text;
  ui.log.prepend(p);
  while (ui.log.children.length > 4) ui.log.lastChild.remove();
  setTimeout(() => p.remove(), 4200);
}

function beep(freq, duration, type = "square", gain = 0.04) {
  if (!soundOn) return;
  audioCtx ||= new AudioContext();
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.value = gain;
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start();
  amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

function createState(map) {
  const randomExtractOpen = Math.random() > 0.38;
  const randomExtract = randomExtractOpen ? map.randomExtracts[Math.floor(Math.random() * map.randomExtracts.length)] : null;
  const enemies = [];
  const loot = [];
  map.layout.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "L") {
        loot.push({ x: x + 0.5, y: y + 0.5, open: false, items: [pickLoot(), pickLoot(Math.random() > 0.65)] });
      }
      if (cell === "."
        && Math.random() < (map.id === "az3" ? 0.045 : map.id === "orbital" ? 0.035 : 0.03)
        && Math.hypot(x + 0.5 - map.spawn[0], y + 0.5 - map.spawn[1]) > 5) {
        enemies.push({ x: x + 0.5, y: y + 0.5, hp: 80, cooldown: Math.random() * 2, alert: 0, dead: false });
      }
    });
  });
  return {
    map,
    running: true,
    ended: false,
    timeLeft: map.time,
    player: {
      x: map.spawn[0],
      y: map.spawn[1],
      angle: map.spawn[2],
      hp: 100,
      stamina: 100,
      kills: 0,
      weaponIndex: 0,
      mags: weapons.map(w => w.mag),
      reserves: weapons.map(w => w.ammo),
      bag: [cloneItem("med"), cloneItem("ammo")],
      secure: [],
      maxWeight: 35
    },
    enemies,
    loot,
    fixedExtract: map.fixedExtract,
    randomExtract,
    switchPulled: false,
    lastShot: 0,
    wallHits: new Array(RAYS).fill(0)
  };
}

function cellAt(map, x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (!map.layout[iy] || !map.layout[iy][ix]) return "#";
  return map.layout[iy][ix];
}

function isWall(map, x, y) {
  return cellAt(map, x, y) === "#";
}

function weightOf(items) {
  return items.reduce((sum, item) => sum + item.weight, 0);
}

function usedSlots(items) {
  return items.reduce((sum, item) => sum + item.slots, 0);
}

function canFit(items, item, maxSlots) {
  return usedSlots(items) + item.slots <= maxSlots;
}

function tryAddLoot(item) {
  if (!game) return false;
  const p = game.player;
  if (canFit(p.bag, item, 20)) {
    p.bag.push(item);
    addLog(`放入背包：${item.name}`);
    beep(660, 0.06, "triangle");
    return true;
  }
  if (canFit(p.secure, item, 4)) {
    p.secure.push(item);
    addLog(`背包满了，放入安全箱：${item.name}`);
    beep(760, 0.06, "triangle");
    return true;
  }
  addLog("背包和安全箱都放不下。");
  return false;
}

function startRaid() {
  const map = maps.find(m => m.id === selectedMapId) || maps[0];
  save.lastMap = map.id;
  saveGame();
  game = createState(map);
  ui.resultDialog.close();
  ui.log.innerHTML = "";
  addLog("行动开始。点击画面锁定视角，WASD 移动，E 互动。");
  beep(220, 0.08, "sawtooth");
  updatePanel();
}

function endRaid(success, reason) {
  if (!game || game.ended) return;
  game.ended = true;
  game.running = false;
  const p = game.player;
  const carried = [...p.bag, ...p.secure];
  let kept = [];
  if (success) {
    kept = carried;
    save.stash.push(...kept.map(({ uid, ...item }) => item));
    save.money += kept.reduce((sum, item) => sum + item.value, 0);
  } else {
    kept = p.secure;
    save.stash.push(...kept.map(({ uid, ...item }) => item));
    save.money += kept.reduce((sum, item) => sum + Math.floor(item.value * 0.25), 0);
  }
  saveGame();
  ui.resultKicker.textContent = success ? "EXTRACTED" : "FAILED RAID";
  ui.resultTitle.textContent = success ? "撤离成功" : "行动失败";
  ui.resultCopy.textContent = success
    ? `你带出了 ${kept.length} 件物资，击倒 ${p.kills} 名 AI。`
    : `${reason}。普通背包掉落，安全箱物品保留。`;
  ui.resultLoot.innerHTML = kept.length
    ? kept.map(item => `<div class="stash-item"><span>${item.name}</span><b>¥${item.value}</b></div>`).join("")
    : `<div class="stash-item"><span>没有带出物资</span><b>¥0</b></div>`;
  ui.resultDialog.showModal();
  document.exitPointerLock?.();
  beep(success ? 740 : 120, 0.18, success ? "triangle" : "sawtooth", 0.06);
  updatePanel();
}

function raycast(angle) {
  const p = game.player;
  let sin = Math.sin(angle);
  let cos = Math.cos(angle);
  for (let depth = 0; depth < MAX_DEPTH; depth += 0.025) {
    const x = p.x + cos * depth;
    const y = p.y + sin * depth;
    if (isWall(game.map, x, y)) {
      return { depth, x, y, shade: cellAt(game.map, x, y) };
    }
  }
  return { depth: MAX_DEPTH, x: p.x + cos * MAX_DEPTH, y: p.y + sin * MAX_DEPTH, shade: "#" };
}

function renderWorld() {
  const w = canvas.width;
  const h = canvas.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h / 2);
  sky.addColorStop(0, "#172527");
  sky.addColorStop(1, "#0a0e0f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h / 2);
  const floor = ctx.createLinearGradient(0, h / 2, 0, h);
  floor.addColorStop(0, "#141b1b");
  floor.addColorStop(1, "#080a0a");
  ctx.fillStyle = floor;
  ctx.fillRect(0, h / 2, w, h / 2);

  for (let i = 0; i < RAYS; i++) {
    const angle = game.player.angle - FOV / 2 + (i / RAYS) * FOV;
    const hit = raycast(angle);
    const corrected = hit.depth * Math.cos(angle - game.player.angle);
    game.wallHits[i] = corrected;
    const lineH = Math.min(h, h / (corrected + 0.001));
    const x = (i / RAYS) * w;
    const colW = Math.ceil(w / RAYS) + 1;
    const light = Math.max(35, 210 - corrected * 15);
    const green = hit.shade === "X" ? Math.min(220, light + 45) : light;
    ctx.fillStyle = `rgb(${Math.floor(light * .56)}, ${Math.floor(green * .68)}, ${Math.floor(light * .64)})`;
    ctx.fillRect(x, h / 2 - lineH / 2, colW, lineH);
    if (i % 9 === 0) {
      ctx.fillStyle = "rgba(255,255,255,.035)";
      ctx.fillRect(x, h / 2 - lineH / 2, 1, lineH);
    }
  }
  drawSprites();
  drawMinimap();
}

function drawSprites() {
  const objects = [];
  game.loot.filter(box => !box.open).forEach(box => objects.push({ ...box, kind: "loot" }));
  game.enemies.filter(enemy => !enemy.dead).forEach(enemy => objects.push({ ...enemy, kind: "enemy" }));
  objects.sort((a, b) => distanceTo(b) - distanceTo(a));
  for (const obj of objects) {
    const dx = obj.x - game.player.x;
    const dy = obj.y - game.player.y;
    const dist = Math.hypot(dx, dy);
    const angle = normalizeAngle(Math.atan2(dy, dx) - game.player.angle);
    if (Math.abs(angle) > FOV / 1.35 || dist < 0.2) continue;
    const screenX = (0.5 + angle / FOV) * canvas.width;
    const size = Math.min(canvas.height, canvas.height / dist * (obj.kind === "enemy" ? 0.82 : 0.42));
    const rayIndex = Math.floor(screenX / canvas.width * RAYS);
    if (game.wallHits[rayIndex] && game.wallHits[rayIndex] < dist - 0.25) continue;
    const y = canvas.height / 2 - size / (obj.kind === "enemy" ? 1.8 : 2.8);
    if (obj.kind === "enemy") {
      ctx.fillStyle = dist < 4 ? "#e66761" : "#b84f4b";
      ctx.fillRect(screenX - size * .22, y, size * .44, size);
      ctx.fillStyle = "#111";
      ctx.fillRect(screenX - size * .16, y + size * .22, size * .32, size * .1);
      ctx.fillStyle = "#f0b84f";
      ctx.fillRect(screenX - size * .2, y - 8, size * .4 * (obj.hp / 80), 4);
    } else {
      ctx.fillStyle = "#f0b84f";
      ctx.fillRect(screenX - size * .35, y, size * .7, size * .48);
      ctx.fillStyle = "#533b17";
      ctx.fillRect(screenX - size * .28, y + size * .12, size * .56, 3);
    }
  }
}

function drawMinimap() {
  const scale = 4;
  const pad = 12;
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(pad, canvas.height - 110, 130, 96);
  const p = game.player;
  for (let y = 0; y < game.map.layout.length; y++) {
    for (let x = 0; x < game.map.layout[y].length; x++) {
      const cell = game.map.layout[y][x];
      if (cell === "#") ctx.fillStyle = "#627173";
      else if (cell === "L") ctx.fillStyle = "#9a7a32";
      else ctx.fillStyle = "#172021";
      ctx.fillRect(pad + x * scale, canvas.height - 106 + y * scale, scale, scale);
    }
  }
  ctx.fillStyle = "#62d68b";
  ctx.fillRect(pad + p.x * scale - 2, canvas.height - 106 + p.y * scale - 2, 4, 4);
  ctx.restore();
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function distanceTo(obj) {
  return Math.hypot(obj.x - game.player.x, obj.y - game.player.y);
}

function movePlayer(dt) {
  const p = game.player;
  p.angle += mouseDx * 0.0025;
  mouseDx = 0;
  const weight = weightOf([...p.bag, ...p.secure]);
  const heavyPenalty = Math.max(0.45, 1 - Math.max(0, weight - 20) * 0.025);
  const sprinting = keys.Shift && p.stamina > 2;
  const speed = (sprinting ? 3.0 : 1.85) * heavyPenalty;
  if (sprinting && (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD)) p.stamina = Math.max(0, p.stamina - dt * 28);
  else p.stamina = Math.min(100, p.stamina + dt * 18);

  let mx = 0;
  let my = 0;
  const forward = keys.KeyW ? 1 : keys.KeyS ? -1 : 0;
  const strafe = keys.KeyD ? 1 : keys.KeyA ? -1 : 0;
  mx += Math.cos(p.angle) * forward + Math.cos(p.angle + Math.PI / 2) * strafe;
  my += Math.sin(p.angle) * forward + Math.sin(p.angle + Math.PI / 2) * strafe;
  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx = (mx / len) * speed * dt;
    my = (my / len) * speed * dt;
    const nx = p.x + mx;
    const ny = p.y + my;
    if (!isWall(game.map, nx, p.y)) p.x = nx;
    if (!isWall(game.map, p.x, ny)) p.y = ny;
  }
}

function updateEnemies(dt) {
  const p = game.player;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    enemy.cooldown -= dt;
    if (dist < 8 && hasLine(enemy.x, enemy.y, p.x, p.y)) enemy.alert = 3;
    else enemy.alert = Math.max(0, enemy.alert - dt);
    if (enemy.alert > 0 && dist > 2.4) {
      const nx = enemy.x + (dx / dist) * dt * 1.05;
      const ny = enemy.y + (dy / dist) * dt * 1.05;
      if (!isWall(game.map, nx, enemy.y)) enemy.x = nx;
      if (!isWall(game.map, enemy.x, ny)) enemy.y = ny;
    }
    if (enemy.alert > 0 && dist < 7 && enemy.cooldown <= 0 && hasLine(enemy.x, enemy.y, p.x, p.y)) {
      enemy.cooldown = 1.05 + Math.random() * 0.8;
      damagePlayer(8 + Math.floor(Math.random() * 8));
      beep(110, 0.08, "sawtooth", 0.035);
    }
  }
}

function hasLine(x1, y1, x2, y2) {
  const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 0.12);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isWall(game.map, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

function shoot() {
  if (!game || game.ended) return;
  const p = game.player;
  const weapon = weapons[p.weaponIndex];
  const now = performance.now();
  if (now - game.lastShot < weapon.delay) return;
  game.lastShot = now;
  if (!weapon.melee) {
    if (p.mags[p.weaponIndex] <= 0) {
      addLog("弹匣空了，按 R 换弹。");
      beep(90, 0.05, "square");
      return;
    }
    p.mags[p.weaponIndex]--;
  }
  beep(weapon.melee ? 260 : 80, weapon.melee ? 0.06 : 0.04, weapon.melee ? "triangle" : "sawtooth", weapon.melee ? 0.03 : 0.07);
  const shotAngle = p.angle + (Math.random() - 0.5) * weapon.spread;
  let best = null;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const dx = enemy.x - p.x;
    const dy = enemy.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > weapon.range) continue;
    const diff = Math.abs(normalizeAngle(Math.atan2(dy, dx) - shotAngle));
    if (diff < (weapon.melee ? 0.35 : 0.08) && hasLine(p.x, p.y, enemy.x, enemy.y)) {
      if (!best || dist < best.dist) best = { enemy, dist };
    }
  }
  if (best) {
    best.enemy.hp -= weapon.damage;
    best.enemy.alert = 4;
    addLog(`命中 AI：-${weapon.damage}`);
    if (best.enemy.hp <= 0) {
      best.enemy.dead = true;
      p.kills++;
      game.loot.push({ x: best.enemy.x, y: best.enemy.y, open: false, items: [pickLoot(), pickLoot(true)] });
      addLog("AI 已击倒，掉落了物资包。");
    }
  }
}

function reload() {
  if (!game || game.ended) return;
  const p = game.player;
  const weapon = weapons[p.weaponIndex];
  if (weapon.melee) return;
  const need = weapon.mag - p.mags[p.weaponIndex];
  const take = Math.min(need, p.reserves[p.weaponIndex]);
  if (take <= 0) {
    addLog("备用弹药不足。");
    return;
  }
  p.mags[p.weaponIndex] += take;
  p.reserves[p.weaponIndex] -= take;
  addLog("换弹完成。");
  beep(420, 0.07, "triangle");
}

function damagePlayer(amount) {
  if (!game || game.ended) return;
  game.player.hp = Math.max(0, game.player.hp - amount);
  ui.damageVignette.classList.add("hit");
  setTimeout(() => ui.damageVignette.classList.remove("hit"), 160);
  if (game.player.hp <= 0) endRaid(false, "生命值归零");
}

function interact() {
  if (!game || game.ended) return;
  const p = game.player;
  const nearLoot = game.loot.find(box => !box.open && distanceTo(box) < 1.35);
  if (nearLoot) {
    nearLoot.open = true;
    nearLoot.items.forEach(tryAddLoot);
    return;
  }
  if (Math.hypot(p.x - game.map.switchPos[0], p.y - game.map.switchPos[1]) < 1.4) {
    game.switchPulled = true;
    addLog("闸机已拉下，拉闸撤离点开启。");
    beep(180, 0.16, "sawtooth", 0.05);
    return;
  }
  const ex = currentExtract();
  if (ex && Math.hypot(p.x - ex[0], p.y - ex[1]) < 1.55) {
    endRaid(true, "extracted");
    return;
  }
  const medIndex = p.bag.findIndex(item => item.use === "heal");
  if (medIndex >= 0 && p.hp < 100) {
    p.bag.splice(medIndex, 1);
    p.hp = Math.min(100, p.hp + 38);
    addLog("使用急救包。");
    beep(620, 0.08, "triangle");
  } else {
    addLog("附近没有可互动目标。");
  }
}

function currentExtract() {
  const p = game.player;
  const candidates = [game.fixedExtract];
  if (game.randomExtract) candidates.push(game.randomExtract);
  if (game.switchPulled) candidates.push(game.map.switchExtract);
  return candidates.sort((a, b) => Math.hypot(p.x - a[0], p.y - a[1]) - Math.hypot(p.x - b[0], p.y - b[1]))[0];
}

function updateGame(dt) {
  if (!game || game.ended) return;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    endRaid(false, "行动时间耗尽");
    return;
  }
  movePlayer(dt);
  updateEnemies(dt);
  updateHud();
}

function updateHud() {
  const p = game.player;
  const weapon = weapons[p.weaponIndex];
  const weight = weightOf([...p.bag, ...p.secure]);
  ui.raidName.textContent = game.map.name;
  ui.timer.textContent = formatTime(game.timeLeft);
  ui.objective.textContent = game.switchPulled ? "目标：撤离点已增加" : "目标：搜物资、活下来、撤离";
  const ex = currentExtract();
  const exDist = Math.hypot(p.x - ex[0], p.y - ex[1]);
  ui.extractHint.textContent = `最近撤离：${exDist.toFixed(1)} m`;
  ui.weightText.textContent = `负重 ${weight.toFixed(1)} / ${p.maxWeight} kg`;
  ui.soundState.textContent = `声音：${soundOn ? "开" : "关"}`;
  ui.hpBar.style.width = `${p.hp}%`;
  ui.hpText.textContent = `${Math.ceil(p.hp)}`;
  ui.staminaBar.style.width = `${p.stamina}%`;
  ui.weaponName.textContent = weapon.name;
  ui.ammoText.textContent = weapon.melee ? "刀具" : `${p.mags[p.weaponIndex]} / ${p.reserves[p.weaponIndex]}`;
  ui.killsText.textContent = p.kills;
  const target = getInteractTarget();
  ui.interactText.textContent = target;
  updateInventory();
}

function getInteractTarget() {
  const p = game.player;
  const loot = game.loot.find(box => !box.open && distanceTo(box) < 1.35);
  if (loot) return "E 搜索物资箱";
  if (Math.hypot(p.x - game.map.switchPos[0], p.y - game.map.switchPos[1]) < 1.4 && !game.switchPulled) return "E 拉下撤离闸机";
  const ex = currentExtract();
  if (ex && Math.hypot(p.x - ex[0], p.y - ex[1]) < 1.55) return "E 撤离";
  if (p.bag.some(item => item.use === "heal") && p.hp < 100) return "E 使用急救包";
  return "E 互动";
}

function updateInventory() {
  if (!game) return;
  renderSlots(ui.bagGrid, game.player.bag, 20);
  renderSlots(ui.secureGrid, game.player.secure, 4);
  ui.secureCount.textContent = `${usedSlots(game.player.secure)}/4`;
}

function renderSlots(el, items, maxSlots) {
  el.innerHTML = "";
  const expanded = [];
  items.forEach(item => {
    expanded.push(item);
    for (let i = 1; i < item.slots; i++) expanded.push({ name: "占用", ghost: true });
  });
  for (let i = 0; i < maxSlots; i++) {
    const item = expanded[i];
    const slot = document.createElement("div");
    slot.className = `slot${item ? " filled" : ""}`;
    slot.textContent = item ? (item.ghost ? "..." : item.name) : "";
    if (item && item.color) slot.style.borderColor = item.color;
    el.append(slot);
  }
}

function updatePanel() {
  ui.moneyText.textContent = `¥${save.money}`;
  ui.stashCount.textContent = save.stash.length;
  ui.stashList.innerHTML = save.stash.length
    ? save.stash.slice(-16).reverse().map(item => `<div class="stash-item"><span>${item.name}</span><b>¥${item.value}</b></div>`).join("")
    : `<div class="stash-item"><span>仓库为空</span><b>先撤离</b></div>`;
  if (game) updateInventory();
}

function renderMapCards() {
  ui.mapGrid.innerHTML = "";
  maps.forEach(map => {
    const button = document.createElement("button");
    button.className = `map-card${map.id === selectedMapId ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${map.name}</strong><small>${map.size}地图 · ${map.note}</small>`;
    button.addEventListener("click", () => {
      selectedMapId = map.id;
      renderMapCards();
    });
    ui.mapGrid.append(button);
  });
}

function formatTime(sec) {
  const safe = Math.max(0, Math.ceil(sec));
  const m = Math.floor(safe / 60).toString().padStart(2, "0");
  const s = (safe % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (game && game.running) updateGame(dt);
  if (game) renderWorld();
  else drawMenuBackdrop();
  requestAnimationFrame(loop);
}

function drawMenuBackdrop() {
  ctx.fillStyle = "#091011";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f3031";
  for (let i = 0; i < 34; i++) {
    ctx.fillRect(i * 44 - 20, canvas.height * .58 + Math.sin(i) * 18, 24, 120);
  }
  ctx.fillStyle = "#e8f2ef";
  ctx.font = "700 28px sans-serif";
  ctx.fillText("选择地图后开始行动", 34, 58);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#92a5a1";
  ctx.fillText("第一版重点是玩法闭环，不是复刻商业素材。", 34, 90);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(640, Math.floor(rect.width * ratio));
  canvas.height = Math.max(360, Math.floor(rect.height * ratio));
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", event => {
  if (event.code === "Tab") {
    event.preventDefault();
    document.body.classList.toggle("show-inventory");
  }
  keys[event.code] = true;
  if (event.code === "KeyR") reload();
  if (event.code === "KeyE") interact();
  if (game && event.code === "Digit1") game.player.weaponIndex = 0;
  if (game && event.code === "Digit2") game.player.weaponIndex = 1;
  if (game && event.code === "Digit3") game.player.weaponIndex = 2;
  if (event.code === "KeyM") {
    soundOn = !soundOn;
    if (game) updateHud();
    else ui.soundState.textContent = `声音：${soundOn ? "开" : "关"}`;
  }
});
window.addEventListener("keyup", event => {
  keys[event.code] = false;
});
window.addEventListener("mousemove", event => {
  if (document.pointerLockElement === canvas) mouseDx += event.movementX;
});
canvas.addEventListener("click", () => {
  canvas.requestPointerLock?.();
  shoot();
});
ui.startRaid.addEventListener("click", startRaid);
ui.closeResult.addEventListener("click", () => ui.resultDialog.close());
ui.toggleInventory.addEventListener("click", () => addLog("右侧面板已经显示背包；Tab 可快速查看。"));
ui.clearSave.addEventListener("click", () => {
  save = { money: 0, stash: [], lastMap: selectedMapId };
  saveGame();
  updatePanel();
  addLog("存档已重置。");
});

resizeCanvas();
renderMapCards();
updatePanel();
drawMenuBackdrop();
requestAnimationFrame(loop);
