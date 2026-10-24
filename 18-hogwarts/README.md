# Hogwarts Immersive Web Game

徐锦成的高品质 3D 魔法世界网页游戏项目。当前完成 P0 技术审计和 P1 魔法学院庭院灰盒垂直切片基础。

## Run locally

```bash
CI=true pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Then open the local Vite URL. The current browser smoke session used `http://127.0.0.1:5183/` because port 5173 was already occupied.

## Controls

- `WASD` / arrow keys: move
- `Shift`: sprint
- `Space`: jump
- `V`: switch first/third person
- `1`: toggle Lumos
- `F3`: toggle performance panel

## Current stage

The visible courtyard is procedural greybox geometry. The HUD marks it as `PLACEHOLDER ART`; it is a playable technical foundation, not the final art pass.

P0 audit results, P1 verification, and the three reference repository findings are in [docs/p0-report.md](docs/p0-report.md) and [docs/p1-report.md](docs/p1-report.md).

Key project documents:

- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Feature matrix](docs/feature-matrix.md)
- [Source audit](docs/source-audit.md)
- [License inventory](docs/license-inventory.md)
- [Compatibility matrix](docs/compatibility-matrix.md)
- [Asset gap list](docs/asset-gap-list.md)
- [Visual quality checklist](docs/visual-quality-checklist.md)

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

No external model, texture, or audio asset from the reference repositories has been copied into the main application.
