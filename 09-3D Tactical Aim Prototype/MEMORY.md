# MEMORY.md

> This file stores project memory.
> It should help future Codex sessions continue correctly without rereading everything.

## Project Summary

- Project name: zu
- Created date: 2026-07-10
- Main goal: Design and build a 3D tactical shooter prototype inspired by competitive round-based attack/defense gameplay.
- Current status: Prototype 07 has original tactical attack/defense rules with buy-phase locking, 5v5 local bot structure, player-first spike pickup with delayed teammate carry/plant support, flat-distance spike deploy/defuse, enlarged lane/site map, no static road weapon pickups, dropped weapons after kills, X fullscreen minimap with teammate dots and 3D ping beams, stealth-aware AI detection, named tactical routes, compact AI squad roles, spacing/stuck handling for bots, enemy spike-carrier-only planting, enemies that can target/down visible teammates, individual ally death rendering, capped Warden healing, basic role abilities, improved weapon view geometry, and settings/pointer-lock state hardening.
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
```

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exists in the project
- Information that can be found easily in the code
