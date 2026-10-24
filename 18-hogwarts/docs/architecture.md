# Technical architecture

Status: P1 spike baseline

## Runtime boundary

`App` owns composition only. The 3D canvas, physics world, player, courtyard, HUD, and diagnostics are separate components. Game rules are stored in data and pure functions so they can be tested without a renderer.

```text
App
├── GameStore (Zustand: camera mode, Lumos, quest stage, target, debug, quality)
├── KeyboardShortcuts (V, 1, E, F3)
├── SceneCanvas
│   ├── KeyboardControls
│   ├── Physics
│   │   ├── CollisionWorld
│   │   └── PlayerController (Ecctrl)
│   ├── MagicCourtyard
│   ├── MoonwellQuestController (nearby targets and passage trigger)
│   ├── CameraRig (shared player reference)
│   └── Atmosphere
├── Soundscape (gesture-started Web Audio ambience and cues)
└── Hud / PerformancePanel
```

## Module responsibilities

| Area | Responsibility | Current location |
| --- | --- | --- |
| App | Composition and lifecycle | `src/app/` |
| State | Small shared state and actions | `src/core/state/` |
| Renderer | Canvas and camera presentation | `src/core/renderer/` |
| Input | Keyboard bindings and future pointer/controller input | `src/core/input/` |
| Physics | Rapier world and colliders | `src/core/physics/`, `src/world/collisions/` |
| Player | Ecctrl wrapper, visual, camera target | `src/player/` |
| World | Procedural courtyard and atmosphere | `src/world/` |
| Quest rules | Pure story transition reducer | `src/quests/quest-machine.ts` |
| Interactions | Stage-aware nearest target and chamber threshold | `src/world/interactions/` |
| Audio | Synthesized ambience and short feedback cues | `src/core/audio/soundscape.ts` |
| Spells | Definitions and pure cooldown rules | `src/spells/` |
| UI | HUD, help, diagnostics | `src/ui/` |
| Tests | Pure rule tests and future browser checks | `tests/` |

## Data flow

1. `KeyboardControls` exposes named movement input to Ecctrl.
2. Ecctrl updates one Rapier character body.
3. `CameraRig` reads the Ecctrl handle and positions the active camera mode around the same body.
4. `GameStore` changes presentation state such as `cameraMode` and `lumosEnabled`; it does not own per-frame physics.
5. The quest reducer owns story progression; VFX and sound provide feedback and cannot decide quest completion.

## Camera decisions

The two camera modes share the player and quest state. First-person hides the player mesh and presents a local wand; switching view does not reset quest progress. Click the scene to request pointer lock. Camera obstacle correction, polished transitions, and extended input states remain future work.

## Asset decisions

The spike uses procedural geometry and Web Audio synthesis. It contains no copied model, texture, audio, or HDR asset from the reference repositories. The asset gap is tracked in `docs/asset-gap-list.md`.

## Performance decisions

- Keep geometry simple and reuse materials where possible.
- Use instancing for repeated courtyard stones and vegetation.
- Use `AdaptiveDpr` for an early quality safeguard.
- Expose renderer counters and a rolling FPS estimate in the optional debug panel.
- Add object pools only when a measured effect needs them; the VFX reference demonstrates the lifecycle contract to follow.
