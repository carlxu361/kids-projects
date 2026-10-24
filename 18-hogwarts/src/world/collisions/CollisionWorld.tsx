import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useGameStore } from "../../core/state/game-store";

export function CollisionWorld() {
  const questStage = useGameStore((state) => state.quest.stage);
  const studyOpen = questStage === "openStudy" || questStage === "insideStudy" || questStage === "complete";

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[20, 0.25, 23]} position={[0, -0.25, -4]} />
        <CuboidCollider args={[20, 3.5, 0.5]} position={[0, 3.2, -27]} />
        <CuboidCollider args={[20, 3.5, 0.5]} position={[0, 3.2, 19]} />
        <CuboidCollider args={[0.5, 3.5, 23]} position={[-20, 3.2, -4]} />
        <CuboidCollider args={[0.5, 3.5, 23]} position={[20, 3.2, -4]} />
        <CuboidCollider args={[0.4, 4.4, 19.5]} position={[-15.8, 4.4, 1.8]} />
        <CuboidCollider args={[0.4, 4.4, 19.5]} position={[15.8, 4.4, 1.8]} />

        <CuboidCollider args={[7.7, 4.8, 0.55]} position={[-10.45, 4.8, -12]} />
        <CuboidCollider args={[7.7, 4.8, 0.55]} position={[10.45, 4.8, -12]} />
        <CuboidCollider args={[0.45, 4.1, 0.6]} position={[-3.05, 4.1, -12]} />
        <CuboidCollider args={[0.45, 4.1, 0.6]} position={[3.05, 4.1, -12]} />
        <CuboidCollider args={[0.45, 3.2, 5.8]} position={[-4.65, 3.2, -19.2]} />
        <CuboidCollider args={[0.45, 3.2, 5.8]} position={[4.65, 3.2, -19.2]} />

        <CuboidCollider args={[2.2, 0.5, 0.3]} position={[-3, 0.5, 4.45]} />
        <CuboidCollider args={[2.2, 0.5, 0.3]} position={[-3, 0.5, 0.35]} />
        <CuboidCollider args={[0.3, 0.5, 1.75]} position={[-5.1, 0.5, 2.4]} />
        <CuboidCollider args={[0.3, 0.5, 1.75]} position={[-0.9, 0.5, 2.4]} />
        <CuboidCollider args={[0.62, 0.9, 0.62]} position={[-3, 1.35, 2.4]} />
        <CuboidCollider args={[0.72, 0.9, 0.72]} position={[-7, 0.9, 0]} />
        <CuboidCollider args={[0.72, 0.9, 0.72]} position={[0, 0.9, -5.4]} />
        <CuboidCollider args={[0.72, 0.9, 0.72]} position={[7, 0.9, 0]} />
        <CuboidCollider args={[0.55, 1, 0.45]} position={[3.35, 1, 7.4]} />
      </RigidBody>
      {!studyOpen && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[2.55, 2.45, 0.3]} position={[0, 2.45, -12]} />
        </RigidBody>
      )}
    </>
  );
}
