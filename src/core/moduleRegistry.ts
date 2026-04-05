import type { ComponentType } from "react";

import type { BlockModule, DistrictType } from "./types";

/** 註冊模組組件皆接收完整 `BlockModule`，由組件內自行窄化。 */
export interface ModuleComponentProps {
  mod: BlockModule;
}

export type ModuleComponent = ComponentType<ModuleComponentProps>;

/** 模組能力描述（搜尋／排程／預覽／可出現的 district） */
export interface ModuleCapabilities {
  searchable?: boolean;
  schedulable?: boolean;
  previewable?: boolean;
  /** 未設定 = 不限 district；若指定則僅這些區域可嵌入 */
  allowedDistricts?: DistrictType[];
}

/**
 * 完整模組註冊條目：`onCreate`／`onTransform` 供資料層與渲染前管線擴充。
 */
export interface ModuleDefinition {
  type: string;
  component: ModuleComponent;
  capabilities?: ModuleCapabilities;
  /**
   * 與 `type` 合併為一筆 `BlockModule`（回傳欄位須與 `type` 相容）。
   */
  onCreate?: () => Partial<BlockModule>;
  /** 渲染前正規化或遷移 */
  onTransform?: (mod: BlockModule) => BlockModule;
}

const registry = new Map<string, ModuleDefinition>();

function putDefinition(def: ModuleDefinition): void {
  if (registry.has(def.type)) {
    console.warn(`[moduleRegistry] overwriting module type: ${def.type}`);
  }
  registry.set(def.type, def);
}

export function registerModule(definition: ModuleDefinition): void;
export function registerModule(type: string, component: ModuleComponent): void;
export function registerModule(
  typeOrDef: string | ModuleDefinition,
  component?: ModuleComponent
): void {
  if (typeof typeOrDef === "string") {
    if (!component) {
      throw new Error("registerModule(type, component): component is required");
    }
    putDefinition({ type: typeOrDef, component });
    return;
  }
  putDefinition(typeOrDef);
}

export function getModuleDefinition(type: string): ModuleDefinition | undefined {
  return registry.get(type);
}

export function getModule(type: string): ModuleComponent | undefined {
  return registry.get(type)?.component;
}

/** 所有已註冊 district（內建模組常用） */
export const ALL_DISTRICT_TYPES: readonly DistrictType[] = [
  "wild",
  "instagram",
  "youtube",
  "studio",
  "neutral",
] as const;

export function isModuleAllowedInDistrict(
  type: string,
  district: DistrictType,
  def: ModuleDefinition | undefined = getModuleDefinition(type)
): boolean {
  const list = def?.capabilities?.allowedDistricts;
  if (list === undefined) return true;
  return list.includes(district);
}

/**
 * 依註冊表建立預設模組（合併 `type` 與 `onCreate`）。
 */
export function createModuleInstance(type: string): BlockModule | null {
  const def = registry.get(type);
  if (!def) return null;
  const extra = def.onCreate?.() ?? {};
  return { type: def.type, ...extra } as BlockModule;
}

export function applyModuleTransform(mod: BlockModule): BlockModule {
  const def = registry.get(mod.type);
  return def?.onTransform != null ? def.onTransform(mod) : mod;
}

export function listRegisteredModuleTypes(): string[] {
  return Array.from(registry.keys());
}

export function listModuleDefinitions(): ModuleDefinition[] {
  return Array.from(registry.values());
}

export function clearModuleRegistry(forTesting = false): void {
  if (import.meta.env.DEV && forTesting) {
    registry.clear();
  }
}
