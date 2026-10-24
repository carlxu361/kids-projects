import { useFrame } from "@react-three/fiber";
import type { EcctrlHandle } from "ecctrl";
import type { RefObject } from "react";
import { useGameStore } from "../../core/state/game-store";
import { findNearbyMoonwellTarget } from "./moonwell-targets";

interface MoonwellQuestControllerProps {
  player: RefObject<EcctrlHandle | null>;
}

export function MoonwellQuestController({ player }: MoonwellQuestControllerProps) {
  useFrame(() => {
    const handle = player.current;
    if (!handle) return;

    const state = useGameStore.getState();
    const position = handle.currPos;
    state.setNearbyTargetId(
      findNearbyMoonwellTarget(state.quest, { x: position.x, z: position.z }),
    );

    if (state.quest.stage === "openStudy" && position.z < -14.2) {
      state.enterStudy();
    }
  });

  return null;
}
