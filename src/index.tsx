import "azure-devops-ui/Core/override.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom";
import { App } from "./App.tsx";
import * as SDK from "azure-devops-extension-sdk";
import { SurfaceBackground, SurfaceContext } from "azure-devops-ui/Surface";

SDK.init();

ReactDOM.render(
  <StrictMode>
    <SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
      <App />
    </SurfaceContext.Provider>
  </StrictMode>,
  document.getElementById("root")
);

SDK.notifyLoadSucceeded();
