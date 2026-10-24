import type { SpellDefinition, SpellId } from "./types";

export const SPELLS: Record<SpellId, SpellDefinition> = {
  lumos: {
    id: "lumos",
    name: "Lumos",
    description: "让魔杖持续成为附近环境的动态光源。",
    cooldownSeconds: 0.35,
    category: "utility",
  },
};
