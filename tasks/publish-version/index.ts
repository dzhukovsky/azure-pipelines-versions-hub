import * as tl from "azure-pipelines-task-lib/task";
import * as azdo from "azure-devops-node-api";
import config from "../../vss-extension.json";
import configDev from "../../vss-extension.dev.json";
import {
  IEnvironmentMetadataDocument,
  pipelineMetadataCollectionNameFactory,
} from "../../shared/metadataContract";

async function run() {
  const environmentId = tl.getVariable("Environment.Id");
  if (!environmentId) {
    return;
  }

  const token = tl.getVariable("System.AccessToken")!;
  const orgUrl = tl.getVariable("System.CollectionUri")!;
  const projectId = tl.getVariable("System.TeamProjectId")!;

  const definitionId = +tl.getVariable("System.DefinitionId")!;
  const buildId = +tl.getVariable("Build.BuildId")!;
  const buildNumber = tl.getVariable("Build.BuildNumber")!;
  const resourceId = +tl.getVariable("Environment.ResourceId")! || undefined;

  const connection = azdo.WebApi.createWithBearerToken(orgUrl, token);
  const api = await connection.getExtensionManagementApi();

  const documentId = environmentId;
  const collectionName = pipelineMetadataCollectionNameFactory.construct(
    projectId,
    definitionId
  );

  const document: IEnvironmentMetadataDocument = await api.getDocumentByName(
    config.publisher,
    configDev.id,
    "Default",
    "Current",
    collectionName,
    documentId
  );

  const data: IEnvironmentMetadataDocument = {
    id: documentId,
    buildId,
    buildNumber,
    resourceId,
    __etag: document?.__etag,
  };

  await api.setDocumentByName(
    data,
    config.publisher,
    configDev.id,
    "Default",
    "Current",
    collectionName
  );
}

run();
