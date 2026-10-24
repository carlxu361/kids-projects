# Hogwarts Immersive Web Game

徐锦成的高品质 3D 魔法世界网页游戏项目。当前包含一个可从庭院探索到月井密室并取得遗物的短篇试玩 spike。

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
- `E`: interact with the nearby character, rune, or relic
- Click the scene: enable mouse look (Pointer Lock)
- `F3`: toggle performance panel

## Current stage

The courtyard, mentor, and relic are procedural greybox geometry. The HUD marks the scene as `PLACEHOLDER ART`; it is a playable vertical slice, not the final art pass. A short route teaches Lumos, reveals three runes, opens the moonwell passage, and rewards exploration with a hidden relic. Ambient sound and spell cues are synthesized in the browser.

See [the spike report](docs/spike-vertical-slice.md) for requirements, interaction flow, test evidence, observed performance, and remaining work.

P0 audit results, P1 verification, and the three reference repository findings are in [docs/p0-report.md](docs/p0-report.md) and [docs/p1-report.md](docs/p1-report.md).

Key project documents:

- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [Feature matrix](docs/feature-matrix.md)
- [Spike vertical-slice report](docs/spike-vertical-slice.md)
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
