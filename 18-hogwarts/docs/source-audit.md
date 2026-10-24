# Open-source reference audit

Audit date: 2026-10-24

The repositories were cloned into isolated local folders under `references/`. The local clones include their own dependencies for verification, but are ignored by the main project Git repository.

## 1. threejs-castle

- URL: https://github.com/luketurnbull/threejs-castle
- Local path: `references/threejs-castle`
- Audited commit: `b5598a3a1abf749007fe00c265ebfd01237baab3`
- Commit time: `2026-03-26T16:08:42+11:00`
- Stack: React 19.2.4, TypeScript 5.8.3, Vite 8.0.2, R3F 9.5.0, Drei 10.7.7, Three 0.183.2, Zustand 5.0.12, GSAP, `vite-plugin-glsl`.
- Entry points: `src/main.tsx`, `src/App.tsx`, `src/components/castle.tsx`, `src/components/experience.tsx`.
- Renderer loop: R3F `useFrame` in grass, smoke, flag, windows, materials, and audio components; `AdaptiveDpr`, `AdaptiveEvents`, and Drei `Bvh` are enabled.
- Loading: a Zustand store creates `GLTFLoader`, `KTX2Loader`, `DRACOLoader`, and `TextureLoader`; the loading sequence loads the model/day textures, day audio, then night textures/audio.
- Scene techniques: baked GLB geometry, KTX2 textures, DRACO decoder, instanced windows, 150,000 grass blades, custom GLSL materials, day/night transitions, point-light fire, and distance-based audio volume.
- State: one Zustand store combines loading, audio, mode, renderer, loaders, meshes, textures, and camera references.
- Cleanup risks observed: audio listeners are attached in the store; loader and texture lifetime is held in the global store; several components mutate geometry attributes received as props; React 19 lint rules flag render-time randomness in grass and windows and synchronous state updates in the control panel.
- Migration value: scene composition, KTX2/DRACO setup, adaptive DPR, instancing, day/night uniform interpolation, and spatial audio distance curve.
- Do not copy directly: castle GLB, textures, audio, fonts, or code until a license is confirmed. The current repository has no `LICENSE` or `NOTICE` file.

## 2. threejs-vfx

- URL: https://github.com/majidmanzarpour/threejs-vfx
- Local path: `references/threejs-vfx`
- Audited commit: `3d184edec529e5ad8055d8803967ea1f040aede0`
- Commit time: `2026-08-14T00:34:00-04:00`
- Stack: plain Three.js 0.185.1, Vite 8.1.5, JavaScript, hand-written GLSL, and lil-gui 0.21.0.
- Entry point: `src/main.js`; effect modules live in `src/vfx/`, `src/abilities/`, `src/particles/`, `src/postprocessing/`, and `src/core/`.
- Rendering loop: a custom Three.js loop updates a shared frame-uniform context and ability manager; VFX modules use explicit phase transitions.
- Spell/VFX lifecycle: `Ability` owns `travel → impact → fade → done`; subclasses provide shader, particle, spawn, travel, impact, fade, and destroy hooks.
- Resource handling: `AbilityManager` and effect modules have explicit destroy paths; `src/utils/ObjectPool.js` and `src/utils/dispose.js` show reusable pool and recursive disposal patterns; `Projectile.js` owns geometry/material cleanup.
- Targeting: line and zone indicators share a cast event contract; gameplay effect code receives origin, direction, and distance rather than deriving target rules from visual code.
- Migration value: phase machine, spell registry/settings separation, object pooling, fixed-size instancing, ground decals, shader composition, and separation of targeting from effect implementation.
- Risks: this is a non-R3F runtime and cannot be pasted into a React component tree without an adapter; the package advertises `check` but the cloned commit has no `scripts/check.mjs`; the checked dependency install reports 3 high severity npm audit findings.
- Asset status: the repo has procedural code under MIT, but public FBX, PNG, HDR, and other files do not have a separate per-asset license record. Treat those assets as unavailable for the main game until verified.

## 3. ecctrl

- URL: https://github.com/pmndrs/ecctrl
- Local path: `references/ecctrl`
- Audited commit: `e2cab804f9f15661a642e76f52d09f0b2db63f35`
- Commit time: `2026-09-06T14:32:46-07:00`
- Version: 2.0.2.
- Stack: React 19.2.7, React DOM 19.2.7, R3F 9.6.1, Drei 10.7.7, React Three Rapier 2.2.0, Rapier compat 0.19.2, Three 0.184.0, Zustand 5.0.14, Vite 8.0.16, TypeScript 6.0.3.
- Entry points: `src/index.ts`, `src/character/Ecctrl.tsx`, `src/character/animation/`, `src/input/`, `src/gravity/`, and `src/time/`.
- Controller loop: `Ecctrl` uses `useFrame`, Rapier ShapeCast/RayCast ground detection, camera-relative movement, spring/damping floating, auto-balance, slope handling, moving-platform support, and an imperative handle.
- Input: named movement state accepts forward/backward/left/right, joystick, run, and jump. Drei `KeyboardControls` can supply the named input context.
- Animation: `EcctrlAnimationStateController` exposes IDLE, WALK, RUN, jump start/idle/fall/land transitions and reads live values from the controller handle.
- Cleanup: debug geometries/materials are disposed when debug asset memo values change; joystick and virtual button components reset stores on unmount; source files carry SPDX MIT headers.
- Migration value: controller integration, ref handle contract, ShapeCast defaults, animation state resolver, input names, and debug indicator approach.
- Compatibility decision: use Ecctrl 2.0.2 peer baseline exactly for the initial project lockfile so one Three.js instance is resolved.

## Command evidence

See `docs/p0-report.md` for install, lint, typecheck, build, and failure details. No code or asset was copied from these repositories into P1.
