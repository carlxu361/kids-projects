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
const lockPrompt = document.querySelector("#lock-prompt");
const aliveAlert = document.querySelector("#alive-alert");
const serverBadge = document.querySelector("#server-badge");
const teamPanel = document.querySelector("#team-panel");
const allyRow = document.querySelector("#ally-row");
const enemyRow = document.querySelector("#enemy-row");
const minimapPanel = document.querySelector("#minimap-panel");
const minimapCanvas = document.querySelector("#minimap");
const minimapCtx = minimapCanvas.getContext("2d");
const weaponSlots = document.querySelector("#weapon-slots");
const weaponName = document.querySelector("#weapon-name");
const creditsLabel = document.querySelector("#credits-label");
const buyPanel = document.querySelector("#buy-panel");
const buyList = document.querySelector("#buy-list");
const buyTimer = document.querySelector("#buy-timer");
const scoreLabel = document.querySelector("#score-label");
const objectiveLabel = document.querySelector("#objective-label");
const objectiveStatus = document.querySelector("#objective-status");
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

const performanceMode = {
  renderScale: 0.62,
  maxPixelRatio: 1,
  hudEvery: 0.12,
  minimapEvery: 0.18,
  aiEvery: 0.16,
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
const pings = [];
const pingMeshes = [];
const teamBots = [];
const buyBarriers = [];
const collisionBoxes = [];
const input = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const shotDirection = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const oldPosition = new THREE.Vector3();
const mapBounds = 120;
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
    new THREE.Vector3(-28, 0, 76),
    new THREE.Vector3(-34, 0, 32),
    new THREE.Vector3(-35, 0, 6),
    new THREE.Vector3(-50, 0, -8),
    sites[0].position,
  ],
  attackB: [
    new THREE.Vector3(28, 0, 76),
    new THREE.Vector3(34, 0, 32),
    new THREE.Vector3(35, 0, 6),
    new THREE.Vector3(50, 0, -8),
    sites[1].position,
  ],
  attackMid: [
    new THREE.Vector3(0, 0, 76),
    new THREE.Vector3(-28, 0, 46),
    new THREE.Vector3(-30, 0, 8),
    new THREE.Vector3(0, 0, -36),
  ],
  attackFlank: [
    new THREE.Vector3(72, 0, 68),
    new THREE.Vector3(90, 0, 24),
    new THREE.Vector3(84, 0, -20),
    sites[1].position,
  ],
  defendA: [
    new THREE.Vector3(-34, 0, -82),
    new THREE.Vector3(-36, 0, -54),
    new THREE.Vector3(-48, 0, -34),
    new THREE.Vector3(-58, 0, -20),
  ],
  defendB: [
    new THREE.Vector3(34, 0, -82),
    new THREE.Vector3(36, 0, -54),
    new THREE.Vector3(48, 0, -34),
    new THREE.Vector3(58, 0, -22),
  ],
  defendMid: [
    new THREE.Vector3(0, 0, -92),
    new THREE.Vector3(22, 0, -62),
    new THREE.Vector3(24, 0, -36),
    new THREE.Vector3(0, 0, -10),
  ],
  defendRotate: [
    new THREE.Vector3(-72, 0, -62),
    new THREE.Vector3(-86, 0, -18),
    new THREE.Vector3(-72, 0, 16),
    new THREE.Vector3(-36, 0, 8),
  ],
};

const hudState = {
  round: "",
  timer: "",
  side: "",
  scoreline: "",
  health: "",
  ammo: "",
  weapon: "",
  score: "",
  objective: "",
  status: "",
  progress: "",
  slots: "",
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

const player = {
  position: new THREE.Vector3(0, eyeHeight, 18),
  velocity: new THREE.Vector3(),
  verticalVelocity: 0,
  grounded: true,
  yaw: 0,
  pitch: 0,
  health: 100,
  score: 0,
  credits: 800,
  heroKey: "warden",
  weaponKey: "pistol",
  inventory: new Set(["melee", "pistol"]),
  scoped: false,
  minimapLarge: false,
  firing: false,
  planting: false,
  hasSpike: false,
  settingsOpen: false,
  alive: true,
  abilityCooldown: 0,
  switchTimer: 0,
  switchDuration: 0.34,
  isReloading: false,
  nextShotAt: 0,
  recoil: 0,
  started: false,
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
  siteRadius: 6.2,
  inventoryRifles: 2,
  inventoryPistols: 1,
};

let coreMesh;
let carriedSpikeMesh;
let spawnSpikeMesh;
let weaponView;
let audioContext;
let hudTimer = 0;
let minimapTimer = 0;
let aiTimer = 0;
let masterVolume = 0.7;
let sfxEnabled = true;
let mouseSensitivity = 0.0022;
let menuOrbitAngle = 0;
let serverStatus = "本地预览";
let serverPingTimer = 0;
let suppressSettingsUntil = 0;

const heroes = {
  warden: { name: "守护者", color: 0x7de3c3, healthBonus: 0, speedBonus: 0, note: "Q 自疗到最多100" },
  flare: { name: "焰手", color: 0xff8a5b, healthBonus: 0, speedBonus: 0.15, note: "Q 近距爆发" },
  brim: { name: "战术官", color: 0xf3c15f, healthBonus: 0, speedBonus: 0, note: "Q 侦测提示" },
  gust: { name: "疾风", color: 0xa6e7ff, healthBonus: 0, speedBonus: 0.45, note: "Q 冲刺" },
};

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

function addBox(x, y, z, w, h, d, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  obstacleMeshes.push(mesh);
  if (h > 0.4) {
    collisionBoxes.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
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

function flatDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function routeClone(points) {
  return points.map((point) => point.clone());
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
  const nextX = oldX + direction.x * speed * dt;
  const nextZ = oldZ + direction.z * speed * dt;
  let moved = false;
  if (!collidesAt(nextX, oldZ, radius)) {
    actor.position.x = nextX;
    moved = true;
  }
  if (!collidesAt(actor.position.x, nextZ, radius)) {
    actor.position.z = nextZ;
    moved = true;
  }
  if (!moved) {
    const side = new THREE.Vector3(-direction.z, 0, direction.x);
    for (const sign of [1, -1]) {
      const sidestepX = oldX + side.x * sign * speed * dt;
      const sidestepZ = oldZ + side.z * sign * speed * dt;
      if (!collidesAt(sidestepX, sidestepZ, radius)) {
        actor.position.x = sidestepX;
        actor.position.z = sidestepZ;
        actor.userData.heading = Math.atan2(side.x * sign, side.z * sign);
        moved = true;
        break;
      }
    }
  }
  actor.position.x = THREE.MathUtils.clamp(actor.position.x, -mapBounds + 4, mapBounds - 4);
  actor.position.z = THREE.MathUtils.clamp(actor.position.z, -mapBounds + 4, mapBounds - 4);
  if (moved) actor.userData.heading = Math.atan2(direction.x, direction.z);
  return moved;
}

function updateActorStuckState(actor, dt) {
  if (!actor.userData.lastPosition) actor.userData.lastPosition = actor.position.clone();
  const moved = flatDistance(actor.position, actor.userData.lastPosition);
  actor.userData.stuckTime = moved < 0.08 ? (actor.userData.stuckTime || 0) + dt : 0;
  actor.userData.lastPosition.copy(actor.position);
  if (actor.userData.stuckTime > 1.2) {
    actor.userData.stuckTime = 0;
    actor.userData.routeIndex = (actor.userData.routeIndex || 0) + 1;
    return true;
  }
  return false;
}

function canDetectPlayer(observer, distanceLimit = 42) {
  const toPlayer = player.position.clone().sub(observer.position);
  const distance = toPlayer.length();
  if (distance > distanceLimit) return false;
  if (!hasLineOfSight(observer.position.clone().setY(1.45), player.position.clone())) return false;
  const dir = toPlayer.setY(0).normalize();
  const heading = observer.userData.heading ?? 0;
  const forwardDir = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
  const inFront = forwardDir.dot(dir) > 0.2;
  const playerIsWalking = keys.has("ShiftLeft") || keys.has("ShiftRight");
  return inFront || !playerIsWalking || distance < 10;
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
    new THREE.Vector2(-118, -78),
    new THREE.Vector2(-92, -112),
    new THREE.Vector2(34, -112),
    new THREE.Vector2(118, -72),
    new THREE.Vector2(118, 74),
    new THREE.Vector2(86, 118),
    new THREE.Vector2(-58, 118),
    new THREE.Vector2(-118, 72),
  ]);
  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(floorShape),
    new THREE.MeshLambertMaterial({ color: 0x23313a, side: THREE.DoubleSide })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  scene.add(floor);

  const grid = new THREE.GridHelper(240, 80, 0x35d0a2, 0x3d5362);
  grid.position.y = 0.01;
  scene.add(grid);

  const wallMat = new THREE.MeshLambertMaterial({ color: 0x53636f });
  const coverMat = new THREE.MeshLambertMaterial({ color: 0x806f52 });
  const laneMat = new THREE.MeshLambertMaterial({ color: 0x344550 });
  const siteMat = new THREE.MeshBasicMaterial({ color: 0x35d0a2, transparent: true, opacity: 0.4 });
  const attackSpawnMat = new THREE.MeshBasicMaterial({ color: 0xff5f73, transparent: true, opacity: 0.18 });
  const defenseSpawnMat = new THREE.MeshBasicMaterial({ color: 0x4aa8ff, transparent: true, opacity: 0.18 });

  const walls = [
    [0, 2, -112, 190, 4, 1],
    [0, 2, 118, 180, 4, 1],
    [-118, 2, 0, 1, 4, 150],
    [118, 2, 0, 1, 4, 150],
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
  ];
  covers.forEach((box) => addBox(...box, coverMat));

  const lanes = [
    [-58, 0.03, 2, 16, 0.06, 106],
    [58, 0.03, 2, 16, 0.06, 106],
    [0, 0.03, 30, 116, 0.06, 16],
    [0, 0.03, -40, 92, 0.06, 14],
    [0, 0.03, 82, 52, 0.06, 14],
  ];
  lanes.forEach((box) => addBox(...box, laneMat));
  addBox(0, 0.025, 96, 78, 0.05, 28, attackSpawnMat);
  addBox(0, 0.025, -96, 78, 0.05, 28, defenseSpawnMat);
  addBuyBarrier(0, 72, 150, 2);
  addBuyBarrier(0, -86, 150, 2);

  for (const site of sites) {
    site.disc = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.08, 32), siteMat.clone());
    site.disc.position.set(site.position.x, 0.07, site.position.z);
    scene.add(site.disc);

    const marker = new THREE.Mesh(
      new THREE.TorusGeometry(6.55, 0.08, 6, 36),
      new THREE.MeshBasicMaterial({ color: 0x35d0a2 })
    );
    marker.position.set(site.position.x, 0.14, site.position.z);
    marker.rotation.x = Math.PI / 2;
    scene.add(marker);
  }

  coreMesh = makeSpikeModel(false);
  coreMesh.position.set(sites[0].position.x, 0.9, sites[0].position.z);
  coreMesh.visible = false;
  scene.add(coreMesh);

  spawnSpikeMesh = makeSpikeModel(true);
  spawnSpikeMesh.position.set(0, 0.14, 92);
  scene.add(spawnSpikeMesh);
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
  group.add(prism, base);
  return group;
}

function createWeaponPickup(key, x, z) {
  const def = weapons[key];
  const group = new THREE.Group();
  group.position.set(x, 0.45, z);
  group.userData = { key, picked: false, dropped: false };

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(key === "sniper" ? 1.35 : 0.92, 0.12, 0.18),
    new THREE.MeshBasicMaterial({ color: def.color })
  );
  body.rotation.y = Math.PI / 2;
  group.add(body);

  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.26, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x101820 })
  );
  grip.position.set(-0.12, -0.17, 0);
  grip.rotation.z = -0.22;
  group.add(grip);

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
  if (!weapons[key] || weapons[key].melee || key === "pistol") return;
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
  const bodyMat = new THREE.MeshBasicMaterial({ color: def.color });
  const darkMat = new THREE.MeshBasicMaterial({ color: 0x121a22 });
  const metalMat = new THREE.MeshBasicMaterial({ color: 0xe3f3fa });

  if (player.weaponKey === "melee") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.92), metalMat);
    blade.position.set(0.36, -0.23, -0.62);
    blade.rotation.set(-0.42, -0.54, 0.36);
    weaponView.add(blade);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.28), darkMat);
    handle.position.set(0.2, -0.42, -0.34);
    handle.rotation.set(-0.38, -0.54, 0.22);
    weaponView.add(handle);
    weaponView.position.set(0, 0, 0);
    weaponView.scale.setScalar(1.25);
    return;
  }

  const bodyLength = player.weaponKey === "sniper" ? 1.4 : player.weaponKey === "pistol" ? 0.62 : 1.05;
  const bodyHeight = player.weaponKey === "pistol" || player.weaponKey === "sheriff" || player.weaponKey === "ghost" || player.weaponKey === "frenzy" ? 0.16 : 0.2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, bodyHeight, bodyLength), bodyMat);
  body.position.set(0.28, -0.24, -0.58);
  body.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(body);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.16), darkMat);
  grip.position.set(0.22, -0.42, -0.4);
  grip.rotation.z = -0.24;
  weaponView.add(grip);

  const barrelLength = player.weaponKey === "sniper" ? 1.18 : player.weaponKey === "shotgun" ? 0.9 : bodyLength * 0.72;
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, barrelLength), metalMat);
  barrel.position.set(0.3, -0.2, -0.88);
  barrel.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(barrel);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.12), darkMat);
  muzzle.position.set(0.31, -0.2, -1.27);
  muzzle.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(muzzle);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.16), darkMat);
  mag.position.set(0.27, -0.44, player.weaponKey === "pistol" ? -0.42 : -0.58);
  mag.rotation.set(-0.12, -0.22, -0.08);
  weaponView.add(mag);

  if (player.weaponKey !== "pistol" && player.weaponKey !== "sheriff") {
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.46), darkMat);
    stock.position.set(0.22, -0.25, -0.08);
    stock.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(stock);
  }

  if (player.weaponKey === "shotgun" || player.weaponKey === "heavy") {
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.48), darkMat);
    fore.position.set(0.28, -0.34, -0.88);
    fore.rotation.set(-0.05, -0.22, 0.02);
    weaponView.add(fore);
  }

  if (player.weaponKey === "heavy") {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 12), darkMat);
    drum.position.set(0.31, -0.46, -0.5);
    drum.rotation.z = Math.PI / 2;
    weaponView.add(drum);
  }

  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.22), darkMat);
  sight.position.set(0.28, -0.08, -0.58);
  sight.rotation.set(-0.05, -0.22, 0.02);
  weaponView.add(sight);

  if (player.weaponKey === "sniper" || player.weaponKey === "guardian") {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.48, 12), darkMat);
    scope.position.set(0.28, -0.1, -0.56);
    scope.rotation.z = Math.PI / 2;
    weaponView.add(scope);
  }

  weaponView.position.set(0, 0, 0);
  weaponView.scale.setScalar(1.25);
}

function createTarget(x, z, label) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { health: 100, label, aiTimer: Math.random() * 1.2, weaponKey: "rifle", state: "hold" };

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 1.05, 4, 8),
    new THREE.MeshLambertMaterial({ color: 0xb8c7d4 })
  );
  body.position.y = 1.05;
  body.userData = { target: group, part: "body" };
  group.add(body);
  targetMeshes.push(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0xd9b08c })
  );
  head.position.y = 1.95;
  head.userData = { target: group, part: "head" };
  group.add(head);
  targetMeshes.push(head);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.08, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x101820 })
  );
  visor.position.set(0, 1.98, -0.23);
  group.add(visor);

  const armor = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.46, 0.16),
    new THREE.MeshLambertMaterial({ color: 0x2e4f62 })
  );
  armor.position.set(0, 1.22, -0.04);
  group.add(armor);

  const shoulderMat = new THREE.MeshLambertMaterial({ color: 0xff5f73 });
  for (const sx of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.2), shoulderMat);
    shoulder.position.set(sx * 0.42, 1.43, -0.02);
    group.add(shoulder);
  }

  const rifle = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x101820 })
  );
  rifle.position.set(0.08, 1.12, -0.42);
  rifle.rotation.y = 0.15;
  group.add(rifle);

  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.72, 0.13),
      new THREE.MeshLambertMaterial({ color: 0x9fb0bd })
    );
    arm.position.set(sx * 0.48, 1.08, 0);
    arm.rotation.z = sx * 0.2;
    group.add(arm);

    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.76, 0.16),
      new THREE.MeshLambertMaterial({ color: 0x52616d })
    );
    leg.position.set(sx * 0.16, 0.38, 0);
    group.add(leg);
  }

  const mark = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.72, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5964, side: THREE.DoubleSide })
  );
  mark.position.y = 2.05;
  mark.rotation.y = Math.PI;
  group.add(mark);

  scene.add(group);
  targets.push(group);
}

function createTeamBot(x, z, label) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { label, health: 100, aiTimer: Math.random() * 1.8, alive: true };

  const mat = new THREE.MeshLambertMaterial({ color: 0x6bdcff });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.96, 4, 6), mat);
  body.position.y = 0.95;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), new THREE.MeshLambertMaterial({ color: 0xd9b08c }));
  head.position.y = 1.78;
  group.add(head);

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
  addFeed(`${heroes[heroKey].name}：${heroes[heroKey].note}`);
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
      <div class="slot-top"><span>${def.slot}</span><span>${def.label}</span></div>
      <div class="slot-gun icon-${key}" style="color:#${def.color.toString(16).padStart(6, "0")}"></div>
    `;
    weaponSlots.append(slot);
  }
  hudState.slots = signature;
}

function renderBuyList() {
  buyList.innerHTML = "";
  const phaseUnlock = match.round <= 1
    ? ["pistol", "sheriff", "smg", "shotgun"]
    : Object.keys(weapons);
  for (const [key, def] of Object.entries(weapons)) {
    if (def.melee) continue;
    if (!phaseUnlock.includes(key)) continue;
    const owned = player.inventory.has(key);
    const full = inventoryFullFor(def.type, key);
    const button = document.createElement("button");
    button.className = `buy-item ${owned ? "owned" : ""}`;
    button.type = "button";
    button.dataset.weapon = key;
    button.innerHTML = `<span>${def.label}</span><strong>${owned ? "已拥有" : `${def.cost} R点`}</strong>`;
    button.disabled = owned || full || player.credits < def.cost;
    buyList.append(button);
  }
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

function openSettings() {
  if (player.settingsOpen || (match.phase !== "playing" && match.phase !== "buy")) return;
  player.settingsOpen = true;
  player.firing = false;
  player.scoped = false;
  keys.clear();
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
  keys.clear();
  player.recoil = 0;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -0.2, 0.2);
  player.firing = false;
  player.scoped = false;
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
  player.firing = false;
  player.scoped = false;
  keys.clear();
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
  const ammo = currentAmmo();
  const def = currentWeapon();
  const ammoText = def.melee ? "近战" : player.isReloading ? "换弹中" : `${ammo.ammo} / ${ammo.reserve}`;
  const next = {
    round: `${match.round}`,
    timer: `${Math.max(0, Math.ceil(match.phase === "buy" ? match.buyTime : match.coreState === "planted" ? match.coreTimer : match.roundTime))}`,
    side: sideName(match.selectedSide),
    scoreline: `${match.attackScore} : ${match.defenseScore}`,
    health: `${player.health}`,
    ammo: ammoText,
    weapon: def.label,
    score: `${player.score}`,
    objective: interaction.label,
    status,
    progress: `${progress}%`,
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
  if (next.ammo !== hudState.ammo) ammoLabel.textContent = next.ammo;
  if (next.weapon !== hudState.weapon) {
    weaponLabel.textContent = next.weapon;
    weaponName.textContent = def.name;
  }
  creditsLabel.textContent = `R点 ${player.credits}`;
  buyTimer.textContent = match.phase === "buy" ? `${Math.ceil(match.buyTime)}` : "";
  if (next.score !== hudState.score) scoreLabel.textContent = next.score;
  if (next.objective !== hudState.objective) objectiveLabel.textContent = next.objective;
  if (next.status !== hudState.status) objectiveStatus.textContent = next.status;
  if (next.progress !== hudState.progress) progressFill.style.width = next.progress;

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
    ally.className = allyAlive ? "alive" : "dead";
    ally.textContent = i === 0 ? "你" : `友${i}·${shortRole(allyBot?.userData.role)}`;
    if (allyBot?.userData.hasSpike) ally.textContent += "·包";
    allyRow.append(ally);

    const enemy = document.createElement("span");
    enemy.className = i < match.enemyAlive ? "alive enemy" : "dead";
    enemy.textContent = `敌${i + 1}`;
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
    serverStatus = `${data.mode || "本地服务器"} · ${ping}ms · ${data.players || 10}人`;
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

  for (const site of sites) drawMiniDot(site.position.x, site.position.z, 5, site.key === "A" ? "#35d0a2" : "#4aa8ff");
  for (const pickup of weaponPickups) if (pickup.visible && !pickup.userData.picked) drawMiniDot(pickup.position.x, pickup.position.z, 2.5, "#ffd166");
  const carrier = teamBots.find((bot) => bot.visible && bot.userData.hasSpike);
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

function addWorldPing(x, z) {
  clearPings();
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 16, 10),
    new THREE.MeshBasicMaterial({ color: 0x6bdcff, transparent: true, opacity: 0.38 })
  );
  beam.position.y = 8;
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 1.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
  );
  marker.position.y = 1.2;
  marker.rotation.y = Math.PI / 4;
  group.add(beam, marker);
  scene.add(group);
  pingMeshes.push(group);
  pings.push({ x, z });
}

function objectiveText() {
  if (match.phase === "menu") return "等待开始";
  if (match.phase === "matchEnd") return "比赛结束";
  if (match.coreState === "planted") return `${match.activeSite.key} 点爆能器已安装 · ${Math.ceil(match.coreTimer)} 秒`;
  if (match.coreState === "defused") return "爆能器已拆除";
  return "爆能器未安装";
}

function plantSpikeAt(site, sourceLabel) {
  match.activeSite = site;
  match.coreState = "planted";
  match.coreTimer = rules.spikeSeconds;
  match.plantProgress = 0;
  match.aiPlantProgress = 0;
  match.allyPlantProgress = 0;
  player.planting = false;
  player.hasSpike = false;
  for (const bot of teamBots) bot.userData.hasSpike = false;
  coreMesh.visible = true;
  coreMesh.position.set(match.activeSite.position.x, 0.9, match.activeSite.position.z);
  coreMesh.scale.setScalar(0.1);
  for (const siteItem of sites) siteItem.disc.material.opacity = siteItem === match.activeSite ? 0.7 : 0.32;
  sfx.plant();
  addFeed(`${sourceLabel}在 ${match.activeSite.key} 点安装爆能器`);
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
        prompt: nearSite && player.hasSpike ? (holdingUse ? `正在部署 ${near.site.key} 点爆能器` : `按住 E 部署 ${near.site.key} 点爆能器`) : "",
      };
    }
    return { label: `目标：守住 ${match.activeSite.key} 点爆能器`, progress: 1 - match.coreTimer / rules.spikeSeconds, prompt: "" };
  }

  if (match.coreState === "planted") {
    const dist = flatDistance(player.position, match.activeSite.position);
    const canDefuse = dist <= rules.siteRadius;
    return {
      label: `目标：进入 ${match.activeSite.key} 点拆除爆能器`,
      progress: match.defuseProgress / rules.defuseSeconds,
      prompt: canDefuse ? (holdingUse ? "正在拆除爆能器" : "按住 E 拆除爆能器") : "",
    };
  }

  return { label: "目标：守住 A/B 点或消灭攻方", progress: match.aiPlantProgress / rules.plantSeconds, prompt: "" };
}

function resetTarget(target, index) {
  const attackSpawns = [
    [-44, 96],
    [-18, 104],
    [0, 108],
    [18, 104],
    [44, 96],
  ];
  const defenseSpawns = [
    [-66, -84],
    [-28, -92],
    [0, -100],
    [28, -92],
    [66, -84],
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
  target.userData.weaponKey = ["rifle", "smg", "guardian", "sheriff", "shotgun"][index % 5];
  target.userData.aiTimer = Math.random() * 1.2;
  target.userData.heading = match.selectedSide === "attack" ? 0 : Math.PI;
  target.userData.stuckTime = 0;
  target.userData.lastPosition = target.position.clone();
  target.userData.route = routeClone(plan.route);
  target.userData.routeIndex = 0;
  target.position.set(x, 0, z);
  target.visible = true;
}

function resetTargetsForRound() {
  targets.forEach((target, index) => resetTarget(target, index));
  const allySpawns = match.selectedSide === "attack"
    ? [[-28, 96], [-10, 102], [10, 102], [28, 96]]
    : [[-28, -96], [-10, -102], [10, -102], [28, -96]];
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
    bot.userData.role = plan.role;
    bot.userData.stuckTime = 0;
    bot.userData.lastPosition = bot.position.clone();
    bot.userData.route = routeClone(plan.route);
    bot.userData.routeIndex = 0;
    bot.userData.heading = match.selectedSide === "attack" ? Math.PI : 0;
  });
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

function damagePlayer(amount, source = "AI") {
  if (match.phase !== "playing") return;
  player.health = Math.max(0, player.health - amount);
  if (player.health <= 0) {
    player.alive = false;
    match.allyAlive = Math.max(0, match.allyAlive - 1);
    updateTeamPanel();
    updateAliveAlert();
    endRound(match.selectedSide === "attack" ? "defense" : "attack", `${source} 击倒了你`);
  }
}

function damageTeamBot(bot, amount, source = "敌方") {
  if (match.phase !== "playing" || !bot.visible || !bot.userData.alive) return;
  bot.userData.health = Math.max(0, bot.userData.health - amount);
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
  addFeed(`${source} 击倒 ${bot.userData.label}`, "miss");
  if (match.allyAlive === 0) endRound(match.selectedSide === "attack" ? "defense" : "attack", "己方全员被击倒");
}

function useHeroAbility() {
  if (match.phase !== "playing" || player.abilityCooldown > 0 || player.settingsOpen) return;
  player.abilityCooldown = 12;
  const hero = heroes[player.heroKey];
  if (player.heroKey === "warden") {
    player.health = Math.min(100, player.health + 35);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.045, 8, 32),
      new THREE.MeshBasicMaterial({ color: hero.color, transparent: true, opacity: 0.82 })
    );
    ring.position.copy(player.position).setY(0.1);
    ring.rotation.x = Math.PI / 2;
    addAbilityEffect(ring, 1.2);
    addFeed("守护者：自疗");
    tone(740, 0.12, "sine", 0.028);
  }
  if (player.heroKey === "flare") {
    const burst = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 8),
      new THREE.MeshBasicMaterial({ color: hero.color, transparent: true, opacity: 0.34 })
    );
    burst.position.copy(player.position).setY(1.0);
    addAbilityEffect(burst, 0.8);
    for (const target of targets) {
      if (target.visible && target.position.distanceTo(player.position) < 7) {
        applyTargetDamage(target, 45, false, "焰手爆发");
        target.userData.aiTimer += 1.2;
      }
    }
    addFeed("焰手：近距爆发");
  }
  if (player.heroKey === "brim") {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0x7f8d98, transparent: true, opacity: 0.42 })
    );
    smoke.position.copy(aimGroundPoint(24)).setY(2.2);
    addAbilityEffect(smoke, 8, true);
    addFeed("战术官：投放烟幕，阻挡视线");
  }
  if (player.heroKey === "gust") {
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
    addFeed("疾风：冲刺");
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
    addFeed(`${sourceLabel} ${target.userData.label}`, "headshot");
  } else if (target.userData.health <= 0) {
    player.score += 100;
    sfx.hit();
    addFeed(`击倒 ${target.userData.label}`);
  } else {
    player.score += 20;
    sfx.hit();
  }

  if (target.userData.health <= 0) {
    addDeathOrb(target.position);
    dropWeaponAt(target.userData.weaponKey || "rifle", target.position);
    target.visible = false;
    match.enemyAlive = livingTargets();
    updateTeamPanel();
    updateAliveAlert();
    sfx.kill();
    showKillEffect(headshot, target.userData.label);
    if (livingTargets() === 0) {
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
  if (!player.started || player.isReloading || player.planting || match.phase !== "playing") return;

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
  player.recoil += def.recoilPerShot;
  player.pitch = THREE.MathUtils.clamp(player.pitch + def.recoilPerShot * 0.45, -1.35, 1.35);
  sfx.shoot();

  const spread = player.velocity.lengthSq() > 0.05 ? def.spreadMoving : def.spreadStill;
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

  player.started = true;
  player.health = 100;
  player.alive = true;
  player.hasSpike = false;
  player.planting = false;
  player.isReloading = false;
  player.position.set(0, eyeHeight, match.selectedSide === "attack" ? 96 : -94);
  player.velocity.set(0, 0, 0);
  player.verticalVelocity = 0;
  player.grounded = true;
  player.yaw = match.selectedSide === "attack" ? 0 : Math.PI;
  player.pitch = 0;
  player.recoil = 0;
  setMinimapLarge(false);
  resetPickupsForRound();

  coreMesh.visible = match.coreState === "planted";
  coreMesh.position.set(match.activeSite.position.x, 0.9, match.activeSite.position.z);
  coreMesh.scale.setScalar(1);
  if (spawnSpikeMesh) {
    spawnSpikeMesh.visible = match.selectedSide === "attack";
    spawnSpikeMesh.position.set(0, 0.14, 92);
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

  if (winner === "attack") match.attackScore += 1;
  else match.defenseScore += 1;
  player.credits += winner === match.selectedSide ? 3000 : 1900;

  const playerWon = winner === match.selectedSide;
  roundResult.textContent = playerWon ? "获胜" : "败北";
  roundReason.textContent = reason;
  roundBanner.classList.remove("hidden");
  addFeed(`${sideName(winner)}得分：${reason}`, winner === "attack" ? "headshot" : "");
  sfx.round();
  sfx.announce();
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
      "下一步可以加入买枪经济、AI 路线和真正多人同步。";
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
        plantSpikeAt(near.site, "你");
      }
    } else {
      player.planting = false;
      match.plantProgress = Math.max(0, match.plantProgress - dt * 1.6);
    }
  }

  if (match.selectedSide === "defense" && match.coreState === "planted") {
    const dist = flatDistance(player.position, match.activeSite.position);
    if (dist <= rules.siteRadius && holdingUse) {
      match.defuseProgress += dt;
      if (match.defuseProgress >= rules.defuseSeconds) {
        match.coreState = "defused";
        coreMesh.visible = false;
        sfx.defuse();
        endRound("defense", "爆能器拆除成功");
      }
    } else {
      match.defuseProgress = Math.max(0, match.defuseProgress - dt * 1.25);
    }
  }

  if (match.coreState === "planted") {
    match.coreTimer -= dt;
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
  player.velocity.set(0, 0, 0);
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
  camera.position.copy(player.position);
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch - player.recoil;
  const targetFov = player.scoped && !currentWeapon().melee ? currentWeapon().zoomFov : 75;
  camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 14, dt);
  camera.updateProjectionMatrix();
  scopeOverlay.classList.toggle("hidden", !(player.scoped && !currentWeapon().melee));
  crosshair.classList.toggle("hidden", player.scoped && !currentWeapon().melee);
}

function updateMovement(dt) {
  if (player.settingsOpen || player.planting || match.phase === "buy") return;
  const heroSpeed = heroes[player.heroKey].speedBonus || 0;
  const knifeSpeed = currentWeapon().melee ? 1.15 : 0;
  const baseSpeed = (player.scoped ? 2.6 : 5.8) + heroSpeed + knifeSpeed;
  const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? Math.min(3.1, baseSpeed) : baseSpeed;
  input.set(0, 0, 0);
  if (keys.has("KeyW")) input.z -= 1;
  if (keys.has("KeyS")) input.z += 1;
  if (keys.has("KeyA")) input.x -= 1;
  if (keys.has("KeyD")) input.x += 1;
  if (input.lengthSq() > 0) input.normalize();

  if (keys.has("Space") && player.grounded && match.phase === "playing") {
    player.verticalVelocity = jumpSpeed;
    player.grounded = false;
    tone(180, 0.05, "sine", 0.018);
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
  if (!collidesAt(nextX, player.position.z)) {
    player.position.x = nextX;
  } else {
    player.velocity.x = 0;
  }
  const nextZ = player.position.z + player.velocity.z * dt;
  if (!collidesAt(player.position.x, nextZ)) {
    player.position.z = nextZ;
  } else {
    player.velocity.z = 0;
  }

  player.verticalVelocity -= gravity * dt;
  player.position.y += player.verticalVelocity * dt;
  if (player.position.y <= eyeHeight) {
    player.position.y = eyeHeight;
    player.verticalVelocity = 0;
    player.grounded = true;
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -mapBounds, mapBounds);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -mapBounds, mapBounds);
}

function updateAI(dt) {
  if (match.phase !== "playing") return;
  const aliveEnemies = targets.filter((target) => target.visible);
  for (const bot of teamBots) {
    if (!bot.visible || !bot.userData.alive || aliveEnemies.length === 0) continue;
    bot.userData.aiTimer -= dt;
    const target = aliveEnemies.reduce((best, item) =>
      item.position.distanceTo(bot.position) < best.position.distanceTo(bot.position) ? item : best
    , aliveEnemies[0]);
    const toEnemy = target.position.clone().sub(bot.position);
    const dist = toEnemy.length();
    const seesEnemy = dist < 34 && hasLineOfSight(bot.position.clone().setY(1.35), target.position.clone().setY(1.35));
    const allyMayTakeSpike = performance.now() - match.combatStartedAt > 6000;
    const canRunObjective =
      !seesEnemy &&
      match.selectedSide === "attack" &&
      match.coreState === "idle" &&
      allyMayTakeSpike &&
      !player.hasSpike &&
      bot === teamBots[0];

    if (canRunObjective && spawnSpikeMesh?.visible) {
      const toSpike = spawnSpikeMesh.position.clone().sub(bot.position);
      if (flatDistance(bot.position, spawnSpikeMesh.position) <= 5.2) {
        bot.userData.hasSpike = true;
        spawnSpikeMesh.visible = false;
        addFeed(`${bot.userData.label} 已拾取爆能器`);
      } else {
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, toSpike), 2.4, dt);
      }
    } else if (canRunObjective && bot.userData.hasSpike) {
      const site = flatDistance(bot.position, sites[0].position) < flatDistance(bot.position, sites[1].position) ? sites[0] : sites[1];
      const toSite = site.position.clone().sub(bot.position);
      if (flatDistance(bot.position, site.position) <= rules.siteRadius) {
        match.activeSite = site;
        match.allyPlantProgress += dt;
        if (match.allyPlantProgress >= rules.plantSeconds) plantSpikeAt(site, bot.userData.label);
      } else {
        match.allyPlantProgress = Math.max(0, match.allyPlantProgress - dt * 0.5);
        tryMoveActor(bot, addSquadSpacing(bot, teamBots, toSite), 2.2, dt);
      }
    } else if (seesEnemy && dist > 18) {
      tryMoveActor(bot, addSquadSpacing(bot, teamBots, toEnemy), 2.1, dt);
    } else if (!seesEnemy && bot.userData.route?.length) {
      const waypoint = bot.userData.route[bot.userData.routeIndex % bot.userData.route.length];
      const toWaypoint = waypoint.clone().sub(bot.position);
      if (flatDistance(bot.position, waypoint) < 2.4) bot.userData.routeIndex += 1;
      else tryMoveActor(bot, addSquadSpacing(bot, teamBots, toWaypoint), 2.2, dt);
    }
    if (bot.userData.aiTimer <= 0 && dist < 30 && seesEnemy) {
      bot.userData.aiTimer = 1.1 + Math.random() * 0.8;
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
    const visibleThreats = [...visiblePlayer, ...visibleAllies].sort((a, b) => a.distance - b.distance);
    const threat = visibleThreats[0] || null;
    const toThreat = threat ? threat.position.clone().sub(target.position) : player.position.clone().sub(target.position);
    const distance = threat ? threat.distance : flatDistance(target.position, player.position);
    const canSee = !!threat;

    if (canSee && distance > 15) {
      tryMoveActor(target, addSquadSpacing(target, targets, toThreat), 1.4, dt);
    } else if (!canSee && target.userData.route?.length) {
      const waypoint = target.userData.route[target.userData.routeIndex % target.userData.route.length];
      const toWaypoint = waypoint.clone().sub(target.position);
      if (flatDistance(target.position, waypoint) < 2.6) target.userData.routeIndex += 1;
      else tryMoveActor(target, addSquadSpacing(target, targets, toWaypoint), 1.9, dt);
    }

    if (canSee && target.userData.aiTimer <= 0) {
      target.userData.aiTimer = 0.75 + Math.random() * 0.65;
      const start = target.position.clone().setY(1.45);
      const end = threat.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.9, threat.kind === "player" ? -0.2 : 1.25, (Math.random() - 0.5) * 0.9));
      const mat = new THREE.LineBasicMaterial({ color: 0xff5f73, transparent: true, opacity: 0.75 });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), mat);
      scene.add(line);
      aiShots.push({ line, material: mat, ttl: 0.12, life: 0.12 });
      if (distance < 26 && Math.random() < 0.5) {
        if (threat.kind === "player") damagePlayer(3 + Math.round(Math.random() * 5), target.userData.label);
        else damageTeamBot(threat.actor, 10 + Math.round(Math.random() * 8), target.userData.label);
      }
    }
    updateActorStuckState(target, dt);
  }

  if (match.selectedSide === "defense" && match.coreState === "idle") {
    const planter = targets.find((target) => target.visible && target.userData.hasSpike && sites.some((site) => flatDistance(target.position, site.position) <= rules.siteRadius));
    if (planter) {
      const near = sites.reduce((best, site) => flatDistance(planter.position, site.position) < flatDistance(planter.position, best.position) ? site : best, sites[0]);
      match.activeSite = near;
      match.aiPlantProgress += dt;
      if (match.aiPlantProgress >= rules.plantSeconds) {
        plantSpikeAt(match.activeSite, "敌方");
      }
    } else {
      match.aiPlantProgress = Math.max(0, match.aiPlantProgress - dt * 1.2);
    }
  }
}

function updateEffects(dt) {
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
  player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);
  if (player.firing) shoot();
  player.switchTimer = Math.max(0, player.switchTimer - dt);
  player.recoil = THREE.MathUtils.damp(player.recoil, 0, currentWeapon().recoilPerShot > 0.04 ? 4.1 : 5.2, dt);
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
    weaponView.visible = match.phase !== "menu" && match.phase !== "matchEnd";
    const switchRatio = player.switchTimer / player.switchDuration;
    const switchDrop = switchRatio > 0 ? Math.sin(switchRatio * Math.PI) * 0.52 : 0;
    weaponView.position.y = Math.sin(performance.now() / 160) * 0.006 - player.recoil * 0.18 - switchDrop;
    weaponView.rotation.z = Math.sin(performance.now() / 400) * 0.008;
  }

  if (match.coreState === "planted") coreMesh.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.pow(0.001, dt));
  coreMesh.rotation.y += dt * 1.8;
  coreMesh.position.y = 0.9 + Math.sin(performance.now() / 250) * 0.06;
  for (const target of targets) target.rotation.y = target.userData.heading ?? player.yaw + Math.PI;
  for (const bot of teamBots) bot.rotation.y = bot.userData.heading ?? player.yaw + Math.PI;
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
volumeSlider.addEventListener("input", () => {
  masterVolume = Number(volumeSlider.value) / 100;
});
sfxToggle.addEventListener("change", () => {
  sfxEnabled = sfxToggle.checked;
});
sensitivitySlider.addEventListener("input", () => {
  mouseSensitivity = Number(sensitivitySlider.value) / 10000;
});
buyList.addEventListener("click", (event) => {
  const button = event.target.closest(".buy-item");
  if (button) buyWeapon(button.dataset.weapon);
});
minimapCanvas.addEventListener("click", (event) => {
  const rect = minimapCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left - 14) / (rect.width - 28)) * (mapBounds * 2) - mapBounds;
  const z = ((event.clientY - rect.top - 14) / (rect.height - 28)) * (mapBounds * 2) - mapBounds;
  addWorldPing(THREE.MathUtils.clamp(x, -mapBounds, mapBounds), THREE.MathUtils.clamp(z, -mapBounds, mapBounds));
  addFeed("已在小地图标记");
});
window.addEventListener("resize", resize);
window.addEventListener("mousedown", (event) => {
  initAudio();
  if (player.settingsOpen || match.phase === "buy") return;
  if (match.phase === "playing" && document.pointerLockElement !== canvas) {
    try {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest && typeof lockRequest.catch === "function") lockRequest.catch(() => {});
    } catch (_) {}
    return;
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
    if (match.phase === "menu" || match.phase === "matchEnd") return;
    if (player.settingsOpen) closeSettings();
    else openSettings();
    return;
  }
  if (player.settingsOpen) return;
  keys.add(event.code);
  if (event.code === "KeyE") pickupNearestWeapon();
  if (event.code === "KeyR") reload();
  if (event.code === "KeyQ") useHeroAbility();
  if (event.code === "KeyB") toggleBuyPanel();
  if (event.code === "KeyX") {
    setMinimapLarge(!player.minimapLarge);
  }
  if (event.code === "Digit1") setWeapon("melee");
  if (event.code === "Digit2") setWeapon("pistol");
  if (event.code === "Digit3") setWeapon("rifle");
  if (event.code === "Digit4") setWeapon("smg");
  if (event.code === "Digit5") setWeapon("sniper");
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
