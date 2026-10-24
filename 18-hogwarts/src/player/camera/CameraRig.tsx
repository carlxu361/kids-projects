import { useFrame, useThree } from "@react-three/fiber";
import type { EcctrlHandle } from "ecctrl";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useGameStore } from "../../core/state/game-store";
import { FirstPersonWand } from "./FirstPersonWand";
import { startSoundscape } from "../../core/audio/soundscape";

interface CameraRigProps {
  player: RefObject<EcctrlHandle | null>;
}

export function CameraRig({ player }: CameraRigProps) {
  const { camera, gl } = useThree();
  const cameraMode = useGameStore((state) => state.cameraMode);
  const yaw = useRef(0);
  const pitch = useRef(-0.08);
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      yaw.current -= event.movementX * 0.0022;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * 0.0018, -0.65, 0.55);
    };

    const onCanvasClick = () => {
      startSoundscape();
      gl.domElement.requestPointerLock?.();
    };

    window.addEventListener("pointermove", onPointerMove);
    gl.domElement.addEventListener("click", onCanvasClick);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      gl.domElement.removeEventListener("click", onCanvasClick);
    };
  }, [gl]);

  useEffect(() => {
    if (cameraMode === "third" && document.pointerLockElement === gl.domElement) {
      document.exitPointerLock();
    }
  }, [cameraMode, gl]);

  useFrame((_, delta) => {
    const handle = player.current;
    if (!handle) return;

    const position = handle.currPos;
    if (cameraMode === "third") {
      desiredPosition.set(Math.sin(yaw.current) * 8.4, 4.25, Math.cos(yaw.current) * 8.4).add(position);
      lookTarget.set(position.x, position.y + 1.12, position.z);
    } else {
      forward.set(
        Math.sin(yaw.current) * Math.cos(pitch.current),
        Math.sin(pitch.current),
        -Math.cos(yaw.current) * Math.cos(pitch.current),
      );
      desiredPosition.set(position.x, position.y + 1.2, position.z);
      lookTarget.copy(desiredPosition).add(forward);
    }

    const smoothing = 1 - Math.exp(-delta * 12);
    camera.position.lerp(desiredPosition, smoothing);
    camera.lookAt(lookTarget);
  });

  return <FirstPersonWand visible={cameraMode === "first"} />;
}
