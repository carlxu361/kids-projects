import { DEFAULT_SETTINGS } from "@space-hideout/shared";
import type { HideNSeekSettings } from "@space-hideout/shared";
import { assertPublicSettings } from "../validation/settings.js";

export function createDefaultPublicSettings(): HideNSeekSettings {
  const settings = structuredClone(DEFAULT_SETTINGS);
  assertPublicSettings(settings);
  return settings;
}
