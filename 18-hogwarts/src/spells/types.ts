export type SpellId = "lumos";

export interface SpellDefinition {
  id: SpellId;
  name: string;
  description: string;
  cooldownSeconds: number;
  category: "utility" | "combat";
}
