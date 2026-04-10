import { useMemo, useState } from "react";

import { useSalonPilot } from "../application/useSalonPilot";
import { SalonSpatialShell } from "./salon-shell/SalonSpatialShell";
import { CurioPalace } from "./salon-shell/CurioPalace";
import { SalonTrayPage } from "./salon-shell/SalonTrayPage";

export function SalonPilotApp() {
  const {
    state,
    currentProject,
    activeWorld,
    wake,
    draft,
    setDraft,
    dropNow,
    updateDropContent,
    deleteDrop,
    switchProject,
    addProjectWithStudio,
    updateProjectMeta,
    removeProject,
    cycleAmbient,
    switchWorld,
  } = useSalonPilot();

  const projects = Object.values(state.projects);
  const worlds = currentProject.worldIds.map((id) => state.worlds[id]).filter(Boolean);

  const palaceDrops = useMemo(() => {
    // Palais is a curated garden for all delivered notes (supports all-project view + per-project view).
    return [...state.drops].sort((a, b) => b.createdAt - a.createdAt);
  }, [state.drops]);

  const [route, setRoute] = useState<"main" | "palais" | "tray">("main");

  if (route === "palais") {
    return (
      <CurioPalace
        open
        variant="page"
        onClose={() => setRoute("main")}
        projectName={currentProject.name}
        projects={projects}
        currentProjectId={currentProject.id}
        onSelectProject={switchProject}
        drops={palaceDrops}
        onUpdateDropContent={updateDropContent}
        onDeleteDrop={deleteDrop}
        reduce={false}
      />
    );
  }

  if (route === "tray") {
    return (
      <SalonTrayPage
        accent={currentProject.artifactTint}
        project={currentProject}
        pourText={draft.content}
        onPourText={(text) => setDraft((d) => ({ ...d, content: text }))}
        onPourCommit={dropNow}
        draftZone={draft.zone}
        draftMode={draft.mode}
        draftSurface={draft.surface}
        draftSurfaceTint={draft.surfaceTint}
        draftSurfaceVariant={draft.surfaceVariant}
        draftTextColor={draft.textColor}
        draftTextFont={draft.textFont}
        onDraftZone={(zone) => setDraft((d) => ({ ...d, zone }))}
        onDraftMode={(mode) => setDraft((d) => ({ ...d, mode }))}
        onDraftSurface={(surface) => setDraft((d) => ({ ...d, surface }))}
        onDraftSurfaceTint={(surfaceTint) => setDraft((d) => ({ ...d, surfaceTint }))}
        onDraftSurfaceVariant={(surfaceVariant) => setDraft((d) => ({ ...d, surfaceVariant }))}
        onDraftTextColor={(textColor) => setDraft((d) => ({ ...d, textColor }))}
        onDraftTextFont={(textFont) => setDraft((d) => ({ ...d, textFont }))}
        onClose={() => setRoute("main")}
      />
    );
  }

  return (
    <SalonSpatialShell
      projects={projects}
      currentProject={currentProject}
      worlds={worlds}
      activeWorld={activeWorld}
      wake={wake}
      pourText={draft.content}
      onPourText={(text) => setDraft((d) => ({ ...d, content: text }))}
      onPourCommit={dropNow}
      draftZone={draft.zone}
      draftMode={draft.mode}
      draftSurface={draft.surface}
      draftSurfaceTint={draft.surfaceTint}
      draftSurfaceVariant={draft.surfaceVariant}
      draftTextColor={draft.textColor}
      draftTextFont={draft.textFont}
      onDraftZone={(zone) => setDraft((d) => ({ ...d, zone }))}
      onDraftMode={(mode) => setDraft((d) => ({ ...d, mode }))}
      onDraftSurface={(surface) => setDraft((d) => ({ ...d, surface }))}
      onDraftSurfaceTint={(surfaceTint) => setDraft((d) => ({ ...d, surfaceTint }))}
      onDraftSurfaceVariant={(surfaceVariant) => setDraft((d) => ({ ...d, surfaceVariant }))}
      onDraftTextColor={(textColor) => setDraft((d) => ({ ...d, textColor }))}
      onDraftTextFont={(textFont) => setDraft((d) => ({ ...d, textFont }))}
      palaceDrops={palaceDrops}
      onOpenPalais={() => setRoute("palais")}
      onOpenTray={() => setRoute("tray")}
      onConfirmNewProject={addProjectWithStudio}
      onUpdateProjectMeta={updateProjectMeta}
      onDeleteProject={removeProject}
      onSelectProject={switchProject}
      onSelectWorld={switchWorld}
      onCenterpieceInteract={cycleAmbient}
    />
  );
}
