# Reference repositories

The three repositories requested for the P0 audit are cloned locally under this directory and intentionally ignored by the parent Git repository. They are research inputs, not source dependencies of the game.

Clone commands:

```bash
git clone https://github.com/luketurnbull/threejs-castle.git references/threejs-castle
git clone https://github.com/majidmanzarpour/threejs-vfx.git references/threejs-vfx
git clone https://github.com/pmndrs/ecctrl.git references/ecctrl
```

The checked commit SHAs, license findings, and executed commands are recorded in `../docs/source-audit.md`, `../docs/license-inventory.md`, and `../docs/p0-report.md`.
