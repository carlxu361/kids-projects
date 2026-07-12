import { readFileSync } from "node:fs";

const game = readFileSync("game.js", "utf8");
const html = readFileSync("index.html", "utf8");
const css = readFileSync("style.css", "utf8");
const server = readFileSync("server.js", "utf8");

const checks = [
  {
    name: "buying is restricted to buy phase",
    pass: /function buyWeapon[\s\S]*?match\.phase !== "buy"/.test(game),
  },
  {
    name: "player cannot move during buy phase",
    pass: /function updateMovement[\s\S]*?match\.phase === "buy"/.test(game),
  },
  {
    name: "player cannot shoot during buy phase",
    pass: /function shoot\(\) \{[\s\S]*?match\.phase !== "playing"/.test(game) &&
      /window\.addEventListener\("mousedown"[\s\S]*?match\.phase === "buy"\) return/.test(game),
  },
  {
    name: "rounds start with spike idle, not pre-planted",
    pass: /function beginRound[\s\S]*?match\.coreState = "idle"/.test(game) && !/match\.coreState = match\.selectedSide/.test(game),
  },
  {
    name: "spike/site interactions use flat ground distance",
    pass: /function nearestSite[\s\S]*?flatDistance\(player\.position, site\.position\)/.test(game) &&
      /flatDistance\(player\.position, match\.activeSite\.position\)/.test(game),
  },
  {
    name: "spike deploy prompt is visible when conditions are met",
    pass: /按住 E 部署/.test(game) && /正在部署/.test(game),
  },
  {
    name: "planting blocks shooting and can be cancelled",
    pass: /function shoot\(\) \{[\s\S]*?player\.planting[\s\S]*?return/.test(game) &&
      /player\.planting = false;[\s\S]*?match\.plantProgress = Math\.max\(0, match\.plantProgress - dt \* 1\.6\)/.test(game),
  },
  {
    name: "road weapon pickups are disabled",
    pass: /function addPickups\(\) \{\s*\/\/ Weapons should enter the round from buy phase or enemy drops, not random road loot\.\s*\}/.test(game),
  },
  {
    name: "map is enlarged beyond the early prototype",
    pass: /const mapBounds = 120;/.test(game) && /GridHelper\(240, 80/.test(game),
  },
  {
    name: "map uses a non-rectangular floor shape",
    pass: /const floorShape = new THREE\.Shape\(\[[\s\S]*?new THREE\.ShapeGeometry\(floorShape\)/.test(game),
  },
  {
    name: "player and spike spawn are deep in the attack base",
    pass: /player\.position\.set\(0, eyeHeight, match\.selectedSide === "attack" \? 96 : -94\)/.test(game) &&
      /spawnSpikeMesh\.position\.set\(0, 0\.14, 92\)/.test(game),
  },
  {
    name: "buy menu is fullscreen overlay",
    pass: /#buy-panel\s*\{[\s\S]*?inset: 0;[\s\S]*?width: auto;[\s\S]*?border-radius: 0;/.test(css),
  },
  {
    name: "dropped weapons still exist after kills",
    pass: /function dropWeaponAt[\s\S]*?createWeaponPickup/.test(game),
  },
  {
    name: "local match structure is 5v5",
    pass: /match\.allyAlive = 5/.test(game) &&
      /enemyAlive: 5/.test(game) &&
      /createTeamBot/.test(game) &&
      /createTarget/.test(game),
  },
  {
    name: "minimap fullscreen uses X",
    pass: /event\.code === "KeyX"/.test(game) && /X 战术图/.test(html) && !/KeyM/.test(game),
  },
  {
    name: "minimap does not reveal enemies",
    pass: /function drawMinimap[\s\S]*?for \(const bot of teamBots\)/.test(game) &&
      !/drawMiniDot\(target\.position/.test(game),
  },
  {
    name: "3D pings use a vertical light beam",
    pass: /function addWorldPing[\s\S]*?CylinderGeometry\(0\.12, 0\.12, 16/.test(game),
  },
  {
    name: "warden health is capped at 100",
    pass: /warden: \{[^}]*healthBonus: 0/.test(game) && /player\.health = Math\.min\(100, player\.health \+ 35\)/.test(game),
  },
  {
    name: "stealth walking affects detection",
    pass: /function canDetectPlayer[\s\S]*?playerIsWalking[\s\S]*?return inFront \|\| !playerIsWalking \|\| distance < 10/.test(game),
  },
  {
    name: "AI damage is reduced from earlier high-damage tuning",
    pass: /damagePlayer\(3 \+ Math\.round\(Math\.random\(\) \* 5\)/.test(game) &&
      !/damagePlayer\(7 \+ Math\.round\(Math\.random\(\) \* 8\)/.test(game),
  },
  {
    name: "AI has anti-stuck route protection",
    pass: /function updateActorStuckState/.test(game) &&
      /actor\.userData\.stuckTime > 1\.2/.test(game) &&
      /updateActorStuckState\(bot, dt\)/.test(game) &&
      /updateActorStuckState\(target, dt\)/.test(game),
  },
  {
    name: "knife increases movement speed",
    pass: /const knifeSpeed = currentWeapon\(\)\.melee \? 1\.15 : 0/.test(game) &&
      /baseSpeed = \(player\.scoped \? 2\.6 : 5\.8\) \+ heroSpeed \+ knifeSpeed/.test(game),
  },
  {
    name: "teammates can carry and plant the spike after player priority window",
    pass: /combatStartedAt/.test(game) && /allyMayTakeSpike/.test(game) && /bot\.userData\.hasSpike = true/.test(game) &&
      /plantSpikeAt\(site, bot\.userData\.label\)/.test(game),
  },
  {
    name: "settings has pointer-lock suppression",
    pass: /suppressSettingsUntil/.test(game) && /pointerlockchange[\s\S]*?performance\.now\(\) > suppressSettingsUntil/.test(game),
  },
  {
    name: "view weapon is hidden on home and match end screens",
    pass: /weaponView\.visible = match\.phase !== "menu" && match\.phase !== "matchEnd"/.test(game),
  },
  {
    name: "view weapon model has separate gun components",
    pass: /function rebuildWeaponView[\s\S]*?const body = new THREE\.Mesh/.test(game) &&
      /const grip = new THREE\.Mesh/.test(game) &&
      /const barrel = new THREE\.Mesh/.test(game) &&
      /const muzzle = new THREE\.Mesh/.test(game) &&
      /const mag = new THREE\.Mesh/.test(game),
  },
  {
    name: "settings panel exposes volume, sfx, sensitivity, and home",
    pass: /id="volume-slider"/.test(html) &&
      /id="sfx-toggle"/.test(html) &&
      /id="sensitivity-slider"/.test(html) &&
      /id="home-button"/.test(html),
  },
  {
    name: "local server exposes 10-player status endpoint",
    pass: /req\.url && req\.url\.startsWith\("\/api\/status"\)/.test(server) &&
      /players: 10/.test(server) &&
      /tickRate: 20/.test(server),
  },
  {
    name: "shipped game files avoid Valorant names",
    pass: !/无畏契约|Valorant/i.test(game + html + css),
  },
  {
    name: "hero abilities have real gameplay effects",
    pass: /player\.health = Math\.min\(100, player\.health \+ 35\)/.test(game) &&
      /target\.userData\.aiTimer \+= 1\.2/.test(game) &&
      /addAbilityEffect\(smoke, 8, true\)/.test(game) &&
      /obstacleMeshes\.push\(mesh\)/.test(game),
  },
  {
    name: "AI uses named tactical routes instead of straight wall-charging",
    pass: /const tacticalRoutes = \{[\s\S]*?attackA:[\s\S]*?attackB:[\s\S]*?defendA:[\s\S]*?defendB:/.test(game) &&
      /function routeClone/.test(game) &&
      /target\.userData\.route = routeClone\(plan\.route\)/.test(game) &&
      /bot\.userData\.route = routeClone\(plan\.route\)/.test(game),
  },
  {
    name: "AI squad roles are assigned and shown compactly",
    pass: /target\.userData\.role = plan\.role/.test(game) &&
      /bot\.userData\.role = plan\.role/.test(game) &&
      /function shortRole/.test(game) &&
      /友\$?\{i\}·/.test(game),
  },
  {
    name: "AI actors keep spacing to reduce teammate wall clumps",
    pass: /function addSquadSpacing/.test(game) &&
      /addSquadSpacing\(bot, teamBots/.test(game) &&
      /addSquadSpacing\(target, targets/.test(game),
  },
  {
    name: "enemy planting requires the enemy spike carrier",
    pass: /target\.userData\.hasSpike = !!plan\.carrier/.test(game) &&
      /target\.visible && target\.userData\.hasSpike && sites\.some/.test(game),
  },
  {
    name: "enemies can target and down teammates, not only the player",
    pass: /function damageTeamBot/.test(game) &&
      /const visibleAllies = teamBots[\s\S]*?filter\(\(bot\) => bot\.visible && bot\.userData\.alive\)/.test(game) &&
      /const visibleThreats = \[\.\.\.visiblePlayer, \.\.\.visibleAllies\]\.sort/.test(game) &&
      /damageTeamBot\(threat\.actor/.test(game) &&
      /match\.allyAlive = livingAllies\(\)/.test(game),
  },
  {
    name: "team status renders individual ally deaths",
    pass: /const allyAlive = i === 0 \? player\.alive : !!allyBot\?\.userData\.alive/.test(game) &&
      /ally\.className = allyAlive \? "alive" : "dead"/.test(game),
  },
  {
    name: "project label is current",
    pass: /Prototype 07/.test(html),
  },
];

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.name}`);
}

if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} gameplay regression checks passed.`);
