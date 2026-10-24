import { Ecctrl, type EcctrlHandle } from "ecctrl";
import type { RefObject } from "react";
import { useGameStore } from "../../core/state/game-store";
import { PlayerVisual } from "../animation/PlayerVisual";

interface PlayerControllerProps {
  playerRef: RefObject<EcctrlHandle | null>;
}

export function PlayerController({ playerRef }: PlayerControllerProps) {
  const cameraMode = useGameStore((state) => state.cameraMode);

  return (
    <Ecctrl
      ref={playerRef}
      position={[0, 1.1, 10]}
      capsuleHalfHeight={0.45}
      capsuleRadius={0.35}
      maxWalkVel={3.2}
      maxRunVel={6.2}
      jumpVel={5.4}
      groundDetection="shapeCast"
      floatHeight={0.22}
      debug={false}
    >
      <PlayerVisual cameraMode={cameraMode} />
    </Ecctrl>
  );
}
