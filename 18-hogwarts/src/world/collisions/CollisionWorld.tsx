import { CuboidCollider, RigidBody } from "@react-three/rapier";

export function CollisionWorld() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[22, 0.25, 22]} position={[0, -0.25, 0]} />
      <CuboidCollider args={[22, 3.2, 0.45]} position={[0, 3, -22]} />
      <CuboidCollider args={[22, 3.2, 0.45]} position={[0, 3, 22]} />
      <CuboidCollider args={[0.45, 3.2, 22]} position={[-22, 3, 0]} />
      <CuboidCollider args={[0.45, 3.2, 22]} position={[22, 3, 0]} />
      <CuboidCollider args={[8.5, 4.2, 0.8]} position={[0, 4.2, -15.4]} />
      <CuboidCollider args={[1.4, 5.2, 1.4]} position={[-9.5, 5.2, -14.4]} />
      <CuboidCollider args={[1.4, 5.2, 1.4]} position={[9.5, 5.2, -14.4]} />
      <CuboidCollider args={[0.55, 2.4, 8]} position={[-13.5, 2.4, -1]} />
    </RigidBody>
  );
}
