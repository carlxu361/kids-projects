export type AssetSource = "placeholder" | "original" | "licensed";

export interface GameAsset {
  id: string;
  path: string;
  type: "image" | "audio" | "spritesheet" | "font";
  source: AssetSource;
  author?: string;
  license?: string;
  distributable: boolean;
}

export const assetManifest: GameAsset[] = [];
