import { create } from "zustand";

export type CameraMode = "third" | "first";
export type QualityMode = "balanced" | "cinematic";

export interface PerformanceMetrics {
  fps: number;
  frameMs: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

const initialPerformanceMetrics: PerformanceMetrics = {
  fps: 0,
  frameMs: 0,
  calls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
};

interface GameState {
  cameraMode: CameraMode;
  debugVisible: boolean;
  lumosEnabled: boolean;
  qualityMode: QualityMode;
  performanceMetrics: PerformanceMetrics;
  toggleCameraMode: () => void;
  toggleDebug: () => void;
  toggleLumos: () => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
}

export const useGameStore = create<GameState>((set) => ({
  cameraMode: "third",
  debugVisible: false,
  lumosEnabled: false,
  qualityMode: "balanced",
  performanceMetrics: initialPerformanceMetrics,
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === "third" ? "first" : "third",
    })),
  toggleDebug: () => set((state) => ({ debugVisible: !state.debugVisible })),
  toggleLumos: () => set((state) => ({ lumosEnabled: !state.lumosEnabled })),
  setPerformanceMetrics: (performanceMetrics) => set({ performanceMetrics }),
}));
