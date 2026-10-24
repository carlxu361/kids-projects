import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useRef } from "react";
import type { EcctrlHandle } from "ecctrl";
import { useGameStore } from "../state/game-store";
import { CameraRig } from "../../player/camera/CameraRig";
import { PlayerController } from "../../player/controller/PlayerController";
import { CollisionWorld } from "../../world/collisions/CollisionWorld";
import { MagicCourtyard } from "../../world/environments/MagicCourtyard";
import { Atmosphere } from "../../world/lighting/Atmosphere";
import { PerformanceCollector } from "../../ui/PerformancePanel";
import { MoonwellQuestController } from "../../world/interactions/MoonwellQuestController";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
  { name: "rightward", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
  { name: "jump", keys: ["Space"] },
];

export function SceneCanvas() {
  const playerRef = useRef<EcctrlHandle | null>(null);
  const debugVisible = useGameStore((state) => state.debugVisible);
  const qualityMode = useGameStore((state) => state.qualityMode);

  return (
    <Canvas
      shadows
      dpr={qualityMode === "cinematic" ? [1, 2] : [0.8, 1.5]}
      camera={{ fov: 58, near: 0.1, far: 180, position: [0, 4, 8] }}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.autoUpdate = true;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <color attach="background" args={["#080b18"]} />
      <fog attach="fog" args={["#080b18", 28, 105]} />
      <KeyboardControls map={keyboardMap}>
        <Physics gravity={[0, -9.81, 0]} debug={debugVisible}>
          <Atmosphere />
          <MagicCourtyard />
          <CollisionWorld />
          <PlayerController playerRef={playerRef} />
          <MoonwellQuestController player={playerRef} />
          <CameraRig player={playerRef} />
          <PerformanceCollector />
        </Physics>
      </KeyboardControls>
    </Canvas>
  );
}
