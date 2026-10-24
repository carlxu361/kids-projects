import { SceneCanvas } from "./core/renderer/SceneCanvas";
import { KeyboardShortcuts } from "./core/input/KeyboardShortcuts";
import { Hud } from "./ui/Hud";
import { PerformancePanel } from "./ui/PerformancePanel";
import { useEffect } from "react";
import { startSoundscape } from "./core/audio/soundscape";

export default function App() {
  useEffect(() => {
    const startFromGesture = () => startSoundscape();
    window.addEventListener("pointerdown", startFromGesture);
    window.addEventListener("keydown", startFromGesture);
    return () => {
      window.removeEventListener("pointerdown", startFromGesture);
      window.removeEventListener("keydown", startFromGesture);
    };
  }, []);

  return (
    <main className="game-shell">
      <SceneCanvas />
      <KeyboardShortcuts />
      <Hud />
      <PerformancePanel />
    </main>
  );
}
