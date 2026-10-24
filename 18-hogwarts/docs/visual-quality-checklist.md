# Visual quality checklist

This checklist is the acceptance gate for replacing the P1 greybox with authored assets.

## Composition and readability

- [ ] The main hall and tower silhouette remain readable from the player start position.
- [ ] The fountain, arcade, torches, and entrance form a clear visual route.
- [ ] First-person and third-person views preserve the same spatial landmarks.
- [ ] No camera view begins inside a wall, floor, or prop.

## Geometry and materials

- [ ] Architectural proportions are measured against the player capsule.
- [ ] Normals are consistent and no large surface has visible backface errors.
- [ ] Stone, metal, wood, glass, and flame materials have distinct roughness and response.
- [ ] Authored textures have documented source, license, resolution, and compression path.

## Lighting and effects

- [ ] The key light, sky fill, torch lights, and emissive windows establish foreground/midground/background depth.
- [ ] Torch flicker stays stable without visible shadow swimming or extreme brightness jumps.
- [ ] Fog and particles support depth while keeping the navigation route readable.
- [ ] Lumos changes local illumination and has a clear on/off feedback state.

## Performance

- [ ] F3 metrics are available during development.
- [ ] Worst-case frame time is recorded for the busiest courtyard view.
- [ ] Quality tiers change DPR and effect cost predictably.
- [ ] Geometry, texture, and effect lifecycles release resources during scene reload.
