export type MoonwellQuestStage =
  | "arrival"
  | "lesson"
  | "revealRunes"
  | "openStudy"
  | "insideStudy"
  | "complete";

export type MoonwellTargetId =
  | "mentor"
  | "rune-dawn"
  | "rune-tide"
  | "rune-dusk"
  | "relic";

export interface MoonwellQuestState {
  stage: MoonwellQuestStage;
  activatedRunes: readonly MoonwellTargetId[];
  lumosEnabled: boolean;
}

export type MoonwellQuestEvent =
  | { type: "INTERACT"; targetId: MoonwellTargetId }
  | { type: "TOGGLE_LUMOS" }
  | { type: "ENTER_STUDY" };

export const INITIAL_MOONWELL_QUEST: MoonwellQuestState = {
  stage: "arrival",
  activatedRunes: [],
  lumosEnabled: false,
};

const RUNE_IDS: MoonwellTargetId[] = ["rune-dawn", "rune-tide", "rune-dusk"];

export function reduceMoonwellQuest(
  state: MoonwellQuestState,
  event: MoonwellQuestEvent,
): MoonwellQuestState {
  if (state.stage === "complete") return state;

  if (event.type === "TOGGLE_LUMOS") {
    const lumosEnabled = !state.lumosEnabled;
    return {
      ...state,
      lumosEnabled,
      stage: state.stage === "lesson" && lumosEnabled ? "revealRunes" : state.stage,
    };
  }

  if (event.type === "ENTER_STUDY") {
    return state.stage === "openStudy" ? { ...state, stage: "insideStudy" } : state;
  }

  if (state.stage === "arrival" && event.targetId === "mentor") {
    return { ...state, stage: "lesson" };
  }

  if (state.stage === "revealRunes" && RUNE_IDS.includes(event.targetId)) {
    if (!state.lumosEnabled || state.activatedRunes.includes(event.targetId)) return state;

    const activatedRunes = [...state.activatedRunes, event.targetId];
    return {
      ...state,
      activatedRunes,
      stage: activatedRunes.length === RUNE_IDS.length ? "openStudy" : state.stage,
    };
  }

  if (state.stage === "insideStudy" && event.targetId === "relic") {
    return { ...state, stage: "complete" };
  }

  return state;
}
