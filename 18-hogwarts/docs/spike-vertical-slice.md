# Moonwell Courtyard — playable spike

Date: 2026-10-24
Status: implemented; automated checks passed; browser smoke completed for the opening interactions
Scope: one short, complete exploration-and-puzzle loop in the existing courtyard

## Goal and player experience

The spike tests whether a small Gothic courtyard can carry a memorable beginning, discovery, and reward without making the map larger. The player meets a spectral mentor, learns to use Lumos, follows three runes revealed by its light, opens a moonwell passage, and finds a hidden relic. The scene remains explicitly marked `PLACEHOLDER ART`.

## Acceptance flow

| Step | Player action | Game response | Completion condition |
| --- | --- | --- | --- |
| 1. Arrive | Explore the courtyard | The mentor offers a contextual interaction | Interact within range |
| 2. Learn | Speak with the mentor, then press `1` | Lumos toggles; nearby rune marks become visible and the HUD gives the next objective | Lumos is on |
| 3. Discover | Approach and interact with the Dawn, Tide, and Dusk runes | Each valid rune is recorded once; progress and short feedback update | 3 of 3 runes recorded |
| 4. Open | Walk through the opened moonwell arch | The quest advances into the hidden study | Cross the chamber threshold |
| 5. Reward | Approach and interact with the relic | The story reaches its terminal reward state | Quest is complete |

Controls: `WASD`/arrows move, `Shift` runs, `Space` jumps, `V` swaps camera, `1` toggles Lumos, `E` interacts, click the scene for mouse look, `F3` opens diagnostics. The HUD also provides contextual buttons.

## Design and module boundaries

- `src/quests/quest-machine.ts` is a pure reducer for allowed story transitions. Duplicate rune interactions are idempotent, invalid-stage interactions are ignored, and the completed quest is terminal.
- `src/world/interactions/moonwell-targets.ts` resolves only targets that are valid for the current stage and within their interaction radius.
- `src/world/interactions/MoonwellQuestController.tsx` samples the player's position and sends interaction/threshold events to game state. It does not put rules in the HUD.
- `src/core/state/game-store.ts` exposes quest, contextual target, Lumos, and camera state through Zustand.
- `src/core/audio/soundscape.ts` starts synthesized ambience after a user gesture and emits short Lumos, rune, discovery, and reward cues. Audio is presentation only.
- `src/world/environments/MagicCourtyard.tsx` contains the current procedural visual set; its meshes are placeholders, not final art.

The player and quest state are shared across first- and third-person views. This spike does not claim crouch/prone, final camera collision, classroom teaching, dueling, or enemy AI.

## TDD evidence

Three new test files were introduced before their corresponding implementation modules; their first run failed because those modules did not exist yet. Implementations were then added until the tests passed. The resulting checks cover:

- legal and illegal quest transitions, Lumos gating, idempotent rune progress, passage unlock, and terminal completion;
- nearest eligible interaction selection, distance limits, and stage gating;
- Zustand actions for camera switching, Lumos, and quest interaction.

## Verification record

Commands run from the project root:

| Command | Result |
| --- | --- |
| `CI=true pnpm typecheck` | Passed |
| `CI=true pnpm lint` | Passed with no warnings |
| `CI=true pnpm test` | Passed: 4 files, 17 tests |
| `CI=true pnpm build` | Passed; Vite emitted a large-chunk advisory for the current Three.js application bundle |

Browser smoke at `http://127.0.0.1:5183/` confirmed the scene loads, mentor interaction advances the objective, Lumos toggles and reveals rune progress, and first/third-person switching preserves the same scene state. The full walking route was not manually completed in this smoke session; full quest progression is covered by reducer tests. The browser is left at the initial courtyard state for play.

## Performance sample

The in-app debug overlay reported approximately 60 FPS, 16.6 ms, 155 draw calls, 28,350 triangles, 179 geometries, and 3 textures in one browser sample. This is an observational sample from the development viewport, not a controlled 1080p benchmark or a stable-60-FPS claim. Record device, resolution, quality setting, frame-time distribution, and worst frames before using it as a release target.

## Art and audio gaps

- Architecture, characters, runes, vegetation, torches, and the relic remain procedural `PLACEHOLDER ART`.
- Ambient and cue audio are synthesized Web Audio placeholders; no external sound asset is included.
- Still needed: authored/licensed castle and corridor kit, PBR stone/wood/plaster materials, character and mentor models with animation, wand, vegetation, flame/smoke treatment, and a licensed spatial soundscape.
- Fixed-camera screenshot comparison, sustained movement/collision walkthrough, mobile testing, memory/unmount checks, and complete route browser automation remain open.

## Next stage

Stabilize movement and camera collision during a full manual walkthrough, then add deterministic browser automation for the complete five-step route. After the route feels good, review composition and silhouettes at fixed camera positions and replace the highest-impact placeholder assets with assets whose licenses and sources are recorded.
