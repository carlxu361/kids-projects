import { afterEach, describe, expect, it } from "vitest";
import { useGameStore } from "../src/core/state/game-store";
import { INITIAL_MOONWELL_QUEST } from "../src/quests/quest-machine";

afterEach(() => {
  useGameStore.setState({
    cameraMode: "third",
    quest: INITIAL_MOONWELL_QUEST,
    nearbyTargetId: null,
  });
});

describe("shared game state", () => {
  it("switches camera presentation without replacing quest progress", () => {
    useGameStore.setState({
      quest: { ...INITIAL_MOONWELL_QUEST, stage: "revealRunes", lumosEnabled: true },
    });
    const questBeforeSwitch = useGameStore.getState().quest;

    useGameStore.getState().toggleCameraMode();
    expect(useGameStore.getState().cameraMode).toBe("first");
    expect(useGameStore.getState().quest).toBe(questBeforeSwitch);

    useGameStore.getState().toggleCameraMode();
    expect(useGameStore.getState().cameraMode).toBe("third");
    expect(useGameStore.getState().quest).toBe(questBeforeSwitch);
  });

  it("does not advance the story when no nearby target is selected", () => {
    useGameStore.getState().interact();
    expect(useGameStore.getState().quest).toBe(INITIAL_MOONWELL_QUEST);
  });

  it("applies the selected nearby interaction through the story rules", () => {
    useGameStore.getState().setNearbyTargetId("mentor");
    useGameStore.getState().interact();

    expect(useGameStore.getState().quest.stage).toBe("lesson");
  });
});
