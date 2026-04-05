/** 從積木外殼標題等觸發，讓對應 {@link ContentModule} 進入編輯 */
export const EPIS_FOCUS_CONTENT_MODULE = "epis-focus-content-module";

export type EpisFocusContentModuleDetail = {
  placementId: string;
  moduleIndex: number;
};
