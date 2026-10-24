# License and asset inventory

Audit date: 2026-10-24

This document separates reusable code from assets. “Unverified” means it is excluded from the main game.

| Source | Code license | Code reuse status | Models / textures / audio status |
| --- | --- | --- | --- |
| `luketurnbull/threejs-castle` | No `LICENSE`, `NOTICE`, or explicit repository license found in the clone | Unverified; do not copy | `public/scene.glb`, KTX2 textures, PNG/JPG textures, fonts, and `src/assets/*` audio are unverified; do not copy |
| `majidmanzarpour/threejs-vfx` | MIT, copyright notice for mohamedachrefelouafi | Candidate for selective reuse with MIT text and attribution retained; prefer reimplementation of patterns | `public/models/*.fbx`, `public/models/diffuse.png`, and `public/hdri/spruit_sunrise.hdr` have no separate asset license record in the audited tree; unverified |
| `pmndrs/ecctrl` | MIT, copyright 2023–2026 Erdong Chen; source SPDX headers; `NOTICE` included | Safe as the `ecctrl` npm dependency under MIT terms; preserve license/NOTICE if source is redistributed | Example animations are identified in NOTICE as Quaternius Universal Animation Library, CC0; example assets remain reference-only until their exact files are confirmed |

## P1 project assets

P1 contains no copied third-party model, texture, HDRI, font, or audio. The courtyard is generated from Three.js geometries and materials. This avoids making an unverified asset look like final production art.

## Dependency license follow-up

Before public release, generate a dependency license report for the final pnpm lockfile and check direct asset provenance. Runtime dependencies are packages, not copied source files, but their license notices still belong in the release checklist.

## Required attribution behavior

- Keep the Ecctrl package's MIT license and NOTICE available when redistributing the dependency or copied source.
- If VFX code is reused, keep its MIT copyright and license text.
- Do not claim the castle repository or its assets are reusable without a license document from the authors.
