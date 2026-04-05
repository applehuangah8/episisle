import { StrictMode } from "react";

import { createRoot } from "react-dom/client";



import { IsleBootstrap } from "@/isle/IsleBootstrap";

import "@/index.css";



const el = document.getElementById("root");

if (!el) throw new Error("Root element #root not found");



/**

 * Single entry: Mode Orchestrator (Isle A ↔ Isle B).

 * - Default: Focus (`App`) inside orchestrator.

 * - `?aura=1` or `#/aura`: Aura prototype; SPA switch, no reload.

 */

createRoot(el).render(

  <StrictMode>

    <IsleBootstrap />

  </StrictMode>

);

