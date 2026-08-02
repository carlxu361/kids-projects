import type { HideNSeekSettings } from "@space-hideout/shared";

export function assertPublicSettings(settings: HideNSeekSettings): void {
  if (settings.hunterSelectionMode !== "random") {
    throw new Error("Public rooms must use random hunter selection.");
  }
}
