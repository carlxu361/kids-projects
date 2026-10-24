# Technical architecture

Status: P1 baseline

## Runtime boundary

`App` owns composition only. The 3D canvas, physics world, player, courtyard, HUD, and diagnostics are separate components. Game rules are stored in data and pure functions so they can be tested without a renderer.

```text
App
├── GameStore (Zustand: camera mode, Lumos, debug, quality)
├── KeyboardShortcuts (V, 1, F3)
├── SceneCanvas
│   ├── KeyboardControls
│   ├── Physics
│   │   ├── CollisionWorld
│   │   └── PlayerController (Ecctrl)
│   ├── MagicCourtyard
│   ├── CameraRig (shared player reference)
│   └── Atmosphere
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
| Spells | Definitions and pure cooldown rules | `src/spells/` |
| UI | HUD, help, diagnostics | `src/ui/` |
| Tests | Pure rule tests and future browser checks | `tests/` |

## Data flow

1. `KeyboardControls` exposes named movement input to Ecctrl.
2. Ecctrl updates one Rapier character body.
3. `CameraRig` reads the Ecctrl handle and positions the active camera mode around the same body.
4. `GameStore` changes presentation state such as `cameraMode` and `lumosEnabled`; it does not own per-frame physics.
5. Spell rules will emit gameplay events. VFX components will subscribe to those events and release their resources when the event ends.

## Camera decisions

P1 uses a single camera and one player reference. Third-person follows from behind the camera yaw; first-person uses the same position and yaw with a local wand presentation. The initial slice keeps obstacle correction and full Pointer Lock tuning for P2, so P1 is honest about its scope.

## Asset decisions

P1 uses procedural geometry and CSS/Three materials only. It contains no copied model, texture, audio, or HDR asset from the reference repositories. The asset gap is tracked in `docs/asset-gap-list.md`.

## Performance decisions

- Keep geometry simple and reuse materials where possible.
- Use instancing for repeated courtyard stones and vegetation.
- Use `AdaptiveDpr` for an early quality safeguard.
- Expose renderer counters and a rolling FPS estimate in the optional debug panel.
- Add object pools only when a measured effect needs them; the VFX reference demonstrates the lifecycle contract to follow.
