import * as tl from "azure-pipelines-task-lib/task";
import * as azdo from "azure-devops-node-api";
import config from "../../vss-extension.json";
import configDev from "../../vss-extension.dev.json";

async function run() {
  const token = tl.getVariable("System.AccessToken")!;
  const orgUrl = tl.getVariable("System.CollectionUri")!;
  const projectId = tl.getVariable("System.TeamProjectId")!;

  const definitionId = tl.getVariable("System.DefinitionId")!;
  const buildId = tl.getVariable("Build.BuildId")!;
  const buildNumber = tl.getVariable("Build.BuildNumber")!;
  const stageName = tl.getVariable("System.StageName")!;

  const connection = azdo.WebApi.createWithBearerToken(orgUrl, token);
  const api = await connection.getExtensionManagementApi();

  const collection = `${projectId}:pipeline-metadata:${definitionId}`;
  const documentId = stageName.toLowerCase();

  const document: { __etag: string } = await api.getDocumentByName(
    config.publisher,
    configDev.id,
    "Default",
    "Current",
    collection,
    documentId
  );

  const data = {
    id: documentId,
    buildId,
    buildNumber,
    __etag: document?.__etag,
  };

  await api.setDocumentByName(
    data,
    config.publisher,
    configDev.id,
    "Default",
    "Current",
    collection
  );
}

run();
