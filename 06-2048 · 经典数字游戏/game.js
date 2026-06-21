const SIZE = 4;
const STORAGE_KEY = "classic-2048-state-v1";
const SCORES_KEY = "classic-2048-leaderboard-v1";
const PREFS_KEY = "classic-2048-preferences-v1";
const ADMIN_PALETTES = new Set(["royal", "matrix", "void", "prism", "dragon", "emerald", "blueprint", "rosegold", "midnight", "hologram"]);

const boardEl = document.querySelector("#game-board");
const tileLayer = document.querySelector("#tile-layer");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best-score");
const scoreAddEl = document.querySelector("#score-add");
const undoBtn = document.querySelector("#undo-btn");
const soundBtn = document.querySelector("#sound-btn");
const themeBtn = document.querySelector("#theme-btn");
const effectsBtn = document.querySelector("#effects-btn");
const effectsPanel = document.querySelector("#effects-panel");
const modal = document.querySelector("#game-modal");
const modalTitle = document.querySelector("#modal-title");
const modalCopy = document.querySelector("#modal-copy");
const continueBtn = document.querySelector("#continue-btn");
const leaderboardList = document.querySelector("#leaderboard-list");
const adminTrigger = document.querySelector("#admin-trigger");
const adminModal = document.querySelector("#admin-modal");
const adminLogin = document.querySelector("#admin-login");
const adminTools = document.querySelector("#admin-tools");
const adminForm = document.querySelector("#admin-form");
const adminPassword = document.querySelector("#admin-password");
const adminError = document.querySelector("#admin-error");
const adminStatus = document.querySelector("#admin-status");

let state;
let previousState = null;
let wonAcknowledged = false;
let audioContext = null;
let nextId = 1;
let recordBroken = false;
let bestAtGameStart = 0;
let adminUnlocked = false;
let nextSpawnValue = null;
let debugLabels = false;

const prefs = loadJSON(PREFS_KEY, {
  sound: true,
  dark: window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false,
});
prefs.effects ||= "classic";
prefs.palette ||= "classic";
if (ADMIN_PALETTES.has(prefs.palette)) prefs.palette = "classic";

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function blankGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

function newGame() {
  state = { grid: blankGrid(), score: 0, over: false };
  previousState = null;
  wonAcknowledged = false;
  recordBroken = false;
  bestAtGameStart = getSavedBest();
  modal.hidden = true;
  addRandomTile();
  addRandomTile();
  saveState();
  render();
  boardEl.focus();
}

function addRandomTile() {
  const empty = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) if (!state.grid[y][x]) empty.push({ x, y });
  }
  if (!empty.length) return;
  const spot = empty[Math.floor(Math.random() * empty.length)];
  const value = nextSpawnValue ?? (Math.random() < 0.9 ? 2 : 4);
  nextSpawnValue = null;
  state.grid[spot.y][spot.x] = { id: nextId++, value, isNew: true };
}

function cloneState(source = state) {
  return JSON.parse(JSON.stringify(source));
}

function vectors(direction) {
  const map = {
    left: { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
    up: { dx: 0, dy: -1 }, down: { dx: 0, dy: 1 },
  };
  return map[direction];
}

function traversal(direction) {
  const xs = [...Array(SIZE).keys()];
  const ys = [...Array(SIZE).keys()];
  if (direction === "right") xs.reverse();
  if (direction === "down") ys.reverse();
  return { xs, ys };
}

function move(direction) {
  if (state.over || !modal.hidden || !adminModal.hidden) return;
  const before = cloneState();
  const { dx, dy } = vectors(direction);
  const { xs, ys } = traversal(direction);
  let moved = false;
  let gained = 0;
  const movements = [];

  state.grid.flat().filter(Boolean).forEach(tile => { tile.isNew = false; tile.merged = false; });

  for (const y of ys) {
    for (const x of xs) {
      const tile = state.grid[y][x];
      if (!tile) continue;
      let cx = x;
      let cy = y;
      let mergedAway = false;
      while (true) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) break;
        const target = state.grid[ny][nx];
        if (!target) {
          state.grid[ny][nx] = tile;
          state.grid[cy][cx] = null;
          cx = nx;
          cy = ny;
          moved = true;
          continue;
        }
        if (target.value === tile.value && !target.merged) {
          target.value *= 2;
          target.merged = true;
          state.grid[cy][cx] = null;
          gained += target.value;
          moved = true;
          mergedAway = true;
        }
        break;
      }
      if (mergedAway) movements.push({ id: tile.id, value: tile.value, fromX: x, fromY: y, toX: cx + dx, toY: cy + dy, ghost: true });
      else if (cx !== x || cy !== y) movements.push({ id: tile.id, fromX: x, fromY: y, toX: cx, toY: cy });
    }
  }

  if (!moved) {
    playTone(120, 0.035, "square", 0.025);
    return;
  }

  previousState = before;
  state.score += gained;
  addRandomTile();
  state.over = !canMove();
  saveState();
  render(gained, movements);
  playTone(gained ? 520 : 300, gained ? 0.09 : 0.045, "sine", gained ? 0.06 : 0.035);
  if (!recordBroken && bestAtGameStart > 0 && state.score > bestAtGameStart) {
    recordBroken = true;
    celebrateRecord();
  }

  const reached2048 = state.grid.flat().some(tile => tile?.value >= 2048);
  if (reached2048 && !wonAcknowledged) {
    wonAcknowledged = true;
    window.setTimeout(() => showModal(true), 230);
  } else if (state.over) {
    recordScore();
    window.setTimeout(() => showModal(false), 230);
  }
}

function canMove() {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!state.grid[y][x]) return true;
      if (x < SIZE - 1 && state.grid[y][x].value === state.grid[y][x + 1]?.value) return true;
      if (y < SIZE - 1 && state.grid[y][x].value === state.grid[y + 1][x]?.value) return true;
    }
  }
  return false;
}

function undo() {
  if (!previousState) return;
  state = previousState;
  previousState = null;
  state.over = false;
  modal.hidden = true;
  saveState();
  render();
  playTone(220, 0.06, "sine", 0.03);
}

function tileTransform(x, y) {
  return `translate(calc(${x} * (var(--cell-size) + var(--gap))), calc(${y} * (var(--cell-size) + var(--gap))))`;
}

function render(gained = 0, movements = []) {
  tileLayer.innerHTML = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const tile = state.grid[y][x];
      if (!tile) continue;
      const el = document.createElement("div");
      el.className = `tile${tile.isNew ? " new" : ""}${tile.merged ? " merged" : ""}${tile.value > 2048 ? " super" : ""}`;
      el.dataset.value = tile.value;
      el.dataset.debug = `#${tile.id} · ${x},${y}`;
      el.style.setProperty("--x", x);
      el.style.setProperty("--y", y);
      el.textContent = tile.value;
      const motion = movements.find(item => item.id === tile.id && !item.ghost);
      if (motion) {
        el.style.transition = "none";
        el.style.transform = tileTransform(motion.fromX, motion.fromY);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          el.style.transition = "";
          el.style.transform = tileTransform(x, y);
        }));
      }
      tileLayer.append(el);
    }
  }

  movements.filter(item => item.ghost).forEach(motion => {
    const ghost = document.createElement("div");
    ghost.className = "tile moving-ghost";
    ghost.dataset.value = motion.value;
    ghost.textContent = motion.value;
    ghost.style.transform = tileTransform(motion.fromX, motion.fromY);
    tileLayer.append(ghost);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ghost.style.transform = tileTransform(motion.toX, motion.toY);
      ghost.classList.add("arrived");
    }));
    window.setTimeout(() => ghost.remove(), prefs.effects === "calm" ? 210 : 150);
  });

  scoreEl.textContent = state.score;
  const scores = loadJSON(SCORES_KEY, []);
  bestEl.textContent = Math.max(state.score, ...scores.map(item => item.score), 0);
  undoBtn.disabled = !previousState;
  if (gained) {
    scoreAddEl.textContent = `+${gained}`;
    scoreAddEl.classList.remove("pop");
    void scoreAddEl.offsetWidth;
    scoreAddEl.classList.add("pop");
  }
  updateDebugStats();
}

function getSavedBest() {
  return Math.max(...loadJSON(SCORES_KEY, []).map(item => item.score), 0);
}

function celebrateRecord() {
  const layer = document.querySelector("#celebration-layer");
  const amount = prefs.effects === "calm" ? 14 : prefs.effects === "vivid" ? 42 : 26;
  const colors = ["#edc22e", "#f2b179", "#f65e3b", "#ffffff", "#8f7a66"];
  for (let i = 0; i < amount; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--duration", `${1.3 + Math.random() * 1.2}s`);
    piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    piece.style.setProperty("--spin", `${360 + Math.random() * 720}deg`);
    piece.style.animationDelay = `${Math.random() * .35}s`;
    layer.append(piece);
    window.setTimeout(() => piece.remove(), 3000);
  }
  const toast = document.querySelector("#record-toast");
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  bestEl.closest(".score-card").classList.add("record");
  window.setTimeout(() => bestEl.closest(".score-card").classList.remove("record"), 1000);
  playTone(880, .18, "sine", .07);
}

function placeCheatTile(value) {
  const empty = [];
  const occupied = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (state.grid[y][x]) occupied.push({ x, y, value: state.grid[y][x].value });
      else empty.push({ x, y });
    }
  }
  const spot = empty[Math.floor(Math.random() * empty.length)] ?? occupied.sort((a, b) => a.value - b.value)[0];
  if (!spot) return;
  state.grid[spot.y][spot.x] = { id: nextId++, value, isNew: true };
  state.over = false;
}

function setAdminStatus(message) {
  adminStatus.textContent = message;
  window.setTimeout(() => {
    if (adminStatus.textContent === message) adminStatus.textContent = "";
  }, 2200);
}

function updateDebugStats() {
  const stats = document.querySelector("#debug-stats");
  if (!stats || !state) return;
  const tiles = state.grid.flat().filter(Boolean);
  stats.querySelector('[data-stat="tiles"]').textContent = `${tiles.length} / 16`;
  stats.querySelector('[data-stat="max"]').textContent = Math.max(...tiles.map(tile => tile.value), 0);
  stats.querySelector('[data-stat="movable"]').textContent = canMove() ? "是" : "否";
  stats.querySelector('[data-stat="next"]').textContent = nextSpawnValue ?? "随机";
}

function runCheat(name) {
  if (name === "next-512") {
    nextSpawnValue = 512;
    setAdminStatus("已设定：下一次移动后生成 512");
    updateDebugStats();
    return;
  }
  if (name === "place-2048") {
    placeCheatTile(2048);
    wonAcknowledged = true;
    setAdminStatus("2048 已放入棋盘");
  }
  if (name === "double-score") {
    state.score = state.score ? state.score * 2 : 2048;
    setAdminStatus("当前分数已翻倍");
  }
  if (name === "clear-small") {
    let cleared = 0;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (state.grid[y][x]?.value <= 4) { state.grid[y][x] = null; cleared++; }
      }
    }
    state.over = false;
    setAdminStatus(cleared ? `已清除 ${cleared} 个小方块` : "棋盘上没有 2 或 4");
  }
  if (name === "revive") {
    const tiles = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (state.grid[y][x]) tiles.push({ x, y, value: state.grid[y][x].value });
    tiles.sort((a, b) => a.value - b.value).slice(0, 4).forEach(tile => { state.grid[tile.y][tile.x] = null; });
    state.over = false;
    modal.hidden = true;
    setAdminStatus("死局已解除，腾出了四个位置");
  }
  if (name === "celebrate") {
    celebrateRecord();
    setAdminStatus("最高纪录特效已播放");
  }
  saveState();
  render();
  playTone(620, .08, "sine", .05);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, wonAcknowledged }));
}

function recordScore() {
  if (!state.score) return;
  const scores = loadJSON(SCORES_KEY, []);
  scores.push({ score: state.score, date: new Date().toISOString() });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 5)));
  renderLeaderboard();
}

function renderLeaderboard() {
  const scores = loadJSON(SCORES_KEY, []);
  if (!scores.length) {
    leaderboardList.innerHTML = '<li class="empty">完成一局后，纪录会出现在这里。</li>';
    return;
  }
  leaderboardList.innerHTML = scores.map(item => {
    const date = new Date(item.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
    return `<li><strong>${item.score}</strong><span>${date}</span></li>`;
  }).join("");
}

function showModal(won) {
  modalTitle.textContent = won ? "你做到了！" : "游戏结束";
  modalCopy.textContent = won ? `你合成了 2048，目前得分 ${state.score}。` : `这局拿到了 ${state.score} 分。`;
  continueBtn.hidden = !won;
  modal.hidden = false;
  (won ? continueBtn : document.querySelector("#modal-new-btn")).focus();
  playTone(won ? 740 : 160, won ? 0.22 : 0.12, won ? "sine" : "triangle", 0.06);
}

function playTone(frequency, duration, type, volume) {
  if (!prefs.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Audio is an enhancement; gameplay remains available. */ }
}

function applyPrefs() {
  document.body.classList.toggle("dark", prefs.dark);
  document.body.dataset.effects = prefs.effects;
  document.body.dataset.palette = prefs.palette;
  soundBtn.textContent = prefs.sound ? "♪" : "×";
  soundBtn.title = prefs.sound ? "关闭音效" : "开启音效";
  soundBtn.setAttribute("aria-label", soundBtn.title);
  themeBtn.textContent = prefs.dark ? "☀" : "◐";
  themeBtn.title = prefs.dark ? "切换浅色模式" : "切换深色模式";
  themeBtn.setAttribute("aria-label", themeBtn.title);
  const themeColors = { starlight: "#15162d", lava: "#201916", aurora: "#10242f", abyss: "#071e2a", desert: "#f4e7cb", royal: "#171126", matrix: "#061009", void: "#080612", prism: "#121725", dragon: "#1c1010", emerald: "#071b16", blueprint: "#081d35", rosegold: "#291b20", midnight: "#050812", hologram: "#101827" };
  document.querySelector('meta[name="theme-color"]').content = themeColors[prefs.palette] ?? (prefs.dark ? "#25231f" : "#faf8ef");
  document.querySelectorAll("[data-setting]").forEach(group => {
    const key = group.dataset.setting;
    group.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.value === prefs[key]));
  });
  document.querySelectorAll("[data-admin-theme]").forEach(button => button.classList.toggle("active", button.dataset.adminTheme === prefs.palette));
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

const directionForKey = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !adminModal.hidden) {
    adminModal.hidden = true;
    return;
  }
  const direction = directionForKey[event.key];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});

let touchStart = null;
boardEl.addEventListener("pointerdown", event => {
  touchStart = { x: event.clientX, y: event.clientY };
  boardEl.setPointerCapture?.(event.pointerId);
});
boardEl.addEventListener("pointerup", event => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
});

document.querySelector("#new-game-btn").addEventListener("click", newGame);
document.querySelector("#modal-new-btn").addEventListener("click", newGame);
undoBtn.addEventListener("click", undo);
continueBtn.addEventListener("click", () => { modal.hidden = true; boardEl.focus(); });
soundBtn.addEventListener("click", () => { prefs.sound = !prefs.sound; applyPrefs(); if (prefs.sound) playTone(440, .06, "sine", .04); });
themeBtn.addEventListener("click", () => { prefs.dark = !prefs.dark; applyPrefs(); });
effectsBtn.addEventListener("click", () => {
  effectsPanel.hidden = !effectsPanel.hidden;
  effectsBtn.setAttribute("aria-expanded", String(!effectsPanel.hidden));
  effectsBtn.setAttribute("aria-label", effectsPanel.hidden ? "打开个性化设置" : "关闭个性化设置");
});
effectsPanel.addEventListener("click", event => {
  const button = event.target.closest("button[data-value]");
  const group = button?.closest("[data-setting]");
  if (!button || !group) return;
  prefs[group.dataset.setting] = button.dataset.value;
  applyPrefs();
  playTone(460, .05, "sine", .03);
});

adminTrigger.addEventListener("click", () => {
  adminModal.hidden = false;
  adminLogin.hidden = adminUnlocked;
  adminTools.hidden = !adminUnlocked;
  adminError.textContent = "";
  if (adminUnlocked) {
    updateDebugStats();
    adminTools.querySelector("button").focus();
  }
  else {
    adminPassword.value = "";
    adminPassword.focus();
  }
});

document.querySelector("#admin-close").addEventListener("click", () => {
  adminModal.hidden = true;
  boardEl.focus();
});

adminModal.addEventListener("click", event => {
  if (event.target === adminModal) adminModal.hidden = true;
});

adminForm.addEventListener("submit", event => {
  event.preventDefault();
  if (adminPassword.value !== "XxbY141128") {
    adminError.textContent = "密码不正确";
    adminPassword.select();
    playTone(130, .08, "square", .025);
    return;
  }
  adminUnlocked = true;
  adminLogin.hidden = true;
  adminTools.hidden = false;
  adminError.textContent = "";
  adminTools.querySelector("button").focus();
  playTone(720, .12, "sine", .05);
});

adminTools.addEventListener("click", event => {
  const button = event.target.closest("button[data-cheat]");
  if (button) runCheat(button.dataset.cheat);
});

document.querySelectorAll("[data-admin-theme]").forEach(button => {
  button.addEventListener("click", () => {
    if (!adminUnlocked) return;
    prefs.palette = button.dataset.adminTheme;
    applyPrefs();
    setAdminStatus(button.dataset.adminTheme === "classic" ? "已恢复经典主题" : `已切换至${button.textContent.trim()}主题`);
    playTone(540, .06, "sine", .035);
  });
});

document.querySelector("#debug-labels-btn").addEventListener("click", event => {
  debugLabels = !debugLabels;
  document.body.classList.toggle("debug-grid", debugLabels);
  event.currentTarget.classList.toggle("active", debugLabels);
  event.currentTarget.textContent = debugLabels ? "隐藏坐标" : "显示坐标";
  setAdminStatus(debugLabels ? "已显示方块 ID 与坐标" : "坐标标注已关闭");
});

document.querySelector("#debug-tile-form").addEventListener("submit", event => {
  event.preventDefault();
  const value = Number(document.querySelector("#debug-tile-value").value);
  if (!Number.isInteger(value) || value < 2 || value > 131072 || (value & (value - 1)) !== 0) {
    setAdminStatus("方块数值必须是 2 的幂，范围 2～131072");
    return;
  }
  placeCheatTile(value);
  saveState();
  render();
  setAdminStatus(`已生成 ${value} 方块`);
});

document.querySelector("#debug-score-form").addEventListener("submit", event => {
  event.preventDefault();
  const value = Number(document.querySelector("#debug-score-value").value);
  if (!Number.isInteger(value) || value < 0 || value > 999999999) {
    setAdminStatus("分数范围为 0～999999999");
    return;
  }
  state.score = value;
  saveState();
  render();
  setAdminStatus(`分数已设置为 ${value}`);
});

document.querySelectorAll("[data-debug]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.debug;
    if (action === "merge-board") {
      const fixture = [
        [2, 2, 4, 4],
        [8, 8, 16, 16],
        [32, 32, 64, 64],
        [128, 128, null, null],
      ];
      state.grid = fixture.map(row => row.map(value => value ? { id: nextId++, value, isNew: true } : null));
      state.over = false;
      nextSpawnValue = null;
      setAdminStatus("已载入连续合并测试盘");
    }
    if (action === "clear-board") {
      state.grid = blankGrid();
      state.over = false;
      setAdminStatus("棋盘已清空");
    }
    if (action === "random-board") {
      state.grid = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => {
        if (Math.random() < .28) return null;
        return { id: nextId++, value: 2 ** (1 + Math.floor(Math.random() * 8)), isNew: true };
      }));
      state.over = !canMove();
      setAdminStatus("已生成随机测试棋盘");
    }
    if (action === "clear-scores") {
      if (!window.confirm("清空本机排行榜中的全部纪录？")) return;
      localStorage.removeItem(SCORES_KEY);
      recordBroken = false;
      bestAtGameStart = 0;
      renderLeaderboard();
      setAdminStatus("本机排行榜已清空");
    }
    if (action === "reset-save") {
      if (!window.confirm("重置当前游戏并清除本局存档？")) return;
      localStorage.removeItem(STORAGE_KEY);
      newGame();
      setAdminStatus("本局存档已重置");
      return;
    }
    modal.hidden = true;
    saveState();
    render();
  });
});

applyPrefs();
renderLeaderboard();
const saved = loadJSON(STORAGE_KEY, null);
if (saved?.state?.grid?.length === SIZE) {
  state = saved.state;
  wonAcknowledged = Boolean(saved.wonAcknowledged);
  nextId = Math.max(1, ...state.grid.flat().filter(Boolean).map(tile => tile.id || 0)) + 1;
  bestAtGameStart = getSavedBest();
  recordBroken = state.score > bestAtGameStart && bestAtGameStart > 0;
  render();
  if (state.over) window.setTimeout(() => showModal(false), 0);
} else {
  newGame();
}
