import { ContentModule } from "@/components/modules/ContentModule";
import { NextModule } from "@/components/modules/NextModule";
import { TaskModule } from "@/components/modules/TaskModule";
import {
  ALL_DISTRICT_TYPES,
  type ModuleComponent,
  registerModule,
} from "@/core/moduleRegistry";

let registered = false;

/**
 * 應用啟動時註冊內建模組（含 capabilities）。
 * 自訂模組可：`registerModule({ type: "music", component: MusicModule, capabilities: { ... } })`
 */
export function ensureModulesRegistered(): void {
  if (registered) return;

  const all = [...ALL_DISTRICT_TYPES];

  registerModule({
    type: "content",
    component: ContentModule as unknown as ModuleComponent,
    capabilities: {
      searchable: true,
      previewable: true,
      allowedDistricts: all,
    },
    onCreate: () => ({ content: "" }),
  });

  registerModule({
    type: "task",
    component: TaskModule as ModuleComponent,
    capabilities: {
      searchable: true,
      allowedDistricts: all,
    },
    onCreate: () => ({ status: "todo" }),
  });

  registerModule({
    type: "next",
    component: NextModule as unknown as ModuleComponent,
    capabilities: {
      searchable: true,
      previewable: true,
      allowedDistricts: all,
    },
    onCreate: () => ({ text: "" }),
  });

  registered = true;
}
