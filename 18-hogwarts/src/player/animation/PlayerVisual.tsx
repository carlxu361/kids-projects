import type { CameraMode } from "../../core/state/game-store";
import { useGameStore } from "../../core/state/game-store";

interface PlayerVisualProps {
  cameraMode: CameraMode;
}

export function PlayerVisual({ cameraMode }: PlayerVisualProps) {
  const lumosEnabled = useGameStore((state) => state.lumosEnabled);

  return (
    <group>
      <mesh castShadow position={[0, 0.65, 0]}>
        <coneGeometry args={[0.48, 1.25, 12]} />
        <meshStandardMaterial color="#253a5d" roughness={0.72} metalness={0.08} />
      </mesh>
      <mesh castShadow position={[0, 1.47, 0]} visible={cameraMode === "third"}>
        <sphereGeometry args={[0.3, 16, 12]} />
        <meshStandardMaterial color="#b7805f" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.68, 0]} visible={cameraMode === "third"}>
        <coneGeometry args={[0.38, 0.42, 12]} />
        <meshStandardMaterial color="#151a32" roughness={0.82} />
      </mesh>
      <group position={[0.42, 1.04, -0.38]} rotation={[0.08, 0, -0.22]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.035, 0.85, 8]} />
          <meshStandardMaterial color="#b98a4e" roughness={0.44} metalness={0.45} />
        </mesh>
        {lumosEnabled && (
          <pointLight color="#9feaff" intensity={3.8} distance={7} decay={2} position={[0, 0.43, 0]} />
        )}
      </group>
    </group>
  );
}
