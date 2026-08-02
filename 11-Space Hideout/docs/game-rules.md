# Game Rules

## Round Phases

```ts
type RoundPhase = "lobby" | "intro" | "head_start" | "hide" | "final_hide" | "ended";
```

## One Hunter

Every round has exactly one hunter.

## Tasks

Tasks reduce the regular Hide timer only. They never directly win the round.

## Final Hide

When regular Hide time reaches zero:

- all tasks close
- hunter speed multiplier applies
- hunter receives Seek map
- hunter receives periodic direction Ping
- crewmates only survive, run, hide, and use remaining vents

## Removed Systems

The rebuild has no meeting, report, discussion, voting, ejection, skipped vote, tie, or meeting animation systems.
