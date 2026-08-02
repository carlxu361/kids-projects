export type LobbySkillTag = "newcomer" | "casual" | "serious" | "expert";

export type HunterSelectionMode = "random" | "round_robin" | "specific_player";

export type VisionMode = "flashlight" | "radial";

export interface HideNSeekSettings {
  mapId: string;
  hunterSelectionMode: HunterSelectionMode;
  selectedHunterPlayerId?: string;
  playerSpeedMultiplier: number;
  crewmateVision: number;
  hunterVision: number;
  commonTaskCount: number;
  shortTaskCount: number;
  longTaskCount: number;
  commonTaskReductionSeconds: number;
  shortTaskReductionSeconds: number;
  longTaskReductionSeconds: number;
  headStartSeconds: number;
  hideSeconds: number;
  finalHideSeconds: number;
  maxVentUses: number;
  visionMode: VisionMode;
  crewmateFlashlightAngle: number;
  hunterFlashlightAngle: number;
  flashlightRange: number;
  killDistance: number;
  killCooldownSeconds: number;
  clickTargetToKill: boolean;
  finalHideHunterSpeedMultiplier: number;
  finalHidePingsEnabled: boolean;
  finalHidePingIntervalSeconds: number;
  seekMapEnabled: boolean;
  seekMapUpdateIntervalMs: number;
  showNames: boolean;
  publicLobbyTags: LobbySkillTag[];
}
