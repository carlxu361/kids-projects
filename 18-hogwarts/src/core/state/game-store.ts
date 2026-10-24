import { create } from "zustand";
import {
  INITIAL_MOONWELL_QUEST,
  reduceMoonwellQuest,
  type MoonwellQuestState,
  type MoonwellTargetId,
} from "../../quests/quest-machine";

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
  quest: MoonwellQuestState;
  nearbyTargetId: MoonwellTargetId | null;
  qualityMode: QualityMode;
  performanceMetrics: PerformanceMetrics;
  toggleCameraMode: () => void;
  toggleDebug: () => void;
  toggleLumos: () => void;
  interact: () => void;
  enterStudy: () => void;
  setNearbyTargetId: (targetId: MoonwellTargetId | null) => void;
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  cameraMode: "third",
  debugVisible: false,
  quest: INITIAL_MOONWELL_QUEST,
  nearbyTargetId: null,
  qualityMode: "balanced",
  performanceMetrics: initialPerformanceMetrics,
  toggleCameraMode: () =>
    set((state) => ({
      cameraMode: state.cameraMode === "third" ? "first" : "third",
    })),
  toggleDebug: () => set((state) => ({ debugVisible: !state.debugVisible })),
  toggleLumos: () =>
    set((state) => ({
      quest: reduceMoonwellQuest(state.quest, { type: "TOGGLE_LUMOS" }),
    })),
  interact: () => {
    const { quest, nearbyTargetId } = get();
    if (!nearbyTargetId) return;
    set({ quest: reduceMoonwellQuest(quest, { type: "INTERACT", targetId: nearbyTargetId }) });
  },
  enterStudy: () =>
    set((state) => ({
      quest: reduceMoonwellQuest(state.quest, { type: "ENTER_STUDY" }),
    })),
  setNearbyTargetId: (nearbyTargetId) => {
    if (get().nearbyTargetId !== nearbyTargetId) set({ nearbyTargetId });
  },
  setPerformanceMetrics: (performanceMetrics) => set({ performanceMetrics }),
}));
