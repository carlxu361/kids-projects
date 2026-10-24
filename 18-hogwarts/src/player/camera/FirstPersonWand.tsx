import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../../core/state/game-store";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface FirstPersonWandProps {
  visible: boolean;
}

export function FirstPersonWand({ visible }: FirstPersonWandProps) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const lumosEnabled = useGameStore((state) => state.lumosEnabled);
  const offset = useMemo(() => new THREE.Vector3(0.38, -0.3, -0.68), []);
  const worldOffset = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!group.current) return;
    worldOffset.copy(offset).applyQuaternion(camera.quaternion);
    group.current.position.copy(camera.position).add(worldOffset);
    group.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={group} visible={visible} rotation={[0.55, 0.08, -0.42]}>
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.11, 12, 8]} />
        <meshStandardMaterial color="#bd866c" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.95, 8]} />
        <meshStandardMaterial color="#c59b5b" roughness={0.4} metalness={0.5} />
      </mesh>
      {lumosEnabled && <pointLight color="#a9efff" intensity={4.5} distance={8} decay={2} position={[0, 0.92, 0]} />}
    </group>
  );
}
