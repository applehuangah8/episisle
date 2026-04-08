import React from "react";
import ReactDOM from "react-dom/client";

import "@/index.css";
import { UnknownApp } from "@/unknown-lab/UnknownApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UnknownApp />
  </React.StrictMode>
);

