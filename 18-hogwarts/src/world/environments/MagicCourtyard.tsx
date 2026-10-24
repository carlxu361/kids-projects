import { Instance, Instances, Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../../core/state/game-store";
import type { MoonwellTargetId } from "../../quests/quest-machine";

const stoneColor = "#42495b";
const trimColor = "#7c8190";
const warmWindow = "#e7b96d";
const PAVING_COLUMNS = 29;
const PAVING_ROWS = 34;
const pavingColors = ["#4b5362", "#525b69", "#58616f", "#454e5e"];
const runeLayout: Array<{
  id: MoonwellTargetId;
  position: [number, number, number];
  color: string;
  glyph: number;
}> = [
  { id: "rune-dawn", position: [-7, 0, 0], color: "#75d9f2", glyph: 0 },
  { id: "rune-tide", position: [0, 0, -5.4], color: "#ba9af9", glyph: 1 },
  { id: "rune-dusk", position: [7, 0, 0], color: "#efd28d", glyph: 2 },
];

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 91.17 + salt * 17.31) * 43758.5453;
  return value - Math.floor(value);
}

export function MagicCourtyard() {
  return (
    <group>
      <CourtyardFloor />
      <Arcade />
      <RearFacade />
      <StudyChamber />
      <PortalGate />
      <Moonwell />
      {runeLayout.map((rune) => <RuneStone key={rune.id} {...rune} />)}
      <Mentor />
      <CourtyardTorches />
      <CourtyardPlanting />
      <Sparkles count={75} scale={[31, 7, 38]} position={[0, 2.2, -4]} size={0.72} speed={0.15} color="#c8d8ff" opacity={0.24} />
    </group>
  );
}

function CourtyardFloor() {
  const stones = useMemo(
    () =>
      Array.from({ length: PAVING_COLUMNS * PAVING_ROWS }, (_, index) => {
        const column = index % PAVING_COLUMNS;
        const row = Math.floor(index / PAVING_COLUMNS);
        return {
          position: [
            (column - (PAVING_COLUMNS - 1) / 2) * 1.28 + (row % 2) * 0.42 + (seeded(index, 1) - 0.5) * 0.06,
            -0.055 + seeded(index, 2) * 0.012,
            -25.3 + row * 1.32 + (seeded(index, 3) - 0.5) * 0.055,
          ] as [number, number, number],
          rotation: [0, (seeded(index, 4) - 0.5) * 0.035, 0] as [number, number, number],
          scale: [1.18 + seeded(index, 5) * 0.08, 0.11, 1.14 + seeded(index, 6) * 0.08] as [number, number, number],
          color: pavingColors[Math.floor(seeded(index, 7) * pavingColors.length)],
        };
      }),
    [],
  );

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, -4]}>
        <planeGeometry args={[40, 46]} />
        <meshStandardMaterial color="#171b28" roughness={0.96} metalness={0.04} />
      </mesh>
      <Instances limit={stones.length} range={stones.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={stoneColor} roughness={0.86} metalness={0.1} />
        {stones.map((stone, index) => <Instance key={index} {...stone} />)}
      </Instances>
      <mesh receiveShadow position={[0, 0.015, -12]}>
        <boxGeometry args={[6.1, 0.035, 0.22]} />
        <meshStandardMaterial color="#9f8963" emissive="#8d744c" emissiveIntensity={0.22} roughness={0.48} />
      </mesh>
      <mesh receiveShadow position={[0, 0.012, 1.8]}>
        <boxGeometry args={[3.8, 0.03, 17.5]} />
        <meshStandardMaterial color="#34394a" roughness={0.78} />
      </mesh>
    </group>
  );
}

function Arcade() {
  const bays = [-10, -5, 0, 5, 10, 15];
  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh castShadow receiveShadow position={[side * 15.8, 4.4, 1.8]}>
            <boxGeometry args={[0.7, 8.8, 39]} />
            <meshStandardMaterial color="#303747" roughness={0.82} metalness={0.08} />
          </mesh>
          {bays.map((center) => (
            <group key={center}>
              {[-2.2, 2.2].map((offset) => (
                <mesh key={offset} castShadow receiveShadow position={[side * 14.9, 2.95, center + offset]}>
                  <cylinderGeometry args={[0.34, 0.46, 5.9, 12]} />
                  <meshStandardMaterial color={trimColor} roughness={0.7} metalness={0.12} />
                </mesh>
              ))}
              <mesh
                castShadow
                receiveShadow
                position={[side * 14.9, 5.9, center]}
                rotation={[0, side * Math.PI / 2, 0]}
              >
                <torusGeometry args={[2.2, 0.24, 10, 24, Math.PI]} />
                <meshStandardMaterial color={trimColor} roughness={0.66} metalness={0.16} />
              </mesh>
              <mesh position={[side * 15.36, 3.05, center]} rotation={[0, side * Math.PI / 2, 0]}>
                <planeGeometry args={[3.6, 2.9]} />
                <meshStandardMaterial color="#0b1020" roughness={0.86} />
              </mesh>
            </group>
          ))}
          <mesh castShadow receiveShadow position={[side * 14.9, 8.05, 1.8]}>
            <boxGeometry args={[1.25, 0.68, 39]} />
            <meshStandardMaterial color="#242b3b" roughness={0.65} metalness={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RearFacade() {
  const windows = [-15.2, -10.6, -6.1, 6.1, 10.6, 15.2];
  return (
    <group>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh castShadow receiveShadow position={[side * 10.6, 4.5, -12.5]}>
            <boxGeometry args={[14.8, 9, 1.2]} />
            <meshStandardMaterial color={stoneColor} roughness={0.78} metalness={0.1} />
          </mesh>
          <mesh castShadow receiveShadow position={[side * 16.5, 7.3, -12.4]}>
            <boxGeometry args={[2.2, 1.1, 1.65]} />
            <meshStandardMaterial color="#737b8c" roughness={0.62} metalness={0.18} />
          </mesh>
        </group>
      ))}
      {windows.map((x) => (
        <group key={x} position={[x, 0, -11.84]}>
          <mesh castShadow position={[0, 4.9, 0]}>
            <boxGeometry args={[1.4, 2.85, 0.12]} />
            <meshStandardMaterial color="#23283a" roughness={0.36} metalness={0.32} />
          </mesh>
          <mesh position={[0, 4.9, 0.08]}>
            <boxGeometry args={[0.9, 2.3, 0.04]} />
            <meshStandardMaterial color={warmWindow} emissive={warmWindow} emissiveIntensity={2.1} roughness={0.3} />
          </mesh>
          <mesh position={[0, 4.9, 0.12]}>
            <boxGeometry args={[0.11, 2.55, 0.05]} />
            <meshStandardMaterial color="#6a563f" roughness={0.68} />
          </mesh>
          <mesh position={[0, 4.9, 0.12]}>
            <boxGeometry args={[1.05, 0.11, 0.05]} />
            <meshStandardMaterial color="#6a563f" roughness={0.68} />
          </mesh>
        </group>
      ))}
      <GothicTower position={[-17.1, 0, -12.4]} height={14.5} />
      <GothicTower position={[17.1, 0, -12.4]} height={14.5} />
      <mesh castShadow position={[0, 4.65, -12.85]} rotation={[0, 0, 0]}>
        <torusGeometry args={[2.75, 0.36, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#928d98" roughness={0.6} metalness={0.2} />
      </mesh>
      {[-2.75, 2.75].map((x) => (
        <group key={x} position={[x, 0, -12.85]}>
          <mesh castShadow receiveShadow position={[0, 2.28, 0]}>
            <boxGeometry args={[0.68, 4.56, 0.86]} />
            <meshStandardMaterial color="#858491" roughness={0.68} metalness={0.14} />
          </mesh>
          <mesh castShadow position={[0, 4.5, 0.43]}>
            <boxGeometry args={[0.98, 0.26, 0.2]} />
            <meshStandardMaterial color="#d0bb87" roughness={0.48} metalness={0.28} />
          </mesh>
        </group>
      ))}
      <mesh castShadow receiveShadow position={[0, 9.35, -12.55]}>
        <coneGeometry args={[4.35, 3.3, 4]} />
        <meshStandardMaterial color="#252c3d" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh position={[0, 8.35, -10.76]}>
        <octahedronGeometry args={[0.43, 0]} />
        <meshStandardMaterial color="#c6a96f" emissive="#c6a96f" emissiveIntensity={1.15} metalness={0.45} roughness={0.3} />
      </mesh>
    </group>
  );
}

function GothicTower({ position, height }: { position: [number, number, number]; height: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[1.8, 2.05, height, 12]} />
        <meshStandardMaterial color="#343b4d" roughness={0.8} metalness={0.12} />
      </mesh>
      {[3.1, 6.5, 9.9].map((y) => (
        <mesh key={y} position={[0, y, -1.77]}>
          <boxGeometry args={[0.7, 1.35, 0.1]} />
          <meshStandardMaterial color={warmWindow} emissive={warmWindow} emissiveIntensity={1.4} />
        </mesh>
      ))}
      <mesh castShadow position={[0, height + 1.9, 0]}>
        <coneGeometry args={[2.65, 4.1, 12]} />
        <meshStandardMaterial color="#1b2233" roughness={0.65} metalness={0.25} />
      </mesh>
      <mesh castShadow position={[0, height + 4.15, 0]}>
        <sphereGeometry args={[0.19, 12, 8]} />
        <meshStandardMaterial color="#b9a16b" metalness={0.7} roughness={0.26} />
      </mesh>
    </group>
  );
}

function StudyChamber() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.08, -19.1]}>
        <boxGeometry args={[9, 0.32, 11.2]} />
        <meshStandardMaterial color="#272c3b" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 3, -24.5]}>
        <boxGeometry args={[9, 6, 0.75]} />
        <meshStandardMaterial color="#343949" roughness={0.82} metalness={0.08} />
      </mesh>
      {[-4.2, 4.2].map((x) => (
        <mesh key={x} castShadow receiveShadow position={[x, 2.6, -19.2]}>
          <boxGeometry args={[0.8, 5.2, 10.8]} />
          <meshStandardMaterial color="#3b4151" roughness={0.82} metalness={0.08} />
        </mesh>
      ))}
      {[-22.3, -18.5, -14.9].map((z) => (
        <mesh key={z} castShadow position={[0, 4.5, z]}>
          <torusGeometry args={[4.15, 0.17, 10, 28, Math.PI]} />
          <meshStandardMaterial color="#666d7d" roughness={0.72} metalness={0.14} />
        </mesh>
      ))}
      <mesh position={[0, 2.8, -24.06]}>
        <torusGeometry args={[1.3, 0.08, 10, 40]} />
        <meshStandardMaterial color="#c3a56c" emissive="#b49357" emissiveIntensity={0.72} metalness={0.52} roughness={0.3} />
      </mesh>
      <Relic />
    </group>
  );
}

function PortalGate() {
  const leftDoor = useRef<THREE.Group>(null);
  const rightDoor = useRef<THREE.Group>(null);
  const questStage = useGameStore((state) => state.quest.stage);
  const isOpen = questStage === "openStudy" || questStage === "insideStudy" || questStage === "complete";

  useFrame((_, delta) => {
    const targetOffset = isOpen ? 1.4 : 0;
    if (leftDoor.current) leftDoor.current.position.x = THREE.MathUtils.damp(leftDoor.current.position.x, -1.3 - targetOffset, 5, delta);
    if (rightDoor.current) rightDoor.current.position.x = THREE.MathUtils.damp(rightDoor.current.position.x, 1.3 + targetOffset, 5, delta);
  });

  return (
    <group position={[0, 0, -12.04]}>
      <group ref={leftDoor} position={[-1.3, 0, 0]}>
        <DoorLeaf />
      </group>
      <group ref={rightDoor} position={[1.3, 0, 0]}>
        <DoorLeaf />
      </group>
      <pointLight color="#8ccde8" intensity={isOpen ? 3.2 : 0.45} distance={10} position={[0, 3.8, -0.2]} />
    </group>
  );
}

function DoorLeaf() {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 2.3, 0]}>
        <boxGeometry args={[2.58, 4.6, 0.34]} />
        <meshStandardMaterial color="#403748" roughness={0.72} metalness={0.2} />
      </mesh>
      <mesh position={[0, 2.3, 0.2]}>
        <boxGeometry args={[1.86, 3.86, 0.06]} />
        <meshStandardMaterial color="#302d3e" roughness={0.58} metalness={0.26} />
      </mesh>
      <mesh position={[0, 2.35, 0.25]}>
        <octahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color="#83d2ec" emissive="#66c6e8" emissiveIntensity={1.8} metalness={0.36} roughness={0.28} />
      </mesh>
      {[0.62, 1.5, 3.25, 4.02].map((y) => (
        <mesh key={y} position={[0, y, 0.24]}>
          <boxGeometry args={[2, 0.08, 0.08]} />
          <meshStandardMaterial color="#978467" roughness={0.46} metalness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Moonwell() {
  const lumosEnabled = useGameStore((state) => state.quest.lumosEnabled);
  const water = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (water.current) water.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group position={[-3, 0, 2.4]}>
      <mesh castShadow receiveShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[2.55, 2.85, 0.46, 48]} />
        <meshStandardMaterial color="#687181" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.51, 0]}>
        <torusGeometry args={[2.24, 0.15, 12, 48]} />
        <meshStandardMaterial color="#b0a27f" roughness={0.42} metalness={0.46} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
        <circleGeometry args={[2.14, 64]} />
        <shaderMaterial
          ref={water}
          transparent
          uniforms={{ uTime: { value: 0 } }}
          vertexShader={waterVertexShader}
          fragmentShader={waterFragmentShader}
        />
      </mesh>
      <mesh castShadow position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.42, 0.68, 1.42, 16]} />
        <meshStandardMaterial color="#797f90" roughness={0.56} metalness={0.26} />
      </mesh>
      <mesh position={[0, 2.14, 0]}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color="#b7edff" emissive="#64c7ec" emissiveIntensity={lumosEnabled ? 3 : 1.1} roughness={0.2} metalness={0.34} />
      </mesh>
      <pointLight color="#56b9e7" intensity={lumosEnabled ? 3.4 : 1.15} distance={lumosEnabled ? 14 : 7} position={[0, 2, 0]} />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.8, 0.55, 0]} rotation={[0, side * 0.12, 0]}>
          <boxGeometry args={[0.12, 0.34, 0.22]} />
          <meshStandardMaterial color="#b49b6d" roughness={0.5} metalness={0.36} />
        </mesh>
      ))}
    </group>
  );
}

const waterVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float radial = length(vUv - 0.5);
    float ripple = sin(radial * 92.0 - uTime * 1.65) * 0.5 + 0.5;
    float crossWave = sin((vUv.x + vUv.y) * 24.0 + uTime * 0.7) * 0.5 + 0.5;
    vec3 deep = vec3(0.025, 0.075, 0.14);
    vec3 moon = vec3(0.12, 0.39, 0.52);
    vec3 color = mix(deep, moon, ripple * 0.34 + crossWave * 0.18);
    float rim = smoothstep(0.52, 0.36, radial);
    gl_FragColor = vec4(color + moon * ripple * 0.08, rim * 0.94);
  }
`;

function RuneStone({
  id,
  position,
  color,
  glyph,
}: {
  id: MoonwellTargetId;
  position: [number, number, number];
  color: string;
  glyph: number;
}) {
  const quest = useGameStore((state) => state.quest);
  const nearbyTargetId = useGameStore((state) => state.nearbyTargetId);
  const lit = quest.lumosEnabled;
  const activated = quest.activatedRunes.includes(id);
  const focused = nearbyTargetId === id;
  const glow = activated ? 2.6 : lit ? 0.42 : 0.06;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.92, 1.08, 0.52, 8]} />
        <meshStandardMaterial color="#535c6d" roughness={0.73} metalness={0.16} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <dodecahedronGeometry args={[0.86, 0]} />
        <meshStandardMaterial color="#596174" roughness={0.62} metalness={0.21} />
      </mesh>
      <mesh castShadow position={[0, 1.09, 0.73]}>
        {glyph === 0 ? <octahedronGeometry args={[0.37, 0]} /> : glyph === 1 ? <torusGeometry args={[0.27, 0.09, 8, 18]} /> : <coneGeometry args={[0.34, 0.66, 3]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.3} metalness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.57, 0]}>
        <torusGeometry args={[1.12, focused ? 0.09 : 0.045, 8, 36]} />
        <meshStandardMaterial color={focused ? "#f3d99e" : color} emissive={color} emissiveIntensity={focused ? 1.3 : glow * 0.55} transparent opacity={focused ? 0.95 : 0.55} />
      </mesh>
      {lit && <pointLight color={color} intensity={activated ? 2.4 : 0.9} distance={activated ? 8 : 4} position={[0, 1.5, 0.4]} />}
    </group>
  );
}

function Mentor() {
  const nearbyTargetId = useGameStore((state) => state.nearbyTargetId);
  const stage = useGameStore((state) => state.quest.stage);
  const body = useRef<THREE.Group>(null);
  const focus = nearbyTargetId === "mentor";

  useFrame(({ clock }) => {
    if (body.current) {
      body.current.position.y = 0.06 + Math.sin(clock.elapsedTime * 1.15) * 0.11;
      body.current.rotation.y = Math.sin(clock.elapsedTime * 0.42) * 0.12;
    }
  });

  return (
    <group position={[3.35, 0, 7.4]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.78, 0.95, 0.38, 20]} />
        <meshStandardMaterial color="#545b6b" roughness={0.64} metalness={0.2} />
      </mesh>
      <group ref={body} position={[0, 0.06, 0]}>
        <mesh castShadow position={[0, 1.2, 0]}>
          <capsuleGeometry args={[0.49, 1.05, 5, 12]} />
          <meshStandardMaterial color="#91a9c4" emissive="#57768e" emissiveIntensity={0.78} transparent opacity={0.72} roughness={0.46} />
        </mesh>
        <mesh castShadow position={[0, 2.12, 0]}>
          <sphereGeometry args={[0.38, 20, 16]} />
          <meshStandardMaterial color="#bfd4dd" emissive="#72aabd" emissiveIntensity={0.88} transparent opacity={0.82} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 2.48, 0]}>
          <coneGeometry args={[0.48, 0.8, 8]} />
          <meshStandardMaterial color="#30394d" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.62, 1.05, -0.18]} rotation={[0.16, 0, -0.82]}>
          <cylinderGeometry args={[0.035, 0.045, 1.42, 8]} />
          <meshStandardMaterial color="#ae9565" roughness={0.45} metalness={0.46} />
        </mesh>
        <mesh position={[0.62, 1.82, -0.18]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#bbf1ff" emissive="#8fe4ff" emissiveIntensity={2.4} />
        </mesh>
      </group>
      <pointLight color="#9ccfe8" intensity={focus ? 4 : 1.8} distance={focus ? 9 : 5} position={[0, 2, 0.3]} />
      {focus && stage === "arrival" && (
        <mesh position={[0, 3.15, 0]}>
          <octahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial color="#f2d58c" emissive="#edc977" emissiveIntensity={2.8} />
        </mesh>
      )}
    </group>
  );
}

function Relic() {
  const stage = useGameStore((state) => state.quest.stage);
  const relic = useRef<THREE.Group>(null);
  const visible = stage === "insideStudy" || stage === "complete";

  useFrame(({ clock }) => {
    if (!relic.current) return;
    relic.current.rotation.y = clock.elapsedTime * 0.45;
    relic.current.position.y = 1.8 + Math.sin(clock.elapsedTime * 1.2) * 0.16;
  });

  return (
    <group position={[0, 0, -20.1]}>
      <mesh castShadow receiveShadow position={[0, 0.46, 0]}>
        <cylinderGeometry args={[1.05, 1.25, 0.9, 8]} />
        <meshStandardMaterial color="#585466" roughness={0.48} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <torusGeometry args={[0.82, 0.11, 10, 40]} />
        <meshStandardMaterial color="#c2a66e" roughness={0.28} metalness={0.7} />
      </mesh>
      {visible && (
        <>
          <group ref={relic} position={[0, 1.8, 0]}>
            <mesh castShadow>
              <octahedronGeometry args={[0.52, 1]} />
              <meshStandardMaterial color="#d7efff" emissive="#76c9f3" emissiveIntensity={2.4} roughness={0.16} metalness={0.24} />
            </mesh>
            <mesh rotation={[0.3, 0.5, 0]}>
              <torusGeometry args={[0.78, 0.055, 8, 36]} />
              <meshStandardMaterial color="#e6c785" emissive="#b49155" emissiveIntensity={0.9} metalness={0.7} roughness={0.24} />
            </mesh>
          </group>
          <pointLight color="#7dccf3" intensity={4.2} distance={12} position={[0, 2.4, 0]} />
        </>
      )}
    </group>
  );
}

function CourtyardTorches() {
  const positions: Array<[number, number, number]> = [
    [-12.4, 0, 5.4],
    [12.4, 0, 5.4],
    [-12.4, 0, -5.4],
    [12.4, 0, -5.4],
    [-5.4, 0, -11.1],
    [5.4, 0, -11.1],
  ];
  return <group>{positions.map((position, index) => <Torch key={position.join("-")} position={position} phase={index * 0.72} />)}</group>;
}

function Torch({ position, phase }: { position: [number, number, number]; phase: number }) {
  const light = useRef<THREE.PointLight>(null);
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 8.4 + phase) * 0.14 + Math.sin(clock.elapsedTime * 15.2 + phase) * 0.06;
    if (light.current) light.current.intensity = 3.2 * pulse;
    if (flame.current) flame.current.scale.set(1 + (pulse - 1) * 0.7, pulse, 1 + (pulse - 1) * 0.7);
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 2.4, 8]} />
        <meshStandardMaterial color="#563b2c" roughness={0.88} />
      </mesh>
      <mesh ref={flame} castShadow position={[0, 2.52, 0]}>
        <coneGeometry args={[0.22, 0.67, 10]} />
        <meshStandardMaterial color="#ffb45d" emissive="#ff682e" emissiveIntensity={3.7} transparent opacity={0.94} />
      </mesh>
      <pointLight ref={light} color="#ff9e52" intensity={3.2} distance={8} decay={2} position={[0, 2.5, 0]} />
    </group>
  );
}

function CourtyardPlanting() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 82 }, (_, index) => ({
        position: [
          (seeded(index, 21) > 0.5 ? 1 : -1) * (13.2 + seeded(index, 22) * 0.8),
          0.66 + seeded(index, 23) * 0.45,
          -13 + seeded(index, 24) * 27,
        ] as [number, number, number],
        rotation: [0, seeded(index, 25) * Math.PI * 2, (seeded(index, 26) - 0.5) * 0.4] as [number, number, number],
        scale: [0.12 + seeded(index, 27) * 0.16, 0.4 + seeded(index, 28) * 0.75, 0.12 + seeded(index, 29) * 0.16] as [number, number, number],
      })),
    [],
  );

  return (
    <group>
      {[-13.1, 13.1].map((x) => (
        <mesh key={x} receiveShadow position={[x, 0.22, 1]}>
          <boxGeometry args={[1.5, 0.44, 29]} />
          <meshStandardMaterial color="#444b56" roughness={0.86} />
        </mesh>
      ))}
      <Instances limit={leaves.length} range={leaves.length} castShadow>
        <coneGeometry args={[0.22, 1, 5]} />
        <meshStandardMaterial color="#405c4d" roughness={0.86} />
        {leaves.map((leaf, index) => <Instance key={index} {...leaf} />)}
      </Instances>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow receiveShadow position={[side * 11.3, 0.5, -8.7]}>
          <boxGeometry args={[1.6, 1, 1.6]} />
          <meshStandardMaterial color="#4b5361" roughness={0.76} />
        </mesh>
      ))}
    </group>
  );
}
