import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { EnvironmentsRestClient } from "./Environment/EnvironmentsClient";

export const getEnvironments = async (projectId: string) => {
  await SDK.ready();

  const environmentsClient = getClient(EnvironmentsRestClient);
  const environments = await environmentsClient.listEnvironments(projectId);

  return environments;
};
