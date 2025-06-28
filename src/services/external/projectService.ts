import * as SDK from "azure-devops-extension-sdk";
import {
  CommonServiceIds,
  IProjectPageService,
  IProjectInfo,
} from "azure-devops-extension-api";

export async function getCurrentProject(): Promise<IProjectInfo> {
  await SDK.ready();

  const projectService = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );

  const project = await projectService.getProject();
  if (!project) {
    throw new Error("No project context");
  }

  return project;
}
