import "azure-devops-ui/Core/override.css";

import ReactDOM from "react-dom";
import { VersionsHub } from "./VersionsHub.tsx";
import * as SDK from "azure-devops-extension-sdk";
import { SurfaceBackground, SurfaceContext } from "azure-devops-ui/Surface";

SDK.init();

ReactDOM.render(
  <SurfaceContext.Provider value={{ background: SurfaceBackground.neutral }}>
    <VersionsHub />
  </SurfaceContext.Provider>,
  document.getElementById("root")
);

SDK.notifyLoadSucceeded();
