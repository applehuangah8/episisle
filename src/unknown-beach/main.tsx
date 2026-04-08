import React from "react";
import ReactDOM from "react-dom/client";

import "@/index.css";
import { UnknownBeachApp } from "@/unknown-beach/UnknownBeachApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UnknownBeachApp />
  </React.StrictMode>
);

