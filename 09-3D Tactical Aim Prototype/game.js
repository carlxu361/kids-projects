import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.querySelector("#game-canvas");
const startPanel = document.querySelector("#start-panel");
const hud = document.querySelector("#hud");
const objectivePanel = document.querySelector("#objective-panel");
const weaponPanel = document.querySelector("#weapon-panel");
const helpPanel = document.querySelector("#help-panel");
const startButton = document.querySelector("#start-button");
const attackButton = document.querySelector("#attack-button");
const defenseButton = document.querySelector("#defense-button");
const heroButtons = document.querySelectorAll(".hero-button");
const settingsPanel = document.querySelector("#settings-panel");
const volumeSlider = document.querySelector("#volume-slider");
const sfxToggle = document.querySelector("#sfx-toggle");
const sensitivitySlider = document.querySelector("#sensitivity-slider");
const qualitySelect = document.querySelector("#quality-select");
const keymapSelect = document.querySelector("#keymap-select");
const resumeButton = document.querySelector("#resume-button");
const homeButton = document.querySelector("#home-button");
const roundLabel = document.querySelector("#round-label");
const timerLabel = document.querySelector("#timer-label");
const sideLabel = document.querySelector("#side-label");
const scorelineLabel = document.querySelector("#scoreline-label");
const healthLabel = document.querySelector("#health-label");
const ammoLabel = document.querySelector("#ammo-label");
const weaponLabel = document.querySelector("#weapon-label");
const healthPanel = document.querySelector("#health-panel");
const healthFill = document.querySelector("#health-fill");
const healthBarLabel = document.querySelector("#health-bar-label");
const armorLabel = document.querySelector("#armor-label");
const noiseLabel = document.querySelector("#noise-label");
const damageDirection = document.querySelector("#damage-direction");
const damageSense = document.querySelector("#damage-sense");
const lockPrompt = document.querySelector("#lock-prompt");
const aliveAlert = document.querySelector("#alive-alert");
const serverBadge = document.querySelector("#server-badge");
const teamPanel = document.querySelector("#team-panel");
const allyRow = document.querySelector("#ally-row");
const enemyRow = document.querySelector("#enemy-row");
const minimapPanel = document.querySelector("#minimap-panel");
const minimapCanvas = document.querySelector("#minimap");
const minimapHint = document.querySelector("#minimap-hint");
const minimapCtx = minimapCanvas.getContext("2d");
const weaponSlots = document.querySelector("#weapon-slots");
const weaponName = document.querySelector("#weapon-name");
const weaponHint = document.querySelector("#weapon-hint");
const abilityLabel = document.querySelector("#ability-label");
const creditsLabel = document.querySelector("#credits-label");
const buyPanel = document.querySelector("#buy-panel");
const buyList = document.querySelector("#buy-list");
const buyTimer = document.querySelector("#buy-timer");
const scoreLabel = document.querySelector("#score-label");
const objectiveLabel = document.querySelector("#objective-label");
const objectiveStatus = document.querySelector("#objective-status");
const objectiveCarrier = document.querySelector("#objective-carrier");
const progressFill = document.querySelector("#progress-fill");
const interactPrompt = document.querySelector("#interact-prompt");
const roundBanner = document.querySelector("#round-banner");
const roundResult = document.querySelector("#round-result");
const roundReason = document.querySelector("#round-reason");
const killEffect = document.querySelector("#kill-effect");
const killTitle = document.querySelector("#kill-title");
const killSubtitle = document.querySelector("#kill-subtitle");
const feed = document.querySelector("#feed");
const crosshair = document.querySelector("#crosshair");
const scopeOverlay = document.querySelector("#scope-overlay");

const performanceProfiles = {
  smooth: { label: "流畅", renderScale: 0.54, hudEvery: 0.18, minimapEvery: 0.28, aiEvery: 0.2 },
  balanced: { label: "均衡", renderScale: 0.62, hudEvery: 0.16, minimapEvery: 0.24, aiEvery: 0.18 },
  sharp: { label: "清晰", renderScale: 0.78, hudEvery: 0.12, minimapEvery: 0.18, aiEvery: 0.16 },
};

const performanceMode = {
  profile: "smooth",
  maxPixelRatio: 1,
  ...performanceProfiles.smooth,
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071017);
scene.fog = new THREE.Fog(0x071017, 45, 260);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode.maxPixelRatio) * performanceMode.renderScale);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;

function applyPerformanceProfile(profileKey = performanceMode.profile) {
  const nextKey = performanceProfiles[profileKey] ? profileKey : "smooth";
  Object.assign(performanceMode, performanceProfiles[nextKey], { profile: nextKey });
  if (qualitySelect) qualitySelect.value = performanceMode.profile;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode.maxPixelRatio) * performanceMode.renderScale);
}

const keymapProfiles = {
  default: {
    label: "默认",
    interact: ["KeyE"],
    dropWeapon: ["KeyG"],
    dropSpike: ["KeyT"],
    leanLeft: ["KeyC"],
    leanRight: ["KeyV"],
    reload: ["KeyR"],
    buy: ["KeyB"],
    map: ["KeyX"],
    quickPing: ["AltLeft", "AltRight"],
    prone: ["KeyZ"],
    abilityQ: ["KeyQ"],
    abilityF: ["KeyF"],
    abilityH: ["KeyH"],
    hint: "B 买枪期菜单 · E 拾爆能器/安装/拆除 · G 丢当前枪 · T 丢爆能器 · X 战术图 · Alt 小指示 · C/V 单点探头 · Q/F/H 技能 · Ctrl 半蹲 · Z 单点趴下 · 右键开镜 · 1 刀 · 2 手枪 · 3/4 主武器",
    minimapHint: "左键标记 · X 关闭 · Alt 准心小指示",
  },
  compact: {
    label: "紧凑",
    interact: ["KeyE"],
    dropWeapon: ["KeyG"],
    dropSpike: ["KeyY", "KeyT"],
    leanLeft: ["KeyC"],
    leanRight: ["KeyV"],
    reload: ["KeyR"],
    buy: ["KeyB"],
    map: ["Tab", "KeyX"],
    quickPing: ["AltLeft", "AltRight"],
    prone: ["KeyZ"],
    abilityQ: ["KeyQ"],
    abilityF: ["KeyF"],
    abilityH: ["KeyH"],
    hint: "B 买枪期菜单 · E 拾爆能器/安装/拆除 · G 丢当前枪 · Y/T 丢爆能器 · Tab/X 战术图 · Alt 小指示 · C/V 单点探头 · Q/F/H 技能 · Ctrl 半蹲 · Z 单点趴下 · 右键开镜 · 1/2/3/4 武器",
    minimapHint: "左键标记 · Tab/X 关闭 · Alt 准心小指示",
  },
};
let keymapMode = "default";

function activeKeymap() {
  return keymapProfiles[keymapMode] || keymapProfiles.default;
}

function keyMatches(action, code) {
  return activeKeymap()[action]?.includes(code);
}

function applyKeymapProfile(profileKey = keymapMode) {
  keymapMode = keymapProfiles[profileKey] ? profileKey : "default";
  if (keymapSelect) keymapSelect.value = keymapMode;
  if (weaponHint) weaponHint.textContent = activeKeymap().hint;
  if (minimapHint) minimapHint.textContent = activeKeymap().minimapHint;
  renderHelpPanel();
}

function renderHelpPanel() {
  const mapLabel = activeKeymap().map.includes("Tab") ? "Tab/X" : "X";
  const dropSpikeLabel = activeKeymap().dropSpike.includes("KeyY") ? "Y/T" : "T";
  const helpItems = [
    ["WASD", "移动"],
    ["鼠标", "瞄准"],
    ["左键", "射击/近战"],
    ["右键", "开镜"],
    ["Space", "跳跃"],
    ["Shift", "静步"],
    ["Ctrl/Z", "半蹲/趴下"],
    ["C/V", "单点探头"],
    ["E", "拾取/安装/拆除"],
    ["B", "买枪期菜单"],
    [mapLabel, "战术图"],
    ["Alt", "准心小指示"],
    ["G", "丢当前枪"],
    [dropSpikeLabel, "丢爆能器"],
    ["Q/F/H", "英雄技能"],
    ["1/2/3/4", "切武器"],
    ["Esc", "设置"],
  ];
  helpPanel.innerHTML = helpItems.map(([key, label]) => `<b>${key}</b> ${label}`).join("");
}

const raycaster = new THREE.Raycaster();
const clock = new THREE.Clock();
const keys = new Set();
const targets = [];
const targetMeshes = [];
const obstacleMeshes = [];
const weaponPickups = [];
const deathOrbs = [];
const tracers = [];
const bursts = [];
const bulletHoles = [];
const aiShots = [];
const abilityEffects = [];
const abilityZones = [];
let abilityAimPreview = null;
const pings = [];
const pingMeshes = [];
const teamBots = [];
const buyBarriers = [];
const collisionBoxes = [];
const climbableBoxes = [];
const input = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const shotDirection = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const oldPosition = new THREE.Vector3();
const mapBounds = 150;
const eyeHeight = 1.7;
const gravity = 18;
const jumpSpeed = 7.2;
const playerRadius = 0.48;

const sites = [
  { key: "A", position: new THREE.Vector3(-58, 0, -20), disc: null },
  { key: "B", position: new THREE.Vector3(58, 0, -22), disc: null },
];

const tacticalRoutes = {
  attackA: [
    new THREE.Vector3(-34, 0, 122),
    new THREE.Vector3(-58, 0, 92),
    new THREE.Vector3(-76, 0, 50),
    new THREE.Vector3(-72, 0, 12),
    new THREE.Vector3(-58, 0, -20),
    sites[0].position,
  ],
  attackB: [
    new THREE.Vector3(34, 0, 122),
    new THREE.Vector3(58, 0, 92),
    new THREE.Vector3(76, 0, 48),
    new THREE.Vector3(72, 0, 10),
    new THREE.Vector3(58, 0, -22),
    sites[1].position,
  ],
  attackMid: [
    new THREE.Vector3(0, 0, 124),
    new THREE.Vector3(0, 0, 82),
    new THREE.Vector3(-26, 0, 42),
    new THREE.Vector3(-20, 0, 4),
    new THREE.Vector3(0, 0, -38),
  ],
  attackFlank: [
    new THREE.Vector3(96, 0, 116),
    new THREE.Vector3(118, 0, 72),
    new THREE.Vector3(120, 0, 22),
    new THREE.Vector3(98, 0, -18),
    sites[1].position,
  ],
  defendA: [
    new THREE.Vector3(-42, 0, -122),
    new THREE.Vector3(-62, 0, -88),
    new THREE.Vector3(-70, 0, -52),
    new THREE.Vector3(-62, 0, -30),
    sites[0].position,
  ],
  defendB: [
    new THREE.Vector3(42, 0, -122),
    new THREE.Vector3(62, 0, -88),
    new THREE.Vector3(70, 0, -54),
    new THREE.Vector3(62, 0, -32),
    sites[1].position,
  ],
  defendMid: [
    new THREE.Vector3(0, 0, -126),
    new THREE.Vector3(0, 0, -88),
    new THREE.Vector3(24, 0, -56),
    new THREE.Vector3(24, 0, -28),
    new THREE.Vector3(0, 0, -10),
  ],
  defendRotate: [
    new THREE.Vector3(-98, 0, -88),
    new THREE.Vector3(-112, 0, -36),
    new THREE.Vector3(-104, 0, 18),
    new THREE.Vector3(-70, 0, 18),
    new THREE.Vector3(-36, 0, 8),
  ],
};

const tacticalHoldPoints = [
  new THREE.Vector3(-66, 0, -13),
  new THREE.Vector3(-50, 0, -27),
  new THREE.Vector3(-42, 0, -6),
  new THREE.Vector3(-28, 0, 10),
  new THREE.Vector3(-74, 0, 34),
  new THREE.Vector3(66, 0, -15),
  new THREE.Vector3(50, 0, -29),
  new THREE.Vector3(42, 0, -8),
  new THREE.Vector3(28, 0, 10),
  new THREE.Vector3(74, 0, 34),
  new THREE.Vector3(-14, 0, -8),
  new THREE.Vector3(14, 0, -8),
  new THREE.Vector3(0, 0, -24),
  new THREE.Vector3(-46, 0, 52),
  new THREE.Vector3(46, 0, 52),
  new THREE.Vector3(-24, 0, 74),
  new THREE.Vector3(24, 0, 74),
  new THREE.Vector3(-92, 0, 72),
  new THREE.Vector3(92, 0, 72),
  new THREE.Vector3(-118, 0, 44),
  new THREE.Vector3(118, 0, 42),
  new THREE.Vector3(-102, 0, -72),
  new THREE.Vector3(102, 0, -74),
  new THREE.Vector3(-68, 0, 104),
  new THREE.Vector3(68, 0, 104),
  new THREE.Vector3(-68, 0, -118),
  new THREE.Vector3(68, 0, -118),
  new THREE.Vector3(0, 0, 64),
  new THREE.Vector3(0, 0, -64),
  new THREE.Vector3(-36, 0, -4),
  new THREE.Vector3(36, 0, -6),
];

const hudState = {
  round: "",
  timer: "",
  side: "",
  scoreline: "",
  health: "",
  armor: "",
  ammo: "",
  weapon: "",
  ability: "",
  score: "",
  objective: "",
  status: "",
  carrier: "",
  progress: "",
  slots: "",
  noise: "",
};

const weapons = {
  melee: {
    name: "M9 Bayonet",
    label: "匕首",
    slot: "1",
    color: 0xeef6fb,
    magazine: Infinity,
    reserve: 0,
    fireDelay: 0.58,
    bodyDamage: 85,
    headDamage: 120,
    recoilPerShot: 0,
    spreadStill: 0,
    spreadMoving: 0,
    reloadTime: 0,
    sound: [260, 90],
    melee: true,
    cost: 0,
    zoomFov: 58,
    range: 2.45,
  },
  pistol: {
    name: "G18",
    label: "G18",
    slot: "2",
    color: 0xd8e7ef,
    magazine: 12,
    reserve: 36,
    fireDelay: 0.22,
    bodyDamage: 34,
    headDamage: 105,
    recoilPerShot: 0.012,
    spreadStill: 0.004,
    spreadMoving: 0.018,
    reloadTime: 1.0,
    sound: [390, 120],
    cost: 0,
    zoomFov: 60,
    type: "pistol",
    range: 55,
  },
  sheriff: {
    name: "R8 Revolver",
    label: "R8",
    slot: "2",
    color: 0xffb86b,
    magazine: 6,
    reserve: 24,
    fireDelay: 0.38,
    bodyDamage: 55,
    headDamage: 155,
    recoilPerShot: 0.035,
    spreadStill: 0.004,
    spreadMoving: 0.026,
    reloadTime: 1.35,
    sound: [300, 170],
    cost: 800,
    zoomFov: 58,
    type: "pistol",
    range: 68,
  },
  frenzy: {
    name: "G18 Auto",
    label: "G18-A",
    slot: "2",
    color: 0xb38cff,
    magazine: 15,
    reserve: 45,
    fireDelay: 0.085,
    bodyDamage: 22,
    headDamage: 78,
    recoilPerShot: 0.012,
    spreadStill: 0.012,
    spreadMoving: 0.032,
    reloadTime: 1.05,
    sound: [720, 70],
    cost: 450,
    zoomFov: 62,
    type: "pistol",
    range: 38,
  },
  ghost: {
    name: "USP-S",
    label: "USP-S",
    slot: "2",
    color: 0x9be7d8,
    magazine: 15,
    reserve: 45,
    fireDelay: 0.18,
    bodyDamage: 30,
    headDamage: 105,
    recoilPerShot: 0.009,
    spreadStill: 0.003,
    spreadMoving: 0.018,
    reloadTime: 1.0,
    sound: [520, 85],
    cost: 500,
    zoomFov: 60,
    type: "pistol",
    range: 62,
  },
  rifle: {
    name: "M4A1",
    label: "M4A1",
    slot: "3",
    color: 0x35d0a2,
    magazine: 25,
    reserve: 75,
    fireDelay: 0.095,
    bodyDamage: 40,
    headDamage: 160,
    recoilPerShot: 0.018,
    spreadStill: 0.005,
    spreadMoving: 0.022,
    reloadTime: 1.25,
    sound: [520, 95],
    cost: 2900,
    zoomFov: 50,
    type: "rifle",
    range: 92,
  },
  burst: {
    name: "FAMAS",
    label: "FAMAS",
    slot: "3",
    color: 0x69e6ff,
    magazine: 24,
    reserve: 72,
    fireDelay: 0.13,
    bodyDamage: 35,
    headDamage: 120,
    recoilPerShot: 0.014,
    spreadStill: 0.004,
    spreadMoving: 0.02,
    reloadTime: 1.2,
    sound: [580, 90],
    cost: 2050,
    zoomFov: 48,
    type: "rifle",
    range: 84,
  },
  smg: {
    name: "MP5",
    label: "MP5",
    slot: "4",
    color: 0x4aa8ff,
    magazine: 30,
    reserve: 90,
    fireDelay: 0.065,
    bodyDamage: 24,
    headDamage: 78,
    recoilPerShot: 0.012,
    spreadStill: 0.009,
    spreadMoving: 0.028,
    reloadTime: 1.15,
    sound: [650, 80],
    cost: 1600,
    zoomFov: 54,
    type: "rifle",
    range: 58,
  },
  shotgun: {
    name: "M870",
    label: "M870",
    slot: "4",
    color: 0xf28c8c,
    magazine: 8,
    reserve: 24,
    fireDelay: 0.74,
    bodyDamage: 95,
    headDamage: 150,
    recoilPerShot: 0.045,
    spreadStill: 0.045,
    spreadMoving: 0.06,
    reloadTime: 1.55,
    sound: [180, 210],
    cost: 1850,
    zoomFov: 57,
    type: "rifle",
    range: 28,
  },
  guardian: {
    name: "M14 EBR",
    label: "M14",
    slot: "4",
    color: 0xb9f26d,
    magazine: 12,
    reserve: 36,
    fireDelay: 0.28,
    bodyDamage: 65,
    headDamage: 195,
    recoilPerShot: 0.028,
    spreadStill: 0.002,
    spreadMoving: 0.03,
    reloadTime: 1.45,
    sound: [420, 140],
    cost: 2250,
    zoomFov: 42,
    type: "rifle",
    range: 110,
  },
  sniper: {
    name: "AWM",
    label: "AWM",
    slot: "5",
    color: 0xffd166,
    magazine: 5,
    reserve: 15,
    fireDelay: 0.92,
    bodyDamage: 110,
    headDamage: 255,
    recoilPerShot: 0.06,
    spreadStill: 0.001,
    spreadMoving: 0.04,
    reloadTime: 1.8,
    sound: [260, 180],
    cost: 4700,
    zoomFov: 32,
    type: "rifle",
    range: 140,
  },
  heavy: {
    name: "M249",
    label: "M249",
    slot: "5",
    color: 0xc9d2dc,
    magazine: 50,
    reserve: 100,
    fireDelay: 0.085,
    bodyDamage: 32,
    headDamage: 96,
    recoilPerShot: 0.021,
    spreadStill: 0.014,
    spreadMoving: 0.035,
    reloadTime: 2.1,
    sound: [460, 90],
    cost: 3200,
    zoomFov: 52,
    type: "rifle",
    range: 88,
  },
};

const ammoByWeapon = {};
for (const [key, def] of Object.entries(weapons)) {
  ammoByWeapon[key] = { ammo: def.magazine, reserve: def.reserve };
}

function weaponProfile(key) {
  const def = weapons[key];
  const sidearm = def.type === "pistol";
  const sniper = key === "sniper";
  const heavy = key === "heavy";
  const shotgun = key === "shotgun";
  const guardian = key === "guardian";
  return {
    sidearm,
    bodyLength: sniper ? 1.62 : heavy ? 1.28 : shotgun ? 1.16 : sidearm ? 0.72 : guardian ? 1.22 : 1.08,
    bodyHeight: sidearm ? 0.15 : heavy ? 0.24 : 0.19,
    barrelLength: sniper ? 0.98 : shotgun ? 0.78 : sidearm ? 0.36 : 0.56,
    barrelWidth: shotgun ? 0.075 : sniper ? 0.052 : 0.06,
    stockLength: sniper ? 0.56 : heavy ? 0.5 : shotgun ? 0.42 : 0.4,
    magHeight: heavy ? 0.22 : sidearm ? 0.22 : 0.32,
    hasStock: def.type === "rifle" && !sidearm,
    hasScope: sniper || guardian,
    hasPump: shotgun,
    hasDrum: heavy,
    hasTwinBarrel: shotgun,
    hasLongRail: sniper || guardian || key === "rifle" || key === "burst" || heavy,
  };
}

const player = {
  position: new THREE.Vector3(0, eyeHeight, 18),
  velocity: new THREE.Vector3(),
  verticalVelocity: 0,
  grounded: true,
  yaw: 0,
  pitch: 0,
  lean: 0,
  health: 100,
  score: 0,
  credits: 800,
  armorType: "none",
  armor: 0,
  maxArmor: 0,
  reviveArmorBrokenAt: 0,
  heroKey: "warden",
  weaponKey: "pistol",
  inventory: new Set(["melee", "pistol"]),
  scoped: false,
  leanToggle: 0,
  minimapLarge: false,
  firing: false,
  planting: false,
  hasSpike: false,
  settingsOpen: false,
  groundHeight: 0,
  alive: true,
  abilityCooldown: 0,
  abilityCooldowns: { q: 0, f: 0, h: 0 },
  pendingAbilitySlot: null,
  speedBoostUntil: 0,
  silentUntil: 0,
  guardUntil: 0,
  switchTimer: 0,
  switchDuration: 0.34,
  isReloading: false,
  nextShotAt: 0,
  recoil: 0,
  shotChain: 0,
  started: false,
  lastNoiseAt: 0,
  lastNoisePosition: new THREE.Vector3(),
  noiseRadius: 0,
  decoyUntil: 0,
  decoyPosition: new THREE.Vector3(),
  nextFootstepNoiseAt: 0,
  prone: false,
};

const match = {
  selectedSide: "attack",
  phase: "menu",
  round: 1,
  attackScore: 0,
  defenseScore: 0,
  roundTime: 100,
  coreState: "idle",
  coreTimer: 0,
  plantProgress: 0,
  aiPlantProgress: 0,
  allyPlantProgress: 0,
  defuseProgress: 0,
  activeSite: sites[0],
  buyTime: 0,
  combatStartedAt: 0,
  tacticalCommand: null,
  teamThreatMemory: { position: new THREE.Vector3(), expiresAt: 0, source: "" },
  lastCoreWarningSecond: 0,
  allyAlive: 5,
  enemyAlive: 5,
  lastAlert: "",
};

const rules = {
  winScore: 7,
  roundSeconds: 100,
  buySeconds: 24,
  spikeSeconds: 40,
  plantSeconds: 3.8,
  defuseSeconds: 4.6,
  siteRadius: 8.4,
  inventoryRifles: 2,
  inventoryPistols: 1,
};

let coreMesh;
let carriedSpikeMesh;
let spawnSpikeMesh;
let objectiveChannelMesh;
let objectiveChannelMaterials = [];
let weaponView;
let audioContext;
let hudTimer = 0;
let minimapTimer = 0;
let aiTimer = 0;
let masterVolume = 0.7;
let sfxEnabled = true;
let mouseSensitivity = 0.0022;
const settingsStorageKey = "zu-settings-v1";
let menuOrbitAngle = 0;
let serverStatus = "本地预览";
let serverPingTimer = 0;
let suppressSettingsUntil = 0;
let settingsOpenedAt = 0;

const heroes = {
  warden: {
    name: "守护者",
    role: "稳点支援",
    color: 0x7de3c3,
    healthBonus: 0,
    speedBonus: 0,
    note: "治疗、护甲、稳点",
    skills: {
      q: { key: "Q", name: "急救环", desc: "治疗自己和近队友，并给护甲守位", cooldown: 12 },
      f: { key: "F", name: "守位信标", desc: "附近队友集合到你身边并获得守位减伤", cooldown: 16 },
      h: { key: "H", name: "装甲补给", desc: "恢复护甲并修补近队友生命", cooldown: 22 },
    },
  },
  flare: {
    name: "焰手",
    role: "入口压制",
    color: 0xff8a5b,
    healthBonus: 0,
    speedBonus: 0.15,
    note: "燃烧、压制、冲点",
    skills: {
      q: { key: "Q", name: "燃烧区", desc: "向准星方向制造持续封路火区", cooldown: 12 },
      f: { key: "F", name: "闪焰压制", desc: "压制前方敌人并打断架枪", cooldown: 15 },
      h: { key: "H", name: "热浪推进", desc: "短时间加速推进并制造近身灼烧", cooldown: 20 },
    },
  },
  brim: {
    name: "战术官",
    role: "控图指挥",
    color: 0xf3c15f,
    healthBonus: 0,
    speedBonus: 0,
    note: "烟幕、扫描、指挥",
    skills: {
      q: { key: "Q", name: "遮断烟幕", desc: "投放烟幕并让烟内敌人迟疑", cooldown: 12 },
      f: { key: "F", name: "热源扫描", desc: "扫描准星区域并让敌人暴露迟疑", cooldown: 16 },
      h: { key: "H", name: "推进号令", desc: "命令空闲队友向准星点推进守标", cooldown: 18 },
    },
  },
  gust: {
    name: "疾风",
    role: "突破扰乱",
    color: 0xa6e7ff,
    healthBonus: 0,
    speedBonus: 0.45,
    note: "位移、静音、诱导",
    skills: {
      q: { key: "Q", name: "诱导冲刺", desc: "向前冲刺并留下诱饵声源", cooldown: 12 },
      f: { key: "F", name: "静风步", desc: "短时间压低脚步和开枪声源", cooldown: 15 },
      h: { key: "H", name: "侧闪", desc: "向侧面闪身并留下诱饵", cooldown: 18 },
    },
  },
};

const abilitySlots = [
  { slot: "q", code: "KeyQ" },
  { slot: "f", code: "KeyF" },
  { slot: "h", code: "KeyH" },
];

const abilityPreviewSpecs = {
  warden: {
    q: { self: true, radius: 9 },
    f: { self: true, radius: 22 },
    h: { self: true, radius: 12 },
  },
  flare: {
    q: { distance: 18, radius: 5.5 },
    f: { distance: 20, radius: 12 },
    h: { self: true, radius: 8 },
  },
  brim: {
    q: { distance: 24, radius: 7.2 },
    f: { distance: 28, radius: 18 },
    h: { distance: 26, radius: 3.2, safe: true },
  },
  gust: {
    q: { self: true, radius: 5.4 },
    f: { self: true, radius: 8 },
    h: { self: true, radius: 4.8 },
  },
};

const armorDefs = {
  light: { label: "轻甲", max: 120, cost: 600, speedScale: 1, note: "正常移速，基础防护" },
  heavy: { label: "重甲", max: 150, cost: 1000, speedScale: 0.9, note: "移速较慢，防护更高" },
  revive: { label: "复活甲", max: 100, cost: 1200, speedScale: 1, regenDelay: 15000, regenRate: 8, note: "打碎后15秒开始缓慢恢复" },
};

function weaponHandling(key = player.weaponKey) {
  const scoped = player.scoped && !weapons[key]?.melee;
  const handling = {
    aimSpread: 0.72,
    hipSpread: 1,
    moveSpread: 1,
    recoilScale: 1,
    noiseRadius: 48,
    recovery: 5.2,
  };
  if (["pistol", "ghost", "sheriff", "frenzy"].includes(key)) {
    handling.aimSpread = 0.82;
    handling.moveSpread = key === "frenzy" ? 0.85 : 1.05;
    handling.noiseRadius = key === "ghost" ? 34 : 42;
  }
  if (key === "smg") {
    handling.aimSpread = 0.78;
    handling.moveSpread = 0.72;
    handling.recoilScale = 0.9;
    handling.noiseRadius = 42;
  }
  if (key === "rifle" || key === "burst") {
    handling.aimSpread = 0.58;
    handling.moveSpread = 1.15;
    handling.recoilScale = 1.05;
    handling.noiseRadius = 52;
  }
  if (key === "guardian") {
    handling.aimSpread = 0.42;
    handling.hipSpread = 1.35;
    handling.moveSpread = 1.45;
    handling.recoilScale = 1.12;
    handling.noiseRadius = 58;
  }
  if (key === "shotgun") {
    handling.aimSpread = 0.88;
    handling.hipSpread = 1.25;
    handling.moveSpread = 1.05;
    handling.recoilScale = 1.2;
    handling.noiseRadius = 44;
  }
  if (key === "sniper") {
    handling.aimSpread = 0.2;
    handling.hipSpread = 3.2;
    handling.moveSpread = 2.1;
    handling.recoilScale = 1.35;
    handling.noiseRadius = 68;
    handling.recovery = 3.7;
  }
  if (key === "heavy") {
    handling.aimSpread = 0.66;
    handling.hipSpread = 1.15;
    handling.moveSpread = 1.25;
    handling.recoilScale = 1 + Math.min(0.45, player.shotChain * 0.035);
    handling.noiseRadius = 62;
    handling.recovery = 4.2;
  }
  handling.spreadScale = (scoped ? handling.aimSpread : handling.hipSpread) * handling.moveSpread;
  handling.recoilScale *= scoped ? 0.72 : 1;
  return handling;
}

function currentWeapon() {
  return weapons[player.weaponKey];
}

function currentAmmo() {
  return ammoByWeapon[player.weaponKey];
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function tone(freq, duration, type = "square", gain = 0.035, at = 0) {
  if (!audioContext || !sfxEnabled || masterVolume <= 0) return;
  const start = audioContext.currentTime + at;
  const osc = audioContext.createOscillator();
  const amp = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.45), start + duration);
  amp.gain.setValueAtTime(gain * masterVolume, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(audioContext.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

const sfx = {
  shoot() {
    if (currentWeapon().melee) {
      this.melee();
      return;
    }
    const [freq, tail] = currentWeapon().sound;
    tone(freq, tail / 1000, "sawtooth", 0.045);
    tone(freq * 0.52, 0.04, "square", 0.02, 0.018);
  },
  melee() {
    tone(220, 0.05, "triangle", 0.026);
    tone(120, 0.08, "sine", 0.018, 0.035);
  },
  hit() {
    tone(720, 0.045, "triangle", 0.025);
  },
  headshot() {
    tone(980, 0.08, "triangle", 0.038);
    tone(1470, 0.12, "sine", 0.03, 0.035);
  },
  kill() {
    tone(520, 0.08, "triangle", 0.028);
    tone(1040, 0.12, "sine", 0.036, 0.05);
    tone(1560, 0.14, "sine", 0.022, 0.12);
  },
  reload() {
    tone(160, 0.06, "square", 0.018);
    tone(240, 0.08, "square", 0.018, 0.13);
  },
  switch() {
    tone(310, 0.05, "triangle", 0.02);
  },
  pickup() {
    tone(470, 0.05, "triangle", 0.025);
    tone(705, 0.08, "sine", 0.022, 0.06);
  },
  scope(on) {
    tone(on ? 620 : 380, 0.04, "triangle", 0.016);
  },
  plant() {
    tone(420, 0.09, "sine", 0.03);
    tone(630, 0.12, "sine", 0.025, 0.09);
  },
  defuse() {
    tone(280, 0.1, "sine", 0.03);
    tone(190, 0.12, "sine", 0.025, 0.09);
  },
  round() {
    tone(300, 0.08, "triangle", 0.032);
    tone(600, 0.14, "triangle", 0.032, 0.1);
  },
  announce() {
    tone(180, 0.08, "sawtooth", 0.025);
    tone(360, 0.12, "triangle", 0.028, 0.08);
    tone(540, 0.16, "sine", 0.024, 0.18);
  },
  victory() {
    tone(392, 0.1, "triangle", 0.032);
    tone(587, 0.12, "sine", 0.03, 0.1);
    tone(784, 0.18, "sine", 0.026, 0.22);
  },
  defeat() {
    tone(330, 0.12, "sawtooth", 0.028);
    tone(220, 0.16, "triangle", 0.026, 0.12);
    tone(110, 0.2, "sine", 0.022, 0.28);
  },
  warning() {
    tone(880, 0.045, "square", 0.026);
    tone(440, 0.055, "square", 0.018, 0.06);
  },
};

function announce(text) {
  roundResult.textContent = text;
  roundReason.textContent = "";
  roundBanner.classList.remove("hidden");
  roundBanner.style.animation = "none";
  roundBanner.offsetHeight;
  roundBanner.style.animation = "";
  sfx.announce();
  window.setTimeout(() => {
    if (match.phase === "playing" || match.phase === "buy") roundBanner.classList.add("hidden");
  }, 1500);
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0x9ac8ff, 0x263026, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(14, 24, 18);
  scene.add(sun);
}

function addBox(x, y, z, w, h, d, material, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  obstacleMeshes.push(mesh);
  if (h > 0.4) {
    const box = {
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      topY: y + h / 2,
      climbable: !!options.climbable,
    };
    collisionBoxes.push(box);
    if (box.climbable) climbableBoxes.push(box);
  }
  return mesh;
}

function collidesAt(x, z, radius = playerRadius) {
  if (match.phase === "buy") {
    for (const barrier of buyBarriers) {
      if (
        x > barrier.minX - radius &&
        x < barrier.maxX + radius &&
        z > barrier.minZ - radius &&
        z < barrier.maxZ + radius
      ) {
        return true;
      }
    }
  }
  for (const box of collisionBoxes) {
    if (
      x > box.minX - radius &&
      x < box.maxX + radius &&
      z > box.minZ - radius &&
      z < box.maxZ + radius
    ) {
      return true;
    }
  }
  return false;
}

function climbableSurfaceAt(x, z, radius = playerRadius * 0.45) {
  let surfaceY = 0;
  for (const box of climbableBoxes) {
    if (
      x > box.minX + radius &&
      x < box.maxX - radius &&
      z > box.minZ + radius &&
      z < box.maxZ - radius
    ) {
      surfaceY = Math.max(surfaceY, box.topY);
    }
  }
  return surfaceY;
}

function playerCollidesAt(x, z, radius = playerRadius) {
  if (match.phase === "buy") {
    for (const barrier of buyBarriers) {
      if (
        x > barrier.minX - radius &&
        x < barrier.maxX + radius &&
        z > barrier.minZ - radius &&
        z < barrier.maxZ + radius
      ) {
        return true;
      }
    }
  }
  const currentSurfaceY = climbableSurfaceAt(player.position.x, player.position.z);
  const futureSurfaceY = climbableSurfaceAt(x, z);
  const canMountCover = futureSurfaceY > 0 && futureSurfaceY <= 1.55 && (
    (!player.grounded && player.position.y >= postureEyeHeight() + futureSurfaceY - 0.45) ||
    (player.grounded && currentSurfaceY >= futureSurfaceY - 0.35)
  );
  for (const box of collisionBoxes) {
    const overlaps = x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius;
    if (!overlaps) continue;
    if (box.climbable && canMountCover && futureSurfaceY >= box.topY - 0.05) continue;
    return true;
  }
  return false;
}

function flatDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function routeClone(points) {
  return points.map((point) => safeNavPoint(point.clone()));
}

function addSquadSpacing(actor, group, direction) {
  for (const other of group) {
    if (other === actor || !other.visible || other.userData.alive === false) continue;
    const gap = actor.position.clone().sub(other.position).setY(0);
    const dist = gap.length();
    if (dist > 0.001 && dist < 1.45) direction.addScaledVector(gap.normalize(), (1.45 - dist) * 0.85);
  }
  return direction;
}

function tryMoveActor(actor, direction, speed, dt, radius = 0.45) {
  if (direction.lengthSq() <= 0.0001) return false;
  direction.setY(0).normalize();
  const oldX = actor.position.x;
  const oldZ = actor.position.z;
  const step = speed * dt;
  const targetX = oldX + direction.x * step;
  const targetZ = oldZ + direction.z * step;
  const angles = [0, 0.38, -0.38, 0.72, -0.72, 1.08, -1.08, Math.PI / 2, -Math.PI / 2];
  let best = null;

  for (const angle of angles) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const moveX = direction.x * cos - direction.z * sin;
    const moveZ = direction.x * sin + direction.z * cos;
    const nextX = oldX + moveX * step;
    const nextZ = oldZ + moveZ * step;
    const candidates = [];
    if (!collidesAt(nextX, nextZ, radius)) candidates.push({ x: nextX, z: nextZ, headingX: moveX, headingZ: moveZ, penalty: Math.abs(angle) });
    if (!collidesAt(nextX, oldZ, radius)) candidates.push({ x: nextX, z: oldZ, headingX: moveX, headingZ: 0, penalty: Math.abs(angle) + 0.22 });
    if (!collidesAt(oldX, nextZ, radius)) candidates.push({ x: oldX, z: nextZ, headingX: 0, headingZ: moveZ, penalty: Math.abs(angle) + 0.22 });

    for (const candidate of candidates) {
      const score = Math.hypot(candidate.x - targetX, candidate.z - targetZ) + candidate.penalty * 0.12;
      if (!best || score < best.score) best = { ...candidate, score };
    }
  }

  if (!best) {
    actor.userData.blockedMoves = (actor.userData.blockedMoves || 0) + 1;
    return false;
  }

  actor.position.x = THREE.MathUtils.clamp(best.x, -mapBounds + 4, mapBounds - 4);
  actor.position.z = THREE.MathUtils.clamp(best.z, -mapBounds + 4, mapBounds - 4);
  const movedX = actor.position.x - oldX;
  const movedZ = actor.position.z - oldZ;
  if (movedX * movedX + movedZ * movedZ > 0.00001) {
    actor.userData.heading = Math.atan2(movedX, movedZ);
  }
  actor.userData.blockedMoves = 0;
  return true;
}

function unstuckActor(actor, radius = 0.45) {
  const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI, Math.PI * 0.75, -Math.PI * 0.75];
  for (const angle of angles) {
    const x = actor.position.x + Math.sin(angle) * 1.8;
    const z = actor.position.z + Math.cos(angle) * 1.8;
    if (!collidesAt(x, z, radius)) {
      actor.position.x = THREE.MathUtils.clamp(x, -mapBounds + 4, mapBounds - 4);
      actor.position.z = THREE.MathUtils.clamp(z, -mapBounds + 4, mapBounds - 4);
      actor.userData.holdPoint = null;
      actor.userData.commandHold = null;
      actor.userData.combatState = "脱困";
      actor.userData.heading = angle;
      return true;
    }
  }
  return false;
}

function updateActorStuckState(actor, dt) {
  if (!actor.userData.lastPosition) actor.userData.lastPosition = actor.position.clone();
  const moved = flatDistance(actor.position, actor.userData.lastPosition);
  actor.userData.stuckTime = moved < 0.08 ? (actor.userData.stuckTime || 0) + dt : 0;
  actor.userData.lastPosition.copy(actor.position);
  if (actor.userData.stuckTime > 1.2) {
    actor.userData.stuckTime = 0;
    actor.userData.routeIndex = (actor.userData.routeIndex || 0) + 1;
    const freed = unstuckActor(actor);
    actor.userData.lastPosition.copy(actor.position);
    return freed;
  }
  return false;
}

function playerPosture() {
  if (player.prone) return "prone";
  if (keys.has("ControlLeft") || keys.has("ControlRight")) return "crouch";
  return "stand";
}

function toggleLean(side) {
  if (match.phase !== "playing") return;
  player.leanToggle = player.leanToggle === side ? 0 : side;
}

function toggleProne() {
  if (match.phase !== "playing") return;
  player.prone = !player.prone;
  if (player.prone) {
    player.scoped = false;
    player.verticalVelocity = 0;
    player.leanToggle = 0;
  }
}

function postureEyeHeight() {
  const posture = playerPosture();
  if (posture === "prone") return 0.72;
  if (posture === "crouch") return 1.18;
  return eyeHeight;
}

function postureSpeedMultiplier() {
  const posture = playerPosture();
  if (posture === "prone") return 0.34;
  if (posture === "crouch") return 0.62;
  return 1;
}

function postureNoiseRadius(base) {
  const posture = playerPosture();
  if (posture === "prone") return Math.min(5, base * 0.28);
  if (posture === "crouch") return Math.min(9, base * 0.5);
  return base;
}

function playerIsStealthWalking() {
  return keys.has("ShiftLeft") || keys.has("ShiftRight") || playerPosture() !== "stand";
}

function makePlayerNoise(radius, label = "") {
  if (match.phase !== "playing" || performance.now() < (player.silentUntil || 0)) return;
  player.lastNoiseAt = performance.now();
  player.lastNoisePosition.copy(player.position).setY(0);
  player.noiseRadius = radius;
  player.decoyUntil = 0;
  if (label) addFeed(label);
}

function activeNoisePosition() {
  return performance.now() < (player.decoyUntil || 0) ? player.decoyPosition : player.lastNoisePosition;
}

function canHearPlayerNoise(observer) {
  if (performance.now() - player.lastNoiseAt > 1800 && performance.now() > (player.decoyUntil || 0)) return false;
  return flatDistance(observer.position, activeNoisePosition()) <= player.noiseRadius;
}

function playerNoiseStateLabel() {
  const moving = keys.has("KeyW") || keys.has("KeyA") || keys.has("KeyS") || keys.has("KeyD");
  const posture = playerPosture();
  const recentlyLoud = match.phase === "playing" && performance.now() - player.lastNoiseAt <= 1800 && player.noiseRadius > 0;
  if (recentlyLoud) return `声源暴露 ${Math.round(player.noiseRadius)}m`;
  if (posture === "prone") return moving ? "趴下：最慢但脚步极轻" : "趴下：低姿态隐蔽";
  if (posture === "crouch") return moving ? "半蹲：慢速低声移动" : "半蹲：降低暴露";
  if (moving && playerIsStealthWalking()) return "静步：敌人只能靠视线发现";
  if (moving) return "奔跑：会留下脚步声";
  return "安静：未暴露声源";
}

function isClutchState() {
  return match.allyAlive <= 2 || match.enemyAlive <= 2;
}

function aiPreferredRange(actor) {
  const key = actor.userData.weaponKey || "rifle";
  if (["pistol", "ghost", "frenzy", "sheriff"].includes(key)) return { min: 7, max: 22 };
  if (key === "smg" || key === "shotgun") return { min: 5, max: 18 };
  if (key === "guardian" || key === "sniper") return { min: 18, max: 34 };
  return { min: 10, max: 28 };
}

function threatPriorityScore(threat) {
  const spikeBonus = threat.actor?.hasSpike || threat.actor?.userData?.hasSpike ? 8 : 0;
  const health = threat.kind === "player" ? player.health : threat.actor?.userData?.health || 100;
  const weakBonus = health <= 35 ? 4 : 0;
  const playerBonus = threat.kind === "player" ? 1.5 : 0;
  return threat.distance - spikeBonus - weakBonus - playerBonus;
}

function rememberTeamThreat(position, source = "敌方") {
  if (!position || match.phase !== "playing") return;
  match.teamThreatMemory.position.copy(position).setY(0);
  match.teamThreatMemory.expiresAt = performance.now() + 3600;
  match.teamThreatMemory.source = source;
}

function teamThreatPointForBot(bot) {
  if (!match.teamThreatMemory || performance.now() > match.teamThreatMemory.expiresAt) return null;
  if (!bot?.visible || !bot.userData.alive || bot.userData.health <= 35 || bot.userData.hasSpike) return null;
  return match.teamThreatMemory.position;
}

function safeNavPoint(point, radius = 0.45) {
  if (!collidesAt(point.x, point.z, radius)) return point;
  for (const distance of [2, 4, 6]) {
    for (const angle of [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const x = point.x + Math.sin(angle) * distance;
      const z = point.z + Math.cos(angle) * distance;
      if (!collidesAt(x, z, radius)) return new THREE.Vector3(x, 0, z);
    }
  }
  return point;
}

function retreatPointFor(actor) {
  if (actor.userData.route?.length) {
    const index = Math.max(0, (actor.userData.routeIndex || 0) - 1);
    return actor.userData.route[index % actor.userData.route.length];
  }
  return match.selectedSide === "attack" ? new THREE.Vector3(0, 0, -94) : new THREE.Vector3(0, 0, 96);
}

function commandPointForBot(bot, index) {
  if (!match.tacticalCommand || performance.now() > match.tacticalCommand.expiresAt) {
    match.tacticalCommand = null;
    return null;
  }
  if (bot.userData.hasSpike || bot.userData.health <= 35) return null;
  const anchor = match.tacticalCommand.position.clone();
  const angle = (index / Math.max(1, teamBots.length)) * Math.PI * 2 + Math.PI / 4;
  const radius = index === 0 ? 0 : 2.6 + index * 0.35;
  anchor.x += Math.cos(angle) * radius;
  anchor.z += Math.sin(angle) * radius;
  anchor.x = THREE.MathUtils.clamp(anchor.x, -mapBounds + 5, mapBounds - 5);
  anchor.z = THREE.MathUtils.clamp(anchor.z, -mapBounds + 5, mapBounds - 5);
  return safeNavPoint(anchor);
}

function plantedCoreGroundPosition() {
  const fallback = match.activeSite?.position || sites[0].position;
  return (coreMesh?.visible ? coreMesh.position : fallback).clone().setY(0);
}

function completeDefuse(sourceLabel = "你") {
  match.coreState = "defused";
  match.defuseProgress = 0;
  coreMesh.visible = false;
  sfx.defuse();
  endRound("defense", sourceLabel === "你" ? "爆能器拆除成功" : sourceLabel + "拆除爆能器成功");
}

function objectivePointForBot(bot, index) {
  if (!bot || bot.userData.hasSpike || bot.userData.health <= 0) return null;
  const siteOffsets = [
    new THREE.Vector3(-7, 0, 5),
    new THREE.Vector3(7, 0, 5),
    new THREE.Vector3(-5, 0, -6),
    new THREE.Vector3(5, 0, -6),
  ];
  if (match.coreState === "planted") {
    return safeNavPoint(plantedCoreGroundPosition().add(siteOffsets[index % siteOffsets.length]));
  }
  if (match.selectedSide === "attack" && match.coreState === "idle") {
    const carrier = player.hasSpike ? player : teamBots.find((ally) => ally.visible && ally.userData.alive && ally.userData.hasSpike);
    if (carrier && carrier !== bot) {
      const escortOffsets = [
        new THREE.Vector3(-4.8, 0, 3.2),
        new THREE.Vector3(4.8, 0, 3.2),
        new THREE.Vector3(-6.2, 0, -2.4),
        new THREE.Vector3(6.2, 0, -2.4),
      ];
      return safeNavPoint(carrier.position.clone().add(escortOffsets[index % escortOffsets.length]));
    }
  }
  return null;
}

function nearestTacticalHoldPoint(actor, focus, squad = teamBots) {
  let best = null;
  let bestScore = Infinity;
  for (const point of tacticalHoldPoints) {
    if (collidesAt(point.x, point.z, 0.5)) continue;
    const occupied = squad.some((other) => {
      if (other === actor || !other.visible || other.userData.alive === false) return false;
      const claimed = other.userData.holdPoint || other.userData.commandHold;
      return claimed && flatDistance(claimed, point) < 2.2;
    });
    if (occupied) continue;
    const actorDist = flatDistance(actor.position, point);
    if (actorDist > 34) continue;
    const focusDist = flatDistance(point, focus);
    const sightBonus = hasLineOfSight(point.clone().setY(1.35), focus.clone().setY(1.35)) ? -4 : 4;
    const score = actorDist + Math.abs(focusDist - 18) * 0.35 + sightBonus;
    if (score < bestScore) {
      bestScore = score;
      best = point;
    }
  }
  return best ? best.clone() : null;
}

function canDetectPlayer(observer, distanceLimit = 42) {
  const toPlayer = player.position.clone().sub(observer.position);
  const distance = toPlayer.length();
  const posture = playerPosture();
  const stealth = playerIsStealthWalking();
  const postureLimit = posture === "prone" ? 18 : posture === "crouch" ? 30 : distanceLimit;
  const nearReveal = posture === "prone" ? 6 : posture === "crouch" ? 8 : 10;
  if (distance > distanceLimit) return false;
  if (stealth && distance > postureLimit) return false;
  if (!hasLineOfSight(observer.position.clone().setY(1.45), player.position.clone())) return false;
  const dir = toPlayer.setY(0).normalize();
  const heading = observer.userData.heading ?? 0;
  const forwardDir = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const frontThreshold = posture === "prone" ? 0.55 : posture === "crouch" ? 0.36 : 0.2;
  const inFront = forwardDir.dot(dir) > frontThreshold;
  return inFront || !stealth || distance < nearReveal;
}

function addBuyBarrier(x, z, w, d) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, 3.2, d),
    new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: 0.18 })
  );
  mesh.position.set(x, 1.6, z);
  mesh.visible = false;
  scene.add(mesh);
  buyBarriers.push({
    mesh,
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  });
}

function addArena() {
  const floorShape = new THREE.Shape([
    new THREE.Vector2(-146, -92),
    new THREE.Vector2(-116, -144),
    new THREE.Vector2(58, -144),
    new THREE.Vector2(146, -92),
    new THREE.Vector2(146, 96),
    new THREE.Vector2(106, 146),
    new THREE.Vector2(-82, 146),
    new THREE.Vector2(-146, 90),
  ]);
  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(floorShape),
    new THREE.MeshLambertMaterial({ color: 0x23313a, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);

  const grid = new THREE.GridHelper(300, 100, 0x35d0a2, 0x3d5362);
  grid.position.y = 0.01;
  scene.add(grid);

  const wallMat = new THREE.MeshLambertMaterial({ color: 0x53636f });
  const coverMat = new THREE.MeshLambertMaterial({ color: 0x806f52 });
  const tacticalCoverMat = new THREE.MeshLambertMaterial({ color: 0x6f7d8a });
  const laneMat = new THREE.MeshLambertMaterial({ color: 0x344550 });
  const routeMat = new THREE.MeshLambertMaterial({ color: 0x2b5960 });
  const spawnCoverMat = new THREE.MeshLambertMaterial({ color: 0x475763 });
  const buildingMat = new THREE.MeshLambertMaterial({ color: 0x303f48 });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x18232a });
  const windowMat = new THREE.MeshBasicMaterial({ color: 0x8bd7ff, transparent: true, opacity: 0.36 });
  const siteMat = new THREE.MeshBasicMaterial({ color: 0x35d0a2, transparent: true, opacity: 0.4 });
  const attackSpawnMat = new THREE.MeshBasicMaterial({ color: 0xff5f73, transparent: true, opacity: 0.18 });
  const defenseSpawnMat = new THREE.MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.18 });

  function addBuilding(x, z, w, d, h, accent = 0x8bd7ff) {
    const body = addBox(x, h / 2, z, w, h, d, buildingMat);
    body.name = "mapBuilding";
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.24, d + 1.2), roofMat);
    roof.name = "mapBuildingRoof";
    roof.position.set(x, h + 0.12, z);
    scene.add(roof);
    obstacleMeshes.push(roof);
    for (const side of [-1, 1]) {
      const windows = new THREE.Mesh(new THREE.BoxGeometry(w * 0.58, 0.48, 0.035), windowMat.clone());
      windows.material.color.setHex(accent);
      windows.position.set(x, h * 0.58, z + side * (d / 2 + 0.025));
      scene.add(windows);
    }
    return body;
  }

  const buildings = [
    [-132, 50, 18, 36, 8, 0x6bdcff],
    [132, 48, 18, 36, 8, 0xffb86b],
    [-118, -86, 28, 22, 9, 0x7de3c3],
    [118, -88, 28, 22, 9, 0xff8a5b],
    [-18, 118, 28, 12, 5, 0x6bdcff],
    [18, -124, 28, 12, 5, 0x4aa8ff],
  ];
  buildings.forEach((box) => addBuilding(...box));

  const walls = [
    [0, 2, -144, 222, 4, 1],
    [0, 2, 146, 222, 4, 1],
    [-146, 2, 0, 1, 4, 184],
    [146, 2, 0, 1, 4, 188],
    [-78, 1.6, -30, 4, 3.2, 72],
    [78, 1.6, -32, 4, 3.2, 72],
    [0, 1.45, -8, 20, 2.9, 4],
    [0, 1.45, -48, 34, 2.9, 4],
    [-58, 1.45, -56, 38, 2.9, 4],
    [58, 1.45, -58, 38, 2.9, 4],
    [-58, 1.35, 14, 36, 2.7, 4],
    [58, 1.35, 14, 36, 2.7, 4],
    [0, 1.35, 52, 48, 2.7, 4],
    [-94, 1.2, 18, 24, 2.4, 4],
    [94, 1.2, 18, 24, 2.4, 4],
    [-24, 1.2, 76, 4, 2.4, 28],
    [24, 1.2, 76, 4, 2.4, 28],
    [-92, 1.35, -4, 4, 2.7, 28],
    [92, 1.35, -6, 4, 2.7, 28],
    [-42, 1.35, -4, 4, 2.7, 24],
    [42, 1.35, -6, 4, 2.7, 24],
    [-18, 1.35, 18, 4, 2.7, 24],
    [18, 1.35, 18, 4, 2.7, 24],
    [-72, 1.25, 42, 30, 2.5, 4],
    [72, 1.25, 42, 30, 2.5, 4],
    [0, 1.35, 8, 4, 2.7, 24],
    [-46, 1.25, -2, 18, 2.5, 4],
    [46, 1.25, -4, 18, 2.5, 4],
    [-86, 1.25, -48, 4, 2.5, 20],
    [86, 1.25, -50, 4, 2.5, 20],
    [-104, 1.1, 34, 4, 2.2, 26],
    [104, 1.1, 34, 4, 2.2, 26],
    [-36, 1.25, 72, 4, 2.5, 18],
    [36, 1.25, 72, 4, 2.5, 18],
    [-66, 1.25, 72, 4, 2.5, 18],
    [66, 1.25, 72, 4, 2.5, 18],
    [-108, 1.15, -20, 18, 2.3, 4],
    [108, 1.15, -22, 18, 2.3, 4],
    [-16, 1.2, -72, 4, 2.4, 18],
    [16, 1.2, -72, 4, 2.4, 18],
    [-110, 1.35, 70, 34, 2.7, 4],
    [110, 1.35, 70, 34, 2.7, 4],
    [-124, 1.35, 18, 4, 2.7, 46],
    [124, 1.35, 16, 4, 2.7, 46],
    [-96, 1.35, -74, 4, 2.7, 34],
    [96, 1.35, -76, 4, 2.7, 34],
    [-44, 1.35, 104, 42, 2.7, 4],
    [44, 1.35, 104, 42, 2.7, 4],
    [-44, 1.35, -118, 42, 2.7, 4],
    [44, 1.35, -118, 42, 2.7, 4],
    [0, 1.35, 92, 4, 2.7, 26],
    [0, 1.35, -104, 4, 2.7, 26],
    [-26, 1.25, 46, 4, 2.5, 30],
    [26, 1.25, 46, 4, 2.5, 30],
    [-26, 1.25, -42, 4, 2.5, 30],
    [26, 1.25, -44, 4, 2.5, 30],
  ];
  walls.forEach((box) => addBox(...box, wallMat));

  const covers = [
    [-58, 0.72, -20, 12, 1.45, 5],
    [58, 0.72, -22, 12, 1.45, 5],
    [-70, 0.72, -8, 7, 1.45, 14],
    [70, 0.72, -10, 7, 1.45, 14],
    [-36, 0.72, 36, 12, 1.45, 4],
    [36, 0.72, 36, 12, 1.45, 4],
    [-34, 0.72, -72, 10, 1.45, 5],
    [34, 0.72, -74, 10, 1.45, 5],
    [0, 0.72, -82, 16, 1.45, 4],
    [0, 0.72, 88, 18, 1.45, 4],
    [-12, 0.72, -24, 8, 1.45, 8],
    [12, 0.72, -24, 8, 1.45, 8],
    [-94, 0.72, -34, 6, 1.45, 16],
    [94, 0.72, -34, 6, 1.45, 16],
    [-52, 0.72, -14, 4, 1.45, 12],
    [-64, 0.72, -28, 4, 1.45, 12],
    [-58, 0.72, -34, 14, 1.45, 4],
    [52, 0.72, -16, 4, 1.45, 12],
    [64, 0.72, -30, 4, 1.45, 12],
    [58, 0.72, -36, 14, 1.45, 4],
    [-18, 0.72, 6, 9, 1.45, 4],
    [18, 0.72, 6, 9, 1.45, 4],
    [0, 0.72, 20, 12, 1.45, 4],
    [-46, 0.72, 58, 10, 1.45, 4],
    [46, 0.72, 58, 10, 1.45, 4],
    [-88, 0.72, 56, 6, 1.45, 14],
    [88, 0.72, 56, 6, 1.45, 14],
    [-28, 0.72, -48, 8, 1.45, 4],
    [28, 0.72, -50, 8, 1.45, 4],
    [-22, 0.72, 84, 10, 1.45, 4],
    [22, 0.72, 84, 10, 1.45, 4],
    [-54, 0.72, 84, 8, 1.45, 4],
    [54, 0.72, 84, 8, 1.45, 4],
    [-22, 0.72, -86, 10, 1.45, 4],
    [22, 0.72, -86, 10, 1.45, 4],
    [-52, 0.72, -90, 8, 1.45, 4],
    [52, 0.72, -90, 8, 1.45, 4],
    [-44, 0.72, -18, 5, 1.45, 10],
    [44, 0.72, -20, 5, 1.45, 10],
    [-72, 0.72, -42, 8, 1.45, 4],
    [72, 0.72, -44, 8, 1.45, 4],
    [-92, 0.72, 72, 10, 1.45, 4],
    [92, 0.72, 72, 10, 1.45, 4],
    [-118, 0.72, 44, 4, 1.45, 12],
    [118, 0.72, 42, 4, 1.45, 12],
    [-102, 0.72, -72, 10, 1.45, 4],
    [102, 0.72, -74, 10, 1.45, 4],
    [-68, 0.72, 104, 10, 1.45, 4],
    [68, 0.72, 104, 10, 1.45, 4],
    [-68, 0.72, -118, 10, 1.45, 4],
    [68, 0.72, -118, 10, 1.45, 4],
    [0, 0.72, 64, 12, 1.45, 4],
    [0, 0.72, -64, 12, 1.45, 4],
    [-36, 0.72, -4, 7, 1.45, 7],
    [36, 0.72, -6, 7, 1.45, 7],
  ];
  covers.forEach((box) => addBox(...box, coverMat, { climbable: true }));

  const tacticalCovers = [
    [-58, 0.95, -20, 4, 1.9, 4],
    [-50, 0.55, -25, 8, 1.1, 3],
    [-66, 0.55, -15, 8, 1.1, 3],
    [-58, 0.55, -8, 3, 1.1, 8],
    [58, 0.95, -22, 4, 1.9, 4],
    [50, 0.55, -27, 8, 1.1, 3],
    [66, 0.55, -17, 8, 1.1, 3],
    [58, 0.55, -10, 3, 1.1, 8],
    [-34, 0.72, 12, 7, 1.45, 7],
    [34, 0.72, 12, 7, 1.45, 7],
    [-10, 0.55, -6, 6, 1.1, 3],
    [10, 0.55, -6, 6, 1.1, 3],
    [0, 0.72, -14, 5, 1.45, 9],
    [-78, 0.6, 74, 10, 1.2, 3],
    [78, 0.6, 74, 10, 1.2, 3],
    [-102, 0.6, 8, 3, 1.2, 10],
    [102, 0.6, 8, 3, 1.2, 10],
    [-46, 0.55, -38, 7, 1.1, 3],
    [46, 0.55, -40, 7, 1.1, 3],
    [-78, 0.55, -24, 3, 1.1, 7],
    [78, 0.55, -26, 3, 1.1, 7],
    [-12, 0.55, 48, 7, 1.1, 3],
    [12, 0.55, 48, 7, 1.1, 3],
    [-54, 0.55, 70, 3, 1.1, 7],
    [54, 0.55, 70, 3, 1.1, 7],
  ];
  tacticalCovers.forEach((box) => addBox(...box, tacticalCoverMat, { climbable: box[4] <= 1.45 }));

  const lanes = [
    [-58, 0.03, 2, 16, 0.06, 106],
    [58, 0.03, 2, 16, 0.06, 106],
    [0, 0.03, 30, 116, 0.06, 16],
    [0, 0.03, -40, 92, 0.06, 14],
    [0, 0.03, 82, 52, 0.06, 14],
    [-58, 0.035, -20, 34, 0.06, 34],
    [58, 0.035, -22, 34, 0.06, 34],
    [0, 0.035, 0, 44, 0.06, 20],
    [-72, 0.035, 44, 42, 0.06, 16],
    [72, 0.035, 44, 42, 0.06, 16],
    [-92, 0.035, 6, 20, 0.06, 58],
    [92, 0.035, 6, 20, 0.06, 58],
    [-58, 0.035, -20, 50, 0.06, 44],
    [58, 0.035, -22, 50, 0.06, 44],
  ];
  lanes.forEach((box) => addBox(...box, laneMat));

  const routeBands = [
    [-36, 0.04, 64, 18, 0.05, 34],
    [36, 0.04, 64, 18, 0.05, 34],
    [-58, 0.04, -42, 34, 0.05, 18],
    [58, 0.04, -44, 34, 0.05, 18],
    [-104, 0.04, 18, 16, 0.05, 42],
    [104, 0.04, 16, 16, 0.05, 42],
    [0, 0.04, -72, 54, 0.05, 18],
  ];
  routeBands.forEach((box) => addBox(...box, routeMat));

  const spawnCovers = [
    [-42, 0.62, 100, 12, 1.24, 3],
    [42, 0.62, 100, 12, 1.24, 3],
    [0, 0.62, 106, 14, 1.24, 3],
    [-42, 0.62, -100, 12, 1.24, 3],
    [42, 0.62, -100, 12, 1.24, 3],
    [0, 0.62, -106, 14, 1.24, 3],
  ];
  spawnCovers.forEach((box) => addBox(...box, spawnCoverMat, { climbable: true }));
  addBox(0, 0.025, 96, 78, 0.05, 28, attackSpawnMat);
  addBox(0, 0.025, -96, 78, 0.05, 28, defenseSpawnMat);
  addBuyBarrier(0, 102, 220, 2);
  addBuyBarrier(0, -112, 220, 2);


  for (const site of sites) {
    site.disc = new THREE.Mesh(new THREE.CylinderGeometry(rules.siteRadius, rules.siteRadius, 0.08, 32), siteMat.clone());
    site.disc.position.set(site.position.x, 0.07, site.position.z);
    scene.add(site.disc);

    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(rules.siteRadius + 0.35, 0.08, 6, 36),
      new THREE.MeshBasicMaterial({ color: 0x35d0a2, transparent: true, opacity: 0.64 })
    );
    marker.name = "siteDeployRing-" + site.key;
    marker.position.set(site.position.x, 0.14, site.position.z);
    marker.rotation.x = Math.PI / 2;
    site.marker = marker;
    scene.add(marker);
  }

  coreMesh = makeSpikeModel(false);
  coreMesh.position.set(sites[0].position.x, 0.9, sites[0].position.z);
  coreMesh.visible = false;
  scene.add(coreMesh);

  spawnSpikeMesh = makeSpikeModel(true);
  spawnSpikeMesh.position.set(0, 0.14, 124);
  scene.add(spawnSpikeMesh);

  objectiveChannelMesh = makeObjectiveChannelEffect();
  scene.add(objectiveChannelMesh);
}

function makeObjectiveChannelEffect() {
  const group = new THREE.Group();
  group.visible = false;
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: 0.68, side: THREE.DoubleSide });
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: 0.22 });
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0xeefcff, transparent: true, opacity: 0.8 });
  objectiveChannelMaterials = [ringMat, beamMat, pulseMat];

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.045, 8, 48), ringMat);
  ring.name = "channelRing";
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.8, 10), beamMat);
  beam.name = "channelBeam";
  beam.position.y = 1.35;
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 32), pulseMat);
  pulse.name = "channelPulse";
  pulse.rotation.x = Math.PI / 2;
  pulse.position.y = 0.28;
  group.add(ring, beam, pulse);
  return group;
}

function makeSpikeModel(flat = false) {
  const group = new THREE.Group();
  const prism = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, flat ? 0.18 : 1.15, 3),
    new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: flat ? 0.62 : 0.9 })
  );
  prism.rotation.y = Math.PI / 6;
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.08, 3),
    new THREE.MeshBasicMaterial({ color: 0x153241 })
  );
  base.position.y = flat ? -0.11 : -0.64;

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(flat ? 1.08 : 0.82, 0.035, 6, 36),
    new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: flat ? 0.82 : 0.58 })
  );
  halo.name = "spikeHalo";
  halo.position.y = flat ? 0.02 : -0.56;
  halo.rotation.x = Math.PI / 2;

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, flat ? 5.6 : 2.4, 10),
    new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: flat ? 0.24 : 0.16 })
  );
  beacon.name = "spikeBeacon";
  beacon.position.y = flat ? 2.85 : 1.3;

  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.5, 3),
    new THREE.MeshBasicMaterial({ color: 0xeefcff, transparent: true, opacity: flat ? 0.9 : 0.72 })
  );
  tip.name = "spikeTip";
  tip.position.y = flat ? 5.8 : 2.58;
  tip.rotation.y = Math.PI / 6;

  group.add(prism, base, halo, beacon, tip);
  return group;
}

function createWeaponPickup(key, x, z) {
  const def = weapons[key];
  const profile = weaponProfile(key);
  const group = new THREE.Group();
  group.position.set(x, 0.45, z);
  group.rotation.y = Math.PI / 2;
  group.userData = { key, picked: false, dropped: false };

  const colorMat = new THREE.MeshBasicMaterial({ color: def.color });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x101820 });
  const metalMat = new THREE.MeshBasicMaterial({ color: 0xe3f3fa });
  const accentMat = new THREE.MeshBasicMaterial({ color: 0x6bdcff });
  const bodyLength = profile.bodyLength;

  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyLength, profile.bodyHeight, 0.2), colorMat);
  body.position.set(0, 0.02, 0);
  group.add(body);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(bodyLength * 0.34, profile.bodyHeight + 0.045, 0.23), darkMat);
  receiver.position.set(profile.sidearm ? 0.06 : -0.1, 0.055, 0);
  group.add(receiver);

  const ejectionPort = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.018), accentMat);
  ejectionPort.position.set(profile.sidearm ? 0.18 : 0.08, 0.16, -0.116);
  group.add(ejectionPort);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(profile.barrelLength, profile.barrelWidth, profile.barrelWidth + 0.015), metalMat);
  barrel.position.set(bodyLength / 2 + profile.barrelLength / 2 - 0.02, 0.04, 0);
  group.add(barrel);

  if (profile.hasTwinBarrel) {
    const secondBarrel = new THREE.Mesh(new THREE.BoxGeometry(profile.barrelLength, profile.barrelWidth, profile.barrelWidth), metalMat);
    secondBarrel.position.set(barrel.position.x, -0.035, 0.08);
    group.add(secondBarrel);
  }

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.09), darkMat);
  muzzle.position.set(barrel.position.x + profile.barrelLength / 2 + 0.06, 0.04, 0);
  group.add(muzzle);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.14), darkMat);
  grip.position.set(profile.sidearm ? -0.08 : -0.18, -0.22, 0);
  grip.rotation.z = -0.2;
  group.add(grip);

  const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.16), metalMat);
  triggerGuard.position.set(profile.sidearm ? 0.02 : -0.04, -0.08, 0);
  group.add(triggerGuard);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(profile.hasDrum ? 0.2 : 0.12, profile.magHeight, 0.13), darkMat);
  mag.position.set(profile.sidearm ? 0.02 : 0.18, -0.22, 0);
  if (profile.hasDrum) mag.geometry = new THREE.CylinderGeometry(0.13, 0.13, 0.16, 16);
  group.add(mag);

  if (profile.hasStock) {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(profile.stockLength, 0.12, 0.18), darkMat);
    stock.position.set(-bodyLength / 2 - profile.stockLength / 2 + 0.02, 0.01, 0);
    group.add(stock);
  }

  if (profile.hasPump) {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.24), darkMat);
    pump.position.set(0.28, -0.08, 0);
    group.add(pump);
  }

  if (!profile.sidearm) {
    const foreGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.12), darkMat);
    foreGrip.position.set(0.34, -0.22, 0.02);
    foreGrip.rotation.z = 0.16;
    group.add(foreGrip);
  }

  if (profile.hasLongRail) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(bodyLength * 0.58, 0.035, 0.08), darkMat);
    rail.position.set(0.08, 0.13, 0);
    group.add(rail);
  }

  if (profile.hasScope) {
    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.12), metalMat);
    scope.position.set(0.08, 0.19, 0);
    group.add(scope);
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.075, 0.13), accentMat);
    lens.position.set(0.31, 0.19, 0);
    group.add(lens);
  }

  if (profile.hasDrum) {
    const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.28), metalMat);
    bipod.position.set(0.45, -0.18, 0);
    group.add(bipod);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.035, 6, 24),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.72 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.42;
  group.add(ring);

  scene.add(group);
  weaponPickups.push(group);
}

function addPickups() {
  // Weapons should enter the round from buy phase or enemy drops, not random road loot.
}

function dropWeaponAt(key, position) {
  if (!weapons[key] || weapons[key].melee) return;
  createWeaponPickup(key, position.x + (Math.random() - 0.5) * 1.2, position.z + (Math.random() - 0.5) * 1.2);
  const pickup = weaponPickups[weaponPickups.length - 1];
  pickup.userData.dropped = true;
  pickup.position.y = 0.45;
}

function makeWeaponView() {
  weaponView = new THREE.Group();
  camera.add(weaponView);
  scene.add(camera);
  rebuildWeaponView();
}

function rebuildWeaponView() {
  if (!weaponView) return;
  while (weaponView.children.length) weaponView.remove(weaponView.children[0]);

  const def = currentWeapon();
  const profile = weaponProfile(player.weaponKey);
  const bodyMat = new THREE.MeshBasicMaterial({ color: def.color });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x121a22 });
  const metalMat = new THREE.MeshBasicMaterial({ color: 0xe3f3fa });
  const handMat = new THREE.MeshBasicMaterial({ color: 0xd0a17a });
  const sleeveMat = new THREE.MeshBasicMaterial({ color: 0x233444 });
  const accentMat = new THREE.MeshBasicMaterial({ color: 0x6bdcff });

  if (player.weaponKey === "melee") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.92), metalMat);
    blade.position.set(0.36, -0.23, -0.62);
    blade.rotation.set(-0.42, -0.54, 0.36);
    weaponView.add(blade);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.28), darkMat);
    handle.position.set(0.2, -0.42, -0.34);
    handle.rotation.set(-0.38, -0.54, 0.22);
    weaponView.add(handle);

    const knifeHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.24), handMat);
    knifeHand.name = "viewRightHand";
    knifeHand.position.set(0.12, -0.5, -0.22);
    knifeHand.rotation.set(-0.28, -0.48, 0.18);
    weaponView.add(knifeHand);

    const knifeSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.46), sleeveMat);
    knifeSleeve.name = "viewRightSleeve";
    knifeSleeve.position.set(0.02, -0.6, 0.04);
    knifeSleeve.rotation.set(-0.18, -0.4, 0.12);
    weaponView.add(knifeSleeve);
    weaponView.position.set(0, 0, 0);
    weaponView.scale.setScalar(1.25);
    return;
  }

  const bodyLength = profile.bodyLength * 0.9;
  const bodyHeight = profile.bodyHeight;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, bodyHeight, bodyLength), bodyMat);
  body.position.set(0.28, -0.24, -0.58);
  body.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(body);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.28, bodyHeight + 0.045, bodyLength * 0.38), darkMat);
  receiver.name = "viewReceiver";
  receiver.position.set(0.28, -0.17, -0.5);
  receiver.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(receiver);

  const ejectionPort = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.055, 0.18), accentMat);
  ejectionPort.name = "viewEjectionPort";
  ejectionPort.position.set(0.15, -0.13, -0.55);
  ejectionPort.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(ejectionPort);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.16), darkMat);
  grip.position.set(0.22, -0.42, -0.4);
  grip.rotation.z = -0.24;
  weaponView.add(grip);

  const triggerGuard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.2), metalMat);
  triggerGuard.name = "viewTriggerGuard";
  triggerGuard.position.set(0.24, -0.33, -0.48);
  triggerGuard.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(triggerGuard);

  const barrelLength = profile.barrelLength * 1.08;
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(profile.barrelWidth + 0.01, profile.barrelWidth + 0.01, barrelLength), metalMat);
  barrel.position.set(0.3, -0.2, -0.88);
  barrel.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(barrel);

  if (profile.hasTwinBarrel) {
    const secondBarrel = new THREE.Mesh(new THREE.BoxGeometry(profile.barrelWidth, profile.barrelWidth, barrelLength * 0.94), metalMat);
    secondBarrel.position.set(0.36, -0.26, -0.88);
    secondBarrel.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(secondBarrel);
  }

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.12), darkMat);
  muzzle.position.set(0.31, -0.2, -1.27);
  muzzle.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(muzzle);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(profile.hasDrum ? 0.22 : 0.14, profile.magHeight, 0.16), darkMat);
  mag.position.set(0.27, -0.44, profile.sidearm ? -0.42 : -0.58);
  if (profile.hasDrum) mag.geometry = new THREE.CylinderGeometry(0.16, 0.16, 0.16, 12);
  mag.rotation.set(-0.12, -0.22, -0.08);
  weaponView.add(mag);

  if (profile.hasStock) {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, profile.stockLength), darkMat);
    stock.position.set(0.22, -0.25, -0.08);
    stock.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(stock);
  }

  if (profile.hasPump || profile.hasDrum || !profile.sidearm) {
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.18, profile.hasPump ? 0.14 : 0.1, 0.48), darkMat);
    fore.name = "viewForegrip";
    fore.position.set(0.28, -0.34, -0.88);
    fore.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(fore);
  }

  if (profile.hasDrum) {
    const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.42), metalMat);
    bipod.position.set(0.34, -0.53, -0.78);
    bipod.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(bipod);
  }

  if (profile.hasLongRail) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, bodyLength * 0.5), darkMat);
    rail.position.set(0.28, -0.06, -0.58);
    rail.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(rail);
  }

  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.22), darkMat);
  sight.position.set(0.28, -0.08, -0.58);
  sight.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(sight);

  if (profile.hasScope) {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.48, 12), darkMat);
    scope.position.set(0.28, -0.1, -0.56);
    scope.rotation.z = Math.PI / 2;
    weaponView.add(scope);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.018, 12), accentMat);
    lens.name = "viewScopeLens";
    lens.position.set(0.52, -0.1, -0.56);
    lens.rotation.z = Math.PI / 2;
    weaponView.add(lens);
  }

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.24), handMat);
  rightHand.name = "viewRightHand";
  rightHand.position.set(0.18, -0.5, -0.36);
  rightHand.rotation.set(-0.16, -0.22, 0.12);
  weaponView.add(rightHand);

  const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.5), sleeveMat);
  rightSleeve.name = "viewRightSleeve";
  rightSleeve.position.set(0.08, -0.62, -0.02);
  rightSleeve.rotation.set(-0.12, -0.18, 0.08);
  weaponView.add(rightSleeve);

  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), handMat);
  leftHand.name = "viewLeftHand";
  leftHand.position.set(profile.sidearm ? 0.38 : 0.2, profile.sidearm ? -0.44 : -0.42, profile.sidearm ? -0.5 : -0.9);
  leftHand.rotation.set(-0.08, -0.34, -0.18);
  weaponView.add(leftHand);

  const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, profile.sidearm ? 0.32 : 0.48), sleeveMat);
  leftSleeve.name = "viewLeftSleeve";
  leftSleeve.position.set(profile.sidearm ? 0.46 : 0.1, profile.sidearm ? -0.56 : -0.58, profile.sidearm ? -0.2 : -0.66);
  leftSleeve.rotation.set(-0.1, -0.28, -0.12);
  weaponView.add(leftSleeve);

  weaponView.position.set(0, 0, 0);
  weaponView.scale.setScalar(1.25);
}

function addHumanoidModel(group, options) {
  const bodyMat = new THREE.MeshLambertMaterial({ color: options.bodyColor });
  const armorMat = new THREE.MeshLambertMaterial({ color: options.armorColor });
  const accentMat = new THREE.MeshLambertMaterial({ color: options.accentColor });
  const clothMat = new THREE.MeshLambertMaterial({ color: options.clothColor });
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xd9b08c });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x101820 });
  const metalMat = new THREE.MeshBasicMaterial({ color: 0xd8e7ef });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.02, 4, 8), bodyMat);
  body.position.y = 1.03;
  group.add(body);
  if (options.hitTarget) {
    body.userData = { target: options.hitTarget, part: "body" };
    targetMeshes.push(body);
  }

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.22), clothMat);
  pelvis.position.set(0, 0.66, 0.01);
  group.add(pelvis);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.24), darkMat);
  belt.position.set(0, 0.8, -0.01);
  group.add(belt);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.5, 0.24), armorMat);
  chest.position.set(0, 1.2, -0.04);
  group.add(chest);

  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.055), accentMat);
  chestPlate.position.set(0, 1.24, -0.19);
  group.add(chestPlate);

  const frontBadge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.025), metalMat);
  frontBadge.position.set(0, 1.42, -0.235);
  group.add(frontBadge);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), skinMat);
  head.position.y = 1.88;
  group.add(head);
  if (options.hitTarget) {
    head.userData = { target: options.hitTarget, part: "head" };
    targetMeshes.push(head);
  }

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.34), accentMat);
  helmet.position.set(0, 2.02, 0.02);
  group.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.08), darkMat);
  visor.position.set(0, 1.96, -0.23);
  group.add(visor);

  const jawGuard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.08), armorMat);
  jawGuard.position.set(0, 1.78, -0.22);
  group.add(jawGuard);

  const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.34, 0.035), metalMat);
  antenna.position.set(0.22, 2.22, 0.06);
  antenna.rotation.z = -0.18;
  group.add(antenna);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.18), clothMat);
  pack.position.set(0, 1.12, 0.18);
  group.add(pack);

  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.22), accentMat);
    shoulder.position.set(sx * 0.43, 1.45, -0.02);
    group.add(shoulder);

    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.44, 0.13), clothMat);
    upperArm.position.set(sx * 0.5, 1.15, -0.02);
    upperArm.rotation.z = sx * 0.22;
    group.add(upperArm);

    const foreArm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.44, 0.13), bodyMat);
    foreArm.position.set(sx * 0.38, 0.98, -0.28);
    foreArm.rotation.x = -0.92;
    foreArm.rotation.z = sx * 0.16;
    group.add(foreArm);

    const glove = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), darkMat);
    glove.position.set(sx * 0.28, 0.79, -0.47);
    glove.rotation.x = -0.92;
    glove.rotation.z = sx * 0.14;
    group.add(glove);

    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.42, 0.18), clothMat);
    thigh.position.set(sx * 0.19, 0.5, 0.02);
    thigh.rotation.z = sx * 0.05;
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.36, 0.16), bodyMat);
    shin.position.set(sx * 0.18, 0.22, -0.02);
    group.add(shin);

    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.06), accentMat);
    kneePad.position.set(sx * 0.18, 0.38, -0.12);
    group.add(kneePad);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.34), darkMat);
    boot.position.set(sx * 0.18, 0.08, -0.07);
    group.add(boot);
  }

  const heldWeapon = new THREE.Group();
  const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.16), darkMat);
  gunBody.position.set(0.08, 0, 0);
  const gunBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.045, 0.045), metalMat);
  gunBarrel.position.set(0.43, 0.02, -0.02);
  const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.08), darkMat);
  gunGrip.position.set(-0.12, -0.14, 0.02);
  gunGrip.rotation.z = -0.18;
  const gunStock = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.09, 0.14), darkMat);
  gunStock.position.set(-0.34, -0.02, 0.02);
  const gunMag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.09), metalMat);
  gunMag.position.set(0.02, -0.16, 0.02);
  gunMag.rotation.z = -0.08;
  const gunSight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.08), metalMat);
  gunSight.position.set(0.16, 0.09, -0.02);
  heldWeapon.add(gunBody, gunBarrel, gunGrip, gunStock, gunMag, gunSight);
  heldWeapon.position.set(0.12, 1.1, -0.42);
  heldWeapon.rotation.y = 0.08;
  group.add(heldWeapon);

}


function createTarget(x, z, label) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { health: 100, label, aiTimer: Math.random() * 1.2, weaponKey: "rifle", state: "hold" };
  addHumanoidModel(group, {
    hitTarget: group,
    bodyColor: 0xb8c7d4,
    armorColor: 0x2e4f62,
    accentColor: 0xff5f73,
    clothColor: 0x52616d,
    ringColor: 0xff5964,
  });
  scene.add(group);
  targets.push(group);
}

function createTeamBot(x, z, label) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { label, health: 100, aiTimer: Math.random() * 1.8, alive: true };
  addHumanoidModel(group, {
    hitTarget: null,
    bodyColor: 0x8ddff2,
    armorColor: 0x1f6470,
    accentColor: 0x6bdcff,
    clothColor: 0x385d6b,
    ringColor: 0x6bdcff,
  });
  scene.add(group);
  teamBots.push(group);
}

function spawnTargets() {
  [
    [-38, -36, "A 链接"],
    [-20, -38, "A 包点"],
    [20, -39, "B 包点"],
    [40, -36, "B 长廊"],
    [0, 8, "中路"],
  ].forEach(([x, z, label]) => createTarget(x, z, label));
  [
    [-10, 43, "友方 1"],
    [-4, 47, "友方 2"],
    [4, 47, "友方 3"],
    [10, 43, "友方 4"],
  ].forEach(([x, z, label]) => createTeamBot(x, z, label));
}

function addFeed(text, type = "") {
  const item = document.createElement("div");
  item.className = `feed-item ${type}`;
  item.textContent = text;
  feed.prepend(item);
  while (feed.children.length > 5) feed.lastElementChild.remove();
  window.setTimeout(() => item.remove(), 3500);
}

function setSelectedSide(side) {
  match.selectedSide = side;
  attackButton.classList.toggle("active", side === "attack");
  defenseButton.classList.toggle("active", side === "defense");
  sideLabel.textContent = side === "attack" ? "攻方" : "守方";
}

function setSelectedHero(heroKey) {
  if (!heroes[heroKey]) return;
  player.heroKey = heroKey;
  heroButtons.forEach((button) => button.classList.toggle("active", button.dataset.hero === heroKey));
  addFeed(`${heroes[heroKey].name}：${heroes[heroKey].role} · ${heroes[heroKey].note}`);
  updateHud();
}

function sideName(side) {
  return side === "attack" ? "攻方" : "守方";
}

function shortRole(role = "支援") {
  if (role.includes("带包")) return "包";
  if (role.includes("B 点")) return "B突";
  if (role.includes("A 守")) return "A守";
  if (role.includes("B 守")) return "B守";
  if (role.includes("中")) return "中";
  if (role.includes("侧翼")) return "侧";
  if (role.includes("回防")) return "回";
  return "援";
}

function nearestPickup() {
  let best = null;
  let bestDist = Infinity;
  for (const pickup of weaponPickups) {
    if (!pickup.visible || pickup.userData.picked) continue;
    const dist = flatDistance(player.position, pickup.position);
    if (dist < bestDist) {
      best = pickup;
      bestDist = dist;
    }
  }
  return { pickup: best, dist: bestDist };
}

function weaponMiniHtml(key, def) {
  const longGun = def.type === "rifle" && key !== "shotgun";
  const scope = key === "sniper" || key === "guardian";
  const drum = key === "heavy";
  return "<div class=\"weapon-mini " + (longGun ? "long" : "short") + " " + (scope ? "scope" : "") + " " + (drum ? "drum" : "") + "\" style=\"--gun-color:#" + def.color.toString(16).padStart(6, "0") + "\"><i class=\"gun-body\"></i><i class=\"gun-barrel\"></i><i class=\"gun-grip\"></i><i class=\"gun-mag\"></i><i class=\"gun-stock\"></i><i class=\"gun-scope\"></i></div>";
}

function weaponStatsHtml(def) {
  const rpm = Math.round(60 / def.fireDelay);
  return `<div class="weapon-stats">
    <span>伤害 ${def.bodyDamage}/${def.headDamage}</span>
    <span>弹匣 ${def.magazine}</span>
    <span>射程 ${def.range}m</span>
    <span>射速 ${rpm}</span>
  </div>`;
}

function ownedWeaponKeys() {
  return Object.keys(weapons).filter((key) => player.inventory.has(key));
}

function primaryWeaponKeys() {
  return ownedWeaponKeys().filter((key) => weapons[key]?.type === "rifle");
}

function displaySlotForWeapon(key) {
  if (key === "melee") return "1";
  if (weapons[key]?.type === "pistol") return "2";
  const primaryIndex = primaryWeaponKeys().indexOf(key);
  return primaryIndex >= 0 ? String(3 + primaryIndex) : weapons[key]?.slot || "-";
}

function setWeaponBySlot(slot) {
  if (slot === 1) return setWeapon("melee");
  if (slot === 2) {
    const sidearm = ownedWeaponKeys().find((key) => weapons[key]?.type === "pistol");
    if (sidearm) setWeapon(sidearm);
    return;
  }
  const primary = primaryWeaponKeys()[slot - 3];
  if (primary) setWeapon(primary);
}

function renderWeaponSlots() {
  const ownedKeys = Object.keys(weapons).filter((key) => player.inventory.has(key));
  const signature = ownedKeys
    .map((key) => `${key}:${player.inventory.has(key) ? 1 : 0}:${player.weaponKey === key ? 1 : 0}`)
    .join("|");
  if (signature === hudState.slots) return;

  weaponSlots.innerHTML = "";
  for (const key of ownedKeys) {
    const def = weapons[key];
    const slot = document.createElement("div");
    slot.className = `weapon-slot unlocked ${player.weaponKey === key ? "active" : ""}`;
    slot.innerHTML = `
      <div class="slot-top"><span>${displaySlotForWeapon(key)}</span><span>${def.label}</span></div>
      ${weaponMiniHtml(key, def)}
    `;
    weaponSlots.append(slot);
  }
  hudState.slots = signature;
}

function appendBuySection(title, note = "") {
  const section = document.createElement("div");
  section.className = "buy-section-title";
  section.innerHTML = `<span>${title}</span>${note ? `<small>${note}</small>` : ""}`;
  buyList.append(section);
}

function appendWeaponBuyButton(key, def) {
  const owned = player.inventory.has(key);
  const full = inventoryFullFor(def.type, key);
  const button = document.createElement("button");
  button.className = `buy-item ${owned ? "owned" : ""}`;
  button.type = "button";
  button.dataset.weapon = key;
  button.innerHTML = weaponMiniHtml(key, def) + `<span>${def.label}</span>${weaponStatsHtml(def)}<strong>${owned ? "已拥有" : `${def.cost} 星核`}</strong>`;
  button.disabled = owned || full || player.credits < def.cost;
  buyList.append(button);
}

function renderBuyList() {
  buyList.innerHTML = "";
  appendBuySection("护甲", "先选生存能力");
  for (const [key, armor] of Object.entries(armorDefs)) {
    const owned = player.armorType === key && player.armor >= armor.max;
    const button = document.createElement("button");
    button.className = `buy-item armor-buy ${owned ? "owned" : ""}`;
    button.type = "button";
    button.dataset.armor = key;
    button.innerHTML = `<span>${armor.label}</span><div class="weapon-stats"><span>护甲 ${armor.max}</span><span>${armor.note}</span></div><strong>${owned ? "已装备" : `${armor.cost} 星核`}</strong>`;
    button.disabled = owned || player.credits < armor.cost;
    buyList.append(button);
  }

  const phaseUnlock = match.round <= 1
    ? ["pistol", "sheriff", "smg", "shotgun"]
    : Object.keys(weapons);
  const buyableWeapons = Object.entries(weapons).filter(([key, def]) => !def.melee && phaseUnlock.includes(key));
  appendBuySection("手枪", "便宜、备用、可丢弃");
  for (const [key, def] of buyableWeapons.filter(([, def]) => def.type === "pistol")) appendWeaponBuyButton(key, def);
  appendBuySection("主武器", "按 3/4 切换，最多两把");
  for (const [key, def] of buyableWeapons.filter(([, def]) => def.type === "rifle")) appendWeaponBuyButton(key, def);
}

function inventoryCount(type) {
  return [...player.inventory].filter((key) => weapons[key]?.type === type).length;
}

function inventoryFullFor(type, key) {
  if (player.inventory.has(key)) return false;
  if (type === "pistol") return inventoryCount("pistol") >= rules.inventoryPistols;
  if (type === "rifle") return inventoryCount("rifle") >= rules.inventoryRifles;
  return false;
}

function buyArmor(key) {
  const armor = armorDefs[key];
  if (match.phase !== "buy") {
    addFeed("只能在买枪阶段购买护甲", "miss");
    return;
  }
  if (!armor || player.credits < armor.cost) return;
  player.credits -= armor.cost;
  player.armorType = key;
  player.maxArmor = armor.max;
  player.armor = armor.max;
  player.reviveArmorBrokenAt = 0;
  sfx.pickup();
  addFeed(`购买 ${armor.label}`);
  renderBuyList();
  updateHud();
}

function buyWeapon(key) {
  const def = weapons[key];
  if (match.phase !== "buy") {
    addFeed("只能在买枪阶段购买", "miss");
    return;
  }
  if (!def || def.melee || player.inventory.has(key) || inventoryFullFor(def.type, key) || player.credits < def.cost) return;
  player.credits -= def.cost;
  player.inventory.add(key);
  ammoByWeapon[key].ammo = def.magazine;
  ammoByWeapon[key].reserve = def.reserve;
  setWeapon(key, true);
  sfx.pickup();
  addFeed(`购买 ${def.label}`);
  renderBuyList();
  updateHud();
}

function toggleBuyPanel(force) {
  if (match.phase !== "buy") {
    buyPanel.classList.add("hidden");
    addFeed("战斗开始后不能买枪", "miss");
    return;
  }
  keys.clear();
  player.velocity.set(0, 0, 0);
  const open = typeof force === "boolean" ? force : buyPanel.classList.contains("hidden");
  buyPanel.classList.toggle("hidden", !open);
  if (open) renderBuyList();
}

function resetInputState({ resetAim = false } = {}) {
  keys.clear();
  cancelAbilityAim(false);
  player.firing = false;
  player.scoped = false;
  player.planting = false;
  player.velocity.set(0, 0, 0);
  player.recoil = 0;
  player.shotChain = 0;
  player.abilityCooldown = 0;
  player.abilityCooldowns = { q: 0, f: 0, h: 0 };
  player.speedBoostUntil = 0;
  player.silentUntil = 0;
  player.prone = false;
  player.lean = 0;
  if (resetAim) player.pitch = THREE.MathUtils.clamp(player.pitch, -0.2, 0.2);
}

function saveSettings() {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify({
      masterVolume,
      sfxEnabled,
      mouseSensitivity,
      quality: performanceMode.profile,
      keymap: keymapMode,
    }));
  } catch (_) {}
}

function loadSettings() {
  let savedQuality = performanceMode.profile;
  let savedKeymap = keymapMode;
  try {
    const saved = JSON.parse(localStorage.getItem(settingsStorageKey) || "{}");
    if (Number.isFinite(saved.masterVolume)) masterVolume = THREE.MathUtils.clamp(saved.masterVolume, 0, 1);
    if (typeof saved.sfxEnabled === "boolean") sfxEnabled = saved.sfxEnabled;
    if (Number.isFinite(saved.mouseSensitivity)) mouseSensitivity = THREE.MathUtils.clamp(saved.mouseSensitivity, 0.0008, 0.004);
    if (typeof saved.quality === "string") savedQuality = saved.quality;
    if (typeof saved.keymap === "string") savedKeymap = saved.keymap;
  } catch (_) {}
  applyPerformanceProfile(savedQuality);
  applyKeymapProfile(savedKeymap);
  volumeSlider.value = String(Math.round(masterVolume * 100));
  sfxToggle.checked = sfxEnabled;
  sensitivitySlider.value = String(Math.round(mouseSensitivity * 10000));
}

function openSettings() {
  if (player.settingsOpen || (match.phase !== "playing" && match.phase !== "buy")) return;
  player.settingsOpen = true;
  settingsOpenedAt = performance.now();
  resetInputState();
  settingsPanel.classList.remove("hidden");
  try {
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  } catch (_) {}
}

function closeSettings() {
  if (!player.settingsOpen) return;
  suppressSettingsUntil = performance.now() + 500;
  player.settingsOpen = false;
  settingsPanel.classList.add("hidden");
  resetInputState({ resetAim: true });
  if (match.phase === "playing") {
    try {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest && typeof lockRequest.catch === "function") lockRequest.catch(() => {});
    } catch (_) {}
  }
}

function returnHome() {
  suppressSettingsUntil = performance.now() + 500;
  match.phase = "menu";
  player.started = false;
  player.settingsOpen = false;
  resetInputState({ resetAim: true });
  match.plantProgress = 0;
  match.defuseProgress = 0;
  match.allyPlantProgress = 0;
  match.aiPlantProgress = 0;
  player.hasSpike = false;
  for (const bot of teamBots) bot.userData.hasSpike = false;
  settingsPanel.classList.add("hidden");
  startPanel.classList.remove("hidden");
  helpPanel.classList.remove("hidden");
  hud.classList.add("hidden");
  teamPanel.classList.add("hidden");
  healthPanel.classList.add("hidden");
  objectivePanel.classList.add("hidden");
  weaponPanel.classList.add("hidden");
  buyPanel.classList.add("hidden");
  minimapPanel.classList.add("hidden");
  setMinimapLarge(false);
  serverBadge.classList.add("hidden");
  roundBanner.classList.add("hidden");
  try {
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  } catch (_) {}
}

function updateHud() {
  const interaction = interactionInfo();
  const progress = Math.round((interaction.progress || 0) * 100);
  const status = objectiveText();
  const carrier = objectiveCarrierText();
  const ammo = currentAmmo();
  const def = currentWeapon();
  const hero = heroes[player.heroKey];
  const ammoText = def.melee ? "近战" : player.isReloading ? "换弹中" : `${ammo.ammo} / ${ammo.reserve}`;
  const next = {
    round: `${match.round}`,
    timer: `${Math.max(0, Math.ceil(match.phase === "buy" ? match.buyTime : match.coreState === "planted" ? match.coreTimer : match.roundTime))}`,
    side: sideName(match.selectedSide),
    scoreline: `${match.attackScore} : ${match.defenseScore}`,
    health: `${player.health}`,
    armor: `${player.armorType === "none" ? "无甲" : `${armorDefs[player.armorType]?.label || "护甲"} ${Math.round(player.armor)}/${player.maxArmor}`}`,
    ammo: ammoText,
    weapon: def.label,
    ability: abilityHudText(hero),
    score: `${player.score}`,
    objective: interaction.label,
    status,
    carrier,
    progress: `${progress}%`,
    noise: playerNoiseStateLabel(),
  };

  if (next.round !== hudState.round) roundLabel.textContent = next.round;
  if (next.timer !== hudState.timer) timerLabel.textContent = next.timer;
  if (next.side !== hudState.side) sideLabel.textContent = next.side;
  if (next.scoreline !== hudState.scoreline) scorelineLabel.textContent = next.scoreline;
  if (next.health !== hudState.health) healthLabel.textContent = next.health;
  if (next.health !== hudState.health) {
    const ratio = THREE.MathUtils.clamp(player.health / 100, 0, 1);
    healthFill.style.transform = `scaleX(${ratio})`;
    healthBarLabel.textContent = `${player.health} HP`;
  }
  if (next.armor !== hudState.armor) armorLabel.textContent = next.armor;
  if (next.ammo !== hudState.ammo) ammoLabel.textContent = next.ammo;
  if (next.weapon !== hudState.weapon) {
    weaponLabel.textContent = next.weapon;
    weaponName.textContent = def.name;
  }
  if (next.ability !== hudState.ability) abilityLabel.innerHTML = abilityHudMarkup(hero);
  creditsLabel.textContent = `星核 ${player.credits}`;
  buyTimer.textContent = match.phase === "buy" ? `${Math.ceil(match.buyTime)}` : "";
  if (next.score !== hudState.score) scoreLabel.textContent = next.score;
  if (next.objective !== hudState.objective) objectiveLabel.textContent = next.objective;
  if (next.status !== hudState.status) objectiveStatus.textContent = next.status;
  if (next.carrier !== hudState.carrier) objectiveCarrier.textContent = next.carrier;
  if (next.progress !== hudState.progress) progressFill.style.width = next.progress;
  if (next.noise !== hudState.noise) noiseLabel.textContent = next.noise;

  interactPrompt.classList.toggle("hidden", !interaction.prompt);
  if (interaction.prompt) interactPrompt.textContent = interaction.prompt;
  lockPrompt.classList.toggle(
    "hidden",
    !(match.phase === "playing" && document.pointerLockElement !== canvas)
  );
  healthPanel.classList.toggle("hidden", match.phase !== "playing" && match.phase !== "buy");
  minimapPanel.classList.toggle("hidden", match.phase !== "playing" && match.phase !== "buy");
  renderWeaponSlots();

  Object.assign(hudState, next);
}

function updateTeamPanel() {
  allyRow.innerHTML = "";
  enemyRow.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const ally = document.createElement("span");
    const allyBot = i === 0 ? null : teamBots[i - 1];
    const allyAlive = i === 0 ? player.alive : !!allyBot?.userData.alive;
    const allyHealth = i === 0 ? player.health : Math.max(0, Math.round(allyBot?.userData.health || 0));
    ally.className = allyAlive ? "alive" : "dead";
    ally.classList.add("team-card");
    const allyText = i === 0 ? "你" : `友${i}·${shortRole(allyBot?.userData.role)}`;
    const allyState = i === 0 ? "玩家" : (allyBot?.userData.combatState || "待命");
    ally.innerHTML = `<b>${allyText}${allyBot?.userData.hasSpike ? "·包" : ""}</b><u>${allyState}</u><i><em style="width:${allyHealth}%"></em></i>`;
    ally.title = `${allyText} ${allyHealth} HP · ${allyState}`;
    allyRow.append(ally);

    const enemy = document.createElement("span");
    enemy.className = i < match.enemyAlive ? "alive enemy" : "dead";
    enemy.classList.add("team-card");
    enemy.innerHTML = `<b>敌${i + 1}</b><i><em style="width:${i < match.enemyAlive ? 100 : 0}%"></em></i>`;
    enemyRow.append(enemy);
  }
}

function updateAliveAlert() {
  const text = match.enemyAlive === 1 ? "敌方还剩一人" : match.allyAlive === 1 ? "仅剩一人" : "";
  if (text === match.lastAlert) return;
  match.lastAlert = text;
  aliveAlert.textContent = text;
  aliveAlert.classList.toggle("hidden", !text);
  if (text) window.setTimeout(() => aliveAlert.classList.add("hidden"), 2400);
}

async function pingServer() {
  const start = performance.now();
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error("offline");
    const data = await response.json();
    const ping = Math.max(1, Math.round(performance.now() - start));
    const roomName = data.name || data.mode || "本地房间";
    const players = data.players || 10;
    const totalSlots = data.slots ? (data.slots.attackers || 0) + (data.slots.defenders || 0) : players;
    const tickRate = data.tickRate || 20;
    serverStatus = roomName + " · " + players + "/" + totalSlots + " · " + tickRate + "Hz · " + ping + "ms";
  } catch (_) {
    serverStatus = "本地预览 · 无状态接口";
  }
  serverBadge.textContent = serverStatus;
}

function mapToMini(x, z) {
  const size = minimapCanvas.width;
  const pad = 14;
  const usable = size - pad * 2;
  return {
    x: pad + ((x + mapBounds) / (mapBounds * 2)) * usable,
    y: pad + ((z + mapBounds) / (mapBounds * 2)) * usable,
  };
}

function drawMiniDot(x, z, radius, color) {
  const p = mapToMini(x, z);
  minimapCtx.fillStyle = color;
  minimapCtx.beginPath();
  minimapCtx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  minimapCtx.fill();
}

function drawMiniLabel(text, x, z, color = "#9fd6e3") {
  const p = mapToMini(x, z);
  const large = player.minimapLarge;
  minimapCtx.save();
  minimapCtx.font = `${large ? 15 : 9}px sans-serif`;
  minimapCtx.textAlign = "center";
  minimapCtx.textBaseline = "middle";
  const width = minimapCtx.measureText(text).width + (large ? 12 : 6);
  const height = large ? 20 : 12;
  minimapCtx.fillStyle = large ? "rgba(5, 10, 14, 0.72)" : "rgba(5, 10, 14, 0.48)";
  minimapCtx.fillRect(p.x - width / 2, p.y - height / 2, width, height);
  minimapCtx.strokeStyle = color;
  minimapCtx.lineWidth = large ? 1.5 : 1;
  minimapCtx.strokeRect(p.x - width / 2, p.y - height / 2, width, height);
  minimapCtx.fillStyle = color;
  minimapCtx.fillText(text, p.x, p.y + 0.5);
  minimapCtx.restore();
}

function drawMiniLine(from, to, color = "#7de3c3", alpha = 0.36) {
  const a = mapToMini(from.x, from.z);
  const b = mapToMini(to.x, to.z);
  minimapCtx.save();
  minimapCtx.strokeStyle = color;
  minimapCtx.globalAlpha = alpha;
  minimapCtx.lineWidth = player.minimapLarge ? 2.2 : 1.2;
  minimapCtx.setLineDash(player.minimapLarge ? [7, 5] : [4, 3]);
  minimapCtx.beginPath();
  minimapCtx.moveTo(a.x, a.y);
  minimapCtx.lineTo(b.x, b.y);
  minimapCtx.stroke();
  minimapCtx.restore();
}

function allyMapIntent(bot) {
  if (bot.userData.commandHold) return bot.userData.commandHold;
  if (bot.userData.holdPoint) return bot.userData.holdPoint;
  if (bot.userData.route?.length) return bot.userData.route[bot.userData.routeIndex % bot.userData.route.length];
  return null;
}

const minimapCallouts = [
  ["A", -58, -20, "#35d0a2"],
  ["B", 58, -22, "#4aa8ff"],
  ["中", 0, 0, "#ffd166"],
  ["A长", -92, 54, "#9fd6e3"],
  ["B长", 92, 52, "#9fd6e3"],
  ["侧翼", 118, 22, "#ffb86b"],
  ["攻方", 0, 124, "#ff5f73"],
  ["守方", 0, -124, "#6bdcff"],
];

function drawMinimap() {
  const size = minimapCanvas.width;
  minimapCtx.clearRect(0, 0, size, size);
  minimapCtx.fillStyle = "rgba(5, 9, 13, 0.82)";
  minimapCtx.fillRect(0, 0, size, size);
  minimapCtx.strokeStyle = "rgba(238,246,251,0.2)";
  minimapCtx.strokeRect(7, 7, size - 14, size - 14);

  minimapCtx.fillStyle = "rgba(255,255,255,0.08)";
  for (const mesh of obstacleMeshes) {
    const sx = mesh.geometry.parameters.width || 1;
    const sz = mesh.geometry.parameters.depth || 1;
    const p = mapToMini(mesh.position.x, mesh.position.z);
    const scale = (size - 28) / (mapBounds * 2);
    minimapCtx.fillRect(p.x - (sx * scale) / 2, p.y - (sz * scale) / 2, sx * scale, sz * scale);
  }

  for (const [text, x, z, color] of minimapCallouts) drawMiniLabel(text, x, z, color);
  for (const site of sites) drawMiniDot(site.position.x, site.position.z, 5, site.key === "A" ? "#35d0a2" : "#4aa8ff");
  for (const pickup of weaponPickups) if (pickup.visible && !pickup.userData.picked) drawMiniDot(pickup.position.x, pickup.position.z, 2.5, "#ffd166");
  const carrier = teamBots.find((bot) => bot.visible && bot.userData.hasSpike);
  for (const bot of teamBots) {
    if (!bot.visible || !bot.userData.alive) continue;
    const intent = allyMapIntent(bot);
    if (intent) drawMiniLine(bot.position, intent, bot.userData.hasSpike ? "#6bdcff" : "#7de3c3", bot.userData.hasSpike ? 0.7 : 0.36);
  }
  if (player.hasSpike) drawMiniDot(player.position.x, player.position.z, 3, "#6bdcff");
  else if (carrier) drawMiniDot(carrier.position.x, carrier.position.z, 3, "#6bdcff");
  else if (spawnSpikeMesh?.visible) drawMiniDot(spawnSpikeMesh.position.x, spawnSpikeMesh.position.z, 3, "#6bdcff");
  for (const bot of teamBots) {
    if (bot.visible && bot.userData.alive && !bot.userData.hasSpike) drawMiniDot(bot.position.x, bot.position.z, 2.2, "#7de3c3");
  }
  for (const ping of pings) drawMiniDot(ping.x, ping.z, 4, "#ffffff");

  const pp = mapToMini(player.position.x, player.position.z);
  minimapCtx.save();
  minimapCtx.translate(pp.x, pp.y);
  minimapCtx.rotate(-player.yaw);
  minimapCtx.fillStyle = "#eef6fb";
  minimapCtx.beginPath();
  minimapCtx.moveTo(0, -7);
  minimapCtx.lineTo(5, 5);
  minimapCtx.lineTo(-5, 5);
  minimapCtx.closePath();
  minimapCtx.fill();
  minimapCtx.restore();
}

function setMinimapLarge(open) {
  player.minimapLarge = open;
  minimapPanel.classList.toggle("large", open);
  minimapCanvas.width = open ? 520 : 180;
  minimapCanvas.height = open ? 520 : 180;
  keys.clear();
  player.firing = false;
  player.scoped = false;
  cancelAbilityAim(false);
  if (open) {
    try {
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    } catch (_) {}
  } else if (match.phase === "playing" && !player.settingsOpen) {
    player.pitch = THREE.MathUtils.clamp(player.pitch, -0.22, 0.22);
    try {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest && typeof lockRequest.catch === "function") lockRequest.catch(() => {});
    } catch (_) {}
  }
  drawMinimap();
}

function clearPings() {
  for (const mesh of pingMeshes) {
    scene.remove(mesh);
    mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
  pingMeshes.length = 0;
  pings.length = 0;
}

function addWorldPing(x, z, { small = false } = {}) {
  clearPings();
  if (match.phase === "playing") {
    match.tacticalCommand = {
      position: new THREE.Vector3(x, 0, z),
      expiresAt: performance.now() + (small ? 9000 : 14000),
    };
  }
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const beamHeight = small ? 5.2 : 16;
  const beamRadius = small ? 0.045 : 0.12;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(beamRadius, beamRadius, beamHeight, small ? 8 : 10),
    new THREE.MeshBasicMaterial({ color: small ? 0x9ef3d1 : 0x6bdcff, transparent: true, opacity: small ? 0.42 : 0.38 })
  );
  beam.name = small ? "crosshairSmallPingBeam" : "worldPingBeam";
  beam.position.y = beamHeight / 2;
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(small ? 0.22 : 0.48, small ? 0.65 : 1.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: small ? 0.82 : 0.95 })
  );
  marker.name = small ? "crosshairSmallPingMarker" : "worldPingMarker";
  marker.position.y = small ? 0.62 : 1.2;
  marker.rotation.y = Math.PI / 4;
  group.add(beam, marker);
  scene.add(group);
  pingMeshes.push(group);
  pings.push({ x, z, small });
}

function addCrosshairPing() {
  if (match.phase !== "playing" || player.settingsOpen || player.minimapLarge) return;
  const point = safeNavPoint(aimGroundPoint(34));
  addWorldPing(
    THREE.MathUtils.clamp(point.x, -mapBounds, mapBounds),
    THREE.MathUtils.clamp(point.z, -mapBounds, mapBounds),
    { small: true }
  );
  addFeed("已在准心处发出小指示");
}

function objectiveText() {
  if (match.phase === "menu") return "等待开始";
  if (match.phase === "matchEnd") return "比赛结束";
  if (match.coreState === "planted") return `${match.activeSite.key} 点爆能器已安装 · ${Math.ceil(match.coreTimer)} 秒`;
  if (match.coreState === "defused") return "爆能器已拆除";
  const allyCarrier = teamBots.find((bot) => bot.visible && bot.userData.hasSpike);
  if (player.hasSpike) return "你携带爆能器 · 前往 A/B 点";
  if (allyCarrier) return `${allyCarrier.userData.label} 携带爆能器`;
  if (spawnSpikeMesh?.visible) return "爆能器在攻方门口";
  return "爆能器未安装";
}

function objectiveCarrierText() {
  if (match.phase === "menu" || match.phase === "matchEnd") return "爆能器：待命";
  if (match.coreState === "planted") return `爆能器：已安装在 ${match.activeSite.key} 点`;
  if (match.coreState === "defused") return "爆能器：已拆除";
  if (player.hasSpike) return "爆能器：你携带";
  const allyCarrier = teamBots.find((bot) => bot.visible && bot.userData.hasSpike);
  if (allyCarrier) return `爆能器：${allyCarrier.userData.label} 携带`;
  const enemyCarrier = targets.find((target) => target.visible && target.userData.hasSpike);
  if (enemyCarrier) return `爆能器：${enemyCarrier.userData.label} 携带`;
  if (spawnSpikeMesh?.visible) return "爆能器：攻方基地地面";
  return "爆能器：掉落或未确认";
}

function plantSpikeAt(site, sourceLabel, plantPosition = site.position) {
  match.activeSite = site;
  match.coreState = "planted";
  match.coreTimer = rules.spikeSeconds;
  match.plantProgress = 0;
  match.aiPlantProgress = 0;
  match.allyPlantProgress = 0;
  match.defuseProgress = 0;
  player.planting = false;
  player.hasSpike = false;
  for (const bot of teamBots) bot.userData.hasSpike = false;
  coreMesh.visible = true;
  const plantedAt = plantPosition.clone ? plantPosition.clone() : site.position.clone();
  plantedAt.x = THREE.MathUtils.clamp(plantedAt.x, -mapBounds, mapBounds);
  plantedAt.z = THREE.MathUtils.clamp(plantedAt.z, -mapBounds, mapBounds);
  coreMesh.position.set(plantedAt.x, 0.9, plantedAt.z);
  coreMesh.scale.setScalar(0.1);
  for (const siteItem of sites) siteItem.disc.material.opacity = siteItem === match.activeSite ? 0.7 : 0.32;
  sfx.plant();
  addFeed(sourceLabel + "在 " + match.activeSite.key + " 点安装爆能器");
}

function pickupNearestWeapon() {
  if (match.phase !== "playing") return false;
  const near = nearestSite();
  if (match.selectedSide === "attack" && player.hasSpike && match.coreState === "idle" && near.dist <= rules.siteRadius) return false;
  if (match.selectedSide === "attack" && spawnSpikeMesh?.visible && flatDistance(player.position, spawnSpikeMesh.position) <= 5.2) {
    player.hasSpike = true;
    spawnSpikeMesh.visible = false;
    sfx.pickup();
    addFeed("已拾取爆能器");
    updateHud();
    return true;
  }
  const info = nearestPickup();
  if (!info.pickup || info.dist > 2.2) return false;
  const key = info.pickup.userData.key;
  if (inventoryFullFor(weapons[key].type, key)) {
    addFeed(weapons[key].type === "pistol" ? "手枪栏已满" : "主武器最多 2 把", "miss");
    return false;
  }
  info.pickup.userData.picked = true;
  info.pickup.visible = false;
  player.inventory.add(key);
  ammoByWeapon[key].ammo = weapons[key].magazine;
  ammoByWeapon[key].reserve = weapons[key].reserve;
  setWeapon(key, true);
  sfx.pickup();
  addFeed(`拾取 ${weapons[key].label}`);
  renderWeaponSlots();
  updateHud();
  return true;
}

function dropCurrentWeapon() {
  if (match.phase !== "playing" || player.planting) return false;
  const key = player.weaponKey;
  if (!key || weapons[key]?.melee) {
    addFeed("刀不能丢弃", "miss");
    return false;
  }
  dropWeaponAt(key, player.position);
  player.inventory.delete(key);
  const fallback = ownedWeaponKeys().find((ownedKey) => !weapons[ownedKey]?.melee) || "melee";
  setWeapon(fallback, true);
  addFeed("已丢下 " + weapons[key].label);
  renderWeaponSlots();
  updateHud();
  return true;
}

function dropSpike() {
  if (match.phase !== "playing" || player.planting || match.coreState !== "idle" || !spawnSpikeMesh) return false;
  if (!player.hasSpike) {
    addFeed("你没有携带爆能器", "miss");
    return false;
  }
  shotDirection.set(0, 0, -1).applyEuler(camera.rotation).setY(0);
  if (shotDirection.lengthSq() < 0.01) shotDirection.set(0, 0, -1);
  shotDirection.normalize();
  const dropPoint = player.position.clone().addScaledVector(shotDirection, 1.8);
  dropPoint.x = THREE.MathUtils.clamp(dropPoint.x, -mapBounds, mapBounds);
  dropPoint.z = THREE.MathUtils.clamp(dropPoint.z, -mapBounds, mapBounds);
  player.hasSpike = false;
  spawnSpikeMesh.visible = true;
  spawnSpikeMesh.position.set(dropPoint.x, 0.14, dropPoint.z);
  sfx.pickup();
  addFeed("已丢下爆能器");
  updateHud();
  return true;
}

function nearestSite() {
  let best = sites[0];
  let bestDist = Infinity;
  for (const site of sites) {
    const dist = flatDistance(player.position, site.position);
    if (dist < bestDist) {
      best = site;
      bestDist = dist;
    }
  }
  return { site: best, dist: bestDist };
}

function deployHint(near) {
  if (match.phase !== "playing") return "";
  if (match.selectedSide !== "attack" || match.coreState !== "idle") return "";
  const allyCarrier = teamBots.find((bot) => bot.visible && bot.userData.hasSpike);
  if (!player.hasSpike) {
    if (allyCarrier) return `${allyCarrier.userData.label} 正在带包，掩护他进点`;
    if (spawnSpikeMesh?.visible) return "先回攻方门口拾取爆能器";
    return "爆能器未在你身上，寻找掉落点或掩护队友";
  }
  if (near.dist > rules.siteRadius) {
    return `携带爆能器：进入安装点（距最近点 ${Math.ceil(near.dist)}m）`;
  }
  return keys.has("KeyE")
    ? `正在部署 ${near.site.key} 点爆能器 ${Math.min(99, Math.round((match.plantProgress / rules.plantSeconds) * 100))}%`
    : `按住 E 部署 ${near.site.key} 点爆能器`;
}

function interactionInfo() {
  const near = nearestSite();
  if (match.phase === "playing" && match.selectedSide === "attack" && spawnSpikeMesh?.visible) {
    const dist = flatDistance(player.position, spawnSpikeMesh.position);
    if (dist <= 5.2) {
      return {
        label: "目标：拾取爆能器",
        progress: 0,
        prompt: keys.has("KeyE") ? "正在拾取爆能器" : "按 E 拾取爆能器",
      };
    }
  }
  const pickupInfo = nearestPickup();
  const nearSite = near.dist <= rules.siteRadius;
  if (
    match.phase === "playing" &&
    pickupInfo.pickup &&
    pickupInfo.dist <= 2.2 &&
    !(match.selectedSide === "attack" && player.hasSpike && match.coreState === "idle" && nearSite)
  ) {
    const def = weapons[pickupInfo.pickup.userData.key];
    return {
      label: "目标：收集武器并完成回合任务",
      progress: 0,
      prompt: keys.has("KeyE") ? `正在拾取 ${def.label}` : `按 E 拾取 ${def.label}`,
    };
  }

  const holdingUse = keys.has("KeyE");
  const hint = deployHint(near);

  if (match.phase !== "playing") return { label: "选择阵营开始", progress: 0, prompt: "" };

  if (match.selectedSide === "attack") {
    if (match.coreState === "idle") {
      const allyCarrier = teamBots.find((bot) => bot.visible && bot.userData.hasSpike);
      return {
        label: player.hasSpike
          ? "目标：进入 A/B 单点安装爆能器"
          : allyCarrier
            ? `${allyCarrier.userData.label} 正在携带爆能器`
            : "目标：先在攻方门口拾取爆能器；你不拿时队友稍后会代拿",
        progress: Math.max(match.plantProgress, match.allyPlantProgress) / rules.plantSeconds,
        prompt: hint,
      };
    }
    return { label: `目标：守住 ${match.activeSite.key} 点爆能器`, progress: 1 - match.coreTimer / rules.spikeSeconds, prompt: "" };
  }

  if (match.coreState === "planted") {
    const dist = flatDistance(player.position, plantedCoreGroundPosition());
    const canDefuse = dist <= rules.siteRadius;
    return {
      label: `目标：进入 ${match.activeSite.key} 点拆除爆能器`,
      progress: match.defuseProgress / rules.defuseSeconds,
      prompt: canDefuse ? (holdingUse ? "正在拆除爆能器" : "按住 E 拆除爆能器") : `靠近 ${match.activeSite.key} 点拆除（${Math.ceil(dist)}m）`,
    };
  }

  return { label: "目标：守住 A/B 点或消灭攻方", progress: match.aiPlantProgress / rules.plantSeconds, prompt: "" };
}

function resetTarget(target, index) {
  const attackSpawns = [
    [-64, 124],
    [-28, 132],
    [0, 136],
    [28, 132],
    [64, 124],
  ];
  const defenseSpawns = [
    [-70, -124],
    [-30, -132],
    [0, -138],
    [30, -132],
    [70, -124],
  ];
  const defenderRoles = [
    { role: "A 守点", route: tacticalRoutes.defendA },
    { role: "B 守点", route: tacticalRoutes.defendB },
    { role: "中路架点", route: tacticalRoutes.defendMid },
    { role: "A 回防", route: tacticalRoutes.defendRotate },
    { role: "B 回防", route: tacticalRoutes.defendB },
  ];
  const attackerRoles = [
    { role: "带包进攻", route: tacticalRoutes.attackA, carrier: true },
    { role: "B 点突破", route: tacticalRoutes.attackB },
    { role: "控中", route: tacticalRoutes.attackMid },
    { role: "侧翼", route: tacticalRoutes.attackFlank },
    { role: "补枪", route: tacticalRoutes.attackA },
  ];
  const spawns = match.selectedSide === "attack" ? defenseSpawns : attackSpawns;
  const plan = match.selectedSide === "attack" ? defenderRoles[index % defenderRoles.length] : attackerRoles[index % attackerRoles.length];
  const [x, z] = spawns[index % spawns.length];
  target.userData.health = 100;
  target.userData.label = match.selectedSide === "attack" ? `防守目标 ${index + 1}` : `进攻目标 ${index + 1}`;
  target.userData.role = plan.role;
  target.userData.hasSpike = !!plan.carrier;
  target.userData.weaponKey = ["pistol", "ghost", "smg", "rifle", "burst"][index % 5];
  target.userData.aiTimer = Math.random() * 1.2;
  target.userData.heading = match.selectedSide === "attack" ? 0 : Math.PI;
  target.userData.stuckTime = 0;
  target.userData.lastPosition = target.position.clone();
  target.userData.route = routeClone(plan.route);
  target.userData.routeIndex = 0;
  target.userData.holdPoint = null;
  target.userData.combatState = "推进";
  target.userData.suppressedUntil = 0;
  target.userData.smokedUntil = 0;
  target.position.set(x, 0, z);
  target.visible = true;
}

function resetTargetsForRound() {
  targets.forEach((target, index) => resetTarget(target, index));
  const allySpawns = match.selectedSide === "attack"
    ? [[-48, 126], [-16, 134], [16, 134], [48, 126]]
    : [[-48, -126], [-16, -134], [16, -134], [48, -126]];
  const allyPlans = match.selectedSide === "attack"
    ? [
        { role: "带包支援", route: tacticalRoutes.attackA },
        { role: "B 点突破", route: tacticalRoutes.attackB },
        { role: "控中", route: tacticalRoutes.attackMid },
        { role: "侧翼", route: tacticalRoutes.attackFlank },
      ]
    : [
        { role: "A 守点", route: tacticalRoutes.defendA },
        { role: "B 守点", route: tacticalRoutes.defendB },
        { role: "中路架点", route: tacticalRoutes.defendMid },
        { role: "快速回防", route: tacticalRoutes.defendRotate },
      ];
  teamBots.forEach((bot, index) => {
    const [x, z] = allySpawns[index % allySpawns.length];
    const plan = allyPlans[index % allyPlans.length];
    bot.position.set(x, 0, z);
    bot.visible = true;
    bot.userData.alive = true;
    bot.userData.health = 100;
    bot.userData.hasSpike = false;
    bot.userData.weaponKey = ["ghost", "smg", "rifle", "burst"][index % 4];
    bot.userData.role = plan.role;
    bot.userData.stuckTime = 0;
    bot.userData.lastPosition = bot.position.clone();
    bot.userData.route = routeClone(plan.route);
    bot.userData.routeIndex = 0;
    bot.userData.commandHold = null;
    bot.userData.holdPoint = null;
    bot.userData.combatState = "推进";
    bot.userData.guardUntil = 0;
    bot.userData.heading = match.selectedSide === "attack" ? Math.PI : 0;
  });
  match.tacticalCommand = null;
  match.teamThreatMemory.expiresAt = 0;
  match.teamThreatMemory.source = "";
  match.allyAlive = 5;
  match.enemyAlive = livingTargets();
  match.lastAlert = "";
  updateTeamPanel();
}

function resetPickupsForRound() {
  player.inventory = new Set(["melee", "pistol"]);
  player.weaponKey = "pistol";
  player.scoped = false;
  for (const pickup of weaponPickups) {
    if (pickup.userData.dropped) {
      scene.remove(pickup);
    } else {
      pickup.visible = true;
      pickup.userData.picked = false;
    }
  }
  for (let i = weaponPickups.length - 1; i >= 0; i--) {
    if (weaponPickups[i].userData.dropped) weaponPickups.splice(i, 1);
  }
  for (const [key, def] of Object.entries(weapons)) {
    ammoByWeapon[key].ammo = def.magazine;
    ammoByWeapon[key].reserve = def.reserve;
  }
  rebuildWeaponView();
  renderWeaponSlots();
}

function livingTargets() {
  return targets.filter((target) => target.visible).length;
}

function livingAllies() {
  return (player.alive ? 1 : 0) + teamBots.filter((bot) => bot.visible && bot.userData.alive).length;
}

function hasLineOfSight(from, to) {
  const direction = to.clone().sub(from);
  const distance = direction.length();
  direction.normalize();
  raycaster.set(from, direction);
  raycaster.far = distance;
  const blocked = raycaster.intersectObjects(obstacleMeshes, false)[0];
  raycaster.far = Infinity;
  return !blocked;
}

function showDamageDirection(sourcePosition) {
  if (!sourcePosition) return;
  const toSource = sourcePosition.clone().sub(player.position);
  const forwardAngle = Math.atan2(Math.sin(player.yaw), Math.cos(player.yaw));
  const sourceAngle = Math.atan2(toSource.x, toSource.z);
  let delta = sourceAngle - forwardAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const abs = Math.abs(delta);
  const label = abs < Math.PI * 0.25 ? "前方" : abs > Math.PI * 0.75 ? "后方" : delta > 0 ? "右侧" : "左侧";
  const senseDir = abs < Math.PI * 0.25 ? "front" : abs > Math.PI * 0.75 ? "back" : delta > 0 ? "right" : "left";
  damageDirection.textContent = `受击：${label}`;
  damageDirection.classList.remove("hidden");
  damageSense.dataset.dir = senseDir;
  damageSense.classList.remove("hidden");
  window.clearTimeout(showDamageDirection.timer);
  showDamageDirection.timer = window.setTimeout(() => {
    damageDirection.classList.add("hidden");
    damageSense.classList.add("hidden");
    damageSense.dataset.dir = "";
  }, 950);
}

function damagePlayer(amount, source = "AI", sourcePosition = null) {
  if (match.phase !== "playing") return;
  showDamageDirection(sourcePosition);
  rememberTeamThreat(sourcePosition, source);
  const guarded = performance.now() < (player.guardUntil || 0);
  const incoming = guarded ? Math.max(1, Math.round(amount * 0.62)) : amount;
  const absorbed = Math.min(player.armor, incoming);
  player.armor = Math.max(0, player.armor - absorbed);
  const finalAmount = incoming - absorbed;
  if (player.armorType === "revive" && player.armor <= 0 && absorbed > 0) player.reviveArmorBrokenAt = performance.now();
  player.health = Math.max(0, player.health - finalAmount);
  updateTeamPanel();
  if (player.health <= 0) {
    player.alive = false;
    match.allyAlive = Math.max(0, match.allyAlive - 1);
    updateTeamPanel();
    updateAliveAlert();
    if (match.coreState === "planted") {
      if (match.selectedSide === "defense" && match.allyAlive === 0) {
        endRound("attack", "守方全员被击倒，爆能器无人可拆");
      } else {
        addFeed(source + " 击倒了你，等待爆能器结果", "miss");
      }
      return;
    }
    endRound(match.selectedSide === "attack" ? "defense" : "attack", source + " 击倒了你");
  }
}

function damageTeamBot(bot, amount, source = "敌方", sourcePosition = null) {
  if (match.phase !== "playing" || !bot.visible || !bot.userData.alive) return;
  const guarded = performance.now() < (bot.userData.guardUntil || 0);
  rememberTeamThreat(sourcePosition, source);
  const finalAmount = guarded ? Math.max(1, Math.round(amount * 0.62)) : amount;
  if (guarded) bot.userData.combatState = "守位";
  bot.userData.health = Math.max(0, bot.userData.health - finalAmount);
  updateTeamPanel();
  if (bot.userData.health > 0) return;
  bot.userData.alive = false;
  bot.visible = false;
  if (bot.userData.hasSpike) {
    bot.userData.hasSpike = false;
    if (spawnSpikeMesh) {
      spawnSpikeMesh.visible = true;
      spawnSpikeMesh.position.copy(bot.position).setY(0.14);
    }
  }
  match.allyAlive = livingAllies();
  updateTeamPanel();
  updateAliveAlert();
  addFeed(source + " 击倒 " + bot.userData.label, "miss");
  if (match.allyAlive === 0) {
    if (match.coreState === "planted" && match.selectedSide === "attack") {
      addFeed("攻方全员被击倒，但守方仍需拆除爆能器", "miss");
      return;
    }
    if (match.coreState === "planted" && match.selectedSide === "defense") {
      endRound("attack", "守方全员被击倒，爆能器无人可拆");
      return;
    }
    endRound(match.selectedSide === "attack" ? "defense" : "attack", "己方全员被击倒");
  }
}

function heroSkill(heroKey, slot) {
  return heroes[heroKey]?.skills?.[slot];
}

function abilityHudText(hero) {
  return abilitySlots.map(({ slot }) => {
    const skill = hero.skills[slot];
    const cooldown = player.abilityCooldowns?.[slot] || 0;
    if (player.pendingAbilitySlot === slot) return skill.key + " " + skill.name + " 预瞄";
    return cooldown > 0 ? skill.key + " " + skill.name + " " + Math.ceil(cooldown) + "s" : skill.key + " " + skill.name;
  }).join(" · ");
}

function abilityHudMarkup(hero) {
  return abilitySlots.map(({ slot }) => {
    const skill = hero.skills[slot];
    const cooldown = player.abilityCooldowns?.[slot] || 0;
    const aiming = player.pendingAbilitySlot === slot;
    const stateClass = aiming ? "aiming" : cooldown > 0 ? "cooldown" : "ready";
    const stateLabel = aiming ? "预瞄" : cooldown > 0 ? "冷却" : "就绪";
    const stateText = aiming ? "左键确认" : cooldown > 0 ? Math.ceil(cooldown) + "s" : "就绪";
    return `<span class="ability-pill ${stateClass}" data-slot="${slot}" aria-label="${skill.key} ${skill.name} ${stateLabel}"><b>${skill.key}</b><span>${skill.name}</span><em>${stateText}</em></span>`;
  }).join("");
}

function setAbilityCooldown(slot, seconds) {
  player.abilityCooldowns[slot] = seconds;
  player.abilityCooldown = player.abilityCooldowns.q;
}

function addSkillRing(position, color, radius = 1.1, ttl = 1.2) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.045, 8, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 })
  );
  ring.position.copy(position).setY(0.1);
  ring.rotation.x = Math.PI / 2;
  addAbilityEffect(ring, ttl);
  return ring;
}

function abilityPreviewSpec(heroKey, slot) {
  return abilityPreviewSpecs[heroKey]?.[slot] || { self: true, radius: 2.4 };
}

function abilityPreviewPoint(heroKey, slot) {
  const spec = abilityPreviewSpec(heroKey, slot);
  if (spec.self) return player.position.clone().setY(0);
  const point = aimGroundPoint(spec.distance || 18);
  return spec.safe ? safeNavPoint(point) : point;
}

function addAbilityTargetPreview(heroKey, slot, color) {
  const spec = abilityPreviewSpec(heroKey, slot);
  const point = abilityPreviewPoint(heroKey, slot);
  const radius = Math.max(0.8, spec.radius || 2.4);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.035, 36),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false })
  );
  disc.name = "abilityTargetPreview";
  disc.position.copy(point).setY(0.07);
  addAbilityEffect(disc, 0.75);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.035, 8, 44),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.76, depthWrite: false })
  );
  ring.name = "abilityTargetRange";
  ring.position.copy(point).setY(0.13);
  ring.rotation.x = Math.PI / 2;
  addAbilityEffect(ring, 0.75);
  return point;
}

function disposeAbilityAimPreview() {
  if (!abilityAimPreview) return;
  for (const mesh of [abilityAimPreview.disc, abilityAimPreview.ring]) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  abilityAimPreview = null;
}

function abilityRequiresConfirmation(heroKey, slot) {
  const spec = abilityPreviewSpec(heroKey, slot);
  return !spec.self;
}

function ensureAbilityAimPreview(heroKey, slot, color) {
  const spec = abilityPreviewSpec(heroKey, slot);
  const radius = Math.max(0.8, spec.radius || 2.4);
  if (abilityAimPreview && abilityAimPreview.heroKey === heroKey && abilityAimPreview.slot === slot && Math.abs(abilityAimPreview.radius - radius) < 0.01) {
    return abilityAimPreview;
  }
  disposeAbilityAimPreview();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.035, 36),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false })
  );
  disc.name = "abilityAimPreview";
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.04, 8, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, depthWrite: false })
  );
  ring.name = "abilityAimRange";
  ring.rotation.x = Math.PI / 2;
  scene.add(disc);
  scene.add(ring);
  abilityAimPreview = { heroKey, slot, radius, disc, ring };
  return abilityAimPreview;
}

function updateAbilityAimPreview() {
  const slot = player.pendingAbilitySlot;
  if (!slot) {
    disposeAbilityAimPreview();
    return;
  }
  if (match.phase !== "playing" || player.settingsOpen || !player.alive) {
    cancelAbilityAim(false);
    return;
  }
  const skill = heroSkill(player.heroKey, slot);
  const cooldown = player.abilityCooldowns?.[slot] || 0;
  if (!skill || cooldown > 0 || !abilityRequiresConfirmation(player.heroKey, slot)) {
    cancelAbilityAim(false);
    return;
  }
  const hero = heroes[player.heroKey];
  const preview = ensureAbilityAimPreview(player.heroKey, slot, hero.color);
  const point = abilityPreviewPoint(player.heroKey, slot);
  const pulse = 0.5 + Math.sin(performance.now() / 135) * 0.5;
  preview.disc.position.copy(point).setY(0.08);
  preview.ring.position.copy(point).setY(0.14);
  preview.disc.material.opacity = 0.16 + pulse * 0.08;
  preview.ring.material.opacity = 0.68 + pulse * 0.22;
}

function startAbilityAim(slot) {
  if (match.phase !== "playing" || player.settingsOpen) return;
  const skill = heroSkill(player.heroKey, slot);
  if (!skill) return;
  const cooldown = player.abilityCooldowns?.[slot] || 0;
  if (cooldown > 0) {
    addFeed(`${skill.key} ${skill.name} 冷却中 ${Math.ceil(cooldown)}秒`);
    return;
  }
  if (player.pendingAbilitySlot === slot) return;
  if (!abilityRequiresConfirmation(player.heroKey, slot)) {
    cancelAbilityAim(false);
    useHeroAbility(slot);
    return;
  }
  player.pendingAbilitySlot = slot;
  player.firing = false;
  player.scoped = false;
  ensureAbilityAimPreview(player.heroKey, slot, heroes[player.heroKey].color);
  updateAbilityAimPreview();
  addFeed(`${skill.key} ${skill.name} 预瞄中 · 左键确认 · 右键取消`);
  updateHud();
}

function confirmAbilityAim() {
  if (!player.pendingAbilitySlot) return false;
  const slot = player.pendingAbilitySlot;
  player.pendingAbilitySlot = null;
  player.firing = false;
  disposeAbilityAimPreview();
  useHeroAbility(slot);
  updateHud();
  return true;
}

function cancelAbilityAim(showFeed = true) {
  if (!player.pendingAbilitySlot && !abilityAimPreview) return false;
  player.pendingAbilitySlot = null;
  player.firing = false;
  disposeAbilityAimPreview();
  if (showFeed) addFeed("技能预瞄已取消");
  updateHud();
  return true;
}

function useHeroAbility(slot = "q") {
  if (match.phase !== "playing" || player.settingsOpen) return;
  const skill = heroSkill(player.heroKey, slot);
  if (!skill) return;
  const cooldown = player.abilityCooldowns?.[slot] || 0;
  if (cooldown > 0) {
    addFeed(`${skill.key} ${skill.name} 冷却中 ${Math.ceil(cooldown)}秒`);
    return;
  }
  setAbilityCooldown(slot, skill.cooldown);
  const hero = heroes[player.heroKey];
  addAbilityTargetPreview(player.heroKey, slot, hero.color);

  if (player.heroKey === "warden" && slot === "q") {
    const guardUntil = performance.now() + 6500;
    player.health = Math.min(100, player.health + 35);
    player.guardUntil = guardUntil;
    for (const bot of teamBots) {
      if (bot.visible && bot.userData.alive && flatDistance(bot.position, player.position) < 9) {
        bot.userData.health = Math.min(100, bot.userData.health + 30);
        bot.userData.combatState = "守位";
        bot.userData.commandHold = bot.position.clone();
        bot.userData.guardUntil = guardUntil;
      }
    }
    addSkillRing(player.position, hero.color, 1.1, 1.2);
    updateTeamPanel();
    addFeed("守护者：急救环治疗并给近队友护甲守位");
    tone(740, 0.12, "sine", 0.028);
  } else if (player.heroKey === "warden" && slot === "f") {
    const guardUntil = performance.now() + 5200;
    for (const [index, bot] of teamBots.entries()) {
      if (!bot.visible || !bot.userData.alive || flatDistance(bot.position, player.position) > 22) continue;
      const angle = (index / Math.max(1, teamBots.length)) * Math.PI * 2;
      bot.userData.commandHold = safeNavPoint(player.position.clone().add(new THREE.Vector3(Math.cos(angle) * 5.2, 0, Math.sin(angle) * 5.2)));
      bot.userData.guardUntil = guardUntil;
      bot.userData.combatState = "守位";
    }
    player.guardUntil = guardUntil;
    addSkillRing(player.position, hero.color, 4.8, 1.5);
    addFeed("守护者：守位信标集合近队友");
  } else if (player.heroKey === "warden" && slot === "h") {
    player.armor = Math.min(player.maxArmor || 80, player.armor + 35);
    player.health = Math.min(100, player.health + 18);
    for (const bot of teamBots) {
      if (bot.visible && bot.userData.alive && flatDistance(bot.position, player.position) < 12) bot.userData.health = Math.min(100, bot.userData.health + 20);
    }
    addSkillRing(player.position, 0xb8ffe8, 2.4, 1.25);
    updateTeamPanel();
    addFeed("守护者：装甲补给修复护甲");
  } else if (player.heroKey === "flare" && slot === "q") {
    const zonePoint = aimGroundPoint(18);
    const burst = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.5, 0.08, 28),
      new THREE.MeshBasicMaterial({ color: hero.color, transparent: true, opacity: 0.38 })
    );
    burst.name = "flareBurnZone";
    burst.position.copy(zonePoint).setY(0.12);
    addAbilityEffect(burst, 5.5);
    addAbilityZone("flare", zonePoint, 5.5, 5.5);
    for (const target of targets) {
      const inBurst = target.visible && flatDistance(target.position, zonePoint) < 5.8;
      const nearPlayer = target.visible && target.position.distanceTo(player.position) < 7;
      if (inBurst || nearPlayer) {
        applyTargetDamage(target, inBurst ? 28 : 45, false, "焰手灼烧");
        target.userData.aiTimer += 1.2;
        target.userData.combatState = "灼烧";
        target.userData.suppressedUntil = performance.now() + 4200;
        target.userData.holdPoint = null;
      }
    }
    addFeed("焰手：燃烧区封锁入口");
  } else if (player.heroKey === "flare" && slot === "f") {
    const flashPoint = aimGroundPoint(20);
    addSkillRing(flashPoint, hero.color, 3.6, 0.9);
    for (const target of targets) {
      if (!target.visible || flatDistance(target.position, flashPoint) > 12) continue;
      target.userData.suppressedUntil = performance.now() + 2600;
      target.userData.aiTimer += 1.6;
      target.userData.holdPoint = null;
      target.userData.combatState = "压制";
    }
    addFeed("焰手：闪焰压制打断架枪");
  } else if (player.heroKey === "flare" && slot === "h") {
    player.speedBoostUntil = performance.now() + 4200;
    makePlayerNoise(28, "热浪推进暴露脚步");
    addSkillRing(player.position, hero.color, 2.8, 1.1);
    for (const target of targets) {
      if (target.visible && flatDistance(target.position, player.position) < 8) {
        applyTargetDamage(target, 18, false, "热浪推进");
        target.userData.combatState = "灼烧";
      }
    }
    addFeed("焰手：热浪推进短时加速");
  } else if (player.heroKey === "brim" && slot === "q") {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0x7f8d98, transparent: true, opacity: 0.42 })
    );
    smoke.position.copy(aimGroundPoint(24)).setY(2.2);
    addAbilityEffect(smoke, 8, true);
    addAbilityZone("smoke", smoke.position, 7.2, 8);
    const smokedTargets = targets.filter((target) => target.visible && flatDistance(target.position, smoke.position) < 18);
    for (const target of smokedTargets) {
      target.userData.aiTimer += 0.8;
      target.userData.combatState = "迟疑";
      target.userData.smokedUntil = performance.now() + 8000;
    }
    addFeed("战术官：烟幕阻挡视线 · 侦察到 " + smokedTargets.length + " 个热源");
  } else if (player.heroKey === "brim" && slot === "f") {
    const scanPoint = aimGroundPoint(28);
    addSkillRing(scanPoint, hero.color, 6.2, 1.2);
    const scanTargets = targets.filter((target) => target.visible && flatDistance(target.position, scanPoint) < 18);
    for (const target of scanTargets) {
      target.userData.aiTimer += 1.1;
      target.userData.combatState = "暴露";
      target.userData.suppressedUntil = Math.max(target.userData.suppressedUntil || 0, performance.now() + 1400);
    }
    addFeed("战术官：热源扫描发现 " + scanTargets.length + " 个目标");
  } else if (player.heroKey === "brim" && slot === "h") {
    const commandPoint = safeNavPoint(aimGroundPoint(26));
    match.tacticalCommand = { position: commandPoint, expiresAt: performance.now() + 8500 };
    addWorldPing(commandPoint.x, commandPoint.z);
    addSkillRing(commandPoint, hero.color, 3.2, 1.4);
    addFeed("战术官：推进号令已下达");
  } else if (player.heroKey === "gust" && slot === "q") {
    const decoyNoise = player.position.clone().setY(0);
    shotDirection.set(0, 0, -1).applyEuler(camera.rotation).setY(0).normalize();
    const dashX = player.position.x + shotDirection.x * 5.4;
    const dashZ = player.position.z + shotDirection.z * 5.4;
    if (!collidesAt(dashX, dashZ)) {
      player.position.x = dashX;
      player.position.z = dashZ;
    }
    const streak = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 5.4, 8),
      new THREE.MeshBasicMaterial({ color: hero.color, transparent: true, opacity: 0.28 })
    );
    streak.position.copy(player.position).setY(0.9);
    streak.rotation.x = Math.PI / 2;
    addAbilityEffect(streak, 0.7);
    player.lastNoiseAt = performance.now();
    player.lastNoisePosition.copy(decoyNoise);
    player.noiseRadius = 30;
    player.decoyUntil = performance.now() + 2600;
    player.decoyPosition.copy(decoyNoise);
    addFeed("疾风：冲刺，诱导敌人搜旧位置");
  } else if (player.heroKey === "gust" && slot === "f") {
    player.silentUntil = performance.now() + 5200;
    player.lastNoiseAt = 0;
    player.noiseRadius = 0;
    addSkillRing(player.position, hero.color, 1.7, 1.1);
    addFeed("疾风：静风步压低声源");
  } else if (player.heroKey === "gust" && slot === "h") {
    const decoyNoise = player.position.clone().setY(0);
    right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    const side = player.lean < 0 ? -1 : 1;
    const blink = player.position.clone().addScaledVector(right, side * 4.8);
    if (!collidesAt(blink.x, blink.z)) player.position.copy(blink.setY(player.position.y));
    player.decoyUntil = performance.now() + 2400;
    player.decoyPosition.copy(decoyNoise);
    player.lastNoiseAt = performance.now();
    player.lastNoisePosition.copy(decoyNoise);
    player.noiseRadius = 24;
    addSkillRing(decoyNoise, hero.color, 1.8, 1);
    addFeed("疾风：侧闪并留下诱饵");
  }
  updateHud();
}

function setWeapon(key, force = false) {
  if (!weapons[key] || (!force && key === player.weaponKey)) return;
  if (!player.inventory.has(key)) {
    addFeed(`${weapons[key].label} 还没拾取`, "miss");
    return;
  }
  player.weaponKey = key;
  player.isReloading = false;
  player.nextShotAt = 0;
  player.scoped = false;
  player.switchTimer = player.switchDuration;
  rebuildWeaponView();
  sfx.switch();
  updateHud();
}

function reload() {
  const def = currentWeapon();
  if (def.melee) return;
  const ammo = currentAmmo();
  if (player.isReloading || ammo.ammo === def.magazine || ammo.reserve <= 0) return;
  player.isReloading = true;
  sfx.reload();
  addFeed("换弹中");
  updateHud();

  window.setTimeout(() => {
    const needed = def.magazine - ammo.ammo;
    const taken = Math.min(needed, ammo.reserve);
    ammo.ammo += taken;
    ammo.reserve -= taken;
    player.isReloading = false;
    updateHud();
  }, def.reloadTime * 1000);
}

function muzzleWorldPosition() {
  return new THREE.Vector3(0.38, -0.3, -0.92).applyMatrix4(camera.matrixWorld);
}

function addTracer(start, end) {
  const material = new THREE.LineBasicMaterial({
    color: currentWeapon().color,
    transparent: true,
    opacity: 0.85,
  });
  const geometry = new THREE.BufferGeometry().setFromPoints([start.clone(), end.clone()]);
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  tracers.push({ line, material, ttl: 0.12, life: 0.12 });
}

function addMuzzleFlash(position) {
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9 })
  );
  flash.position.copy(position);
  addAbilityEffect(flash, 0.07);
}

function addImpactBurst(position, headshot = false) {
  const material = new THREE.MeshBasicMaterial({
    color: headshot ? 0xffd166 : 0x35d0a2,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.26, 18), material);
  ring.position.copy(position);
  ring.lookAt(camera.position);
  scene.add(ring);
  bursts.push({ mesh: ring, material, ttl: 0.38, life: 0.38 });
}

function addBulletHole(position, normalColor = 0x0b1117) {
  const material = new THREE.MeshBasicMaterial({
    color: normalColor,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.075, 10), material);
  hole.position.copy(position);
  hole.position.y += 0.002;
  hole.lookAt(camera.position);
  scene.add(hole);
  bulletHoles.push({ mesh: hole, material, ttl: 5, life: 5 });
}

function addAbilityEffect(mesh, ttl, blocksSight = false) {
  scene.add(mesh);
  if (blocksSight) obstacleMeshes.push(mesh);
  abilityEffects.push({ mesh, material: mesh.material, ttl, life: ttl, blocksSight });
}

function addAbilityZone(type, position, radius, ttl) {
  abilityZones.push({ type, position: position.clone().setY(0), radius, ttl, life: ttl, nextTickAt: performance.now() + 450 });
}

function aimGroundPoint(distance = 22) {
  shotDirection.set(0, 0, -1).applyEuler(camera.rotation).setY(0).normalize();
  return player.position.clone().addScaledVector(shotDirection, distance).setY(0.05);
}

function showKillEffect(headshot, label) {
  killTitle.textContent = headshot ? "SKULL +" : "SKULL";
  killSubtitle.textContent = label;
  killEffect.classList.remove("hidden");
  killEffect.style.animation = "none";
  killEffect.offsetHeight;
  killEffect.style.animation = "";
  window.setTimeout(() => killEffect.classList.add("hidden"), 5000);
}

function addDeathOrb(position) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), mat);
  orb.position.copy(position).setY(0.28);
  scene.add(orb);
  deathOrbs.push({ mesh: orb, material: mat, ttl: 6, life: 6 });
}

function applyTargetDamage(target, damage, headshot, sourceLabel) {
  target.userData.health -= damage;
  if (headshot) {
    player.score += 150;
    sfx.headshot();
    addFeed(sourceLabel + " " + target.userData.label, "headshot");
  } else if (target.userData.health <= 0) {
    player.score += 100;
    sfx.hit();
    addFeed("击倒 " + target.userData.label);
  } else {
    player.score += 20;
    sfx.hit();
  }

  if (target.userData.health <= 0) {
    addDeathOrb(target.position);
    dropWeaponAt(target.userData.weaponKey || "rifle", target.position);
    if (target.userData.hasSpike && spawnSpikeMesh) {
      target.userData.hasSpike = false;
      spawnSpikeMesh.visible = true;
      spawnSpikeMesh.position.copy(target.position).setY(0.14);
      addFeed("爆能器已掉落");
    }
    target.visible = false;
    match.enemyAlive = livingTargets();
    updateTeamPanel();
    updateAliveAlert();
    sfx.kill();
    showKillEffect(headshot, target.userData.label);
    if (livingTargets() === 0) {
      if (match.coreState === "planted" && match.selectedSide === "defense") {
        addFeed("攻方全员被击倒，仍需拆除爆能器", "miss");
        return;
      }
      const winner = match.selectedSide;
      endRound(winner, winner === "attack" ? "攻方部署爆能器或消灭防守" : "守方拆除爆能器或消灭攻方");
    }
  }
}

function meleeAttack() {
  const now = performance.now() / 1000;
  if (now < player.nextShotAt) return;
  player.nextShotAt = now + currentWeapon().fireDelay;
  player.switchTimer = Math.max(player.switchTimer, 0.18);
  sfx.melee();
  makePlayerNoise(10);

  shotDirection.set(0, 0, -1).applyEuler(camera.rotation);
  raycaster.set(camera.position, shotDirection);
  raycaster.far = 2.45;
  const activeMeshes = targetMeshes.filter((mesh) => mesh.userData.target.visible);
  const hit = raycaster.intersectObjects(activeMeshes, false)[0];
  raycaster.far = Infinity;
  if (!hit) {
    updateHud();
    return;
  }

  const target = hit.object.userData.target;
  const headshot = hit.object.userData.part === "head";
  addImpactBurst(hit.point, headshot);
  applyTargetDamage(target, headshot ? currentWeapon().headDamage : currentWeapon().bodyDamage, headshot, "近战命中");
  updateHud();
}

function shoot() {
  if (!player.started || player.isReloading || player.planting || player.pendingAbilitySlot || match.phase !== "playing") return;

  const def = currentWeapon();
  if (def.melee) {
    meleeAttack();
    return;
  }
  const ammo = currentAmmo();
  const now = performance.now() / 1000;
  if (now < player.nextShotAt) return;

  initAudio();
  if (ammo.ammo <= 0) {
    addFeed("弹匣空了，按 R 换弹", "miss");
    tone(120, 0.05, "square", 0.02);
    return;
  }

  player.nextShotAt = now + def.fireDelay;
  ammo.ammo -= 1;
  player.shotChain = now - (player.lastShotAt || 0) < 0.42 ? player.shotChain + 1 : 1;
  player.lastShotAt = now;
  const handling = weaponHandling(player.weaponKey);
  const recoilAmount = def.recoilPerShot * handling.recoilScale;
  player.recoil += recoilAmount;
  player.pitch = THREE.MathUtils.clamp(player.pitch + recoilAmount * 0.45, -1.35, 1.35);
  sfx.shoot();
  makePlayerNoise(handling.noiseRadius);

  const baseSpread = player.velocity.lengthSq() > 0.05 ? def.spreadMoving : def.spreadStill;
  const spread = baseSpread * handling.spreadScale;
  shotDirection.set(0, 0, -1).applyEuler(camera.rotation);
  shotDirection.x += (Math.random() - 0.5) * spread;
  shotDirection.y += (Math.random() - 0.5) * spread;
  shotDirection.z += (Math.random() - 0.5) * spread;
  shotDirection.normalize();

  raycaster.set(camera.position, shotDirection);
  raycaster.far = def.range || 92;
  const activeMeshes = targetMeshes.filter((mesh) => mesh.userData.target.visible);
  const hits = raycaster.intersectObjects([...activeMeshes, ...obstacleMeshes], false);
  const hit = hits[0];
  raycaster.far = Infinity;
  const tracerStart = muzzleWorldPosition();
  addMuzzleFlash(tracerStart);

  if (!hit) {
    hitPoint.copy(camera.position).addScaledVector(shotDirection, def.range || 92);
    addTracer(tracerStart, hitPoint);
    // addFeed("未命中：移动开枪会更飘", "miss");
    updateHud();
    return;
  }

  if (!hit.object.userData.target) {
    addTracer(tracerStart, hit.point);
    addImpactBurst(hit.point, false);
    addBulletHole(hit.point);
    updateHud();
    return;
  }

  addTracer(tracerStart, hit.point);
  const target = hit.object.userData.target;
  const part = hit.object.userData.part;
  const headshot = part === "head";
  const damage = headshot ? def.headDamage : def.bodyDamage;
  addImpactBurst(hit.point, headshot);
  addBulletHole(hit.point, headshot ? 0xffd166 : 0x101820);
  applyTargetDamage(target, damage, headshot, headshot ? "爆头命中" : "身体命中");

  updateHud();
}

function beginRound() {
  match.phase = "buy";
  match.roundTime = rules.roundSeconds;
  match.buyTime = rules.buySeconds;
  match.plantProgress = 0;
  match.aiPlantProgress = 0;
  match.allyPlantProgress = 0;
  match.defuseProgress = 0;
  match.activeSite = sites[0];
  match.coreState = "idle";
  match.coreTimer = 0;
  match.lastCoreWarningSecond = 0;

  player.started = true;
  player.health = 100;
  player.alive = true;
  player.hasSpike = false;
  player.planting = false;
  player.guardUntil = 0;
  player.isReloading = false;
  player.prone = false;
  player.position.set(0, eyeHeight, match.selectedSide === "attack" ? 128 : -128);
  player.velocity.set(0, 0, 0);
  player.verticalVelocity = 0;
  player.grounded = true;
  player.groundHeight = 0;
  player.yaw = match.selectedSide === "attack" ? 0 : Math.PI;
  player.pitch = 0;
  player.recoil = 0;
  player.lastNoiseAt = 0;
  player.noiseRadius = 0;
  player.decoyUntil = 0;
  player.lastNoisePosition.copy(player.position).setY(0);
  player.decoyPosition.copy(player.position).setY(0);
  player.nextFootstepNoiseAt = 0;
  setMinimapLarge(false);
  resetPickupsForRound();

  coreMesh.visible = match.coreState === "planted";
  coreMesh.position.set(match.activeSite.position.x, 0.9, match.activeSite.position.z);
  coreMesh.scale.setScalar(1);
  if (spawnSpikeMesh) {
    spawnSpikeMesh.visible = match.selectedSide === "attack";
    spawnSpikeMesh.position.set(0, 0.14, 124);
  }
  for (const barrier of buyBarriers) barrier.mesh.visible = true;
  for (const site of sites) site.disc.material.opacity = site === match.activeSite && match.coreState === "planted" ? 0.7 : 0.38;
  resetTargetsForRound();
  hud.classList.remove("hidden");
  teamPanel.classList.remove("hidden");
  serverBadge.classList.remove("hidden");
  healthPanel.classList.remove("hidden");
  objectivePanel.classList.remove("hidden");
  weaponPanel.classList.remove("hidden");
  buyPanel.classList.remove("hidden");
  renderBuyList();
  helpPanel.classList.add("hidden");
  roundBanner.classList.add("hidden");
  startPanel.classList.add("hidden");
  try {
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  } catch (_) {}
  sfx.round();
  addFeed("买枪阶段：手枪免费，按 B 可开关买枪菜单");
  updateHud();
}

function startCombatPhase() {
  if (match.phase !== "buy") return;
  match.phase = "playing";
  match.combatStartedAt = performance.now();
  suppressSettingsUntil = performance.now() + 500;
  keys.clear();
  player.firing = false;
  player.scoped = false;
  for (const barrier of buyBarriers) barrier.mesh.visible = false;
  buyPanel.classList.add("hidden");
  try {
    const lockRequest = canvas.requestPointerLock();
    if (lockRequest && typeof lockRequest.catch === "function") lockRequest.catch(() => {});
  } catch (_) {}
  announce(match.selectedSide === "attack" ? "攻方出击" : "守方就位");
  addFeed(match.selectedSide === "attack" ? "攻方任务：拾取爆能器，进入 A/B 点按住 E 安装" : "守方任务：守住 A/B 点，阻止攻方安装爆能器");
}

function startGame() {
  initAudio();
  if (match.phase === "matchEnd") {
    match.round = 1;
    match.attackScore = 0;
    match.defenseScore = 0;
    player.score = 0;
    player.credits = 800;
  }
  beginRound();
}

function endRound(winner, reason) {
  if (match.phase !== "playing" && match.phase !== "buy") return;
  match.phase = "roundEnd";
  player.started = false;
  player.firing = false;
  player.scoped = false;
  player.planting = false;
  keys.clear();
  match.plantProgress = 0;
  match.defuseProgress = 0;
  match.lastCoreWarningSecond = 0;

  if (winner === "attack") match.attackScore += 1;
  else match.defenseScore += 1;
  player.credits += winner === match.selectedSide ? 3000 : 1900;

  const playerWon = winner === match.selectedSide;
  roundResult.textContent = playerWon ? "获胜" : "败北";
  roundReason.textContent = reason;
  roundBanner.classList.remove("hidden");
  addFeed(`${sideName(winner)}得分：${reason}`, winner === "attack" ? "headshot" : "");
  if (playerWon) sfx.victory();
  else sfx.defeat();
  updateHud();

  if (match.attackScore >= rules.winScore || match.defenseScore >= rules.winScore) {
    match.phase = "matchEnd";
    startPanel.classList.remove("hidden");
    hud.classList.add("hidden");
    teamPanel.classList.add("hidden");
    serverBadge.classList.add("hidden");
    healthPanel.classList.add("hidden");
    objectivePanel.classList.add("hidden");
    weaponPanel.classList.add("hidden");
    helpPanel.classList.remove("hidden");
    startPanel.querySelector(".eyebrow").textContent = "Match Complete";
    startPanel.querySelector("h1").textContent = `${sideName(winner)}赢下训练赛`;
    startPanel.querySelector("p:not(.eyebrow)").textContent =
      "本局已使用买枪经济、护甲、爆能器、AI路线和队友指挥完成训练；可调整英雄、阵营或键位后重新开始。";
    startButton.textContent = "重新开始";
    return;
  }

  window.setTimeout(() => {
    match.round += 1;
    beginRound();
  }, 2400);
}

function updateObjective(dt) {
  if (match.phase !== "playing") return;

  const near = nearestSite();
  const holdingUse = keys.has("KeyE");
  if (holdingUse && match.selectedSide === "attack" && spawnSpikeMesh?.visible && flatDistance(player.position, spawnSpikeMesh.position) <= 5.2) {
    pickupNearestWeapon();
    return;
  }
  const pickupInfo = nearestPickup();
  const deployingHasPriority = match.selectedSide === "attack" && player.hasSpike && match.coreState === "idle" && near.dist <= rules.siteRadius;
  if (pickupInfo.pickup && pickupInfo.dist <= 2.2 && !deployingHasPriority) {
    match.plantProgress = 0;
    match.defuseProgress = 0;
    if (holdingUse) return;
  }

  if (match.selectedSide === "attack" && match.coreState === "idle") {
    if (near.dist <= rules.siteRadius && holdingUse && player.hasSpike) {
      player.planting = true;
      match.activeSite = near.site;
      match.plantProgress += dt;
      if (match.plantProgress >= rules.plantSeconds) {
        plantSpikeAt(near.site, "你", player.position);
      }
    } else {
      player.planting = false;
      match.plantProgress = Math.max(0, match.plantProgress - dt * 1.6);
    }
  }

  if (match.selectedSide === "defense" && match.coreState === "planted") {
    const dist = flatDistance(player.position, plantedCoreGroundPosition());
    if (dist <= rules.siteRadius && holdingUse) {
      match.defuseProgress += dt;
      if (match.defuseProgress >= rules.defuseSeconds) completeDefuse("你");
    } else {
      match.defuseProgress = Math.max(0, match.defuseProgress - dt * 1.25);
    }
  }

  if (match.coreState === "planted") {
    match.coreTimer -= dt;
    const warningSecond = Math.ceil(match.coreTimer);
    if (warningSecond > 0 && warningSecond <= 10 && warningSecond !== match.lastCoreWarningSecond) {
      match.lastCoreWarningSecond = warningSecond;
      sfx.warning();
    }
    if (match.coreTimer <= 0) {
      coreMesh.visible = false;
      endRound("attack", `${match.activeSite.key} 点爆能器爆破成功`);
    }
  } else {
    match.roundTime -= dt;
    if (match.roundTime <= 0) endRound("defense", "时间耗尽，守方守住安装点");
  }
}

function updateBuyPhase(dt) {
  if (match.phase !== "buy") return;
  match.buyTime -= dt;
  if (match.buyTime <= 0) startCombatPhase();
}

function updateCamera(dt = 0.016) {
  if (match.phase === "menu" || match.phase === "matchEnd") {
    menuOrbitAngle += dt * 0.12;
    camera.position.set(Math.sin(menuOrbitAngle) * 46, 24, Math.cos(menuOrbitAngle) * 46);
    camera.lookAt(0, 0, -6);
    camera.fov = THREE.MathUtils.damp(camera.fov, 58, 8, dt);
    camera.updateProjectionMatrix();
    scopeOverlay.classList.add("hidden");
    crosshair.classList.add("hidden");
    return;
  }
  const leanInput = match.phase === "playing" && !player.prone ? player.leanToggle : 0;
  player.lean = THREE.MathUtils.damp(player.lean, THREE.MathUtils.clamp(leanInput, -1, 1), 10, dt);
  camera.position.copy(player.position);
  right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  const leanOffset = player.lean * 0.48;
  if (Math.abs(leanOffset) > 0.01 && !playerCollidesAt(player.position.x + right.x * leanOffset, player.position.z + right.z * leanOffset)) {
    camera.position.addScaledVector(right, leanOffset);
  }
  camera.rotation.y = player.yaw + player.lean * 0.035;
  camera.rotation.x = player.pitch - player.recoil;
  camera.rotation.z = -player.lean * 0.13;
  const handling = weaponHandling(player.weaponKey);
  const scopedFov = currentWeapon().zoomFov + (handling.aimSpread > 0.8 ? 4 : 0);
  const targetFov = player.scoped && !currentWeapon().melee ? scopedFov : 75;
  camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 14, dt);
  camera.updateProjectionMatrix();
  scopeOverlay.classList.toggle("hidden", !(player.scoped && !currentWeapon().melee));
  crosshair.classList.toggle("hidden", player.scoped && !currentWeapon().melee);
}

function updateMovement(dt) {
  if (player.settingsOpen || player.planting || (match.phase === "buy" && !buyPanel.classList.contains("hidden"))) {
    player.velocity.set(0, 0, 0);
    return;
  }
  const heroSpeed = heroes[player.heroKey].speedBonus || 0;
  const skillSpeed = performance.now() < (player.speedBoostUntil || 0) ? 1.25 : 0;
  const knifeSpeed = currentWeapon().melee ? 1.15 : 0;
  const armorSpeedScale = armorDefs[player.armorType]?.speedScale || 1;
  const baseSpeed = ((player.scoped ? 2.6 : 5.8) + heroSpeed + skillSpeed + knifeSpeed) * armorSpeedScale;
  const postureSpeed = baseSpeed * postureSpeedMultiplier();
  const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? Math.min(3.1, postureSpeed) : postureSpeed;
  input.set(0, 0, 0);
  if (keys.has("KeyW")) input.z -= 1;
  if (keys.has("KeyS")) input.z += 1;
  if (keys.has("KeyA")) input.x -= 1;
  if (keys.has("KeyD")) input.x += 1;
  if (input.lengthSq() > 0) input.normalize();
  if (input.lengthSq() > 0 && player.grounded && !playerIsStealthWalking() && performance.now() > player.nextFootstepNoiseAt) {
    player.nextFootstepNoiseAt = performance.now() + 520;
    makePlayerNoise(postureNoiseRadius(18));
  }

  if (keys.has("Space") && player.grounded && match.phase === "playing" && playerPosture() !== "prone") {
    player.verticalVelocity = jumpSpeed;
    player.grounded = false;
    tone(180, 0.05, "sine", 0.018);
    makePlayerNoise(24);
  }

  forward.set(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  move.set(0, 0, 0)
    .addScaledVector(right, input.x)
    .addScaledVector(forward, input.z)
    .multiplyScalar(speed);

  player.velocity.x = THREE.MathUtils.lerp(player.velocity.x, move.x, 1 - Math.pow(0.001, dt));
  player.velocity.z = THREE.MathUtils.lerp(player.velocity.z, move.z, 1 - Math.pow(0.001, dt));
  oldPosition.copy(player.position);
  const nextX = player.position.x + player.velocity.x * dt;
  if (!playerCollidesAt(nextX, player.position.z)) {
    player.position.x = nextX;
  } else {
    player.velocity.x = 0;
  }
  const nextZ = player.position.z + player.velocity.z * dt;
  if (!playerCollidesAt(player.position.x, nextZ)) {
    player.position.z = nextZ;
  } else {
    player.velocity.z = 0;
  }

  const surfaceY = climbableSurfaceAt(player.position.x, player.position.z);
  if (player.grounded && surfaceY + 0.08 < (player.groundHeight || 0)) {
    player.grounded = false;
    player.verticalVelocity = Math.min(player.verticalVelocity, 0);
  }
  player.verticalVelocity -= gravity * dt;
  player.position.y += player.verticalVelocity * dt;
  const targetEyeHeight = postureEyeHeight() + surfaceY;
  if (player.grounded) player.position.y = THREE.MathUtils.damp(player.position.y, targetEyeHeight, 12, dt);
  if (player.position.y <= targetEyeHeight) {
    player.position.y = targetEyeHeight;
    player.verticalVelocity = 0;
    player.grounded = true;
    player.groundHeight = surfaceY;
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -mapBounds, mapBounds);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -mapBounds, mapBounds);
}

function updateArmorRegen(dt) {
  if (match.phase !== "playing" || player.armorType !== "revive" || player.armor >= player.maxArmor) return;
  if (!player.reviveArmorBrokenAt || performance.now() - player.reviveArmorBrokenAt < armorDefs.revive.regenDelay) return;
  player.armor = Math.min(player.maxArmor, player.armor + armorDefs.revive.regenRate * dt);
}

function updateAI(dt) {
  if (match.phase !== "playing") return;
  if (match.tacticalCommand && performance.now() > match.tacticalCommand.expiresAt) match.tacticalCommand = null;
  const aliveEnemies = targets.filter((target) => target.visible);
  const defenseDefuser = match.selectedSide === "defense" && match.coreState === "planted"
    ? teamBots
        .filter((bot) => bot.visible && bot.userData.alive)
        .sort((a, b) => flatDistance(a.position, plantedCoreGroundPosition()) - flatDistance(b.position, plantedCoreGroundPosition()))[0]
    : null;
  for (const bot of teamBots) {
    const defendingPlanted = match.selectedSide === "defense" && match.coreState === "planted";
    if (!bot.visible || !bot.userData.alive || (aliveEnemies.length === 0 && !defendingPlanted)) continue;
    bot.userData.aiTimer -= dt;
    const target = aliveEnemies.length ? aliveEnemies.reduce((best, item) =>
      item.position.distanceTo(bot.position) < best.position.distanceTo(bot.position) ? item : best
    , aliveEnemies[0]) : null;
    const toEnemy = target ? target.position.clone().sub(bot.position) : new THREE.Vector3(0, 0, -1);
    const dist = target ? toEnemy.length() : Infinity;
    const seesEnemy = !!target && dist < 34 && hasLineOfSight(bot.position.clone().setY(1.35), target.position.clone().setY(1.35));
    const clutch = isClutchState();
    const botMoveSpeed = clutch ? 1.55 : 2.2;
    const botLowHealth = bot.userData.health <= 35;
    const allyMayTakeSpike = performance.now() - match.combatStartedAt > 6000;
    const canRunObjective =
      !seesEnemy &&
      match.selectedSide === "attack" &&
      match.coreState === "idle" &&
      allyMayTakeSpike &&
      !player.hasSpike &&
      bot === teamBots[0];
    const guarding = performance.now() < (bot.userData.guardUntil || 0);
    const sharedThreat = teamThreatPointForBot(bot);

    if (guarding && bot.userData.commandHold && flatDistance(bot.position, bot.userData.commandHold) > 1.6) {
      bot.userData.combatState = "守位";
      tryMoveActor(bot, addSquadSpacing(bot, teamBots, bot.userData.commandHold.clone().sub(bot.position)), 1.45, dt);
    } else if (guarding && !seesEnemy) {
      bot.userData.combatState = "守位";
      bot.userData.heading = Math.atan2(toEnemy.x, toEnemy.z);
    } else if (botLowHealth && seesEnemy) {
      bot.userData.combatState = "后撤";
      const safePoint = retreatPointFor(bot);
      tryMoveActor(bot, addSquadSpacing(bot, teamBots, safePoint.clone().sub(bot.position)), 2.15, dt);
    } else if (defendingPlanted && bot === defenseDefuser && !seesEnemy) {
      const defusePoint = plantedCoreGroundPosition();
      const defuseDist = flatDistance(bot.position, defusePoint);
      bot.userData.combatState = defuseDist <= rules.siteRadius ? "拆包" : "回防";
      bot.userData.commandHold = defusePoint.clone();
      if (defuseDist <= rules.siteRadius) {
        bot.userData.heading = Math.atan2(defusePoint.x - bot.position.x, defusePoint.z - bot.position.z);
        match.defuseProgress += dt;
        if (match.defuseProgress >= rules.defuseSeconds) completeDefuse(bot.userData.label);
      } else {
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, defusePoint.clone().sub(bot.position)), 2.35, dt);
      }
    } else if (sharedThreat && !seesEnemy) {
      const tradeHold = nearestTacticalHoldPoint(bot, sharedThreat, teamBots) || safeNavPoint(sharedThreat.clone().add(bot.position.clone().sub(sharedThreat).setLength(8)));
      const toSharedThreat = sharedThreat.clone().sub(bot.position);
      bot.userData.combatState = "补枪";
      bot.userData.commandHold = tradeHold.clone();
      bot.userData.heading = Math.atan2(toSharedThreat.x, toSharedThreat.z);
      if (flatDistance(bot.position, tradeHold) > 2) {
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, tradeHold.clone().sub(bot.position)), 2.3, dt);
      }
    } else if (canRunObjective && spawnSpikeMesh?.visible) {
      bot.userData.combatState = "带包";
      const toSpike = spawnSpikeMesh.position.clone().sub(bot.position);
      if (flatDistance(bot.position, spawnSpikeMesh.position) <= 5.2) {
        bot.userData.hasSpike = true;
        spawnSpikeMesh.visible = false;
        addFeed(`${bot.userData.label} 已拾取爆能器`);
      } else {
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, toSpike), 2.4, dt);
      }
    } else if (canRunObjective && bot.userData.hasSpike) {
      bot.userData.combatState = "带包";
      const site = flatDistance(bot.position, sites[0].position) < flatDistance(bot.position, sites[1].position) ? sites[0] : sites[1];
      const toSite = site.position.clone().sub(bot.position);
      if (flatDistance(bot.position, site.position) <= rules.siteRadius) {
        match.activeSite = site;
        match.allyPlantProgress += dt;
        if (match.allyPlantProgress >= rules.plantSeconds) plantSpikeAt(site, bot.userData.label, bot.position);
      } else {
        match.allyPlantProgress = Math.max(0, match.allyPlantProgress - dt * 0.5);
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, toSite), 2.2, dt);
      }
    } else if (seesEnemy) {
      const preferred = aiPreferredRange(bot);
      if (dist < preferred.min) {
        bot.userData.combatState = "拉开";
        const away = bot.position.clone().sub(target.position);
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, away), 1.85, dt);
      } else if (dist > preferred.max) {
        bot.userData.combatState = "压近";
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, toEnemy), 2.05, dt);
      } else {
        const holdPoint = nearestTacticalHoldPoint(bot, target.position, teamBots);
        if (holdPoint && flatDistance(bot.position, holdPoint) > 2.1) {
          bot.userData.holdPoint = holdPoint;
          bot.userData.combatState = "找掩体";
          tryMoveActor(bot, addSquadSpacing(bot, teamBots, holdPoint.clone().sub(bot.position)), dist > 18 ? 2.15 : 1.35, dt);
        } else {
          bot.userData.holdPoint = holdPoint || bot.userData.holdPoint;
          bot.userData.combatState = "架枪";
          bot.userData.heading = Math.atan2(toEnemy.x, toEnemy.z);
        }
      }
    } else if (!seesEnemy) {
      bot.userData.holdPoint = null;
      const botIndex = teamBots.indexOf(bot);
      const commandPoint = commandPointForBot(bot, botIndex);
      const objectivePoint = objectivePointForBot(bot, botIndex);
      const objectiveState = match.coreState === "planted" ? (match.selectedSide === "attack" ? "守包" : "回防") : "护包";
      if (commandPoint && flatDistance(bot.position, commandPoint) > 2.2) {
        bot.userData.combatState = "守标";
        bot.userData.commandHold = commandPoint.clone();
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, commandPoint.clone().sub(bot.position)), 2.35, dt);
      } else if (commandPoint) {
        bot.userData.combatState = "守标";
        bot.userData.commandHold = commandPoint.clone();
      } else if (objectivePoint && flatDistance(bot.position, objectivePoint) > 2.1) {
        bot.userData.combatState = objectiveState;
        bot.userData.commandHold = objectivePoint.clone();
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, objectivePoint.clone().sub(bot.position)), objectiveState === "护包" ? 2.25 : 2.05, dt);
      } else if (objectivePoint) {
        bot.userData.combatState = objectiveState;
        bot.userData.commandHold = objectivePoint.clone();
      } else {
        const smokeCover = abilityZones.find((zone) => zone.type === "smoke" && flatDistance(bot.position, zone.position) < 26);
        if (smokeCover && flatDistance(bot.position, smokeCover.position) > 4.2 && !bot.userData.hasSpike) {
          bot.userData.combatState = "借烟";
          tryMoveActor(bot, addSquadSpacing(bot, teamBots, safeNavPoint(smokeCover.position.clone()).sub(bot.position)), 2.25, dt);
        } else if (bot.userData.route?.length) {
          bot.userData.combatState = "推进";
          const waypoint = bot.userData.route[bot.userData.routeIndex % bot.userData.route.length];
          const toWaypoint = waypoint.clone().sub(bot.position);
          if (flatDistance(bot.position, waypoint) < 2.4) bot.userData.routeIndex += 1;
          else tryMoveActor(bot, addSquadSpacing(bot, teamBots, toWaypoint), botMoveSpeed, dt);
        }
      }
    }
    if (bot.userData.aiTimer <= 0 && dist < 30 && seesEnemy && !botLowHealth) {
      bot.userData.aiTimer = (clutch ? 1.55 : 1.1) + Math.random() * 0.8;
      target.userData.health -= 18;
      if (target.userData.health <= 0) applyTargetDamage(target, 999, false, `${bot.userData.label} 击倒`);
    }
    updateActorStuckState(bot, dt);
  }

  for (const target of targets) {
    if (!target.visible) continue;
    target.userData.aiTimer -= dt;
    const visibleAllies = teamBots
      .filter((bot) => bot.visible && bot.userData.alive)
      .map((bot) => ({
        kind: "ally",
        actor: bot,
        position: bot.position,
        distance: flatDistance(target.position, bot.position),
      }))
      .filter((item) => item.distance < 34 && hasLineOfSight(target.position.clone().setY(1.45), item.position.clone().setY(1.35)));
    const canSeePlayer = canDetectPlayer(target);
    const visiblePlayer = canSeePlayer ? [{
      kind: "player",
      actor: player,
      position: player.position,
      distance: flatDistance(target.position, player.position),
    }] : [];
    const visibleThreats = [...visiblePlayer, ...visibleAllies].sort((a, b) => threatPriorityScore(a) - threatPriorityScore(b));
    const threat = visibleThreats[0] || null;
    const toThreat = threat ? threat.position.clone().sub(target.position) : player.position.clone().sub(target.position);
    const distance = threat ? threat.distance : flatDistance(target.position, player.position);
    const canSee = !!threat;
    const heardPlayer = !canSee && canHearPlayerNoise(target);
    const clutch = isClutchState();
    const targetLowHealth = target.userData.health <= 35;
    const nowMs = performance.now();
    const suppressed = nowMs < (target.userData.suppressedUntil || 0);
    const smokeImpaired = nowMs < (target.userData.smokedUntil || 0);
    const smokeZone = abilityZones.find((zone) => zone.type === "smoke" && flatDistance(target.position, zone.position) < zone.radius);
    const burnZone = abilityZones.find((zone) => zone.type === "flare" && flatDistance(target.position, zone.position) < zone.radius);

    if (burnZone) {
      target.userData.combatState = "灼烧";
      target.userData.holdPoint = null;
      target.userData.suppressedUntil = Math.max(target.userData.suppressedUntil || 0, nowMs + 900);
      if (nowMs > (target.userData.burnTickAt || 0)) {
        target.userData.burnTickAt = nowMs + 520;
        applyTargetDamage(target, 7, false, "焰手燃烧区");
      }
      const away = target.position.clone().sub(burnZone.position);
      tryMoveActor(target, addSquadSpacing(target, targets, away), 2.2, dt);
    } else if (suppressed) {
      target.userData.combatState = "压制";
      target.userData.holdPoint = null;
      const safePoint = retreatPointFor(target);
      tryMoveActor(target, addSquadSpacing(target, targets, safePoint.clone().sub(target.position)), 1.2, dt);
    } else if (smokeImpaired || smokeZone) {
      target.userData.combatState = "迟疑";
      target.userData.holdPoint = null;
      target.userData.aiTimer = Math.max(target.userData.aiTimer, 0.9);
      if (smokeZone) {
        const away = target.position.clone().sub(smokeZone.position);
        tryMoveActor(target, addSquadSpacing(target, targets, away), 1.25, dt);
      } else if (!canSee && target.userData.route?.length) {
        const safePoint = retreatPointFor(target);
        tryMoveActor(target, addSquadSpacing(target, targets, safePoint.clone().sub(target.position)), 0.9, dt);
      }
    } else if (targetLowHealth && canSee) {
      target.userData.combatState = "后撤";
      const safePoint = retreatPointFor(target);
      tryMoveActor(target, addSquadSpacing(target, targets, safePoint.clone().sub(target.position)), 1.85, dt);
    } else if (canSee) {
      const preferred = aiPreferredRange(target);
      if (distance < preferred.min) {
        target.userData.combatState = "拉开";
        const away = target.position.clone().sub(threat.position);
        tryMoveActor(target, addSquadSpacing(target, targets, away), 1.65, dt);
      } else if (distance > preferred.max) {
        target.userData.combatState = "压近";
        tryMoveActor(target, addSquadSpacing(target, targets, toThreat), 1.85, dt);
      } else {
        const holdPoint = nearestTacticalHoldPoint(target, threat.position, targets);
        if (holdPoint && flatDistance(target.position, holdPoint) > 2.1) {
          target.userData.holdPoint = holdPoint;
          target.userData.combatState = "找掩体";
          tryMoveActor(target, addSquadSpacing(target, targets, holdPoint.clone().sub(target.position)), distance > 15 ? 1.65 : 1.1, dt);
        } else {
          target.userData.holdPoint = holdPoint || target.userData.holdPoint;
          target.userData.combatState = "架枪";
          target.userData.heading = Math.atan2(toThreat.x, toThreat.z);
        }
      }
    } else if (heardPlayer) {
      target.userData.holdPoint = null;
      const noisePosition = activeNoisePosition();
      const chasingDecoy = performance.now() < (player.decoyUntil || 0);
      target.userData.combatState = chasingDecoy ? "诱导" : "搜声";
      const toNoise = noisePosition.clone().sub(target.position);
      if (flatDistance(target.position, noisePosition) > 3.2) {
        tryMoveActor(target, addSquadSpacing(target, targets, toNoise), chasingDecoy ? 2.35 : 2.05, dt);
      }
    } else if (!canSee && target.userData.route?.length) {
      target.userData.holdPoint = null;
      target.userData.combatState = target.userData.hasSpike ? "带包" : "推进";
      const waypoint = target.userData.route[target.userData.routeIndex % target.userData.route.length];
      const toWaypoint = waypoint.clone().sub(target.position);
      if (flatDistance(target.position, waypoint) < 2.6) target.userData.routeIndex += 1;
      else tryMoveActor(target, addSquadSpacing(target, targets, toWaypoint), 1.9, dt);
    }

    if (canSee && target.userData.aiTimer <= 0 && !targetLowHealth && !suppressed && !smokeImpaired) {
      target.userData.aiTimer = (clutch ? 1.15 : 0.75) + Math.random() * 0.65;
      const start = target.position.clone().setY(1.45);
      const end = threat.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.9, threat.kind === "player" ? -0.2 : 1.25, (Math.random() - 0.5) * 0.9));
      const mat = new THREE.LineBasicMaterial({ color: 0xff5f73, transparent: true, opacity: 0.75 });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), mat);
      scene.add(line);
      aiShots.push({ line, material: mat, ttl: 0.12, life: 0.12 });
      if (distance < 26 && Math.random() < 0.5) {
        if (threat.kind === "player") damagePlayer(3 + Math.round(Math.random() * 5), target.userData.label, target.position);
        else damageTeamBot(threat.actor, 10 + Math.round(Math.random() * 8), target.userData.label, target.position);
      }
    }
    updateActorStuckState(target, dt);
  }

  if (match.selectedSide === "defense" && match.coreState === "idle") {
    const planter = targets.find((target) => target.visible && target.userData.hasSpike && sites.some((site) => flatDistance(target.position, site.position) <= rules.siteRadius));
    if (planter) {
      planter.userData.combatState = "部署";
      const near = sites.reduce((best, site) => flatDistance(planter.position, site.position) < flatDistance(planter.position, best.position) ? site : best, sites[0]);
      match.activeSite = near;
      match.aiPlantProgress += dt;
      if (match.aiPlantProgress >= rules.plantSeconds) {
        plantSpikeAt(match.activeSite, "敌方", planter.position);
      }
    } else {
      match.aiPlantProgress = Math.max(0, match.aiPlantProgress - dt * 1.2);
    }
  }
  updateTeamPanel();
}

function updateSiteDeployMarkers(dt) {
  const canPlant = match.phase === "playing" && match.selectedSide === "attack" && match.coreState === "idle" && player.hasSpike;
  for (const site of sites) {
    if (!site.marker) continue;
    const near = flatDistance(player.position, site.position) <= rules.siteRadius;
    const targetOpacity = canPlant ? (near ? 0.95 : 0.72) : 0.34;
    site.marker.material.opacity = THREE.MathUtils.damp(site.marker.material.opacity, targetOpacity, 8, dt);
    site.marker.scale.setScalar(canPlant && near ? 1.08 + Math.sin(performance.now() / 140) * 0.035 : 1);
    if (site.disc) {
      site.disc.material.opacity = THREE.MathUtils.damp(site.disc.material.opacity, canPlant ? (near ? 0.62 : 0.46) : 0.32, 8, dt);
      site.disc.scale.setScalar(canPlant && near ? 1.04 + Math.sin(performance.now() / 180) * 0.025 : 1);
    }
  }
}

function updateObjectiveChannelEffect(dt) {
  if (!objectiveChannelMesh) return;
  const plantRatio = Math.max(match.plantProgress, match.allyPlantProgress, match.aiPlantProgress) / rules.plantSeconds;
  const defuseRatio = match.defuseProgress / rules.defuseSeconds;
  const progress = THREE.MathUtils.clamp(Math.max(plantRatio, defuseRatio), 0, 1);
  objectiveChannelMesh.visible = match.phase === "playing" && progress > 0.01;
  if (!objectiveChannelMesh.visible) return;
  const allyPlanter = teamBots.find((bot) => bot.visible && bot.userData.alive && bot.userData.hasSpike);
  const enemyPlanter = targets.find((target) => target.visible && target.userData.hasSpike);
  const channelSource = match.coreState === "planted"
    ? plantedCoreGroundPosition()
    : player.planting
      ? player.position
      : allyPlanter
        ? allyPlanter.position
        : enemyPlanter
          ? enemyPlanter.position
          : match.activeSite?.position || sites[0].position;
  objectiveChannelMesh.position.set(channelSource.x, 0.02, channelSource.z);
  objectiveChannelMesh.rotation.y += dt * (2.2 + progress * 3.5);
  objectiveChannelMesh.scale.setScalar(0.85 + progress * 0.9 + Math.sin(performance.now() / 120) * 0.04);
  objectiveChannelMaterials[0].opacity = 0.3 + progress * 0.55;
  objectiveChannelMaterials[1].opacity = 0.12 + progress * 0.28;
  objectiveChannelMaterials[2].opacity = 0.25 + Math.sin(performance.now() / 90) * 0.18 + progress * 0.3;
}

function updateEffects(dt) {
  updateSiteDeployMarkers(dt);
  updateObjectiveChannelEffect(dt);
  for (let i = abilityZones.length - 1; i >= 0; i--) {
    abilityZones[i].ttl -= dt;
    if (abilityZones[i].ttl <= 0) abilityZones.splice(i, 1);
  }
  for (let i = tracers.length - 1; i >= 0; i--) {
    const item = tracers[i];
    item.ttl -= dt;
    item.material.opacity = Math.max(0, item.ttl / item.life);
    if (item.ttl <= 0) {
      scene.remove(item.line);
      item.line.geometry.dispose();
      item.material.dispose();
      tracers.splice(i, 1);
    }
  }

  for (let i = aiShots.length - 1; i >= 0; i--) {
    const item = aiShots[i];
    item.ttl -= dt;
    item.material.opacity = Math.max(0, item.ttl / item.life);
    if (item.ttl <= 0) {
      scene.remove(item.line);
      item.line.geometry.dispose();
      item.material.dispose();
      aiShots.splice(i, 1);
    }
  }

  for (let i = bursts.length - 1; i >= 0; i--) {
    const item = bursts[i];
    item.ttl -= dt;
    const k = Math.max(0, item.ttl / item.life);
    item.mesh.scale.setScalar(1 + (1 - k) * 2.4);
    item.material.opacity = k;
    if (item.ttl <= 0) {
      scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.material.dispose();
      bursts.splice(i, 1);
    }
  }

  for (let i = bulletHoles.length - 1; i >= 0; i--) {
    const item = bulletHoles[i];
    item.ttl -= dt;
    item.material.opacity = Math.max(0, item.ttl / item.life) * 0.86;
    if (item.ttl <= 0) {
      scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.material.dispose();
      bulletHoles.splice(i, 1);
    }
  }

  for (let i = deathOrbs.length - 1; i >= 0; i--) {
    const item = deathOrbs[i];
    item.ttl -= dt;
    item.mesh.position.y = 0.28 + Math.sin(performance.now() / 180) * 0.06;
    item.material.opacity = Math.max(0, item.ttl / item.life);
    if (item.ttl <= 0) {
      scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.material.dispose();
      deathOrbs.splice(i, 1);
    }
  }

  for (let i = abilityEffects.length - 1; i >= 0; i--) {
    const item = abilityEffects[i];
    item.ttl -= dt;
    const k = Math.max(0, item.ttl / item.life);
    item.mesh.scale.setScalar(1 + (1 - k) * 0.35);
    if (item.material) item.material.opacity = Math.min(item.material.opacity, k * 0.82);
    if (item.ttl <= 0) {
      if (item.blocksSight) {
        const index = obstacleMeshes.indexOf(item.mesh);
        if (index >= 0) obstacleMeshes.splice(index, 1);
      }
      scene.remove(item.mesh);
      item.mesh.geometry.dispose();
      item.mesh.material.dispose();
      abilityEffects.splice(i, 1);
    }
  }

  for (const pickup of weaponPickups) {
    if (!pickup.visible) continue;
    pickup.rotation.y += dt * 1.3;
    pickup.position.y = 0.45 + Math.sin(performance.now() / 280 + pickup.position.x) * 0.04;
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  updateMovement(dt);
  updateBuyPhase(dt);
  updateObjective(dt);
  aiTimer += dt;
  if (aiTimer >= performanceMode.aiEvery) {
    updateAI(aiTimer);
    aiTimer = 0;
  }
  updateEffects(dt);
  updateAbilityAimPreview();
  updateArmorRegen(dt);
  for (const slot of Object.keys(player.abilityCooldowns)) player.abilityCooldowns[slot] = Math.max(0, player.abilityCooldowns[slot] - dt);
  player.abilityCooldown = player.abilityCooldowns.q;
  if (player.firing && !player.pendingAbilitySlot) shoot();
  player.switchTimer = Math.max(0, player.switchTimer - dt);
  if (!player.firing) player.shotChain = 0;
  player.recoil = THREE.MathUtils.damp(player.recoil, 0, weaponHandling(player.weaponKey).recovery, dt);
  updateCamera(dt);
  hudTimer += dt;
  minimapTimer += dt;
  serverPingTimer += dt;
  if (hudTimer >= performanceMode.hudEvery) {
    updateHud();
    updateAliveAlert();
    hudTimer = 0;
  }
  if (minimapTimer >= performanceMode.minimapEvery) {
    drawMinimap();
    minimapTimer = 0;
  }
  if (serverPingTimer >= 3) {
    serverPingTimer = 0;
    pingServer();
  }

  if (weaponView) {
    weaponView.visible = match.phase !== "menu" && match.phase !== "matchEnd" && !(player.scoped && !currentWeapon().melee);
    const switchRatio = player.switchTimer / player.switchDuration;
    const switchDrop = switchRatio > 0 ? Math.sin(switchRatio * Math.PI) * 0.52 : 0;
    const scopedWeaponRaise = player.scoped && !currentWeapon().melee ? 0.22 : 0;
    weaponView.position.x = THREE.MathUtils.damp(weaponView.position.x, player.scoped && !currentWeapon().melee ? -0.14 : 0, 12, dt);
    weaponView.position.y = scopedWeaponRaise + Math.sin(performance.now() / 160) * 0.006 - player.recoil * 0.18 - switchDrop;
    weaponView.rotation.z = Math.sin(performance.now() / 400) * 0.008 - player.lean * 0.06;
  }

  if (match.coreState === "planted") coreMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.pow(0.001, dt));
  coreMesh.rotation.y += dt * 1.8;
  if (match.coreState === "planted") coreMesh.position.y = 0.9 + Math.sin(performance.now() / 250) * 0.06;
  if (spawnSpikeMesh?.visible) {
    spawnSpikeMesh.rotation.y += dt * 0.9;
    spawnSpikeMesh.position.y = 0.14 + Math.sin(performance.now() / 320) * 0.035;
    const halo = spawnSpikeMesh.getObjectByName("spikeHalo");
    const beacon = spawnSpikeMesh.getObjectByName("spikeBeacon");
    if (halo?.material) halo.material.opacity = 0.62 + Math.sin(performance.now() / 180) * 0.18;
    if (beacon?.material) beacon.material.opacity = 0.18 + Math.sin(performance.now() / 220) * 0.08;
  }
  for (const target of targets) {
    target.rotation.y = target.userData.heading ?? player.yaw + Math.PI;
  }
  for (const bot of teamBots) {
    bot.rotation.y = bot.userData.heading ?? player.yaw + Math.PI;
  }
  for (const marker of pingMeshes) marker.children.forEach((child, index) => {
    if (index === 1) child.position.y = 1.2 + Math.sin(performance.now() / 180) * 0.18;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode.maxPixelRatio) * performanceMode.renderScale);
  renderer.setSize(window.innerWidth, window.innerHeight);
}

addLights();
addArena();
addPickups();
spawnTargets();
makeWeaponView();
setSelectedSide("attack");
updateCamera();
updateHud();
animate();

attackButton.addEventListener("click", () => setSelectedSide("attack"));
defenseButton.addEventListener("click", () => setSelectedSide("defense"));
heroButtons.forEach((button) => button.addEventListener("click", () => setSelectedHero(button.dataset.hero)));
startButton.addEventListener("click", startGame);
resumeButton.addEventListener("click", closeSettings);
homeButton.addEventListener("click", returnHome);
loadSettings();
volumeSlider.addEventListener("input", () => {
  masterVolume = Number(volumeSlider.value) / 100;
  saveSettings();
});
sfxToggle.addEventListener("change", () => {
  sfxEnabled = sfxToggle.checked;
  saveSettings();
});
sensitivitySlider.addEventListener("input", () => {
  mouseSensitivity = Number(sensitivitySlider.value) / 10000;
  saveSettings();
});
qualitySelect.addEventListener("change", () => {
  applyPerformanceProfile(qualitySelect.value);
  saveSettings();
});
keymapSelect.addEventListener("change", () => {
  applyKeymapProfile(keymapSelect.value);
  saveSettings();
});
buyList.addEventListener("click", (event) => {
  const button = event.target.closest(".buy-item");
  if (button?.dataset.weapon) buyWeapon(button.dataset.weapon);
  if (button?.dataset.armor) buyArmor(button.dataset.armor);
});
minimapCanvas.addEventListener("click", (event) => {
  const rect = minimapCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left - 14) / (rect.width - 28)) * (mapBounds * 2) - mapBounds;
  const z = ((event.clientY - rect.top - 14) / (rect.height - 28)) * (mapBounds * 2) - mapBounds;
  addWorldPing(THREE.MathUtils.clamp(x, -mapBounds, mapBounds), THREE.MathUtils.clamp(z, -mapBounds, mapBounds));
  addFeed(match.phase === "playing" ? "已下达队友标记" : "已在小地图标记");
});
window.addEventListener("resize", resize);
window.addEventListener("mousedown", (event) => {
  initAudio();
  if (player.settingsOpen || match.phase === "buy" || player.minimapLarge) return;
  if (match.phase === "playing" && document.pointerLockElement !== canvas) {
    try {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest && typeof lockRequest.catch === "function") lockRequest.catch(() => {});
    } catch (_) {}
    return;
  }
  if (player.pendingAbilitySlot) {
    if (event.button === 0) {
      confirmAbilityAim();
      return;
    }
    if (event.button === 2) {
      cancelAbilityAim();
      return;
    }
  }
  if (event.button === 2) {
    if (!currentWeapon().melee) {
      player.scoped = true;
      sfx.scope(true);
    }
    return;
  }
  if (event.button === 0) {
    player.firing = true;
    shoot();
  }
});
window.addEventListener("mouseup", (event) => {
  if (event.button === 0) player.firing = false;
  if (event.button === 2 && player.scoped) {
    player.scoped = false;
    sfx.scope(false);
  }
});
window.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("wheel", (event) => {
  const order = Object.keys(weapons).filter((key) => player.inventory.has(key));
  const index = order.indexOf(player.weaponKey);
  const next = order[(index + (event.deltaY > 0 ? 1 : order.length - 1)) % order.length];
  setWeapon(next);
});
window.addEventListener("keydown", (event) => {
  initAudio();
  if (event.code === "Escape") {
    event.preventDefault();
    if (event.repeat) return;
    if (match.phase === "menu" || match.phase === "matchEnd") return;
    if (player.pendingAbilitySlot) {
      cancelAbilityAim();
      return;
    }
    if (player.settingsOpen) {
      if (performance.now() - settingsOpenedAt < 220) return;
      closeSettings();
    } else {
      openSettings();
    }
    return;
  }
  if (player.settingsOpen) return;
  if (keyMatches("map", event.code) || keyMatches("quickPing", event.code)) event.preventDefault();
  keys.add(event.code);
  if (keyMatches("interact", event.code)) pickupNearestWeapon();
  if (keyMatches("dropWeapon", event.code)) dropCurrentWeapon();
  if (!event.repeat && keyMatches("leanLeft", event.code)) toggleLean(-1);
  if (!event.repeat && keyMatches("leanRight", event.code)) toggleLean(1);
  if (!event.repeat && keyMatches("quickPing", event.code)) addCrosshairPing();
  if (keyMatches("dropSpike", event.code)) dropSpike();
  if (keyMatches("reload", event.code)) reload();
  if (keyMatches("abilityQ", event.code)) startAbilityAim("q");
  if (keyMatches("abilityF", event.code)) startAbilityAim("f");
  if (keyMatches("abilityH", event.code)) startAbilityAim("h");
  if (keyMatches("buy", event.code)) toggleBuyPanel();
  if (keyMatches("map", event.code)) {
    setMinimapLarge(!player.minimapLarge);
  }
  if (!event.repeat && keyMatches("prone", event.code)) toggleProne();
  if (event.code === "Digit1") setWeaponBySlot(1);
  if (event.code === "Digit2") setWeaponBySlot(2);
  if (event.code === "Digit3") setWeaponBySlot(3);
  if (event.code === "Digit4") setWeaponBySlot(4);
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === canvas && match.phase === "playing") {
    player.started = true;
    startPanel.classList.add("hidden");
  } else if (match.phase === "playing" && !player.settingsOpen && performance.now() > suppressSettingsUntil) {
    openSettings();
  }
});
window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== canvas) return;
  player.yaw -= event.movementX * mouseSensitivity;
  player.pitch -= event.movementY * mouseSensitivity;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.25, 1.25);
});
