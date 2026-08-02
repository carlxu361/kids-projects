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
    name: "player can close buy menu and move during buy phase",
    pass: game.includes("match.phase === \"buy\" && !buyPanel.classList.contains(\"hidden\")") &&
      !game.includes("player.planting || match.phase === \"buy\"") &&
      game.includes("function toggleBuyPanel(force)"),
  },
  {
    name: "player cannot shoot during buy phase",
    pass: /function shoot\(\) \{[\s\S]*?match\.phase !== "playing"/.test(game) &&
      game.includes("if (player.settingsOpen || match.phase === \"buy\" || player.minimapLarge) return"),
  },
  {
    name: "rounds start with spike idle, not pre-planted",
    pass: /function beginRound[\s\S]*?match\.coreState = "idle"/.test(game) && !/match\.coreState = match\.selectedSide/.test(game),
  },
  {
    name: "spike/site interactions use flat ground distance",
    pass: /function nearestSite[\s\S]*?flatDistance\(player\.position, site\.position\)/.test(game) &&
      game.includes("flatDistance(player.position, plantedCoreGroundPosition())"),
  },
  {
    name: "spike pickup and deploy zone are forgiving",
    pass: game.includes("siteRadius: 8.4") &&
      game.includes("new THREE.CylinderGeometry(rules.siteRadius, rules.siteRadius") &&
      game.includes("new THREE.TorusGeometry(rules.siteRadius + 0.35") &&
      game.includes("holdingUse && match.selectedSide === \"attack\" && spawnSpikeMesh?.visible") &&
      game.includes("pickupNearestWeapon();\n    return;") &&
      game.includes("site.disc.material.opacity") &&
      game.includes("site.disc.scale.setScalar"),
  },
  {
    name: "spike deploy prompt explains missing carrier distance and hold action",
    pass: /按住 E 部署/.test(game) && /正在部署/.test(game) &&
      game.includes("function deployHint(near)") &&
      game.includes("function objectiveCarrierText()") &&
      html.includes("id=\"objective-carrier\"") &&
      css.includes("#objective-carrier") &&
      game.includes("爆能器：你携带") &&
      game.includes("爆能器：攻方基地地面") &&
      game.includes("先回攻方门口拾取爆能器") &&
      game.includes("携带爆能器：进入安装点") &&
      game.includes("点拆除（"),
  },
  {
    name: "planting blocks shooting and can be cancelled",
    pass: /function shoot\(\) \{[\s\S]*?player\.planting[\s\S]*?return/.test(game) &&
      /player\.planting = false;[\s\S]*?match\.plantProgress = Math\.max\(0, match\.plantProgress - dt \* 1\.6\)/.test(game),
  },
  {
    name: "site deploy rings highlight when carrying spike",
    pass: game.includes("marker.name = \"siteDeployRing-\" + site.key") &&
      game.includes("site.marker = marker") &&
      game.includes("function updateSiteDeployMarkers(dt)") &&
      game.includes("const canPlant = match.phase === \"playing\"") &&
      game.includes("site.marker.material.opacity") &&
      game.includes("site.marker.scale.setScalar") &&
      game.includes("updateSiteDeployMarkers(dt)"),
  },
  {
    name: "planting and defusing have 3D channel animation",
    pass: game.includes("let objectiveChannelMesh") &&
      game.includes("function makeObjectiveChannelEffect()") &&
      game.includes('ring.name = "channelRing"') &&
      game.includes('beam.name = "channelBeam"') &&
      game.includes('pulse.name = "channelPulse"') &&
      game.includes("function updateObjectiveChannelEffect(dt)") &&
      game.includes("Math.max(match.plantProgress, match.allyPlantProgress, match.aiPlantProgress) / rules.plantSeconds") &&
      game.includes("match.defuseProgress / rules.defuseSeconds") &&
      game.includes("progress: `${progress}%`") &&
      !game.includes("progress: `%`") &&
      game.includes("objectiveChannelMesh.visible = match.phase === \"playing\" && progress > 0.01") &&
      game.includes("updateObjectiveChannelEffect(dt)"),
  },
  {
    name: "planted spike uses planter position and defuse uses planted core",
    pass: game.includes("function plantSpikeAt(site, sourceLabel, plantPosition = site.position)") &&
      game.includes("coreMesh.position.set(plantedAt.x, 0.9, plantedAt.z)") &&
      game.includes('plantSpikeAt(near.site, "你", player.position)') &&
      game.includes("plantSpikeAt(site, bot.userData.label, bot.position)") &&
      game.includes('plantSpikeAt(match.activeSite, "敌方", planter.position)') &&
      game.includes("function plantedCoreGroundPosition()") &&
      game.includes("flatDistance(player.position, plantedCoreGroundPosition())") &&
      game.includes("objectiveChannelMesh.position.set(channelSource.x, 0.02, channelSource.z)"),
  },
  {
    name: "road weapon pickups are disabled",
    pass: /function addPickups\(\) \{\s*\/\/ Weapons should enter the round from buy phase or enemy drops, not random road loot\.\s*\}/.test(game),
  },
  {
    name: "map is enlarged beyond the early prototype",
    pass: /const mapBounds = 150;/.test(game) && /GridHelper\(300, 100/.test(game),
  },
  {
    name: "map uses a non-rectangular floor shape",
    pass: /const floorShape = new THREE\.Shape\(\[[\s\S]*?new THREE\.ShapeGeometry\(floorShape\)/.test(game),
  },
  {
    name: "player and spike spawn are deep in the attack base",
    pass: /player\.position\.set\(0, eyeHeight, match\.selectedSide === "attack" \? 128 : -128\)/.test(game) &&
      /spawnSpikeMesh\.position\.set\(0, 0\.14, 124\)/.test(game),
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
    name: "player can drop carried spike and any gun",
    pass: game.includes("function dropCurrentWeapon()") &&
      game.includes("dropWeaponAt(key, player.position)") &&
      game.includes("if (!weapons[key] || weapons[key].melee) return") &&
      !/function dropWeaponAt[\s\S]*?key === "pistol"[\s\S]*?function addPickups/.test(game) &&
      game.includes("player.inventory.delete(key)") &&
      game.includes('if (!key || weapons[key]?.melee)') &&
      !/function dropCurrentWeapon[\s\S]*?key === "pistol"[\s\S]*?function dropSpike/.test(game) &&
      game.includes("function dropSpike()") &&
      game.includes("spawnSpikeMesh.position.set(dropPoint.x, 0.14, dropPoint.z)") &&
      game.includes(`dropWeapon: ["KeyG"]`) &&
      game.includes(`dropSpike: ["KeyT"]`) &&
      game.includes(`dropSpike: ["KeyY", "KeyT"]`) &&
      game.includes(`if (keyMatches("dropWeapon", event.code)) dropCurrentWeapon()`) &&
      game.includes(`if (keyMatches("dropSpike", event.code)) dropSpike()`) &&
      html.includes("G 丢当前枪 · T 丢爆能器"),
  },
  {
    name: "defense must defuse after planted spike and ally AI can defuse",
    pass: game.includes("function completeDefuse(sourceLabel = \"你\")") &&
      game.includes("攻方全员被击倒，但守方仍需拆除爆能器") &&
      game.includes("攻方全员被击倒，仍需拆除爆能器") &&
      game.includes("match.coreState === \"planted\" && match.selectedSide === \"defense\"") &&
      game.includes("const defenseDefuser = match.selectedSide === \"defense\" && match.coreState === \"planted\"") &&
      game.includes("bot.userData.combatState = defuseDist <= rules.siteRadius ? \"拆包\" : \"回防\"") &&
      game.includes("completeDefuse(bot.userData.label)") &&
      game.includes("spawnSpikeMesh.position.copy(target.position).setY(0.14)"),
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
    pass: game.includes(`map: ["KeyX"]`) &&
      game.includes(`map: ["Tab", "KeyX"]`) &&
      game.includes(`if (keyMatches("map", event.code))`) &&
      game.includes("event.preventDefault()") &&
      /X 战术图/.test(html) &&
      !/KeyM/.test(game),
  },
  {
    name: "fullscreen minimap releases and restores pointer lock",
    pass: game.includes("function setMinimapLarge(open)") &&
      game.includes("document.exitPointerLock()") &&
      game.includes("player.pitch = THREE.MathUtils.clamp(player.pitch, -0.22, 0.22)") &&
      game.includes("canvas.requestPointerLock()") &&
      game.includes("player.settingsOpen || match.phase === \"buy\" || player.minimapLarge") &&
      game.includes("cancelAbilityAim(false)"),
  },
  {
    name: "crosshair quick ping creates a small ally-only light column",
    pass: game.includes(`quickPing: ["AltLeft", "AltRight"]`) &&
      game.includes(`if (!event.repeat && keyMatches("quickPing", event.code)) addCrosshairPing()`) &&
      game.includes("function addCrosshairPing()") &&
      game.includes("{ small: true }") &&
      game.includes("crosshairSmallPingBeam") &&
      game.includes("beamHeight = small ? 5.2 : 16") &&
      game.includes("expiresAt: performance.now() + (small ? 9000 : 14000)") &&
      html.includes("Alt 小指示"),
  },
  {
    name: "minimap does not reveal enemies",
    pass: /function drawMinimap[\s\S]*?for \(const bot of teamBots\)/.test(game) &&
      !/drawMiniDot\(target\.position/.test(game),
  },
  {
    name: "3D pings use a vertical light beam",
    pass: game.includes("function addWorldPing(x, z, { small = false } = {})") &&
      game.includes("beamHeight = small ? 5.2 : 16") &&
      game.includes("beamRadius = small ? 0.045 : 0.12"),
  },
  {
    name: "minimap pings create ally-only tactical commands",
    pass: game.includes('match.tacticalCommand = {') &&
      game.includes('position: new THREE.Vector3(x, 0, z)') &&
      game.includes("expiresAt: performance.now() + (small ? 9000 : 14000)") &&
      game.includes('已下达队友标记') &&
      game.includes('const heardPlayer = !canSee && canHearPlayerNoise(target)') &&
      !game.includes('canHearPlayerNoise(target, match.tacticalCommand)'),
  },
  {
    name: "warden health is capped at 100",
    pass: /warden: \{[^}]*healthBonus: 0/.test(game) && /player\.health = Math\.min\(100, player\.health \+ 35\)/.test(game),
  },
  {
    name: "stealth walking and posture affect detection",
    pass: /function canDetectPlayer[\s\S]*?const posture = playerPosture\(\)/.test(game) &&
      game.includes("const postureLimit = posture === \"prone\" ? 18 : posture === \"crouch\" ? 30 : distanceLimit") &&
      game.includes("const nearReveal = posture === \"prone\" ? 6 : posture === \"crouch\" ? 8 : 10") &&
      game.includes("if (stealth && distance > postureLimit) return false") &&
      game.includes("const frontThreshold = posture === \"prone\" ? 0.55 : posture === \"crouch\" ? 0.36 : 0.2") &&
      game.includes("return inFront || !stealth || distance < nearReveal"),
  },
  {
    name: "AI damage is reduced from earlier high-damage tuning",
    pass: /damagePlayer\(3 \+ Math\.round\(Math\.random\(\) \* 5\)/.test(game) &&
      !/damagePlayer\(7 \+ Math\.round\(Math\.random\(\) \* 8\)/.test(game),
  },
  {
    name: "AI has anti-stuck route protection and escape nudges",
    pass: /function updateActorStuckState/.test(game) &&
      /actor\.userData\.stuckTime > 1\.2/.test(game) &&
      game.includes("function unstuckActor(actor") &&
      game.includes("actor.userData.combatState = \"脱困\"") &&
      game.includes("const freed = unstuckActor(actor)") &&
      game.includes("function safeNavPoint(point") &&
      game.includes("return points.map((point) => safeNavPoint(point.clone()))") &&
      game.includes("const angles = [0, 0.38, -0.38, 0.72, -0.72, 1.08, -1.08, Math.PI / 2, -Math.PI / 2]") &&
      game.includes("const score = Math.hypot(candidate.x - targetX, candidate.z - targetZ) + candidate.penalty * 0.12") &&
      game.includes("return safeNavPoint(anchor)") &&
      /updateActorStuckState\(bot, dt\)/.test(game) &&
      /updateActorStuckState\(target, dt\)/.test(game),
  },
  {
    name: "knife increases movement speed",
    pass: /const knifeSpeed = currentWeapon\(\)\.melee \? 1\.15 : 0/.test(game) &&
      game.includes("const armorSpeedScale = armorDefs[player.armorType]?.speedScale || 1") &&
      game.includes("const baseSpeed = ((player.scoped ? 2.6 : 5.8) + heroSpeed + skillSpeed + knifeSpeed) * armorSpeedScale"),
  },
  {
    name: "buy menu offers armor and displays credits as star core",
    pass: game.includes("const armorDefs = {") &&
      game.includes("light: { label: \"轻甲\", max: 120") &&
      game.includes("heavy: { label: \"重甲\", max: 150") &&
      game.includes("revive: { label: \"复活甲\", max: 100") &&
      game.includes('appendBuySection("护甲", "先选生存能力")') &&
      game.includes("button.dataset.armor = key") &&
      game.includes("buyArmor(button.dataset.armor)") &&
      game.includes("creditsLabel.textContent = `星核 ${player.credits}`") &&
      html.includes("id=\"armor-label\"") &&
      html.includes("class=\"weapon-panel-top\"><div id=\"weapon-name\">Rifle</div><div id=\"credits-label\">星核 800") &&
      css.includes(".weapon-panel-top") &&
      css.includes("#armor-label") &&
      css.includes(".buy-item.armor-buy"),
  },
  {
    name: "armor absorbs damage, heavy slows movement, revive armor regenerates after break",
    pass: /function damagePlayer[\s\S]*?const absorbed = Math\.min\(player\.armor, incoming\)/.test(game) &&
      /player\.armor = Math\.max\(0, player\.armor - absorbed\)/.test(game) &&
      /const finalAmount = incoming - absorbed/.test(game) &&
      /player\.health = Math\.max\(0, player\.health - finalAmount\)/.test(game) &&
      /player\.armorType === "revive"[\s\S]*?player\.reviveArmorBrokenAt = performance\.now\(\)/.test(game) &&
      /heavy: \{ label: "重甲"[\s\S]*?speedScale: 0\.9/.test(game) &&
      /function updateArmorRegen\(dt\)[\s\S]*?armorDefs\.revive\.regenDelay[\s\S]*?player\.armor = Math\.min\(player\.maxArmor, player\.armor \+ armorDefs\.revive\.regenRate \* dt\)/.test(game),
  },
  {
    name: "teammates can carry and plant the spike after player priority window",
    pass: /combatStartedAt/.test(game) && /allyMayTakeSpike/.test(game) && /bot\.userData\.hasSpike = true/.test(game) &&
      /plantSpikeAt\(site, bot\.userData\.label, bot\.position\)/.test(game),
  },
  {
    name: "player can tap-toggle lean peek and scoped view hides weapon",
    pass: game.includes("leanToggle: 0") &&
      game.includes("function toggleLean(side)") &&
      game.includes("player.leanToggle = player.leanToggle === side ? 0 : side") &&
      game.includes(`leanLeft: ["KeyC"]`) &&
      game.includes(`leanRight: ["KeyV"]`) &&
      game.includes(`if (!event.repeat && keyMatches("leanLeft", event.code)) toggleLean(-1)`) &&
      game.includes(`if (!event.repeat && keyMatches("leanRight", event.code)) toggleLean(1)`) &&
      game.includes('const leanInput = match.phase === "playing" && !player.prone ? player.leanToggle : 0') &&
      game.includes("player.lean = THREE.MathUtils.damp") &&
      game.includes("camera.position.addScaledVector(right, leanOffset)") &&
      game.includes("camera.rotation.z = -player.lean * 0.13") &&
      game.includes(`weaponView.visible = match.phase !== "menu" && match.phase !== "matchEnd" && !(player.scoped && !currentWeapon().melee)`) &&
      html.includes("C/V 单点探头"),
  },
  {
    name: "settings has pointer-lock suppression and centralized input reset",
    pass: /suppressSettingsUntil/.test(game) &&
      /pointerlockchange[\s\S]*?performance\.now\(\) > suppressSettingsUntil/.test(game) &&
      game.includes("let settingsOpenedAt = 0") &&
      game.includes("settingsOpenedAt = performance.now()") &&
      game.includes("if (event.repeat) return") &&
      game.includes("performance.now() - settingsOpenedAt < 220") &&
      game.includes("function resetInputState") &&
      game.includes("player.velocity.set(0, 0, 0)") &&
      game.includes("player.planting = false") &&
      game.includes("resetInputState({ resetAim: true })"),
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
      /const mag = new THREE\.Mesh/.test(game) &&
      game.includes("viewReceiver") &&
      game.includes("viewEjectionPort") &&
      game.includes("viewTriggerGuard") &&
      game.includes("viewForegrip") &&
      game.includes("viewRightHand") &&
      game.includes("viewLeftHand") &&
      game.includes("viewScopeLens"),
  },
  {
    name: "characters use upgraded tactical humanoid models with held weapons",
    pass: game.includes('function addHumanoidModel(group, options)') &&
      game.includes('const pelvis = new THREE.Mesh') &&
      game.includes('const belt = new THREE.Mesh') &&
      game.includes('const chestPlate = new THREE.Mesh') &&
      game.includes('const frontBadge = new THREE.Mesh') &&
      game.includes('const jawGuard = new THREE.Mesh') &&
      game.includes('const antenna = new THREE.Mesh') &&
      game.includes('const glove = new THREE.Mesh') &&
      game.includes('const kneePad = new THREE.Mesh') &&
      game.includes('const gunStock = new THREE.Mesh') &&
      game.includes('const gunMag = new THREE.Mesh') &&
      game.includes('const gunSight = new THREE.Mesh') &&
      /function createTarget[\s\S]*?addHumanoidModel\(group/.test(game) &&
      /function createTeamBot[\s\S]*?addHumanoidModel\(group/.test(game),
  },
  {
    name: "settings panel exposes and persists volume sfx sensitivity quality keymap and home",
    pass: /id="volume-slider"/.test(html) &&
      /id="sfx-toggle"/.test(html) &&
      /id="sensitivity-slider"/.test(html) &&
      /id="quality-select"/.test(html) &&
      /id="keymap-select"/.test(html) &&
      /id="home-button"/.test(html) &&
      game.includes("settingsStorageKey") &&
      game.includes("function saveSettings()") &&
      game.includes("function loadSettings()") &&
      game.includes("quality: performanceMode.profile") &&
      game.includes("keymap: keymapMode") &&
      game.includes("localStorage.setItem(settingsStorageKey") &&
      game.includes("localStorage.getItem(settingsStorageKey") &&
      /volumeSlider\.addEventListener\("input"[\s\S]*?saveSettings\(\)/.test(game) &&
      /sfxToggle\.addEventListener\("change"[\s\S]*?saveSettings\(\)/.test(game) &&
      /sensitivitySlider\.addEventListener\("input"[\s\S]*?saveSettings\(\)/.test(game) &&
      /qualitySelect\.addEventListener\("change"[\s\S]*?applyPerformanceProfile/.test(game) &&
      /keymapSelect\.addEventListener\("change"[\s\S]*?applyKeymapProfile/.test(game),
  },
  {
    name: "settings keymap profile changes controls HUD and minimap hints",
    pass: game.includes("const keymapProfiles = {") &&
      game.includes(`default: {`) &&
      game.includes(`compact: {`) &&
      game.includes(`dropSpike: ["KeyY", "KeyT"]`) &&
      game.includes(`map: ["Tab", "KeyX"]`) &&
      game.includes("function applyKeymapProfile") &&
      game.includes("weaponHint.textContent = activeKeymap().hint") &&
      game.includes("minimapHint.textContent = activeKeymap().minimapHint") &&
      game.includes(`Y/T 丢爆能器 · Tab/X 战术图`) &&
      game.includes(`minimapHint: "左键标记 · Tab/X 关闭 · Alt 准心小指示"`) &&
      html.includes(`id="keymap-select"`) &&
      html.includes(`id="minimap-hint"`)
  },
  {
    name: "settings quality profile changes render scale and update cadence",
    pass: game.includes("const performanceProfiles = {") &&
      game.includes(`smooth: { label: "流畅", renderScale: 0.54`) &&
      game.includes(`balanced: { label: "均衡", renderScale: 0.62`) &&
      game.includes(`sharp: { label: "清晰", renderScale: 0.78`) &&
      game.includes("function applyPerformanceProfile") &&
      game.includes("qualitySelect.value = performanceMode.profile") &&
      game.includes("renderer.setPixelRatio(Math.min(window.devicePixelRatio, performanceMode.maxPixelRatio) * performanceMode.renderScale)"),
  },
  {
    name: "round audio has distinct win loss and spike warning cues",
    pass: game.includes("victory() {") &&
      game.includes("defeat() {") &&
      game.includes("warning() {") &&
      game.includes("if (playerWon) sfx.victory()") &&
      game.includes("else sfx.defeat()") &&
      game.includes("lastCoreWarningSecond") &&
      game.includes("warningSecond > 0 && warningSecond <= 10") &&
      game.includes("sfx.warning()"),
  },
  {
    name: "local server exposes rich local room status",
    pass: /req\.url && req\.url\.startsWith\("\/api\/status"\)/.test(server) &&
      /name: "裂界训练房"/.test(server) &&
      /players: 10/.test(server) &&
      /tickRate: 20/.test(server) &&
      /slots: \{ attackers: 5, defenders: 5 \}/.test(server) &&
      /scoreLimit: 13/.test(server) &&
      /features: \["buy-phase", "5v5-bots", "spike-objective", "tactical-pings"\]/.test(server),
  },
  {
    name: "server badge renders room slots tick rate and latency",
    pass: game.includes("const totalSlots = data.slots") &&
      game.includes("serverStatus = roomName +") &&
      game.includes("tickRate + \"Hz") &&
      game.includes("ping + \"ms"),
  },
  {
    name: "local server falls back when default port is busy",
    pass: server.includes("const preferredPort = Number(process.env.PORT || 5173)") &&
      server.includes("function listen(port, attempts = 0)") &&
      server.includes("error.code === \"EADDRINUSE\"") &&
      server.includes("attempts < 20") &&
      server.includes("!process.env.PORT") &&
      server.includes("listen(nextPort, attempts + 1)") &&
      server.includes("listen(preferredPort)"),
  },
  {
    name: "shipped game files avoid Valorant names",
    pass: !/无畏契约|Valorant/i.test(game + html + css),
  },
  {
    name: "each hero has three skills and a dedicated hero select panel",
    pass: game.includes("const abilitySlots = [") &&
      game.includes('q: { key: "Q", name: "急救环"') &&
      game.includes('f: { key: "F", name: "守位信标"') &&
      game.includes('h: { key: "H", name: "装甲补给"') &&
      game.includes('f: { key: "F", name: "闪焰压制"') &&
      game.includes('h: { key: "H", name: "热浪推进"') &&
      game.includes('f: { key: "F", name: "热源扫描"') &&
      game.includes('h: { key: "H", name: "推进号令"') &&
      game.includes('f: { key: "F", name: "静风步"') &&
      game.includes('h: { key: "H", name: "侧闪"') &&
      game.includes(`abilityQ: ["KeyQ"]`) &&
      game.includes(`abilityF: ["KeyF"]`) &&
      game.includes(`abilityH: ["KeyH"]`) &&
      game.includes(`if (keyMatches("abilityQ", event.code)) startAbilityAim("q")`) &&
      game.includes(`if (keyMatches("abilityF", event.code)) startAbilityAim("f")`) &&
      game.includes(`if (keyMatches("abilityH", event.code)) startAbilityAim("h")`) &&
      html.includes('id="hero-select-panel"') &&
      html.includes('每名英雄 3 个原创技能') &&
      html.includes('Q/F/H 技能') &&
      css.includes('#hero-select-panel'),
  },
  {
    name: "hero abilities have real tactical effects",
    pass: game.includes("player.health = Math.min(100, player.health + 35)") &&
      game.includes('bot.userData.combatState = "守位"') &&
      game.includes("const guardUntil = performance.now() + 6500") &&
      game.includes("player.guardUntil = guardUntil") &&
      game.includes("bot.userData.guardUntil = guardUntil") &&
      game.includes("const guarded = performance.now() < (player.guardUntil || 0)") &&
      game.includes("const guarded = performance.now() < (bot.userData.guardUntil || 0)") &&
      game.includes("const finalAmount = guarded ? Math.max(1, Math.round(amount * 0.62)) : amount") &&
      game.includes('target.userData.combatState = "压制"') &&
      game.includes("const smokedTargets = targets.filter") &&
      game.includes('target.userData.combatState = "迟疑"') &&
      game.includes("target.userData.suppressedUntil = performance.now() + 4200") &&
      game.includes("const abilityZones = []") &&
      game.includes("function addAbilityZone(type, position, radius, ttl)") &&
      game.includes('burst.name = "flareBurnZone"') &&
      game.includes('addAbilityZone("flare", zonePoint, 5.5, 5.5)') &&
      game.includes("const burnZone = abilityZones.find") &&
      game.includes('target.userData.combatState = "灼烧"') &&
      game.includes("target.userData.burnTickAt = nowMs + 520") &&
      game.includes('applyTargetDamage(target, 7, false, "焰手燃烧区")') &&
      game.includes("tryMoveActor(target, addSquadSpacing(target, targets, away), 2.2, dt)") &&
      game.includes("abilityZones[i].ttl -= dt") &&
      game.includes("target.userData.smokedUntil = performance.now() + 8000") &&
      game.includes('addAbilityZone("smoke", smoke.position, 7.2, 8)') &&
      game.includes("const smokeCover = abilityZones.find") &&
      game.includes('bot.userData.combatState = "借烟"') &&
      game.includes("safeNavPoint(smokeCover.position.clone()).sub(bot.position)") &&
      game.includes("const smokeZone = abilityZones.find") &&
      game.includes("smokeImpaired || smokeZone") &&
      game.includes("target.userData.holdPoint = null") &&
      game.includes("target.userData.aiTimer = Math.max(target.userData.aiTimer, 0.9)") &&
      game.includes("target.position.clone().sub(smokeZone.position)") &&
      game.includes("!suppressed && !smokeImpaired") &&
      game.includes("const decoyNoise = player.position.clone().setY(0)") &&
      game.includes("player.lastNoisePosition.copy(decoyNoise)") &&
      game.includes("player.decoyUntil = performance.now() + 2600") &&
      game.includes("player.decoyPosition.copy(decoyNoise)") &&
      game.includes("function activeNoisePosition()") &&
      game.includes("return performance.now() < (player.decoyUntil || 0) ? player.decoyPosition : player.lastNoisePosition") &&
      game.includes("const chasingDecoy = performance.now() < (player.decoyUntil || 0)") &&
      game.includes('target.userData.combatState = chasingDecoy ? "诱导" : "搜声"') &&
      game.includes("addAbilityEffect(smoke, 8, true)") &&
      game.includes("obstacleMeshes.push(mesh)"),
  },
  {
    name: "hero ability HUD shows ready cooldown and aiming state",
    pass: html.includes(`id="ability-label"`) &&
      css.includes(`#ability-label`) &&
      game.includes(`const abilityLabel = document.querySelector("#ability-label")`) &&
      game.includes(`function abilityHudText(hero)`) &&
      game.includes(`function abilityHudMarkup(hero)`) &&
      game.includes(`const aiming = player.pendingAbilitySlot === slot`) &&
      game.includes(`const stateLabel = aiming ? "预瞄" : cooldown > 0 ? "冷却" : "就绪"`) &&
      game.includes(`abilityLabel.innerHTML = abilityHudMarkup(hero)`),
  },
  {
    name: "hero ability HUD renders three compact status pills",
    pass: html.includes(`class="ability-pill ready" data-slot="q"`) &&
      html.includes(`class="ability-pill ready" data-slot="f"`) &&
      html.includes(`class="ability-pill ready" data-slot="h"`) &&
      css.includes(`.ability-pill.ready`) &&
      css.includes(`.ability-pill.cooldown`) &&
      game.includes(`class="ability-pill `) &&
      game.includes(`data-slot="`) &&
      game.includes(`aria-label="`),
  },
  {
    name: "hero abilities show cast range and landing feedback",
    pass: game.includes("const abilityPreviewSpecs = {") &&
      game.includes("function abilityPreviewSpec(heroKey, slot)") &&
      game.includes("function abilityPreviewPoint(heroKey, slot)") &&
      game.includes("function addAbilityTargetPreview(heroKey, slot, color)") &&
      game.includes("abilityTargetPreview") &&
      game.includes("abilityTargetRange") &&
      game.includes("addAbilityTargetPreview(player.heroKey, slot, hero.color)"),
  },
  {
    name: "aimed hero abilities use confirm cancel preview flow",
    pass: game.includes("pendingAbilitySlot: null") &&
      game.includes("let abilityAimPreview = null") &&
      game.includes("function abilityRequiresConfirmation(heroKey, slot)") &&
      game.includes("function startAbilityAim(slot)") &&
      game.includes("function confirmAbilityAim()") &&
      game.includes("function cancelAbilityAim(showFeed = true)") &&
      game.includes("updateAbilityAimPreview()") &&
      game.includes("if (player.pendingAbilitySlot) {") &&
      game.includes("confirmAbilityAim();") &&
      game.includes("cancelAbilityAim();") &&
      game.includes("player.pendingAbilitySlot || match.phase") &&
      css.includes(".ability-pill.aiming"),
  },
  {
    name: "cooldown abilities explain why the cast did not fire",
    pass: game.includes("if (!skill) return") &&
      game.includes("const cooldown = player.abilityCooldowns?.[slot] || 0") &&
      game.includes("if (cooldown > 0)") &&
      game.includes("冷却中") &&
      game.includes("Math.ceil(cooldown)"),
  },
  {
    name: "teammates use tactical cover holds instead of only rushing routes",
    pass: game.includes("const tacticalHoldPoints") &&
      game.includes("function nearestTacticalHoldPoint") &&
      game.includes("bot.userData.combatState = \"找掩体\"") &&
      game.includes("bot.userData.combatState = \"架枪\"") &&
      game.includes("bot.userData.holdPoint = holdPoint"),
  },
  {
    name: "teammates share threat memory and rotate to trade support",
    pass: game.includes("teamThreatMemory") &&
      game.includes("function rememberTeamThreat") &&
      game.includes("function teamThreatPointForBot") &&
      game.includes("rememberTeamThreat(sourcePosition, source)") &&
      game.includes("const sharedThreat = teamThreatPointForBot(bot)") &&
      game.includes(`bot.userData.combatState = "补枪"`) &&
      game.includes("nearestTacticalHoldPoint(bot, sharedThreat, teamBots)") &&
      game.includes("damageTeamBot(threat.actor, 10 + Math.round(Math.random() * 8), target.userData.label, target.position)"),
  },
  {
    name: "team panel shows teammate tactical state",
    pass: game.includes("const allyState = i === 0 ? \"玩家\"") &&
      game.includes("<u>${allyState}</u>") &&
      css.includes(".team-card u"),
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
    name: "enemies use cover holds sound search and plant states",
    pass: game.includes("target.userData.combatState = \"找掩体\"") &&
      game.includes("target.userData.combatState = \"架枪\"") &&
      game.includes('target.userData.combatState = chasingDecoy ? "诱导" : "搜声"') &&
      game.includes("target.userData.combatState = target.userData.hasSpike ? \"带包\" : \"推进\"") &&
      game.includes("planter.userData.combatState = \"部署\"") &&
      game.includes("nearestTacticalHoldPoint(target, threat.position, targets)"),
  },
  {
    name: "AI actors keep spacing to reduce teammate wall clumps",
    pass: /function addSquadSpacing/.test(game) &&
      /addSquadSpacing\(bot, teamBots/.test(game) &&
      /addSquadSpacing\(target, targets/.test(game),
  },
  {
    name: "teammates follow tactical pings when not fighting or carrying spike",
    pass: game.includes('function commandPointForBot(bot, index)') &&
      game.includes('if (bot.userData.hasSpike || bot.userData.health <= 35) return null') &&
      game.includes('const botIndex = teamBots.indexOf(bot)') &&
      game.includes('const commandPoint = commandPointForBot(bot, botIndex)') &&
      game.includes('bot.userData.commandHold = commandPoint.clone()') &&
      game.includes('tryMoveActor(bot, addSquadSpacing(bot, teamBots, commandPoint.clone().sub(bot.position)), 2.35, dt)'),
  },
  {
    name: "teammates escort carriers and hold planted objective",
    pass: game.includes("function objectivePointForBot(bot, index)") &&
      game.includes("const objectivePoint = objectivePointForBot(bot, botIndex)") &&
      game.includes("const objectiveState = match.coreState === \"planted\" ? (match.selectedSide === \"attack\" ? \"守包\" : \"回防\") : \"护包\"") &&
      game.includes("bot.userData.combatState = objectiveState") &&
      game.includes("tryMoveActor(bot, addSquadSpacing(bot, teamBots, objectivePoint.clone().sub(bot.position)), objectiveState === \"护包\" ? 2.25 : 2.05, dt)"),
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
    name: "team status shows ally health bars and refreshes on damage/heal",
    pass: game.includes('const allyHealth = i === 0 ? player.health : Math.max(0, Math.round(allyBot?.userData.health || 0))') &&
      game.includes('ally.classList.add("team-card")') &&
      game.includes('const allyState = i === 0 ? "玩家"') &&
      game.includes('ally.innerHTML = `<b>${allyText}${allyBot?.userData.hasSpike ? "·包" : ""}</b><u>${allyState}</u><i><em style="width:${allyHealth}%"></em></i>`') &&
      /function damageTeamBot[\s\S]*?bot\.userData\.health = Math\.max\(0, bot\.userData\.health - finalAmount\);[\s\S]*?updateTeamPanel\(\);/.test(game) &&
      /function useHeroAbility[\s\S]*?updateTeamPanel\(\);[\s\S]*?addFeed\("守护者：急救环治疗并给近队友护甲守位"\)/.test(game) &&
      css.includes('.team-card em'),
  },
  {
    name: "player noise separates stealth walking from loud actions",
    pass: game.includes("function makePlayerNoise") &&
      game.includes("function canHearPlayerNoise") &&
      game.includes("!playerIsStealthWalking() && performance.now() > player.nextFootstepNoiseAt") &&
      game.includes("makePlayerNoise(24)") &&
      game.includes("makePlayerNoise(handling.noiseRadius)") &&
      game.includes("handling.noiseRadius = 68") &&
      game.includes("handling.noiseRadius = 42"),
  },
  {
    name: "crouch and tap-prone change movement height speed and noise feedback",
    pass: game.includes("function playerPosture()") &&
      game.includes('keys.has("ControlLeft") || keys.has("ControlRight")') &&
      game.includes("function toggleProne()") &&
      game.includes(`prone: ["KeyZ"]`) &&
      game.includes(`if (!event.repeat && keyMatches("prone", event.code)) toggleProne()`) &&
      game.includes('if (posture === "prone") return 0.72') &&
      game.includes('if (posture === "crouch") return 1.18') &&
      game.includes("function postureSpeedMultiplier()") &&
      game.includes("function postureNoiseRadius(base)") &&
      game.includes('const postureLimit = posture === "prone" ? 18 : posture === "crouch" ? 30 : distanceLimit') &&
      game.includes('const frontThreshold = posture === "prone" ? 0.55 : posture === "crouch" ? 0.36 : 0.2') &&
      game.includes("if (stealth && distance > postureLimit) return false") &&
      game.includes("player.position.y = THREE.MathUtils.damp(player.position.y, targetEyeHeight") &&
      html.includes("Ctrl 半蹲 · Z 单点趴下") &&
      html.includes('id="noise-label"'),
  },
  {
    name: "damage direction indicator shows incoming attack side near crosshair",
    pass: game.includes("function showDamageDirection(sourcePosition)") &&
      game.includes('const senseDir = abs < Math.PI * 0.25 ? "front"') &&
      game.includes("damageSense.dataset.dir = senseDir") &&
      game.includes('damageSense.classList.remove("hidden")') &&
      game.includes('damageSense.classList.add("hidden")') &&
      html.includes('id="damage-sense"') &&
      html.includes('class="sense-front"') &&
      css.includes('#damage-sense[data-dir="front"] .sense-front') &&
      game.includes("damagePlayer(3 + Math.round(Math.random() * 5), target.userData.label, target.position)"),
  },
  {
    name: "enemies investigate sound without shooting through walls",
    pass: game.includes("const heardPlayer = !canSee && canHearPlayerNoise(target)") &&
      game.includes("else if (heardPlayer)") &&
      game.includes("const noisePosition = activeNoisePosition()") &&
      game.includes("const toNoise = noisePosition.clone().sub(target.position)") &&
      game.includes("tryMoveActor(target, addSquadSpacing(target, targets, toNoise), chasingDecoy ? 2.35 : 2.05, dt)") &&
      /if \(canSee && target\.userData\.aiTimer <= 0[^{]*\)/.test(game),
  },
  {
    name: "AI low-health actors retreat instead of re-peeking",
    pass: game.includes("function retreatPointFor(actor)") &&
      game.includes("const botLowHealth = bot.userData.health <= 35") &&
      game.includes("const targetLowHealth = target.userData.health <= 35") &&
      game.includes("if (botLowHealth && seesEnemy)") &&
      game.includes("if (targetLowHealth && canSee)") &&
      game.includes("!botLowHealth") &&
      game.includes("!targetLowHealth"),
  },
  {
    name: "AI clutch state slows movement and firing cadence",
    pass: game.includes("function isClutchState()") &&
      game.includes("const botMoveSpeed = clutch ? 1.55 : 2.2") &&
      game.includes("tryMoveActor(target, addSquadSpacing(target, targets, holdPoint.clone().sub(target.position)), distance > 15 ? 1.65 : 1.1, dt)") &&
      game.includes("bot.userData.aiTimer = (clutch ? 1.55 : 1.1) + Math.random() * 0.8") &&
      game.includes("target.userData.aiTimer = (clutch ? 1.15 : 0.75) + Math.random() * 0.65"),
  },
  {
    name: "map has tactical choke and connector walls",
    pass: game.includes("[-92, 1.35, -4, 4, 2.7, 28]") &&
      game.includes("[92, 1.35, -6, 4, 2.7, 28]") &&
      game.includes("[-18, 1.35, 18, 4, 2.7, 24]") &&
      game.includes("[18, 1.35, 18, 4, 2.7, 24]") &&
      game.includes("[0, 1.35, 8, 4, 2.7, 24]"),
  },
  {
    name: "map has denser site mid and flank cover clusters",
    pass: game.includes("[-52, 0.72, -14, 4, 1.45, 12]") &&
      game.includes("[64, 0.72, -30, 4, 1.45, 12]") &&
      game.includes("[0, 0.72, 20, 12, 1.45, 4]") &&
      game.includes("[-88, 0.72, 56, 6, 1.45, 14]") &&
      game.includes("[88, 0.72, 56, 6, 1.45, 14]"),
  },
  {
    name: "map has layered site boxes entry corners and flank lanes",
    pass: game.includes("const tacticalCoverMat = new THREE.MeshLambertMaterial") &&
      game.includes("[-58, 0.95, -20, 4, 1.9, 4]") &&
      game.includes("[58, 0.95, -22, 4, 1.9, 4]") &&
      game.includes("[-46, 1.25, -2, 18, 2.5, 4]") &&
      game.includes("[46, 1.25, -4, 18, 2.5, 4]") &&
      game.includes("[-104, 1.1, 34, 4, 2.2, 26]") &&
      game.includes("[104, 1.1, 34, 4, 2.2, 26]") &&
      game.includes("[-92, 0.035, 6, 20, 0.06, 58]") &&
      game.includes("[92, 0.035, 6, 20, 0.06, 58]"),
  },
  {
    name: "map has spawn buffers route bands and side-lane segmentation",
    pass: game.includes("const routeMat = new THREE.MeshLambertMaterial") &&
      game.includes("const spawnCoverMat = new THREE.MeshLambertMaterial") &&
      game.includes("const routeBands = [") &&
      game.includes("const spawnCovers = [") &&
      game.includes("[-36, 1.25, 72, 4, 2.5, 18]") &&
      game.includes("[36, 1.25, 72, 4, 2.5, 18]") &&
      game.includes("[-22, 0.72, 84, 10, 1.45, 4]") &&
      game.includes("[0, 0.62, -106, 14, 1.24, 3]") &&
      game.includes("new THREE.Vector3(-92, 0, 72)") &&
      game.includes("new THREE.Vector3(92, 0, 72)") &&
      game.includes("new THREE.Vector3(-68, 0, -118)") &&
      game.includes("new THREE.Vector3(68, 0, -118)"),
  },
  {
    name: "map has original buildings and no floating 3D callout labels",
    pass: game.includes("function addBuilding(x, z, w, d, h") &&
      game.includes('body.name = "mapBuilding"') &&
      game.includes('roof.name = "mapBuildingRoof"') &&
      game.includes("const buildings = [") &&
      game.includes("[-132, 50, 18, 36, 8") &&
      game.includes("[118, -88, 28, 22, 9") &&
      !game.includes("function addCalloutLabel") &&
      !game.includes("mapCallout-"),
  },
  {
    name: "minimap has tactical zone labels without enemy reveal",
    pass: game.includes("function drawMiniLabel(text, x, z") &&
      game.includes("const minimapCallouts = [") &&
      game.includes("[\"A\", -58, -20") &&
      game.includes("[\"B\", 58, -22") &&
      game.includes("[\"中\", 0, 0") &&
      game.includes("[\"A长\", -92, 54") &&
      game.includes("[\"B长\", 92, 52") &&
      game.includes("for (const [text, x, z, color] of minimapCallouts) drawMiniLabel(text, x, z, color)") &&
      !/drawMiniDot\(target\.position/.test(game),
  },
  {
    name: "minimap shows ally tactical route intent without enemy routes",
    pass: game.includes("function drawMiniLine(from, to") &&
      game.includes("function allyMapIntent(bot)") &&
      game.includes("if (bot.userData.commandHold) return bot.userData.commandHold") &&
      game.includes("if (bot.userData.holdPoint) return bot.userData.holdPoint") &&
      game.includes("return bot.userData.route[bot.userData.routeIndex % bot.userData.route.length]") &&
      game.includes("for (const bot of teamBots)") &&
      game.includes("drawMiniLine(bot.position, intent") &&
      !/for \(const target of targets\)[\s\S]*?drawMiniLine/.test(game),
  },
  {
    name: "primary weapons use dynamic slots so AWM does not require Digit5",
    pass: game.includes("function displaySlotForWeapon(key)") &&
      game.includes("function setWeaponBySlot(slot)") &&
      game.includes("return primaryIndex >= 0 ? String(3 + primaryIndex)") &&
      game.includes("if (event.code === \"Digit3\") setWeaponBySlot(3)") &&
      game.includes("if (event.code === \"Digit4\") setWeaponBySlot(4)") &&
      html.includes("1 刀 · 2 手枪 · 3/4 主武器") &&
      !html.includes("1-5 切枪") &&
      !game.includes("Digit5") &&
      !game.includes("setWeapon(\"sniper\")"),
  },
  {
    name: "weapon UI shows mini gun silhouettes in slots and buy menu",
    pass: game.includes("function weaponMiniHtml") &&
      game.includes("${weaponMiniHtml(key, def)}") &&
      game.includes("button.innerHTML = weaponMiniHtml(key, def)") &&
      css.includes(".weapon-mini") &&
      css.includes(".gun-barrel") &&
      css.includes(".gun-stock"),
  },
  {
    name: "weapon handling differentiates scoped stability recoil noise and recovery",
    pass: game.includes("function weaponHandling(key = player.weaponKey)") &&
      game.includes("handling.hipSpread = 3.2") &&
      game.includes("handling.aimSpread = 0.2") &&
      game.includes("handling.recoilScale = 1 + Math.min(0.45, player.shotChain * 0.035)") &&
      game.includes("makePlayerNoise(handling.noiseRadius)") &&
      game.includes("const spread = baseSpread * handling.spreadScale") &&
      game.includes("weaponHandling(player.weaponKey).recovery") &&
      game.includes("function addMuzzleFlash(position)") &&
      game.includes("addMuzzleFlash(tracerStart)") &&
      game.includes("const scopedFov = currentWeapon().zoomFov"),
  },
  {
    name: "buy menu shows weapon stats for tactical choice",
    pass: game.includes("function weaponStatsHtml(def)") &&
      game.includes("伤害 ${def.bodyDamage}/${def.headDamage}") &&
      game.includes("弹匣 ${def.magazine}") &&
      game.includes("射程 ${def.range}m") &&
      game.includes("射速 ${rpm}") &&
      game.includes("${weaponStatsHtml(def)}") &&
      css.includes(".weapon-stats"),
  },
  {
    name: "buy menu is grouped and explains B closes for movement",
    pass: html.includes('id="buy-hint"') &&
      html.includes("B 关闭后可移动") &&
      game.includes('function appendBuySection(title, note = "")') &&
      game.includes('appendBuySection("护甲", "先选生存能力")') &&
      game.includes('appendBuySection("手枪", "便宜、备用、可丢弃")') &&
      game.includes('appendBuySection("主武器", "按 3/4 切换，最多两把")') &&
      game.includes("function appendWeaponBuyButton(key, def)") &&
      css.includes(".buy-head small") &&
      css.includes(".buy-section-title small"),
  },
  {
    name: "dropped weapon models have distinct components",
    pass: /function createWeaponPickup[\s\S]*?const barrel = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const muzzle = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const mag = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const stock = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const scope = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const receiver = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const ejectionPort = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const triggerGuard = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const foreGrip = new THREE\.Mesh/.test(game) &&
      /function createWeaponPickup[\s\S]*?const lens = new THREE\.Mesh/.test(game),
  },
  {
    name: "weapon models use shared profiles for distinct gun families",
    pass: game.includes("function weaponProfile(key)") &&
      game.includes("hasTwinBarrel: shotgun") &&
      game.includes("hasLongRail: sniper || guardian || key === \"rifle\" || key === \"burst\" || heavy") &&
      game.includes("const profile = weaponProfile(key)") &&
      game.includes("const profile = weaponProfile(player.weaponKey)") &&
      game.includes("const secondBarrel = new THREE.Mesh") &&
      game.includes("const bipod = new THREE.Mesh") &&
      game.includes("const rail = new THREE.Mesh"),
  },
  {
    name: "top floating actor indicators are removed for cleaner faster play",
    pass: !game.includes("function addStatusBadge") &&
      !game.includes("function updateStatusBadge") &&
      !game.includes('badge.name = "statusBadge"') &&
      !game.includes("updateStatusBadge(target") &&
      !game.includes("updateStatusBadge(bot") &&
      !game.includes("mark.position.y = 2.08") &&
      game.includes("updateTeamPanel()"),
  },
  {
    name: "spike model has visible halo beacon and tip",
    pass: game.includes('halo.name = "spikeHalo"') &&
      game.includes('beacon.name = "spikeBeacon"') &&
      game.includes('tip.name = "spikeTip"') &&
      game.includes('TorusGeometry(flat ? 1.08 : 0.82') &&
      game.includes('CylinderGeometry(0.08, 0.08, flat ? 5.6 : 2.4'),
  },
  {
    name: "unplanted spike animates and deploy prompt shows progress",
    pass: game.includes('spawnSpikeMesh.rotation.y += dt * 0.9') &&
      game.includes('spawnSpikeMesh.getObjectByName("spikeHalo")') &&
      game.includes('正在部署 ${near.site.key} 点爆能器 ${Math.min(99') &&
      game.includes('你携带爆能器 · 前往 A/B 点') &&
      game.includes('爆能器在攻方门口'),
  },
  {
    name: "low covers are climbable and landing uses cover top height",
    pass: game.includes("const climbableBoxes = []") &&
      game.includes("function climbableSurfaceAt(x, z") &&
      game.includes("function playerCollidesAt(x, z") &&
      game.includes("covers.forEach((box) => addBox(...box, coverMat, { climbable: true }))") &&
      game.includes("spawnCovers.forEach((box) => addBox(...box, spawnCoverMat, { climbable: true }))") &&
      game.includes("const surfaceY = climbableSurfaceAt(player.position.x, player.position.z)") &&
      game.includes("player.groundHeight = surfaceY"),
  },
  {
    name: "AI starts without heavy weapons and uses range-aware decisions",
    pass: game.includes('target.userData.weaponKey = ["pistol", "ghost", "smg", "rifle", "burst"][index % 5]') &&
      game.includes('bot.userData.weaponKey = ["ghost", "smg", "rifle", "burst"][index % 4]') &&
      game.includes("function aiPreferredRange(actor)") &&
      game.includes("function threatPriorityScore(threat)") &&
      game.includes('target.userData.combatState = "拉开"') &&
      game.includes('target.userData.combatState = "压近"') &&
      game.includes('bot.userData.combatState = "拉开"') &&
      game.includes('bot.userData.combatState = "压近"') &&
      !game.includes('["rifle", "smg", "guardian", "sheriff", "shotgun"]'),
  },
  {
    name: "performance mode reduces render load and removes per-frame floating badges",
    pass: game.includes(`smooth: { label: "流畅", renderScale: 0.54`) &&
      game.includes("hudEvery: 0.18") &&
      game.includes("minimapEvery: 0.28") &&
      game.includes("aiEvery: 0.2") &&
      game.includes("antialias: false") &&
      game.includes("renderer.shadowMap.enabled = false") &&
      !game.includes("updateStatusBadge"),
  },
  {
    name: "help and match end copy match current implemented mechanics",
    pass: game.includes("function renderHelpPanel()") &&
      game.includes("helpPanel.innerHTML = helpItems.map") &&
      game.includes("const mapLabel = activeKeymap().map.includes") &&
      game.includes("const dropSpikeLabel = activeKeymap().dropSpike.includes") &&
      game.includes("本局已使用买枪经济、护甲、爆能器、AI路线和队友指挥完成训练") &&
      !game.includes("下一步可以加入买枪经济、AI 路线和真正多人同步"),
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
