"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const humanCountSelect = document.getElementById("humanCount");
const targetScoreSelect = document.getElementById("targetScore");
const banner = document.getElementById("banner");
const roundText = document.getElementById("roundText");
const timerText = document.getElementById("timerText");
const phaseText = document.getElementById("phaseText");
const mutatorName = document.getElementById("mutatorName");
const mutatorText = document.getElementById("mutatorText");
const playerList = document.getElementById("playerList");
const keyGrid = document.getElementById("keyGrid");

const WIDTH = 1280;
const HEIGHT = 720;
const ROUND_SECONDS = 60;
const SCORE_BY_PLACE = [5, 2, 1, 0];
const PLAYER_W = 24;
const PLAYER_H = 36;
const PLAYER_COLORS = ["#39f6ff", "#ff3df2", "#ffe66d", "#70ff9f"];
const ARENA = { left: 54, right: WIDTH - 54, top: 76, bottom: HEIGHT - 54 };

const keyState = new Set();
let audioContext = null;
let lastTime = performance.now();

const playerTemplates = [
  {
    id: 0,
    name: "P1",
    control: "WASD",
    keys: { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS" },
    color: PLAYER_COLORS[0],
  },
  {
    id: 1,
    name: "P2",
    control: "方向键",
    keys: { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" },
    color: PLAYER_COLORS[1],
  },
  {
    id: 2,
    name: "P3",
    control: "IJKL",
    keys: { left: "KeyJ", right: "KeyL", up: "KeyI", down: "KeyK" },
    color: PLAYER_COLORS[2],
  },
  {
    id: 3,
    name: "P4",
    control: "TFGH",
    keys: { left: "KeyF", right: "KeyH", up: "KeyT", down: "KeyG" },
    color: PLAYER_COLORS[3],
  },
];

const mutators = [
  {
    name: "二段跳",
    text: "获得者落地前可以跳两次。",
    gravity: 1,
    accel: 1,
    friction: 1,
    jumpPower: 1,
    maxJumps: 2,
    reverse: false,
    tinyArena: false,
  },
  {
    name: "低重力",
    text: "获得者跳得更飘，空中路线更难猜。",
    gravity: 0.64,
    accel: 1.04,
    friction: 1,
    jumpPower: 0.88,
    maxJumps: 1,
    reverse: false,
    tinyArena: false,
  },
  {
    name: "脉冲速度",
    text: "获得者横向移动更快，但空中更难刹住。",
    gravity: 1,
    accel: 1.32,
    friction: 0.72,
    jumpPower: 1,
    maxJumps: 1,
    reverse: false,
    tinyArena: false,
  },
];

const BASE_MUTATOR = {
  name: "普通状态",
  text: "没有个人突变器。",
  gravity: 1,
  accel: 1,
  friction: 1,
  jumpPower: 1,
  maxJumps: 1,
  reverse: false,
  tinyArena: false,
};

const maps = [
  {
    name: "Laser Bridge",
    spawns: [
      { x: 170, y: 470 },
      { x: 1076, y: 470 },
      { x: 340, y: 230 },
      { x: 900, y: 230 },
    ],
    platforms() {
      return [
        platform(112, 600, 380, 24),
        platform(788, 600, 380, 24),
        platform(420, 455, 440, 22),
        platform(202, 295, 250, 20),
        platform(828, 295, 250, 20),
        platform(78, 430, 170, 18),
        platform(1032, 430, 170, 18),
        platform(530, 205, 220, 18),
        platform(600, 585, 80, 18),
      ];
    },
    drawHazards(time) {
      const x = WIDTH / 2 + Math.sin(time * 1.2) * 342;
      const y = 372 + Math.sin(time * 1.65) * 150;
      drawLaser(x, 116, x, ARENA.bottom - 30, "#ff4f6d");
      drawLaser(170, y, WIDTH - 170, y, "#ffe66d");
    },
    damage(player, dt, time) {
      const x = WIDTH / 2 + Math.sin(time * 1.2) * 342;
      const y = 372 + Math.sin(time * 1.65) * 150;
      if (player.x + PLAYER_W > x - 10 && player.x < x + 10 && player.y + PLAYER_H > 116 && player.y < ARENA.bottom - 30) {
        damagePlayer(player, 78 * dt, "激光");
      }
      if (player.y + PLAYER_H > y - 10 && player.y < y + 10 && player.x + PLAYER_W > 170 && player.x < WIDTH - 170) {
        damagePlayer(player, 64 * dt, "横向激光");
      }
    },
  },
  {
    name: "Falling Grid",
    spawns: [
      { x: 200, y: 185 },
      { x: 1040, y: 185 },
      { x: 390, y: 500 },
      { x: 850, y: 500 },
    ],
    platforms(time) {
      const list = [
        platform(130, 610, 220, 24),
        platform(930, 610, 220, 24),
        platform(520, 270, 240, 22),
        platform(88, 280, 180, 18),
        platform(1012, 280, 180, 18),
        platform(420, 560, 120, 18),
        platform(740, 560, 120, 18),
      ];
      const tileWidth = 120;
      for (let i = 0; i < 8; i += 1) {
        const blink = Math.sin(time * 2.2 + i * 1.15);
        if (blink > -0.42) {
          list.push(platform(170 + i * tileWidth, 430, tileWidth - 14, 22, blink < 0.05));
        }
      }
      for (let i = 0; i < 6; i += 1) {
        const blink = Math.sin(time * 1.8 + i * 1.32 + 2.5);
        if (blink > -0.35) {
          list.push(platform(275 + i * 122, 350, 92, 18, blink < 0.08));
        }
      }
      return list;
    },
    drawHazards(time) {
      for (let i = 0; i < 8; i += 1) {
        const blink = Math.sin(time * 2.2 + i * 1.15);
        if (blink <= -0.42) {
          drawDangerPlate(170 + i * 120, 430, 106, 22, 0.88);
        } else if (blink < 0.05) {
          drawDangerPlate(170 + i * 120, 430, 106, 22, 0.32);
        }
      }
      for (let i = 0; i < 6; i += 1) {
        const blink = Math.sin(time * 1.8 + i * 1.32 + 2.5);
        if (blink <= -0.35) {
          drawDangerPlate(275 + i * 122, 350, 92, 18, 0.7);
        } else if (blink < 0.08) {
          drawDangerPlate(275 + i * 122, 350, 92, 18, 0.3);
        }
      }
      drawLaser(ARENA.left + 84, 152, ARENA.right - 84, 152, "#ff3df2");
    },
    damage(player, dt, time) {
      for (let i = 0; i < 8; i += 1) {
        const blink = Math.sin(time * 2.2 + i * 1.15);
        if (blink <= -0.42 && overlapsRect(player, 170 + i * 120, 430, 106, 22)) {
          damagePlayer(player, 70 * dt, "塌陷电板");
        }
      }
      for (let i = 0; i < 6; i += 1) {
        const blink = Math.sin(time * 1.8 + i * 1.32 + 2.5);
        if (blink <= -0.35 && overlapsRect(player, 275 + i * 122, 350, 92, 18)) {
          damagePlayer(player, 58 * dt, "塌陷电板");
        }
      }
      if (player.y + PLAYER_H > 142 && player.y < 162 && player.x + PLAYER_W > ARENA.left + 84 && player.x < ARENA.right - 84) {
        damagePlayer(player, 38 * dt, "上层激光");
      }
    },
  },
  {
    name: "Bounce Pit",
    spawns: [
      { x: 190, y: 475 },
      { x: 1050, y: 475 },
      { x: 400, y: 285 },
      { x: 840, y: 285 },
    ],
    platforms() {
      return [
        platform(140, 595, 370, 24),
        platform(770, 595, 370, 24),
        platform(380, 420, 520, 22),
        platform(170, 265, 220, 20),
        platform(890, 265, 220, 20),
        platform(540, 250, 200, 18),
        platform(72, 480, 150, 18),
        platform(1058, 480, 150, 18),
      ];
    },
    drawHazards(time) {
      drawBounceRail(ARENA.left, ARENA.bottom - 14, ARENA.right - ARENA.left, 18);
      drawLaser(ARENA.left + 12, 140, ARENA.left + 12, ARENA.bottom - 78, "#ffe66d");
      drawLaser(ARENA.right - 12, 140, ARENA.right - 12, ARENA.bottom - 78, "#ffe66d");
      const y = 348 + Math.sin(time * 1.4) * 128;
      drawLaser(260, y, WIDTH - 260, y, "#ff4f6d");
    },
    damage(player, dt, time) {
      if (player.x < ARENA.left + 20) {
        player.vx = Math.abs(player.vx) + 420;
      }
      if (player.x + PLAYER_W > ARENA.right - 20) {
        player.vx = -Math.abs(player.vx) - 420;
      }
      const y = 348 + Math.sin(time * 1.4) * 128;
      if (player.y + PLAYER_H > y - 10 && player.y < y + 10 && player.x + PLAYER_W > 260 && player.x < WIDTH - 260) {
        damagePlayer(player, 58 * dt, "横向激光");
      }
    },
  },
];

const state = {
  phase: "ready",
  round: 0,
  humanCount: 2,
  targetScore: 100,
  matchWinner: null,
  activeMapIndex: 0,
  activeMutator: mutators[0],
  mutatorSeed: -1,
  mutatorTargetId: null,
  roundTime: ROUND_SECONDS,
  suddenDeath: false,
  suddenTime: 0,
  introTime: 0,
  resultTime: 0,
  scores: [0, 0, 0, 0],
  players: [],
  deaths: [],
  particles: [],
  lastPlaces: ["-", "-", "-", "-"],
  time: 0,
};

function platform(x, y, w, h, warning = false) {
  return { x, y, w, h, warning };
}

function makePlayer(template, spawn) {
  const isAI = template.id >= state.humanCount;
  return {
    ...template,
    isAI,
    displayName: isAI ? `${template.name} AI` : template.name,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    health: 100,
    alive: true,
    grounded: false,
    jumpsLeft: template.id === state.mutatorTargetId ? state.activeMutator.maxJumps : BASE_MUTATOR.maxJumps,
    jumpHeld: false,
    lastReason: "",
    place: "",
    moveGlow: 0,
    moving: false,
    facing: template.id % 2 === 0 ? 1 : -1,
    walkTime: 0,
    aiTargetX: spawn.x,
    aiTargetY: spawn.y,
    aiPlatformIndex: 0,
    aiJumpClock: 0,
    aiThinkClock: 0,
  };
}

function initAudio() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioCtor) {
      audioContext = new AudioCtor();
    }
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function tone(freq, duration, type = "square", gain = 0.035) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const volume = audioContext.createGain();
  osc.frequency.value = freq;
  osc.type = type;
  volume.gain.setValueAtTime(gain, audioContext.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.connect(volume);
  volume.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

function chord(freqs, duration, type, gain) {
  freqs.forEach((freq, index) => {
    window.setTimeout(() => tone(freq, duration, type, gain), index * 32);
  });
}

function startMatch() {
  initAudio();
  state.humanCount = Number(humanCountSelect.value);
  state.targetScore = Number(targetScoreSelect.value);
  state.phase = "intro";
  state.round = 0;
  state.matchWinner = null;
  state.scores = [0, 0, 0, 0];
  state.lastPlaces = ["-", "-", "-", "-"];
  nextRound();
  chord([330, 494, 660], 0.09, "sawtooth", 0.045);
}

function nextRound() {
  state.round += 1;
  state.phase = "intro";
  state.roundTime = ROUND_SECONDS;
  state.suddenDeath = false;
  state.suddenTime = 0;
  state.introTime = 1.25;
  state.resultTime = 0;
  state.deaths = [];
  state.lastPlaces = ["-", "-", "-", "-"];
  state.activeMapIndex = (state.round - 1) % maps.length;
  if ((state.round - 1) % 3 === 0) {
    chooseMutator();
  }
  const map = maps[state.activeMapIndex];
  state.players = playerTemplates.map((template, index) => makePlayer(template, map.spawns[index]));
  const targetName = playerTemplates[state.mutatorTargetId]?.name || "?";
  showBanner(`第 ${state.round} 回合`, `${map.name} · 3选1：${targetName} 获得 ${state.activeMutator.name}`);
  updateHud();
}

function chooseMutator() {
  let nextIndex = Math.floor(Math.random() * mutators.length);
  if (mutators.length > 1 && nextIndex === state.mutatorSeed) {
    nextIndex = (nextIndex + 1) % mutators.length;
  }
  state.mutatorSeed = nextIndex;
  state.activeMutator = mutators[nextIndex];
  state.mutatorTargetId = Math.floor(Math.random() * playerTemplates.length);
}

function playerMutator(player) {
  return player.id === state.mutatorTargetId ? state.activeMutator : BASE_MUTATOR;
}

function showBanner(title, subtitle) {
  banner.innerHTML = `<strong>${title}</strong><span>${subtitle}</span>`;
  banner.classList.add("is-visible");
}

function hideBanner() {
  banner.classList.remove("is-visible");
}

function updateGame(dt) {
  state.time += dt;
  updateParticles(dt);

  if (state.phase === "intro") {
    state.introTime -= dt;
    if (state.introTime <= 0) {
      state.phase = "playing";
      hideBanner();
    }
    return;
  }

  if (state.phase === "roundOver") {
    state.resultTime -= dt;
    if (state.resultTime <= 0) {
      nextRound();
    }
    return;
  }

  if (state.phase !== "playing") return;

  if (!state.suddenDeath) {
    state.roundTime -= dt;
    if (state.roundTime <= 0) {
      state.roundTime = 0;
      state.suddenDeath = true;
      state.suddenTime = 0;
      phaseText.textContent = "骤死";
      chord([196, 147, 98], 0.13, "sawtooth", 0.052);
      flashAlivePlayers();
    }
  } else {
    state.suddenTime += dt;
  }

  const activePlatforms = maps[state.activeMapIndex].platforms(state.time);
  state.players.forEach((player) => updatePlayer(player, dt, activePlatforms));
  resolvePlayerBumps(dt);
  state.players.forEach((player) => {
    if (!player.alive) return;
    maps[state.activeMapIndex].damage(player, dt, state.time);
    applySuddenDeath(player, dt);
    if (player.health <= 0) {
      killPlayer(player, player.lastReason || "耗尽");
    }
  });

  const alive = state.players.filter((player) => player.alive);
  if (alive.length <= 1) {
    finishRound();
  }
}

function updatePlayer(player, dt, activePlatforms) {
  if (!player.alive) return;

  const mutator = playerMutator(player);
  const input = player.isAI ? readAiInput(player, dt, activePlatforms, mutator) : readHumanInput(player, mutator);
  const maxSpeed = 340 * mutator.accel;
  const accel = 1540 * mutator.accel;
  const gravity = 1580 * mutator.gravity;
  const groundFriction = player.grounded ? 8.5 * mutator.friction : 1.8 * mutator.friction;
  const movingNow = input.left || input.right || input.up || input.down;

  if (input.left) player.vx -= accel * dt;
  if (input.right) player.vx += accel * dt;

  if (!input.left && !input.right) {
    const slow = Math.min(1, groundFriction * dt);
    player.vx *= 1 - slow;
  }

  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (input.up && !player.jumpHeld && player.jumpsLeft > 0) {
    player.vy = -620 * mutator.jumpPower;
    player.jumpsLeft -= 1;
    player.grounded = false;
    player.moveGlow = 1;
    tone(460 + player.id * 70, 0.045, "triangle", 0.018);
  }
  player.jumpHeld = input.up;

  const fastFall = input.down && !player.grounded ? 1.6 : 1;
  player.vy += gravity * fastFall * dt;
  player.vy = Math.min(player.vy, 720);

  moveAndCollide(player, dt, activePlatforms);
  updateMovementHealth(player, movingNow, dt);

  player.moving = movingNow || Math.abs(player.vx) > 42;
  if (Math.abs(player.vx) > 18) {
    player.facing = player.vx > 0 ? 1 : -1;
    player.walkTime += dt * Math.min(8, Math.abs(player.vx) / 44);
  }
  player.moveGlow = Math.max(0, player.moveGlow - dt * 2.4);

  applyArenaBounds(player, dt);
}

function readHumanInput(player, mutator) {
  let left = keyState.has(player.keys.left);
  let right = keyState.has(player.keys.right);
  const up = keyState.has(player.keys.up);
  const down = keyState.has(player.keys.down);
  if (mutator.reverse) {
    const oldLeft = left;
    left = right;
    right = oldLeft;
  }
  return { left, right, up, down };
}

function readAiInput(player, dt, activePlatforms, mutator) {
  player.aiThinkClock -= dt;
  player.aiJumpClock -= dt;

  if (player.aiThinkClock <= 0) {
    player.aiThinkClock = 0.28 + Math.random() * 0.24;
    const target = chooseAiTarget(player, activePlatforms);
    player.aiTargetX = target.x;
    player.aiTargetY = target.y;
  }

  const center = player.x + PLAYER_W / 2;
  const nearest = nearestAliveRival(player);
  let gap = player.aiTargetX - center;

  if (nearest && Math.abs(nearest.x - player.x) < 72 && Math.abs(nearest.y - player.y) < 58) {
    const away = player.x < nearest.x ? -1 : 1;
    gap = away * 140;
  }

  let left = gap < -22;
  let right = gap > 22;

  if (mutator.reverse) {
    const oldLeft = left;
    left = right;
    right = oldLeft;
  }

  const targetAbove = player.aiTargetY < player.y - 34;
  const targetAcrossGap = isNearPlatformEdge(player, activePlatforms) && Math.abs(gap) > 32;
  const stalled = Math.abs(player.vx) < 18 && Math.abs(gap) > 64;
  const wantsJump = player.grounded && player.aiJumpClock <= 0 && (targetAbove || targetAcrossGap || stalled || Math.random() < 0.005);
  if (wantsJump) {
    player.aiJumpClock = 0.46 + Math.random() * 0.28;
  }

  return {
    left,
    right,
    up: wantsJump,
    down: !player.grounded && player.y < player.aiTargetY - 110 && Math.random() < 0.3,
  };
}

function chooseAiTarget(player, activePlatforms) {
  const safePlatforms = activePlatforms.filter((plat) => plat.w >= 90 && !plat.warning);
  const options = safePlatforms.length ? safePlatforms : activePlatforms;
  const arenaWidth = ARENA.right - ARENA.left;
  const laneStep = arenaWidth / 5;
  const lane = ARENA.left + laneStep * (1 + ((state.round + player.id * 2) % 4));
  const nearest = nearestAliveRival(player);
  const panicFromWall = player.x < ARENA.left + 92 || player.x + PLAYER_W > ARENA.right - 92;

  if (panicFromWall) {
    return { x: WIDTH / 2 + (player.id - 1.5) * 82, y: ARENA.bottom - PLAYER_H - 90 };
  }

  let best = null;
  let bestScore = Infinity;
  options.forEach((plat, index) => {
    const centerX = plat.x + plat.w * (0.35 + ((player.id + state.round + index) % 3) * 0.15);
    let score = Math.abs(centerX - lane) * 1.15 + Math.abs(plat.y - (player.y + PLAYER_H)) * 0.42;
    state.players.forEach((other) => {
      if (!other.alive || other.id === player.id) return;
      const dx = centerX - (other.x + PLAYER_W / 2);
      const dy = plat.y - (other.y + PLAYER_H);
      const distance = Math.max(32, Math.hypot(dx, dy));
      score += 5200 / distance;
    });
    if (nearest) {
      const rivalDistance = Math.abs(centerX - (nearest.x + PLAYER_W / 2));
      score += rivalDistance < 80 ? 220 : 0;
    }
    if (score < bestScore) {
      bestScore = score;
      best = { x: centerX, y: plat.y - PLAYER_H, index };
    }
  });

  return best || { x: WIDTH / 2, y: ARENA.bottom - PLAYER_H - 90 };
}

function nearestAliveRival(player) {
  let best = null;
  let bestDistance = Infinity;
  state.players.forEach((candidate) => {
    if (!candidate.alive || candidate.id === player.id) return;
    const dx = candidate.x - player.x;
    const dy = candidate.y - player.y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  });
  return best;
}

function platformUnderPlayer(player, activePlatforms) {
  return activePlatforms.find((plat) => {
    const onTop = Math.abs(player.y + PLAYER_H - plat.y) < 12;
    const insideX = player.x + PLAYER_W > plat.x && player.x < plat.x + plat.w;
    return onTop && insideX;
  });
}

function isNearPlatformEdge(player, activePlatforms) {
  const plat = platformUnderPlayer(player, activePlatforms);
  if (!plat) return player.grounded;
  const center = player.x + PLAYER_W / 2;
  return center - plat.x < 42 || plat.x + plat.w - center < 42;
}

function updateMovementHealth(player, movingNow, dt) {
  const idleDrain = state.suddenDeath ? 24 : 18;
  if (movingNow && !state.suddenDeath) {
    player.health = Math.min(100, player.health + 18 * dt);
  } else if (!movingNow) {
    player.lastReason = "停太久";
    damagePlayer(player, idleDrain * dt, "停太久");
  }
  if (state.suddenDeath) {
    damagePlayer(player, (3 + state.suddenTime * 0.35) * dt, "骤死");
  }
}

function moveAndCollide(player, dt, activePlatforms) {
  const previousY = player.y;
  player.x += player.vx * dt;

  player.y += player.vy * dt;
  player.grounded = false;

  activePlatforms.forEach((plat) => {
    const wasAbove = previousY + PLAYER_H <= plat.y + 5;
    const overlapsX = player.x + PLAYER_W > plat.x && player.x < plat.x + plat.w;
    const overlapsY = player.y + PLAYER_H > plat.y && player.y < plat.y + plat.h;
    if (overlapsX && overlapsY && wasAbove && player.vy >= 0) {
      player.y = plat.y - PLAYER_H;
      player.vy = 0;
      player.grounded = true;
      player.jumpsLeft = state.activeMutator.maxJumps;
    }
  });
}

function applyArenaBounds(player, dt) {
  if (player.x < ARENA.left) {
    player.x = ARENA.left;
    player.vx = Math.abs(player.vx) * 0.36;
    player.lastReason = "撞墙";
  }
  if (player.x + PLAYER_W > ARENA.right) {
    player.x = ARENA.right - PLAYER_W;
    player.vx = -Math.abs(player.vx) * 0.36;
    player.lastReason = "撞墙";
  }
  if (player.y < ARENA.top) {
    player.y = ARENA.top;
    player.vy = Math.abs(player.vy) * 0.28;
  }
  if (player.y + PLAYER_H > ARENA.bottom) {
    player.y = ARENA.bottom - PLAYER_H;
    player.vy = -Math.abs(player.vy) * 0.16;
    player.grounded = true;
    player.jumpsLeft = playerMutator(player).maxJumps;
    player.lastReason = "底边弹回";
  }
}

function resolvePlayerBumps(dt) {
  const alive = state.players.filter((player) => player.alive);
  for (let i = 0; i < alive.length; i += 1) {
    for (let j = i + 1; j < alive.length; j += 1) {
      const a = alive[i];
      const b = alive[j];
      if (!rectsOverlap(a, b)) continue;

      const centerA = a.x + PLAYER_W / 2;
      const centerB = b.x + PLAYER_W / 2;
      const push = centerA < centerB ? -1 : 1;
      const overlapX = Math.max(1, PLAYER_W - Math.abs(centerA - centerB));
      const separate = overlapX / 2 + 1;
      a.x += push * separate;
      b.x -= push * separate;

      const relativeSpeed = Math.abs(a.vx - b.vx);
      const sharedVelocity = (a.vx + b.vx) * 0.5;
      a.vx = clamp(sharedVelocity + push * 92, -360, 360) * 0.82;
      b.vx = clamp(sharedVelocity - push * 92, -360, 360) * 0.82;

      if (relativeSpeed > 220) {
        damagePlayer(a, 2.5, "碰撞");
        damagePlayer(b, 2.5, "碰撞");
        spark((a.x + b.x) / 2 + PLAYER_W / 2, Math.min(a.y, b.y) + 20, "#ffffff", 8);
      }
    }
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + PLAYER_W && a.x + PLAYER_W > b.x && a.y < b.y + PLAYER_H && a.y + PLAYER_H > b.y;
}

function overlapsRect(player, x, y, w, h) {
  return player.x < x + w && player.x + PLAYER_W > x && player.y < y + h && player.y + PLAYER_H > y;
}

function applySuddenDeath(player, dt) {
  if (!state.suddenDeath && !state.activeMutator.tinyArena) return;
  const baseInset = state.activeMutator.tinyArena ? 120 : 0;
  const inset = Math.min(360, baseInset + state.suddenTime * 20);
  if (player.x < ARENA.left + inset || player.x + PLAYER_W > ARENA.right - inset) {
    damagePlayer(player, 82 * dt, "骤死边界");
  }
}

function damagePlayer(player, amount, reason) {
  if (!player.alive) return;
  player.health -= amount;
  player.lastReason = reason;
}

function killPlayer(player, reason) {
  if (!player.alive) return;
  player.alive = false;
  player.health = 0;
  player.lastReason = reason;
  state.deaths.push(player.id);
  player.place = `${state.players.length - state.deaths.length + 1}`;
  spark(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, player.color, 26);
  chord([160 + player.id * 30, 96], 0.08, "square", 0.04);
}

function finishRound() {
  if (state.phase !== "playing") return;
  const aliveOrder = state.players
    .filter((player) => player.alive)
    .sort((a, b) => b.health - a.health || a.id - b.id);
  const deadOrder = state.deaths
    .slice()
    .reverse()
    .map((id) => state.players.find((player) => player.id === id));
  const placements = [...aliveOrder, ...deadOrder].filter(Boolean);

  placements.forEach((player, index) => {
    const points = SCORE_BY_PLACE[index] || 0;
    state.scores[player.id] += points;
    state.lastPlaces[player.id] = `第 ${index + 1} +${points}`;
  });

  const winner = state.players.find((player) => state.scores[player.id] >= state.targetScore);
  if (winner) {
    state.phase = "matchOver";
    state.matchWinner = winner;
    showBanner(`${winner.displayName} 获胜`, `总分 ${state.scores[winner.id]} / ${state.targetScore}`);
    chord([523, 659, 784, 1046], 0.11, "triangle", 0.055);
  } else {
    state.phase = "roundOver";
    state.resultTime = 2.6;
    const first = placements[0];
    showBanner(`${first.displayName} 本回合第一`, `+5 分 · 下一回合马上开始`);
    chord([392, 523, 659], 0.08, "triangle", 0.035);
  }
  updateHud();
}

function flashAlivePlayers() {
  state.players.forEach((player) => {
    if (player.alive) {
      player.moveGlow = 1;
      spark(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, player.color, 10);
    }
  });
}

function spark(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 180;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.28 + Math.random() * 0.34,
      maxLife: 0.62,
      color,
    });
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 260 * dt;
    return particle.life > 0;
  });
}

function draw() {
  drawBackground();
  const map = maps[state.activeMapIndex] || maps[0];
  drawArenaFrame();
  drawSuddenWalls();
  map.drawHazards(state.time);
  drawPlatforms(map.platforms(state.time));
  drawParticles();
  state.players.forEach(drawPlayer);
  drawTopCanvasHud();
  drawBottomHealthBars();
}

function drawBackground() {
  const living = state.players.filter((player) => player.alive);
  const lowHealth = living.length ? Math.min(...living.map((player) => player.health)) : 100;
  const pulse = state.suddenDeath ? 0.9 : clamp((100 - lowHealth) / 100, 0, 0.55);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#070812");
  gradient.addColorStop(0.55, "#111a32");
  gradient.addColorStop(1, "#070812");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.16 + pulse * 0.18;
  ctx.strokeStyle = state.suddenDeath ? "#ff4f6d" : "#39f6ff";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.36 + pulse * 0.4;
  ctx.strokeStyle = state.suddenDeath ? "#ff4f6d" : "#ff3df2";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= WIDTH; x += 24) {
    const y = 56 + Math.sin(x * 0.026 + state.time * 3.4) * (8 + pulse * 18);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawArenaFrame() {
  const width = ARENA.right - ARENA.left;
  const height = ARENA.bottom - ARENA.top;
  ctx.save();
  ctx.strokeStyle = "#39f6ff";
  ctx.shadowColor = "#39f6ff";
  ctx.shadowBlur = 18;
  ctx.lineWidth = 4;
  roundRect(ARENA.left - 10, ARENA.top - 10, width + 20, height + 20, 10);
  ctx.stroke();

  ctx.shadowBlur = 10;
  ctx.fillStyle = "rgba(57, 246, 255, 0.13)";
  ctx.fillRect(ARENA.left - 16, ARENA.top - 16, width + 32, 16);
  ctx.fillRect(ARENA.left - 16, ARENA.top, 16, height);
  ctx.fillRect(ARENA.right, ARENA.top, 16, height);

  ctx.fillStyle = "rgba(57, 246, 255, 0.18)";
  ctx.shadowColor = "#39f6ff";
  ctx.shadowBlur = 14;
  ctx.fillRect(ARENA.left - 16, ARENA.bottom, width + 32, 18);
  ctx.strokeStyle = "#39f6ff";
  ctx.beginPath();
  ctx.moveTo(ARENA.left - 12, ARENA.bottom);
  ctx.lineTo(ARENA.right + 12, ARENA.bottom);
  ctx.stroke();
  ctx.restore();
}

function drawPlatforms(platforms) {
  platforms.forEach((plat) => {
    ctx.save();
    ctx.fillStyle = plat.warning ? "rgba(255, 230, 109, 0.42)" : "rgba(57, 246, 255, 0.18)";
    ctx.strokeStyle = plat.warning ? "#ffe66d" : "#39f6ff";
    ctx.shadowColor = plat.warning ? "#ffe66d" : "#39f6ff";
    ctx.shadowBlur = plat.warning ? 12 : 16;
    ctx.lineWidth = 2;
    roundRect(plat.x, plat.y, plat.w, plat.h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawPlayer(player) {
  if (!player.alive) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + 3, player.y + 3);
    ctx.lineTo(player.x + PLAYER_W - 3, player.y + PLAYER_H - 3);
    ctx.moveTo(player.x + PLAYER_W - 3, player.y + 3);
    ctx.lineTo(player.x + 3, player.y + PLAYER_H - 3);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  const bob = player.grounded && player.moving ? Math.abs(Math.sin(player.walkTime * 2.4)) * 3 : 0;
  const bodyY = player.y - bob;

  ctx.shadowColor = player.color;
  ctx.shadowBlur = 18 + player.moveGlow * 18;
  ctx.fillStyle = player.color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  roundRect(player.x, bodyY, PLAYER_W, PLAYER_H, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#06101a";
  const eyeY = bodyY + 13;
  const eyeLead = player.facing > 0 ? 2 : -2;
  ctx.fillRect(player.x + 8 + eyeLead, eyeY, 5, 6);
  ctx.fillRect(player.x + PLAYER_W - 13 + eyeLead, eyeY, 5, 6);

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 0;
  const legSwing = player.moving ? Math.sin(player.walkTime * 3) * 5 : 0;
  ctx.beginPath();
  ctx.moveTo(player.x + 9, bodyY + PLAYER_H - 2);
  ctx.lineTo(player.x + 7 + legSwing, bodyY + PLAYER_H + 8);
  ctx.moveTo(player.x + PLAYER_W - 9, bodyY + PLAYER_H - 2);
  ctx.lineTo(player.x + PLAYER_W - 7 - legSwing, bodyY + PLAYER_H + 8);
  ctx.stroke();

  ctx.font = "700 12px Trebuchet MS, Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#eff7ff";
  ctx.fillText(player.displayName, player.x + PLAYER_W / 2, bodyY - 11);
  if (!player.moving && state.phase === "playing" && !state.suddenDeath) {
    ctx.font = "900 12px Trebuchet MS, Arial";
    ctx.fillStyle = "#ff4f6d";
    ctx.shadowColor = "#ff4f6d";
    ctx.shadowBlur = 10;
    ctx.fillText("MOVE!", player.x + PLAYER_W / 2, bodyY - 25);
  }
  ctx.restore();
}

function drawParticles() {
  state.particles.forEach((particle) => {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 2.5 + alpha * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBottomHealthBars() {
  const gap = 18;
  const margin = 58;
  const barY = HEIGHT - 40;
  const barH = 18;
  const width = (WIDTH - margin * 2 - gap * 3) / 4;
  ctx.save();
  ctx.fillStyle = "rgba(5, 8, 20, 0.78)";
  ctx.fillRect(0, HEIGHT - 54, WIDTH, 54);
  ctx.strokeStyle = "rgba(57, 246, 255, 0.28)";
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT - 54);
  ctx.lineTo(WIDTH, HEIGHT - 54);
  ctx.stroke();

  state.players.forEach((player, index) => {
    const x = margin + index * (width + gap);
    const ratio = clamp(player.health / 100, 0, 1);
    const isTarget = player.id === state.mutatorTargetId;
    ctx.shadowColor = isTarget ? "#ffe66d" : player.color;
    ctx.shadowBlur = isTarget ? 18 : 10;
    ctx.fillStyle = "rgba(12, 16, 34, 0.92)";
    roundRect(x, barY, width, barH, 5);
    ctx.fill();
    ctx.strokeStyle = isTarget ? "#ffe66d" : player.color;
    ctx.lineWidth = isTarget ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = player.health < 25 ? "#ff4f6d" : player.color;
    roundRect(x + 4, barY + 4, Math.max(5, (width - 8) * ratio), barH - 8, 4);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = "900 13px Trebuchet MS, Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#eff7ff";
    ctx.fillText(`${player.displayName}  ${state.scores[player.id]}/${state.targetScore}`, x, barY - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = isTarget ? "#ffe66d" : "#94a4c4";
    ctx.fillText(isTarget ? state.activeMutator.name : player.isAI ? "AI" : player.control, x + width, barY - 8);
  });
  ctx.restore();
}

function drawTopCanvasHud() {
  ctx.save();
  ctx.font = "900 18px Trebuchet MS, Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = state.suddenDeath ? "#ff4f6d" : "#eff7ff";
  const timer = state.suddenDeath ? `骤死 ${Math.ceil(state.suddenTime)}` : `${Math.ceil(state.roundTime)}`;
  ctx.fillText(timer, WIDTH / 2, 34);
  ctx.font = "700 13px Trebuchet MS, Arial";
  ctx.fillStyle = "#94a4c4";
  const mutatorLabel =
    state.mutatorTargetId === null
      ? "等待 3选1"
      : `3选1 → ${playerTemplates[state.mutatorTargetId].name}: ${state.activeMutator.name}`;
  ctx.fillText(`${maps[state.activeMapIndex]?.name || "Arena"} · ${mutatorLabel}`, WIDTH / 2, 54);
  ctx.restore();
}

function drawSuddenWalls() {
  const baseInset = state.activeMutator.tinyArena ? 120 : 0;
  const inset = state.suddenDeath ? Math.min(360, baseInset + state.suddenTime * 20) : baseInset;
  if (!state.suddenDeath && !state.activeMutator.tinyArena) return;

  const alpha = state.suddenDeath ? 0.42 : 0.17;
  ctx.save();
  ctx.fillStyle = `rgba(255, 79, 109, ${alpha})`;
  ctx.strokeStyle = "#ff4f6d";
  ctx.shadowColor = "#ff4f6d";
  ctx.shadowBlur = 18;
  ctx.fillRect(ARENA.left, ARENA.top, inset, ARENA.bottom - ARENA.top);
  ctx.fillRect(ARENA.right - inset, ARENA.top, inset, ARENA.bottom - ARENA.top);
  ctx.beginPath();
  ctx.moveTo(ARENA.left + inset, ARENA.top);
  ctx.lineTo(ARENA.left + inset, ARENA.bottom);
  ctx.moveTo(ARENA.right - inset, ARENA.top);
  ctx.lineTo(ARENA.right - inset, ARENA.bottom);
  ctx.stroke();
  ctx.restore();
}

function drawLaser(x1, y1, x2, y2, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.restore();
}

function drawDangerPlate(x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#ff4f6d";
  ctx.shadowColor = "#ff4f6d";
  ctx.shadowBlur = 18;
  roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.restore();
}

function drawBounceRail(x, y, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(57, 246, 255, 0.24)";
  ctx.strokeStyle = "#39f6ff";
  ctx.shadowColor = "#39f6ff";
  ctx.shadowBlur = 16;
  roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function roundRect(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function updateHud() {
  roundText.textContent = String(state.round);
  timerText.textContent = state.suddenDeath ? `+${Math.ceil(state.suddenTime)}` : String(Math.ceil(state.roundTime));
  phaseText.textContent = phaseLabel();
  const targetPlayer = state.players.find((player) => player.id === state.mutatorTargetId);
  mutatorName.textContent = targetPlayer ? `${targetPlayer.displayName} · ${state.activeMutator.name}` : "等待 3选1";
  mutatorText.textContent = targetPlayer
    ? `突变池：二段跳 / 低重力 / 脉冲速度。本轮由 ${targetPlayer.displayName} 获得：${state.activeMutator.text}`
    : "每 3 个回合，从 3 个突变器中抽 1 个，再随机给 1 名玩家。";

  playerList.innerHTML = state.players
    .map((player) => {
      const isTarget = player.id === state.mutatorTargetId;
      const status = player.alive ? (isTarget ? state.activeMutator.name : "存活") : player.lastReason || "出局";
      const mode = player.isAI ? "AI" : player.control;
      return `
        <article class="player-card" style="color: ${player.color}">
          <span class="chip"></span>
          <div>
            <div class="player-name">
              <strong>${player.displayName}</strong>
              <span class="score">${state.scores[player.id]} / ${state.targetScore}</span>
            </div>
            <div class="player-meta">${mode} · ${status}</div>
          </div>
          <span class="place">${state.lastPlaces[player.id] === "-" ? status : state.lastPlaces[player.id]}</span>
        </article>
      `;
    })
    .join("");

  keyGrid.innerHTML = playerTemplates
    .map((template) => {
      const isAI = template.id >= state.humanCount;
      return `<div style="color: ${template.color}"><b>${template.name}</b><span>${isAI ? "AI 补位" : template.control}</span></div>`;
    })
    .join("");
}

function phaseLabel() {
  if (state.phase === "ready") return "待机";
  if (state.phase === "intro") return "准备";
  if (state.phase === "roundOver") return "结算";
  if (state.phase === "matchOver") return "结束";
  return state.suddenDeath ? "骤死" : "进行";
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  updateGame(dt);
  draw();
  updateHud();
  requestAnimationFrame(loop);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === "Enter" && (state.phase === "ready" || state.phase === "matchOver")) {
    startMatch();
  }
  if (event.code === "KeyR" && event.metaKey === false && event.ctrlKey === false) {
    startMatch();
  }
  keyState.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keyState.delete(event.code);
});

startButton.addEventListener("click", startMatch);
restartButton.addEventListener("click", startMatch);
targetScoreSelect.addEventListener("change", () => {
  state.targetScore = Number(targetScoreSelect.value);
  updateHud();
});
humanCountSelect.addEventListener("change", () => {
  state.humanCount = Number(humanCountSelect.value);
  state.phase = "ready";
  state.round = 0;
  state.matchWinner = null;
  state.mutatorTargetId = null;
  state.roundTime = ROUND_SECONDS;
  state.suddenDeath = false;
  state.suddenTime = 0;
  state.scores = [0, 0, 0, 0];
  state.deaths = [];
  state.lastPlaces = ["-", "-", "-", "-"];
  state.players = playerTemplates.map((template, index) => makePlayer(template, maps[state.activeMapIndex].spawns[index]));
  showBanner("人数已更新", `${state.humanCount} 人 + ${4 - state.humanCount} AI，按开始重开`);
  updateHud();
});

state.players = playerTemplates.map((template, index) => makePlayer(template, maps[0].spawns[index]));
showBanner("选择人数后开始", "余下位置由 AI 补上，第1名+5，第2名+2，第3名+1，第4名+0");
updateHud();
requestAnimationFrame(loop);
