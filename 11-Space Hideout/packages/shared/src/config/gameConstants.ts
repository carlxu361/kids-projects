export const PROTOCOL_VERSION = "hns-rebuild-0.1.0";
export const HUNTER_COUNT = 1;

export const ROUND_DEFAULTS = {
  introSeconds: 8,
  headStartSeconds: 10,
  hideSeconds: 240,
  finalHideSeconds: 60
} as const;

export const TASK_TIME_REDUCTION = {
  common: 4,
  short: 6,
  long: 10
} as const;

export const SERVER_TICK_RATE_HZ = 20;
export const DANGER_UPDATE_RATE_HZ = 5;
