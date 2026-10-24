# P1 report: high-quality courtyard greybox

Date: 2026-10-24

## Delivered

- React + TypeScript + Vite application with a locked pnpm dependency graph.
- Procedural Gothic courtyard greybox with a main hall, two tower silhouettes, arcade columns, corridor glimpse, fountain, stone paving, warm windows, torch flames, dynamic point lights, fog, stars, and sparkles.
- Rapier fixed collision volumes for the floor, perimeter, hall, towers, and arcade wall.
- Ecctrl player with WASD/arrow movement, Shift sprint, Space jump, and capsule collision.
- Shared camera rig with third-person and first-person modes, first-person wand, pointer-lock hook, and head hiding in first person.
- Lumos registry entry and cooldown rule foundation, with a wand light and HUD feedback.
- Optional F3 performance panel showing FPS, frame time, draw calls, triangles, geometries, and textures.
- Documentation for requirements, architecture, source audits, licenses, compatibility, feature status, and asset gaps.

## Main files

- `src/core/renderer/SceneCanvas.tsx`
- `src/world/environments/MagicCourtyard.tsx`
- `src/world/collisions/CollisionWorld.tsx`
- `src/player/controller/PlayerController.tsx`
- `src/player/camera/CameraRig.tsx`
- `src/spells/registry.ts`
- `src/ui/PerformancePanel.tsx`
- `tests/spells.test.ts`

## Verification

Commands and their actual results are recorded in `docs/p0-report.md`.

The browser smoke entry point is:

```text
http://127.0.0.1:5183/
```

Manual checks completed in the Codex in-app browser:

- initial third-person scene renders the courtyard and player;
- `V` switches to first person and back;
- `1` switches Lumos and changes nearby lighting/HUD state;
- `F3` opens the HTML performance panel without unmounting the 3D scene;
- observed sample in first person with Lumos: 57 FPS, 17.5 ms frame time, 9 draw calls, 1,762 triangles, 59 geometries, 9 textures;
- observed sample in third person before Lumos: 60 FPS, 16.6 ms frame time, 6 draw calls, 1,538 triangles, 59 geometries, 9 textures.

These are single manual samples from the current browser session, not a sustained desktop 1080p performance claim.

## Known limits

- All visible world assets are procedural greybox geometry and are explicitly labeled `PLACEHOLDER ART` in the HUD.
- The six-spell runtime is not implemented yet; P1 only establishes the registry and cooldown foundation with Lumos presentation.
- Third-person camera obstruction correction, crouch/prone states, full pointer-lock tuning, animation blending, spatial audio, optimized authored assets, and visual regression automation remain for later stages.
- The production build reports a large JavaScript chunk warning; code splitting and asset loading strategy belong to P2 performance work.

## Asset needs

The current gap list is maintained in `docs/asset-gap-list.md`. The next high-value additions are an explicitly licensed courtyard kit, authored stone/PBR materials, a player model and animations, and licensed ambient/fire audio.

## Next stage

P2 should stabilize the controller and camera contract first: pointer lock, camera collision, crouch/prone collider states, and basic animation state reporting. Then replace one courtyard landmark and one player visual with licensed authored assets while keeping the procedural scene available as a fallback.
