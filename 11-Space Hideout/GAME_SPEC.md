# Space Hideout Game Spec

## Product Baseline

`space-hideout` is an original desktop browser Hide n Seek game inspired by the information logic of official Hide n Seek modes, without copying names, logos, art, maps, sounds, fonts, animation frames, or source code from existing games.

## Fixed First-Version Rules

- `HUNTER_COUNT = 1`
- Crewmates win by surviving until the final timer ends.
- Tasks reduce only the regular Hide timer.
- Completing all tasks does not immediately win the round.
- Hunter wins by killing all living crewmates before time ends.
- Living crewmates have limited vent uses.
- Hunter cannot use vents.
- Danger meter shows nearness only, not position or direction.
- Final Hide removes tasks and gives hunter speed, Seek map, and periodic directional Ping.
- No emergency meeting, report, discussion, voting, or ejection systems exist.

## Current Stage

Stage 0 and Stage 1 only:

- Backup and cleanup
- New pnpm Monorepo
- Shared config and types
- Client shell
- Server shell
- Health checks
- Test tooling
- Documentation

Gameplay implementation starts in Stage 2.
