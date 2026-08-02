# Architecture

## Shape

The rebuild is a pnpm Monorepo:

```text
apps/client
apps/server
packages/shared
```

`packages/shared` is the only source for protocol types, settings, state names, constants, and math helpers. Client and server must not copy protocol definitions into their own folders.

## Server Authority

The server will own:

- matchmaking
- rooms
- role assignment
- round phase
- timers
- movement validation
- collision
- kills
- task sessions
- vent uses
- danger values
- Final Hide
- Seek map
- Ping
- AI
- win/loss

The client will own:

- input collection
- rendering
- UI
- animation
- sound
- interpolation

## Stage 1 Boundary

Stage 1 intentionally implements only:

- HTTP health check
- Socket.IO connection
- initial lobby phase
- Phaser shell

No old movement, map, room, task, AI, detector, or kill code is reused.

## AI Foundation

The first AI code is intentionally pure and testable:

- crewmate intent decisions use phase, danger value, task count, vent uses, and personality
- hunter intent decisions use visible targets, Final Hide Ping leads, and Seek map zone leads
- hunter AI never uses vents
- Final Hide crewmate AI removes task goals

Live room integration and pathfinding start after room, movement, and map data exist.
