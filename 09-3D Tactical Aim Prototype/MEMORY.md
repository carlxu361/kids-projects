# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: zu
- Created date: 2026-07-10
- Main goal: Design and build a 3D tactical shooter prototype inspired by competitive round-based attack/defense gameplay.
- Current status: Prototype 07 has original tactical attack/defense rules with buy-phase menu locking with movement after closing the buy panel, 5v5 local bot structure, player-first spike pickup with delayed teammate carry/plant support, flat-distance spike deploy/defuse with visible spike halo/beacon/tip, deploy failure reason hints, highlighted site deploy rings, deploy percent prompt, planter-foot planted spike placement, planted-core defuse distance, defender-required defuse after plant, allied defender AI defuse behavior, and 3D objective channel animation, enlarged lane/site map with denser choke walls, connector walls, layered site cover clusters, entry corner walls, mid cover, flank cover, spawn-buffer cover, side-lane segmentation, route floor bands, and clearer lane floor bands, no static road weapon pickups, dropped weapons after kills, X fullscreen minimap with teammate dots, 3D ping beams, and ally-only tactical ping commands, stealth-aware AI detection, named tactical routes, compact AI squad roles, spacing/stuck handling with escape nudges and shared threat-memory trade support for bots, enemy spike-carrier-only planting, enemies that can target/down visible teammates, individual ally death and health-bar rendering, player noise for running/jumping/shooting with enemy investigation but no through-wall shooting, low-health AI retreat and slower clutch-state movement/fire cadence, capped Warden self-healing plus nearby ally healing, smoke heat-count scouting, dash noise risk, dedicated hero selection panel plus original Q/F/H triple-skill hero kits with shared cooldown HUD, distinct synthesized win/loss/spike-warning audio cues, upgraded original tactical humanoid models for allies/enemies, weapon-profile-driven first-person and dropped-gun geometry with distinct family silhouettes, type-specific handling, and dynamic primary weapon slots, mini gun silhouettes and weapon stat cards in the buy menu, star-core credit display plus grouped buy menu sections for armor/sidearms/primary weapons, buy-phase light/heavy/revive armor with separate armor HUD, damage absorption, heavy armor speed tradeoff, and revive armor delayed regeneration, player-controlled weapon dropping, and player-controlled spike dropping, team tactical cover-hold points, visible teammate combat states in the team panel, enemy cover-hold/sound-search/plant states, and settings/pointer-lock state hardening, a 150-bound expanded map pass with deeper spawns, crouch/prone posture movement, tap-toggle C/V lean peeking, tap-toggle Z prone, visible noise-state HUD, crosshair-centered incoming damage sense, scoped weapon raise, incoming damage direction indicator, low-poly map buildings, climbable low cover, removed floating actor/callout indicators, saved smooth/balanced/sharp performance profiles plus saved default/compact keymap profiles with matching weapon, minimap, and help-panel hints, range-aware AI combat choices, no-heavy enemy opener loadout, and any-gun dropping except melee with pistol drops creating real pickups.
- Tech stack: Browser-based 3D prototype with HTML, CSS, JavaScript, and Three.js loaded from CDN.

## User Preferences For This Project

- Default discussion language: Chinese
- Explain principles before implementation.
- Use simple, clear language suitable for a 12-year-old learner.
- Conclusion first, reason second.
- Do not flatter.
- Point out problems directly.
- Prefer small learning steps over doing everything silently.

## Decisions

Record important decisions here.

```markdown
- 2026-07-10: Decision: Build an original tactical shooter prototype instead of copying Valorant directly.
  Reason: This preserves the learning value of attack/defense, rounds, economy, aiming, and map design while avoiding copied proprietary assets and over-large scope.
- 2026-07-10: Decision: Use browser 3D with JavaScript and Three.js for the first playable prototype.
  Reason: It is the fastest path to a visible prototype with movement, aiming, shooting, headshots, and recoil.
- 2026-07-11: Decision: Move from aim-training prototype to a focused attack/defense round prototype.
  Reason: The user clarified the external reference is a target feel, but this project should become a more competitive tactical shooter rather than a chaotic arena with bosses or random events.
- 2026-07-11: Decision: Add original tactical-shooter-style effects instead of copying Valorant assets.
  Reason: The project can learn from the feel of tactical shooters, but should not copy proprietary audio, UI art, models, names, or kill animations.
- 2026-07-11: Decision: Make melee and pistol default, and require rifle/SMG/sniper pickup with E.
  Reason: Pickup-based guns give the player a clearer objective inside the map and match the user's requested competitive-shooter direction better than giving every gun immediately.
- 2026-07-11: Decision: Use original hero archetypes and an original exploder model instead of copying Valorant characters or spike art.
  Reason: The prototype should learn the tactical-shooter structure without using proprietary character names, models, sounds, or UI art.
- 2026-07-11: Decision: Replace throwables with a future hero-skill lane.
  Reason: The user wants throwables removed for now and abilities added later through hero design.
- 2026-07-11: Decision: Treat 5v5 as local bot simulation for now, not real online multiplayer.
  Reason: It gives the requested tactical structure quickly while a real multiplayer server would require a separate networking architecture.
```

## Architecture Notes

Record how the project is organized.

```markdown
- 2026-07-10: `work/` is for drafts and experiments; `outputs/` is for user-facing deliverables.
```

## Useful Commands

Record commands that are useful but not obvious.

```bash
# example
# run local preview
python3 -m http.server 5173

# check JavaScript syntax
node --check game.js
node --check server.js
node checks.mjs

# alternative local server
node server.js
```

## Pitfalls And Fixes

Record problems we hit and how we solved them.

Format:

```markdown
- YYYY-MM-DD: Problem: TODO
  Fix: TODO
- 2026-07-10: Problem: In-app browser felt laggy for the 3D prototype.
  Fix: Enabled performance-first rendering: lower render scale, no antialiasing, no shadow maps, lower geometry segment counts, cached raycast meshes, reused vectors, and avoided rewriting HUD text every frame.
- 2026-07-11: Problem: In-app browser verification was blocked by the browser security policy for the local 127.0.0.1 page.
  Fix: Used `node --check game.js` and static feature checks instead, and left browser-play verification as a remaining manual check.
- 2026-07-11: Problem: Browser showed `ERR_CONNECTION_REFUSED` for `127.0.0.1:5173`.
  Fix: Started the local preview server with `python3 -m http.server 5173` and verified the page returned `200 OK`.
- 2026-07-11: Problem: Player could walk through walls.
  Fix: Added rectangular collision boxes for walls/covers and blocked movement per axis so the player can slide along walls without passing through them.
- 2026-07-11: Problem: Prototype felt too slow after adding AI and minimap.
  Fix: Lowered render scale and throttled HUD, minimap, and AI updates instead of recalculating all of them every frame.
```

## External Resources

Record links or file locations.

Important rule: record where credentials are stored, never record credential values.

```markdown
- YYYY-MM-DD: Resource: TODO
  Location: TODO
```

## Session Log

Add short notes after meaningful work.

```markdown
- 2026-07-10: User answered the 20-question scope survey: wants a 3D, 5v5, attack/defense tactical shooter prototype with real aiming, full-style gun/economy ideas, headshots, recoil, no character skills in first version, competitive ranking, and gunplay as the main fun point.
- 2026-07-10: Created Prototype 01 with first-person movement, pointer-lock aiming, shooting, body/head damage, recoil, reload, score HUD, round timer, a simple training arena, and target respawns.
- 2026-07-10: Optimized Prototype 01 for smoother in-app browser play while keeping the same gameplay features.
- 2026-07-11: Created Prototype 02 with attack/defense selection, hidden menu-state HUD, round scoring to 7, core install/defuse interactions, planted-core timer, round result banner, and no-respawn targets inside each round.
- 2026-07-11: Created Prototype 03 with A/B sites, larger map bounds, jump physics, pistol/rifle/SMG/sniper switching, a first-person weapon model, synthesized original gun and objective sounds, bullet tracers, impact bursts, a kill feedback overlay, and right-bottom HUD/weapon panels.
- 2026-07-11: Created Prototype 04 with Esc click-to-relock prompt, bigger map bounds, E pickup guns, slot-based right-bottom weapon UI, melee, sniper right-click scope, switch animation, center-bottom health bar, top round timer/score, lower-center kill effect, and G/T throwable controls.
- 2026-07-11: Created Prototype 05 with startup buy menu, R-point rewards, more weapons, all-gun aim-down-sights, basic moving/shooting AI, cover/wall bullet blocking, death orbs, dropped weapon pickups, minimap click pings, original hero archetype selection, polygonal map floor, improved low-poly enemy bodies, improved gun view model, defeat/clutch round banners, and no throwable system.
- 2026-07-11: Created Prototype 06 with collision, Esc settings, volume/SFX/sensitivity controls, home orbit animation, hold-to-fire, 5v5 local bots, buy barriers, longer buy phase, spike pickup before deploy, cyan triangular spike model, single-point deploy radius, deploy cancel/no-shoot behavior, minimap without enemy reveal, 3D ping markers, win/lose wording, last-player alerts, weapon inventory limits, extra pistols, and lightweight CSS animation effects.
- 2026-07-11: Added a project-local `server.js` static server and changed the menu camera to orbit over the actual map scene instead of only showing a UI ring animation.
- 2026-07-11: Added `/api/status` to `server.js` and client-side ping display so the in-game server badge can show local latency and 10-player server status when run with `node server.js`.
- 2026-07-12: Tuned Prototype 06 after play feedback: removed body-hit HP spam, added 5-second bullet holes, made buy UI full-screen but toggleable, disabled movement during buy phase, renamed weapons to international-style codes like G18/M14/AWM, added weapon range limits, reduced AI bullet damage, widened buy barriers, hid the view weapon on the home screen, moved plant sites away from defender spawn, and added settings-close aim calibration.
- 2026-07-12: Tuned Prototype 07 rules after play feedback: fixed spike deploy by using flat ground distance for sites, stopped defense rounds from starting with the spike already planted, limited buying to buy phase, removed static road weapon pickups, enlarged the map and moved spawns deeper into bases, added route-based teammate/enemy AI, made stealth walking reduce enemy detection when out of sight, changed minimap fullscreen toggle to X with 3D light-column pings, capped Warden health at 100, improved view weapon geometry, and kept the project copyright-safe by implementing original tactical-shooter-style mechanics instead of copying Valorant assets or names.
- 2026-07-12: Continued Prototype 07 polish: updated the visible prototype label and controls, made Esc ignored on the home screen, cleared movement input when toggling buy/settings, added stronger buy-phase movement locking, upgraded hero cards with roles, and made hero abilities affect play with healing visuals, burst disruption, smoke that blocks AI line-of-sight, and dash trails.
- 2026-07-12: Added teammate objective logic: if the player attacks and does not pick up the spike, the first teammate can pick it up, carry it toward a site, plant it through the shared spike-planting function, show carrier status on the minimap, and expose ally planting progress in the objective UI.
- 2026-07-12: Improved bot reliability: `tryMoveActor` now attempts sidesteps when blocked, bots and enemies track stuck time and advance route points if trapped, and the minimap shows living teammates without revealing enemies.
- 2026-07-12: Hardened settings/pointer-lock state: added a short suppression window so pointer-lock changes do not reopen settings immediately after closing or phase changes, cleared held inputs on settings/home/round transitions, and reset firing/scoping when leaving active control states.
- 2026-07-12: Delayed teammate spike pickup: combat now records `combatStartedAt`, the first teammate waits several seconds before taking the spike so the player has first priority to pick up and plant, and the objective UI explains that a teammate will carry it later if the player does not.
- 2026-07-12: Added and expanded `checks.mjs`, a lightweight gameplay regression checker covering buy-phase restrictions including no shooting/moving, no pre-planted spike, flat-distance deploy checks and deploy prompts, deploy cancel/no-shoot behavior, no static road guns, enlarged/non-rectangular map and deep spawns, fullscreen buy overlay, dropped weapons, 5v5 local structure, X tactical map without enemy reveal, 3D ping beams, Warden health cap, stealth detection, reduced AI damage, AI anti-stuck protection, knife speed, teammate spike carry/plant, settings pointer-lock suppression, hidden home-screen weapon model, separate gun model components, settings controls, 10-player server status, shipped-game copyright-safe naming, hero gameplay effects, and current prototype labeling.
- 2026-07-12: Added `outputs/acceptance.md` as a user-facing acceptance checklist mapping the latest play-feedback items to implemented behavior and the verification commands/results.
- 2026-07-12: Improved AI tactics for Prototype 07: added named attack/defense route tables, assigned compact squad roles such as carrier/support/mid/flank/hold/rotate, added squad spacing to reduce bot clumping, made defenders move to hold/rotate positions instead of staying at spawn, and required the enemy spike carrier to be the one who can plant.
- 2026-07-12: Improved 5v5 combat simulation: enemies now choose between the player and visible teammates as threats, can damage/down team bots, update ally counts, show individual ally death state in the team HUD, and drop the carried spike if a teammate carrier is eliminated.
- 2026-07-12: Added stealth/sound investigation logic: running footsteps, jumping, melee, and gunfire leave temporary player noise positions; Shift walking suppresses footstep noise; enemies can investigate heard noise but only shoot visible threats.
- 2026-07-12: Improved original map structure: added extra choke/connector walls, A/B site cover clusters, mid cover, flank cover, and additional lane floor bands so the map reads less like a rectangle and more like a tactical A/B-site layout without copying Valorant maps.
- 2026-07-12: Improved hero tactical value: Warden now heals nearby living teammates as well as self, Brim smoke reports nearby enemy heat count while still blocking AI line of sight, and Gust dash creates noise that enemies can investigate.
- 2026-07-12: Improved weapon presentation: dropped weapons now use multi-part low-poly models with barrel, muzzle, grip, magazine, stock, pump/scope variants, and weapon slots plus buy menu show shared mini gun silhouettes instead of text-only cards.
- 2026-07-12: Improved spike clarity: unplanted spike now has a cyan halo, vertical beacon, top tip, subtle rotation/breathing animation, objective text states who carries it or where it is, and deploy prompts show progress percentage.
- 2026-07-12: Improved AI decision-making: low-health allies and enemies retreat toward route safety points when they see threats, clutch states slow movement and fire cadence, and low-health AI avoids re-peeking while visible threats are present.
- 2026-07-12: Added ally-only tactical ping commands: clicking the minimap during play still creates a 3D beam, and idle teammates now spread toward that marked point without revealing it to enemies or overriding spike/objective/combat priorities.
- 2026-07-12: Improved character and hero feedback: allies and enemies now share a clearer low-poly humanoid model with helmet, chest armor, limbs, backpack, and held weapon, while the right-bottom HUD shows Q ability ready/cooldown state.
- 2026-07-12: Further improved the original tactical map: added layered A/B site cover, central plant-box cover, extra entry corner walls, flank-lane walls, and wider lane floor bands so routes and cover clusters are clearer without copying any commercial map.
- 2026-07-12: Improved weapon modeling: added shared `weaponProfile` data so first-person and dropped guns use the same family-specific silhouette rules, including long rails, scopes, twin shotgun barrels, drum magazines, stocks, and heavy bipods.
- 2026-07-12: Improved buy-menu weapon readability: each buy card now shows damage, magazine size, range, and fire-rate stats derived from the existing weapon definitions, making gun choices less blind.
- 2026-07-12: Improved 5v5 readability: the top team panel now renders ally/enemy cards with health bars, refreshes when player or teammates take damage, and updates after Warden healing so teammate impact is easier to read.
- 2026-07-12: Improved original audio feedback: round wins and losses now use different synthesized tone sequences, and a planted spike plays per-second warning beeps during the final 10 seconds.
- 2026-07-12: Improved objective interaction feedback: planting and defusing now show a reusable 3D channel animation at the active site with a rotating ring, vertical beam, and pulse ring driven by plant/defuse progress.
- 2026-07-12: Improved local server status: `/api/status` now returns honest local-room metadata including room name, 5v5 slots, 20Hz tick rate, score limit, objective, features, uptime, and the in-game server badge renders room occupancy, tick rate, and latency.
- 2026-07-13: Improved teammate tactics: added tactical cover-hold points, a nearest-cover selector that avoids occupied holds, teammate combat states such as 推进/守标/找掩体/架枪/后撤/带包, and team-panel state labels so allies no longer read as only route-rushing bots.
- 2026-07-13: Improved enemy tactics: enemies now also choose nearby cover-hold points on contact, use 架枪/找掩体/搜声/带包/部署 states, and the enemy spike carrier explicitly enters 部署 state before planting.
- 2026-07-13: Improved buy and weapon selection feel: closing the buy panel during buy phase now allows movement inside spawn barriers, and weapon number keys use dynamic slots (1 knife, 2 sidearm, 3/4 owned primary weapons) so AWM is no longer locked behind Digit5.
- 2026-07-13: Upgraded original humanoid models: added pelvis, belt, layered chest plate, front badge, jaw guard, antenna, gloves, knee pads, stronger boots, and third-person weapon stock/mag/sight details for clearer tactical characters without copying commercial character art.
- 2026-07-13: Improved original map structure again: added spawn-buffer cover, side-lane segmentation walls, route-band floor colors, and extra site/mid cover pieces so the map reads less like a large empty rectangle and more like distinct tactical spaces.
- 2026-07-13: Improved original hero tactics: Warden healing now puts nearby allies into guard state, Flare burst suppresses enemy AI state, Brim smoke delays enemies inside smoke while still blocking sight, and Gust dash leaves a decoy noise source at the starting point.
- 2026-07-13: Improved weapon feel: added `weaponHandling` so weapon families differ in scoped stability, hip-fire penalty, movement spread, recoil scaling, sound radius, and recoil recovery; sniper hip-fire is much less reliable, heavy weapons build recoil over sustained fire, and SMGs keep better moving accuracy.
- 2026-07-13: Improved spike deploy clarity: added `deployHint` to explain missing spike carrier, distance to the nearest plant site, hold-to-plant progress, and defuse distance, plus animated site deploy ring highlighting when carrying the spike.
- 2026-07-13: Improved AI anti-stuck behavior: route cloning now runs through `safeNavPoint`, and stuck bots call `unstuckActor` to nudge to a nearby collision-free point, clear claimed hold/command points, and mark combatState as 脱困.
- 2026-07-13: Improved settings robustness: added centralized input reset for Esc/home paths, persisted volume/SFX/sensitivity in localStorage, cleared objective channel state on home, and corrected weapon slot hint to dynamic slots.
- 2026-07-13: Expanded the original tactical map again: map bounds are now 150, spawn points and spike spawn move deeper into bases, buy barriers widen, and routes/walls/cover add longer A/B lanes, mid doors, spawn halls, and flank sections.
- 2026-07-13: Added posture and awareness mechanics: Ctrl crouch and Z prone alter eye height, speed, jump ability, footstep noise, and HUD noise labels; player damage now shows incoming direction from front/back/left/right.
- 2026-07-13: Made posture affect AI detection: crouch and prone reduce effective detection range and require stronger frontal vision while close enemies can still reveal the player; added expanded-map tactical hold points for long lanes, spawn halls, and flank sections.
- 2026-07-13: Improved tactical feedback and hero impact: shooting now spawns a short muzzle flash, Warden guard state persists on allies, Flare applies timed suppression to enemies, and Brim smoke applies timed hesitation that blocks normal enemy firing while active.
- 2026-07-13: Improved spike clarity again: fixed the HUD objective progress string from a bare percent sign to a real progress percent string, added an `objectiveCarrierText` status line for player/ally/enemy/ground/planted/defused spike states, and covered both with regression checks.
- 2026-07-14: Added 3D tactical status badges above AI actors: carried spike, deploying, suppressed, smoke-impaired, guarding, holding, cover, and sound-search states now render as small colored geometry markers and are covered by regression checks.
- 2026-07-14: Added original 3D map callout labels using generated canvas textures for A site, B site, mid, A long, B long, flank, attack base, and defense base, improving navigation on the enlarged map without copying commercial map names.
- 2026-07-14: Added minimap tactical zone labels for A, B, mid, A long, B long, flank, attack base, and defense base while preserving the no-enemy-reveal minimap rule.
- 2026-07-14: Added ally tactical intent lines on the minimap: living teammates now show dashed route/hold/command lines, spike carriers use stronger cyan lines, and enemy routes remain hidden.
- 2026-07-14: Made spike pickup and deployment more forgiving: holding E while entering the spawn-spike pickup radius now picks it up, site deploy radius increased to 8.4, and deploy discs/rings use the same radius with stronger carried-spike visual feedback.
- 2026-07-14: Improved AI navigation reliability: actor movement now tries a fan of forward/diagonal/side directions, tactical minimap command points are snapped to safe nav points, and the existing stuck recovery remains as a fallback.
- 2026-07-14: Hardened local preview startup: server.js now falls back from busy 5173/5174-style ports to the next available port and logs only the actual listening URL; verified current fallback on 5175 with page and /api/status returning 200.
- 2026-07-14: Hardened Esc settings behavior: repeated Escape keydown is ignored and settings cannot be immediately closed by the same Esc event shortly after pointer-lock loss opens it.
- 2026-07-14: Improved weapon model readability: first-person weapons now include receiver, ejection port, trigger guard, foregrip, scope lens, and visible hand/sleeve grips; dropped weapons also gained receiver, ejection port, trigger guard, foregrip, and scope lens details.
- 2026-07-14: Improved Warden tactical value: Q now gives the player and nearby healed allies a 6.5s guard window that reduces incoming damage to 62%, while allies keep holding position.
- 2026-07-14: Improved Flare tactical value: Q now creates a 5.5s aimed burn zone that suppresses enemies, ticks damage, and makes affected AI move out of the area, turning the skill into lane/entry denial instead of a one-shot burst only.
- 2026-07-15: Improved Brim tactical smoke: smoke is now tracked as a zone, enemies inside lose hold points, hesitate, and try to leave, while idle allies can use nearby smoke as cover and move toward it with combatState 借烟.
- 2026-07-15: Improved Gust tactical value: dash now leaves a 2.6s decoy noise position, enemies hearing it use activeNoisePosition and enter combatState 诱导 while moving toward the old position.
- 2026-07-15: Improved teammate objective coordination: idle allies now use objectivePointForBot to escort the spike carrier, hold around a planted spike on attack, and rotate back toward the planted site on defense, with combat states 护包, 守包, and 回防 covered by checks.
- 2026-07-15: Added star-core armor economy checks: the buy menu now has light armor, heavy armor, and revive armor cards, the HUD shows armor separately from health, armor absorbs damage before health, heavy armor slows movement, and revive armor starts regenerating after being broken for 15 seconds.
- 2026-07-15: Added active drop controls: G drops the current non-default weapon as a pickup, and T drops the carried spike in front of the player while the objective is still idle; both are covered by regression checks and shown in the weapon hint. Later extended G to drop any non-melee gun, including the default pistol.
- 2026-07-15: Tightened planted-spike rules: plantSpikeAt now places the planted spike at the planter position, defuse distance and the objective channel use the planted spike position, defenders must defuse after the spike is planted even if attackers are eliminated, and allied defender bots can rotate to the planted spike and complete defuse.
- 2026-07-15: Added combat feel controls: C/V lean peeking offsets and rolls the camera near cover, damage direction now also lights a crosshair-centered sense indicator, and scoped weapons raise and settle closer to the center of view.
- 2026-07-15: Added dedicated hero selection and Q/F/H triple-skill hero kits: each original hero now exposes three skills, the HUD renders all slot cooldowns, Q/F/H trigger the correct slot, and Warden/Flare/Brim/Gust gained support, suppression, command, stealth, and mobility actions covered by regression checks.
- 2026-07-15: Continued Prototype 07 toward updated feedback: added original low-poly buildings, made low covers climbable by landing on cover top height, removed 3D floating actor badges and map callout labels, reduced renderScale/HUD/minimap/AI cadence for smoother play, changed C/V lean and Z prone to tap toggles, made all non-melee guns droppable, and improved AI with no-heavy opener weapons plus range-aware 拉开/压近/找掩体 behavior. Regression checks increased to 84.
- 2026-07-16: Fixed the any-gun drop rule at the lower level: dropWeaponAt now allows pistols too, so dropping the default pistol creates a real pickup instead of only deleting it from inventory. Also grouped the buy menu into armor, sidearms, and primary weapons with a B-close movement hint; regression checks increased to 85.
- 2026-07-16: Added saved performance profiles in settings: 流畅 keeps the lower 0.54 render scale and slower HUD/minimap/AI cadence, while 均衡 and 清晰 raise clarity for stronger machines; regression checks increased to 86.
- 2026-07-16: Improved teammate AI with shared threat memory: when the player or an ally is hit, nearby idle teammates remember the attacker position, enter 补枪 state, rotate to a tactical hold point, and face the threat; regression checks increased to 87.
- 2026-07-16: Added saved keymap profiles in settings: default preserves X tactical map and T spike drop, compact adds Tab/X tactical map and Y/T spike drop, and both weapon HUD and minimap hints update from the active profile; regression checks remain at 88 with the keymap check strengthened.
- 2026-07-16: Cleaned up UI truthfulness: the left-bottom help panel now renders from the active keymap, match-end copy describes already implemented economy/armor/spike/AI/team-command systems instead of stale future-work text, and regression checks increased to 89.
```

- 2026-07-16: Improved hero skill readability: the weapon HUD now renders Q/F/H as three compact status pills with ready/cooldown styling and accessible labels, and regression checks increased to 90.

- 2026-07-16: Improved ability failure feedback: pressing a skill during cooldown now adds a combat feed message with the remaining seconds instead of silently doing nothing, and regression checks increased to 91.

- 2026-07-16: Improved skill landing feedback: every original Q/F/H ability now has an abilityPreviewSpec with self/aim distance and real impact radius, and successful casts draw a short-lived ground disc plus range ring so the player can see landing and area feedback; regression checks increased to 92.

- 2026-07-16: Added confirmed aiming for ground-targeted hero skills: aimed Q/F/H skills now enter pendingAbilitySlot preview mode, the ground disc/ring follows the crosshair, left click confirms, right click or Escape cancels, self-centered skills still cast immediately, and regression checks increased to 93.

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exists in the project
- Information that can be found easily in the code
