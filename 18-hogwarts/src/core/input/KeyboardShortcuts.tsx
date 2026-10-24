import { useEffect } from "react";
import { useGameStore } from "../state/game-store";

export function KeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat && ["KeyV", "Digit1", "F3"].includes(event.code)) {
        return;
      }

      if (event.code === "KeyV") {
        useGameStore.getState().toggleCameraMode();
      }

      if (event.code === "Digit1") {
        useGameStore.getState().toggleLumos();
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
