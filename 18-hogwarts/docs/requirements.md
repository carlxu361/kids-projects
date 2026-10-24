# Hogwarts Immersive Web Game — requirements baseline

Status: P0 and P1 foundations complete; compact P1 story spike implemented; broader P2/P3 scope remains planned

Date: 2026-10-24

## Product goal

Build a browser-based 3D magic adventure with strong atmosphere and reliable interaction. The project grows through small vertical slices. Each slice must run, be testable, and leave evidence in the repository.

The quality order is:

1. Visual presentation and spatial immersion.
2. Magic interaction and game feel.
3. Content breadth.

## Combined scope from the two project briefs

The previous project brief describes an existing demo with a third-person courtyard, NPCs, quests, and basic spells. The current workspace does not contain that implementation, so the first implementation slice establishes a new compatible foundation while preserving the requested behavior as the target specification.

### P0 — evidence and compatibility

- Inspect the workspace and Git state before implementation.
- Clone the three named reference repositories into isolated `references/` folders.
- Record commit SHA, commit time, source structure, dependencies, licenses, assets, lifecycle behavior, and real build/check results.
- Select one shared Three.js version for React, R3F, Drei, Rapier, and Ecctrl.
- Do not copy assets or code whose license cannot be confirmed.

### P1 — runnable magic courtyard

- React + TypeScript + Vite application with pnpm lockfile.
- Procedural Gothic courtyard greybox marked `PLACEHOLDER` until licensed final art exists.
- Main hall, tower silhouettes, stone courtyard, colonnade/archway, interior corridor glimpse, windows, torches, fog, stars, and wind-like particle motion.
- Rapier ground and building collision bodies.
- Ecctrl character movement with WASD, Shift run, and Space jump.
- Shared camera foundation with V toggling first-person and third-person modes.
- First-person wand presentation and a real nearby Lumos point light.
- Zustand store for camera mode, Lumos state, debug HUD, and quality mode.
- Spell registry and cooldown utility so visual effects do not own gameplay rules.
- Compact, complete first-play loop: meet mentor, learn Lumos, reveal three moonwell runes, open the passage, and collect the hidden relic.
- Context-sensitive keyboard and HUD interaction, state-aware rune targeting, and synthesized ambience/feedback with no unlicensed audio dependency.
- TDD for pure quest transitions, interaction targeting, and shared Zustand actions.
- Type checking, linting, unit test, production build, and manual browser smoke entry point.

### P2 — dual-view interaction and robust movement

- Pointer Lock mouse look, smooth 0.2–0.35 second camera transition, third-person shoulder offset, camera obstacle correction, and first-person local-model hiding.
- Crouch and prone state with matching collider and animation changes.
- Mobile camera-mode button and controller/R3 input mapping.
- Accio, Levioso, Expelliarmus, Protego, and Confringo with distinct rule and VFX modules.

### P3 — expanded vertical slice

- Explore courtyard, enter classroom, learn a spell, solve an environmental puzzle, find a hidden room, duel, and receive a reward.
- NPC dialogue and task guidance.
- Explainable enemy state machine with patrol, alert, reposition, cast, defend, control reaction, failure, and retreat.
- Easy, normal, and challenge presets.

The compact moonwell story is an implemented spike and does not claim the broader P3 classroom, duel, NPC, or enemy scope is complete. Its evidence and limitations are tracked in `docs/spike-vertical-slice.md`.

### P4 — quality and release

- Licensed final assets, KTX2/DRACO or an equivalent optimized pipeline, spatial audio, settings, performance report, fixed-camera visual regression, and public release review.

## Non-functional requirements

- The renderer, physics, input, audio, gameplay rules, VFX, UI, and data modules have explicit boundaries.
- Desktop 1080p targets stable 60 FPS on a recorded test machine; worst-frame time is reported alongside average FPS.
- Debug telemetry can be disabled in the public build.
- Effects have cleanup paths, concurrency limits, and quality tiers before large spell counts are added.
- Every stage report lists implemented features, changed files, commands, real results, known issues, asset gaps, evidence, and next steps.

## Acceptance gates

- A stage is complete only when its stated commands have been run and their outcomes are recorded.
- A failed check remains visible in the report until it is fixed or explicitly accepted as a reference-repository issue.
- A placeholder is never described as final quality.
- A public build must not include secrets, internal instruction files, admin controls, or debug-only controls.
