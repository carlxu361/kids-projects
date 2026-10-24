# Compatibility matrix

Status: P1 lockfile verified with the reproducible install command below; runtime browser smoke also passed.

## Selected versions

The selection follows Ecctrl 2.0.2's own development and peer dependency baseline so React, R3F, Rapier, Ecctrl, and Three share one compatible graph.

| Package | Selected version | Evidence | Status |
| --- | --- | --- | --- |
| React | 19.2.7 | Ecctrl 2.0.2 dev and peer dependency | selected |
| React DOM | 19.2.7 | Ecctrl 2.0.2 dev and peer dependency | selected |
| Three | 0.184.0 | Ecctrl 2.0.2 dev and peer dependency | selected |
| @react-three/fiber | 9.6.1 | Ecctrl 2.0.2 dev and peer dependency >=9.4 | selected |
| @react-three/drei | 10.7.7 | Ecctrl 2.0.2 dev and peer dependency >=10.7 | selected |
| @react-three/rapier | 2.2.0 | Ecctrl 2.0.2 dev and peer dependency >=2.2.0 | selected |
| ecctrl | 2.0.2 | audited reference commit and package metadata | selected |
| @dimforge/rapier3d-compat | 0.19.2 | Ecctrl 2.0.2 development dependency | selected transitively |
| Zustand | 5.0.14 | Ecctrl 2.0.2 runtime dependency | selected |
| Vite | 8.0.16 | Ecctrl 2.0.2 development dependency | selected |
| TypeScript | 6.0.3 | Ecctrl 2.0.2 development dependency | selected |
| GLSL tooling | vite-plugin-glsl 1.5.6 | Castle reference and P1 shader plan | selected for later shader modules |

## Reference comparison

| Reference | React | R3F | Rapier | Three | Result |
| --- | --- | --- | --- | --- | --- |
| Castle | 19.2.4 | 9.5.0 | — | 0.183.2 | Useful visual reference; below Ecctrl peer baseline |
| VFX | — | — | — | 0.185.1 | Useful plain Three.js VFX reference; requires an R3F adapter |
| Ecctrl | 19.2.7 | 9.6.1 | 2.2.0 | 0.184.0 | Baseline selected for the application |

## Rules

- Keep one `three` package in the final dependency graph.
- Do not use `--force` or `--legacy-peer-deps`.
- Re-run `CI=true pnpm install --frozen-lockfile --ignore-scripts`, `pnpm typecheck`, and `pnpm build` after dependency changes in this environment.
- If a future upgrade changes Ecctrl peer requirements, update this matrix before editing application code.
