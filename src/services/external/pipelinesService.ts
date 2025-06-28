import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { PipelinesRestClient } from "azure-devops-extension-api/Pipelines/PipelinesClient";

export const getPipelines = async (projectId: string) => {
  await SDK.ready();

  const pipelinesClient = getClient(PipelinesRestClient);
  const pipelines = await pipelinesClient.listPipelines(projectId);

  return pipelines;
};
