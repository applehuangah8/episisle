import { StrictMode } from "react";

import { createRoot } from "react-dom/client";



import { IsleBootstrap } from "@/isle/IsleBootstrap";

import "@/index.css";



const el = document.getElementById("root");

if (!el) throw new Error("Root element #root not found");



/**
 * Single entry: experience orchestrator (Entry Path ↔ worldFocus ↔ auraWorld).
 * - Default: Layer 1 Entry Path (`EntryPathSelector`).
 * - `?isle=focus`: worldFocus — existing `App` (focusView).
 * - `?isle=aura` / `?aura=1` / `#/aura`: Layer 2 Aura World (3D diorama).
 */

createRoot(el).render(

  <StrictMode>

    <IsleBootstrap />

  </StrictMode>

);

