import type { ReactNode } from "react";
import { Archive, Copy, X } from "lucide-react";

import { ensureModulesRegistered } from "@/components/registerModules";
import { ContentModule } from "@/components/modules/ContentModule";
import { ExtensionModule } from "@/components/modules/ExtensionModule";
import { NextModule } from "@/components/modules/NextModule";
import { TaskModule } from "@/components/modules/TaskModule";
import {
  blockDisplayTitle,
  isContentModule,
  isNextModule,
  isTaskModule,
} from "@/core/blockView";
import {
  applyModuleTransform,
  getModuleDefinition,
  isModuleAllowedInDistrict,
} from "@/core/moduleRegistry";
import type { BlockModule, BlockRenderProps, DistrictType } from "@/core/types";
import { EPIS_FOCUS_CONTENT_MODULE } from "@/dom/episContentEditEvents";
import { useStore } from "@/store/useStore";

ensureModulesRegistered();

function isTownSkin(district: DistrictType): boolean {
  return district === "instagram" || district === "youtube";
}

function moduleKind(m: BlockModule): "content" | "task" | "next" | "ext" {
  if (isContentModule(m)) return "content";
  if (isTaskModule(m)) return "task";
  if (isNextModule(m)) return "next";
  return "ext";
}

function renderModule(
  mod: BlockModule,
  key: string,
  model: BlockRenderProps["model"],
  moduleIndex: number,
  district: BlockRenderProps["model"]["placement"]["district"],
  primaryContentIndex: number
) {
  const def = getModuleDefinition(mod.type);
  const displayMod = applyModuleTransform(mod);

  if (def && !isModuleAllowedInDistrict(mod.type, district, def)) {
    return (
      <div
        key={key}
        className="epis-brick rounded-xl border-dashed border-amber-400/45 bg-amber-50/40 px-2 py-1.5 text-[11px] text-amber-900/75"
      >
        模組「{mod.type}」未開放於此區域
      </div>
    );
  }

  if (isContentModule(mod)) {
    return (
      <ContentModule
        key={key}
        mod={mod}
        blockId={model.block.id}
        placementId={model.placement.id}
        moduleIndex={moduleIndex}
        isPrimaryContent={primaryContentIndex === moduleIndex}
      />
    );
  }
  if (isTaskModule(mod)) {
    return (
      <TaskModule key={key} mod={mod} blockId={model.block.id} moduleIndex={moduleIndex} />
    );
  }
  if (isNextModule(mod)) {
    return (
      <NextModule
        key={key}
        mod={mod}
        blockId={model.block.id}
        placementId={model.placement.id}
        moduleIndex={moduleIndex}
      />
    );
  }

  const Cmp = def?.component;
  if (Cmp) return <Cmp key={key} mod={displayMod} />;

  return (
    <ExtensionModule
      key={key}
      mod={displayMod}
      blockId={model.block.id}
      moduleIndex={moduleIndex}
    />
  );
}

export function DistrictBlockShell({
  model,
  fallbackTitle,
  tintClass,
  footer,
}: BlockRenderProps & { fallbackTitle: string; tintClass: string; footer?: ReactNode }) {
  const sendToArchiveFromButton = useStore((s) => s.sendToArchiveFromButton);
  const deletePlacementAndBlock = useStore((s) => s.deletePlacementAndBlock);
  const duplicatePlacement = useStore((s) => s.duplicatePlacement);
  const title = blockDisplayTitle(model.block, fallbackTitle);
  const { modules } = model.block;
  const district = model.placement.district;
  const primaryContentIndex = modules.findIndex((m) => isContentModule(m));
  const town = isTownSkin(district);
  const shellClass = town
    ? `epis-brick epis-brick-town flex h-full w-full flex-col overflow-hidden rounded-brick ${tintClass} p-4`
    : `epis-brick epis-brick-glass flex h-full w-full flex-col overflow-hidden rounded-brick ${tintClass} p-4`;

  return (
    <div className={shellClass}>
      <div className="flex items-start justify-between gap-2">
        <h3
          className="min-w-0 flex-1 cursor-text select-none text-sm font-semibold tracking-wide text-epis-ink/90"
          data-epis-dblclick-edit
          onMouseDownCapture={(e) => {
            if (e.detail >= 2) e.preventDefault();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const mi = modules.findIndex((m) => isContentModule(m));
            if (mi < 0) return;
            document.dispatchEvent(
              new CustomEvent(EPIS_FOCUS_CONTENT_MODULE, {
                bubbles: true,
                detail: { placementId: model.placement.id, moduleIndex: mi },
              })
            );
          }}
          title={primaryContentIndex >= 0 ? "雙擊編輯內文標題" : undefined}
        >
          {title}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            data-epis-no-drag
            className="rounded-lg p-1 text-epis-ink/45 transition hover:bg-white/45 hover:text-epis-ink/80"
            title="封存至倉庫（典籍）"
            aria-label="封存至倉庫"
            onClick={(e) => {
              e.stopPropagation();
              sendToArchiveFromButton(model.block.id);
            }}
          >
            <Archive className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            data-epis-no-drag
            className="rounded-lg p-1 text-epis-ink/45 transition hover:bg-white/45 hover:text-epis-ink/80"
            title="複製積木"
            aria-label="複製積木"
            onClick={(e) => {
              e.stopPropagation();
              duplicatePlacement(model.placement.id);
            }}
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            data-epis-no-drag
            className="rounded-lg p-1 text-pink-300 transition hover:bg-pink-50/80 hover:text-pink-400"
            title="刪除此積木"
            aria-label="刪除此積木"
            onClick={(e) => {
              e.stopPropagation();
              deletePlacementAndBlock(model.placement.id);
            }}
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.25} />
          </button>
          <span className="epis-stamp-badge rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase text-epis-ink/60">
            {model.districtHint ?? "neutral"}
          </span>
        </div>
      </div>
      <div
        className={
          town && modules.length >= 2
            ? "epis-module-stack mt-3 min-h-0 flex-1 overflow-auto"
            : "mt-3 min-h-0 flex-1 flex flex-col gap-2 overflow-auto"
        }
      >
        {modules.length === 0 ? (
          <p className="text-xs text-epis-ink/55">尚無模組</p>
        ) : town && modules.length >= 2 ? (
          modules.map((m, i) => (
            <div
              key={`${model.block.id}:${i}`}
              className={`epis-module-sheet epis-module-sheet--${moduleKind(m)} min-h-0 shrink-0`}
            >
              {renderModule(m, `${model.block.id}:${i}`, model, i, district, primaryContentIndex)}
            </div>
          ))
        ) : (
          modules.map((m, i) => (
            <div
              key={`${model.block.id}:${i}`}
              className={`epis-module-sheet epis-module-sheet--${moduleKind(m)} min-h-0`}
            >
              {renderModule(m, `${model.block.id}:${i}`, model, i, district, primaryContentIndex)}
            </div>
          ))
        )}
      </div>
      {footer ? (
        <div className="mt-2 shrink-0 border-t border-[var(--color-panel-border)] pt-2">{footer}</div>
      ) : null}
    </div>
  );
}
