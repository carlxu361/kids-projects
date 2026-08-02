import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@space-hideout/shared";
import { assertPublicSettings } from "../src/validation/settings.js";

describe("public room settings validation", () => {
  it("accepts random hunter selection for public rooms", () => {
    expect(() => assertPublicSettings(DEFAULT_SETTINGS)).not.toThrow();
  });

  it("rejects specific hunter selection for public rooms", () => {
    expect(() =>
      assertPublicSettings({
        ...DEFAULT_SETTINGS,
        hunterSelectionMode: "specific_player",
        selectedHunterPlayerId: "player-1"
      })
    ).toThrow("Public rooms must use random hunter selection.");
  });
});
