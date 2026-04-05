import type { BlockComponent, DistrictType } from "./types";

/**
 * 模組註冊：DistrictType → 外殼組件。
 * 新增區域：實作組件 → registerDistrict → BlockRenderer 依 placement.district 解析。
 */
const byDistrict = new Map<DistrictType, BlockComponent>();

export function registerDistrict(district: DistrictType, component: BlockComponent): void {
  if (byDistrict.has(district)) {
    console.warn(`[blockRegistry] overwriting district: ${district}`);
  }
  byDistrict.set(district, component);
}

export function getDistrictComponent(district: DistrictType): BlockComponent | undefined {
  return byDistrict.get(district);
}

export function listRegisteredDistricts(): DistrictType[] {
  return Array.from(byDistrict.keys());
}

export function clearBlockRegistry(forTesting = false): void {
  if (import.meta.env.DEV && forTesting) {
    byDistrict.clear();
  }
}
