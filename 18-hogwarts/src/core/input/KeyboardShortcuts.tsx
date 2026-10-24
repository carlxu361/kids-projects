import { useEffect } from "react";
import { playMagicCue, startSoundscape } from "../audio/soundscape";
import { useGameStore } from "../state/game-store";

export function KeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat && ["KeyV", "KeyE", "Digit1", "F3"].includes(event.code)) {
        return;
      }

      if (event.code === "KeyV") {
        startSoundscape();
        useGameStore.getState().toggleCameraMode();
      }

      if (event.code === "Digit1") {
        startSoundscape();
        const wasEnabled = useGameStore.getState().quest.lumosEnabled;
        useGameStore.getState().toggleLumos();
        playMagicCue(wasEnabled ? "dim" : "lumos");
      }

      if (event.code === "KeyE") {
        startSoundscape();
        const before = useGameStore.getState().quest;
        useGameStore.getState().interact();
        const after = useGameStore.getState().quest;
        if (before.stage !== after.stage) {
          playMagicCue(after.stage === "complete" ? "reward" : "discovery");
        } else if (before.activatedRunes.length !== after.activatedRunes.length) {
          playMagicCue("rune");
        }
      }

      if (event.code === "F3") {
        event.preventDefault();
        useGameStore.getState().toggleDebug();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
