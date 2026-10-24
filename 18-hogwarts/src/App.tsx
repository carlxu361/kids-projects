import { SceneCanvas } from "./core/renderer/SceneCanvas";
import { KeyboardShortcuts } from "./core/input/KeyboardShortcuts";
import { Hud } from "./ui/Hud";
import { PerformancePanel } from "./ui/PerformancePanel";

export default function App() {
  return (
    <main className="game-shell">
      <SceneCanvas />
      <KeyboardShortcuts />
      <Hud />
      <PerformancePanel />
    </main>
  );
}
