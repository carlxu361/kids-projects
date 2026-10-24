import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { useGameStore } from "../core/state/game-store";

export function PerformanceCollector() {
  const visible = useGameStore((state) => state.debugVisible);
  const setPerformanceMetrics = useGameStore((state) => state.setPerformanceMetrics);
  const { gl } = useThree();
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!visible) return;
    elapsed.current += delta;
    if (elapsed.current < 0.5) return;
    const fps = 1 / delta;
    setPerformanceMetrics({
      fps,
      frameMs: delta * 1000,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    });
    elapsed.current = 0;
  });

  return null;
}

export function PerformancePanel() {
  const visible = useGameStore((state) => state.debugVisible);
  const metrics = useGameStore((state) => state.performanceMetrics);

  if (!visible) return null;

  return (
    <aside className="debug-panel" aria-label="Performance debug panel">
      <div>FPS {metrics.fps.toFixed(0)}</div>
      <div>Frame {metrics.frameMs.toFixed(1)} ms</div>
      <div>Draw calls {metrics.calls}</div>
      <div>Triangles {metrics.triangles}</div>
      <div>Geometries {metrics.geometries}</div>
      <div>Textures {metrics.textures}</div>
    </aside>
  );
}
