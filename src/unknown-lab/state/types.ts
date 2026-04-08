export type VacationSceneId = "v1" | "v2" | "v3";

export type IdeaOre = {
  id: string;
  seed: number;
  text: string;
  x: number;
  z: number;
};

export type RefinedGem = {
  id: string;
  seed: number;
  title: string;
  sourceOreIds: string[];
  x: number;
  z: number;
};

