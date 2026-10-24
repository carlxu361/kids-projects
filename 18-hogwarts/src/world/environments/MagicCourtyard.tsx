import { Instance, Instances, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const stoneColor = "#3f485b";
const trimColor = "#66728a";
const warmWindow = "#e7b96d";

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.17 + salt * 17.31) * 43758.5453;
  return value - Math.floor(value);
}

export function MagicCourtyard() {
  return (
    <group>
      <CourtyardFloor />
      <MainHall />
      <Arcade />
      <CourtyardTorches />
      <Fountain />
      <Sparkles count={55} scale={[28, 4, 28]} position={[0, 1.8, 1]} size={0.8} speed={0.18} color="#f0d89e" opacity={0.28} />
    </group>
  );
}

function CourtyardFloor() {
  const stones = useMemo(
    () =>
      Array.from({ length: 128 }, (_, index) => ({
        position: [
          (seeded(index, 1) - 0.5) * 40,
          0.04 + seeded(index, 2) * 0.04,
          (seeded(index, 3) - 0.5) * 38,
        ] as [number, number, number],
        rotation: [0, seeded(index, 4) * Math.PI, 0] as [number, number, number],
        scale: [0.92 + seeded(index, 5) * 0.26, 0.08, 0.72 + seeded(index, 6) * 0.25] as [number, number, number],
      })),
    [],
  );

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#171c2a" roughness={0.98} metalness={0.02} />
      </mesh>
      <Instances limit={stones.length} range={stones.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={stoneColor} roughness={0.86} metalness={0.08} />
        {stones.map((stone, index) => (
          <Instance key={index} {...stone} />
        ))}
      </Instances>
    </group>
  );
}

function MainHall() {
  const windows = [-4.8, -2.4, 2.4, 4.8];

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 4.8, -15.2]}>
        <boxGeometry args={[18, 9.6, 2.4]} />
        <meshStandardMaterial color={stoneColor} roughness={0.76} metalness={0.12} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 10.1, -15.2]}>
        <boxGeometry args={[14, 1.6, 2]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} metalness={0.16} />
      </mesh>
      <Tower position={[-9.3, 0, -15]} height={16} />
      <Tower position={[9.3, 0, -15]} height={16} />
      {windows.map((x) => (
        <mesh key={x} castShadow position={[x, 5.7, -13.92]}>
          <boxGeometry args={[1.05, 2.3, 0.12]} />
          <meshStandardMaterial color={warmWindow} emissive={warmWindow} emissiveIntensity={2.8} roughness={0.32} />
        </mesh>
      ))}
      <mesh position={[0, 3.1, -13.9]}>
        <boxGeometry args={[3.1, 4.2, 0.2]} />
        <meshStandardMaterial color="#111628" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 6.4, -13.8]}>
        <coneGeometry args={[3.4, 2.7, 4]} />
        <meshStandardMaterial color="#27324a" roughness={0.6} metalness={0.22} />
      </mesh>
    </group>
  );
}

function Tower({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[2.25, 2.5, height, 12]} />
        <meshStandardMaterial color={stoneColor} roughness={0.78} metalness={0.1} />
      </mesh>
      <mesh castShadow position={[0, height + 1.6, 0]}>
        <coneGeometry args={[3.1, 4.2, 12]} />
        <meshStandardMaterial color="#1a2034" roughness={0.68} metalness={0.3} />
      </mesh>
      <mesh position={[0, height * 0.6, -2.22]}>
        <boxGeometry args={[0.8, 1.5, 0.12]} />
        <meshStandardMaterial color={warmWindow} emissive={warmWindow} emissiveIntensity={2.4} />
      </mesh>
    </group>
  );
}

function Arcade() {
  const bays = [-9, -5, -1, 3, 7];
  return (
    <group position={[0, 0, -3.5]}>
      <mesh castShadow receiveShadow position={[-13.5, 4.6, 0]}>
        <boxGeometry args={[1, 9.2, 17]} />
        <meshStandardMaterial color="#30394d" roughness={0.82} metalness={0.08} />
      </mesh>
      {bays.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh castShadow position={[0, 3.1, 0]}>
            <boxGeometry args={[0.75, 6.2, 1.2]} />
            <meshStandardMaterial color={trimColor} roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, 7.25, 0]}>
            <boxGeometry args={[4, 1.2, 1.2]} />
            <meshStandardMaterial color={trimColor} roughness={0.72} />
          </mesh>
          <mesh position={[0, 4, -0.63]}>
            <boxGeometry args={[2.9, 3.6, 0.08]} />
            <meshStandardMaterial color="#0c1020" roughness={0.65} />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 8.4, 0]}>
        <boxGeometry args={[17, 0.8, 1.5]} />
        <meshStandardMaterial color="#20283e" roughness={0.65} metalness={0.18} />
      </mesh>
      <group position={[-10.5, 1.2, -0.6]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.7, 9]} />
          <meshStandardMaterial color="#0c1020" roughness={0.9} />
        </mesh>
        <mesh position={[0, 2.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.5, 0.04]} />
          <meshStandardMaterial color="#9e6b46" roughness={0.78} />
        </mesh>
      </group>
    </group>
  );
}

function CourtyardTorches() {
  const positions: Array<[number, number, number]> = [
    [-8, 0, 8],
    [8, 0, 8],
    [-13, 0, -5],
    [13, 0, -5],
    [-7, 0, -10],
    [7, 0, -10],
  ];

  return (
    <group>
      {positions.map((position, index) => (
        <Torch key={position.join("-")} position={position} phase={index * 0.73} />
      ))}
    </group>
  );
}

function Torch({ position, phase }: { position: [number, number, number]; phase: number }) {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 8.4 + phase) * 0.14 + Math.sin(clock.elapsedTime * 15.2 + phase) * 0.06;
    if (light.current) light.current.intensity = 4.2 * pulse;
    if (flame.current) flame.current.scale.set(1 + (pulse - 1) * 0.7, pulse, 1 + (pulse - 1) * 0.7);
  });

  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 2.2, 8]} />
        <meshStandardMaterial color="#553b2b" roughness={0.9} />
      </mesh>
      <mesh ref={flame} castShadow position={[0, 2.35, 0]}>
        <coneGeometry args={[0.23, 0.7, 10]} />
        <meshStandardMaterial color="#ffb45d" emissive="#ff6a2c" emissiveIntensity={4} transparent opacity={0.94} />
      </mesh>
      <pointLight ref={light} color="#ff9e52" intensity={4.2} distance={9} decay={2} position={[0, 2.25, 0]} castShadow />
    </group>
  );
}

function Fountain() {
  return (
    <group position={[0, 0, 5]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[3.1, 3.35, 0.45, 32]} />
        <meshStandardMaterial color="#5b667a" roughness={0.55} metalness={0.28} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[2.75, 2.75, 0.06, 32]} />
        <meshStandardMaterial color="#203e61" roughness={0.22} metalness={0.35} emissive="#0b2139" emissiveIntensity={0.28} />
      </mesh>
      <mesh castShadow position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.45, 0.72, 1.8, 16]} />
        <meshStandardMaterial color={trimColor} roughness={0.62} metalness={0.2} />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color="#9beaff" emissive="#36b7e9" emissiveIntensity={1.8} transparent opacity={0.85} />
      </mesh>
      <pointLight color="#42b9e8" intensity={1.2} distance={7} position={[0, 1.5, 0]} />
    </group>
  );
}
