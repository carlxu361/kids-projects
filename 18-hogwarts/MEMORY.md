# MEMORY.md

> This file stores project memory so later sessions can continue without rereading the whole history.

## Project Summary

- Project name: Hogwarts Immersive Web Game
- Created date: 2026-10-24
- Main goal: 建设徐锦成的高品质浏览器 3D 魔法冒险游戏作品
- Current status: P0 audit and P1 courtyard greybox are complete; the next stage is controller/camera stabilization and authored asset replacement.
- Tech stack: React, TypeScript, Vite, React Three Fiber, Three.js, Rapier, Zustand, GLSL tooling, pnpm

## User Preferences

- Default discussion language: Chinese
- Explain principles before implementation.
- Use simple, clear language suitable for a 12-year-old learner.
- Conclusion first, reason second.
- Point out problems directly.
- Prefer small, testable learning steps.
- When the user says “直接帮我做”, implement actively and explain the important principle.

## Product Decisions

- 2026-10-24: Build in staged vertical slices. P0 establishes evidence and compatibility; P1 targets one polished magic courtyard before adding broad content.
- 2026-10-24: The first-person and third-person views share one player, physics, spell, enemy, quest, and save state; camera mode is a presentation and input layer.
- 2026-10-24: Placeholder assets are allowed for greybox work only when clearly labeled and tracked in an asset gap list.
- 2026-10-24: Reference repositories remain isolated under `references/` and are not copied into the main app until license and compatibility checks pass.
- 2026-10-24: P1 uses deterministic procedural geometry and marks the scene `PLACEHOLDER ART`; no unverified reference assets are part of the main app.
- 2026-10-24: Keep R3F hooks inside Canvas and render HTML overlays outside Canvas. Performance telemetry uses an in-Canvas collector plus a Zustand bridge.
- 2026-10-24: Third-person camera uses direct `camera.lookAt()` after quaternion interpolation failed to produce a visible view in browser smoke; camera collision and smoother shoulder framing remain P2 work.

## Architecture Notes

- Planned boundaries: `core/` for renderer, assets, physics, input, audio, and performance; `world/` for environments and interactions; `player/` for controller and camera; `spells/` for definitions, casting, effects, targeting, and impacts; `combat/`, `npc/`, `quests/`, `ui/`, `shaders/`, `data/`, and `tests/` for their own responsibilities.
- Game rules must not be decided by visual effects. VFX reports presentation events; combat and spell rules change game state.
- Spell definitions will use a registry so cooldowns, targeting, effects, and tests can be inspected independently.

## Research and License Notes

- 2026-10-24: The three requested references are `luketurnbull/threejs-castle`, `majidmanzarpour/threejs-vfx`, and `pmndrs/ecctrl`; audit results belong in `docs/source-audit.md` and `docs/license-inventory.md`.
- Do not record secrets, tokens, private account details, or unverified license claims.

## Useful Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Pitfalls and Fixes

- 2026-10-24: Problem: the project directory was empty and the repository root contained unrelated dirty changes.
  Fix: keep all work scoped to `18-hogwarts/` and avoid staging parent-repository changes.
- 2026-10-24: Problem: `/Users/hachiware/.codex/templates/` was unavailable.
  Fix: create project-level instruction and memory files from the user-provided rules and the existing root-project conventions.
- 2026-10-24: Problem: reference clone `node_modules` folders caused Vite to resolve duplicate React/Three instances when scanning the parent repository.
  Fix: remove generated reference install folders and the app Vite cache; keep reference source clones ignored and audit results committed.
- 2026-10-24: Problem: an HTML performance panel rendered inside R3F Canvas and crashed when enabled.
  Fix: split metrics collection from the DOM panel and bridge them through the game store.

## Session Log

- 2026-10-24: Read the repository instructions and root memory, confirmed the project directory is empty, and created this project-level `AGENTS.md` and `MEMORY.md`.
- 2026-10-24: Completed the three reference audits, created P0/P1 documentation, implemented the procedural courtyard and shared camera/player foundation, and verified typecheck, lint, unit tests, production build, and browser smoke.

## Do Not Store

- Passwords
- API keys
- Tokens
- Private account details
- Large copies of code that already exist in the project
