# P0 report

Date: 2026-10-24

## Workspace result

The requested project directory was empty. The parent `kids-projects` repository contains unrelated dirty changes, so work is scoped to `18-hogwarts/` and uses branch `codex/hogwarts-p0-audit`.

Project-level `AGENTS.md` and `MEMORY.md` were created because the requested directory did not contain them and the advertised template directory was unavailable in this environment.

## Reference repository commands

| Repository | Install command | Result | Verification command | Result |
| --- | --- | --- | --- | --- |
| threejs-castle | `pnpm install --frozen-lockfile` | passed; 216 packages | `pnpm lint` | failed: 15 errors and 4 warnings from React purity, prop mutation, effect state update, and caught-error rules |
| threejs-castle | — | — | `pnpm build` | passed; Vite 8.0.2, 617 modules, 1.55 MB JS bundle before gzip; chunk-size warning |
| threejs-vfx | `npm ci` | failed because package-lock is out of sync; npm reported missing `@emnapi/*` entries and a mismatched wasi-threads version | `npm run check` | failed because declared `scripts/check.mjs` is absent in the cloned commit |
| threejs-vfx | `npm install` | passed; regenerated local clone install state; npm reported 3 high severity findings | `npm run build` | passed; Vite 8.1.5, 363 modules, several lazy chunks, main settings chunk about 1.23 MB before gzip |
| ecctrl | `npm ci` | passed; 155 packages; npm reported 6 vulnerabilities (2 moderate, 4 high) | `npm run typecheck` | passed |
| ecctrl | — | — | `npm run build:lib` | passed; Vite 8.0.16 and TypeScript library build |

The VFX `npm install` was used only after the clean `npm ci` failure exposed a stale lockfile. No force or legacy peer dependency flag was used.

## P0 decisions

- Start a new P1 application because no existing game code is present in this directory.
- Use Ecctrl 2.0.2's peer baseline for the main lockfile.
- Keep reference clones local and ignored; keep their findings in committed docs.
- Build P1 with procedural geometry and no unverified external assets.
- Treat castle visual techniques and VFX lifecycle patterns as design references, not drop-in code.

## P1 evidence

The P1 application uses the committed `pnpm-lock.yaml` and the compatibility versions recorded in `docs/compatibility-matrix.md`.

| Check | Command | Result |
| --- | --- | --- |
| Reproducible install | `CI=true pnpm install --frozen-lockfile --ignore-scripts` | passed; lockfile is up to date |
| TypeScript | `CI=true pnpm typecheck` | passed |
| ESLint | `CI=true pnpm lint` | passed |
| Unit tests | `CI=true pnpm test` | passed; 3 tests |
| Production build | `CI=true pnpm build` | passed; Vite 8.0.16, 594 modules; bundle-size warning remains |
| Browser smoke | Codex IAB at `http://127.0.0.1:5183/` | passed; scene loaded, third/first person switch, Lumos, and F3 telemetry checked |

The normal `pnpm install` path was also attempted. This environment's pnpm supply-chain policy blocked the `esbuild` build script, so the verified reproducible command uses `--ignore-scripts`. The application build and browser smoke both passed with that install state.

The browser smoke initially exposed two runtime defects: reference clone dependency folders caused duplicate React/Three resolution, and the debug panel attempted to render a DOM element inside R3F Canvas. The reference `node_modules` folders and Vite cache were removed from the workspace, the panel was split into an in-Canvas collector and an HTML overlay, and the smoke test was repeated successfully.
