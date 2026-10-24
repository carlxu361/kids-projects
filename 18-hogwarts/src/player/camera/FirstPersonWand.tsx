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
  const lumosEnabled = useGameStore((state) => state.quest.lumosEnabled);
  const offset = useMemo(() => new THREE.Vector3(0.46, -0.34, -0.68), []);
  const worldOffset = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!group.current) return;
    worldOffset.copy(offset).applyQuaternion(camera.quaternion);
    group.current.position.copy(camera.position).add(worldOffset);
    group.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={group} visible={visible} renderOrder={1000}>
      <mesh position={[0, -0.03, 0.07]} renderOrder={1000}>
        <sphereGeometry args={[0.075, 12, 8]} />
        <meshStandardMaterial color="#bd866c" roughness={0.9} />
      </mesh>
      <mesh rotation={[-1.05, 0, 0.55]} position={[0, 0.1, -0.23]} renderOrder={1000}>
        <cylinderGeometry args={[0.021, 0.033, 0.84, 8]} />
        <meshStandardMaterial color="#c59b5b" roughness={0.4} metalness={0.5} depthTest={false} />
      </mesh>
      <mesh position={[0, 0.46, -0.57]} renderOrder={1001}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color={lumosEnabled ? "#d8f7ff" : "#9f7e4e"} emissive={lumosEnabled ? "#8ce5ff" : "#000000"} emissiveIntensity={lumosEnabled ? 2.8 : 0} depthTest={false} />
      </mesh>
      {lumosEnabled && <pointLight color="#a9efff" intensity={4.5} distance={8} decay={2} position={[0, 0.42, -0.57]} />}
    </group>
  );
}
