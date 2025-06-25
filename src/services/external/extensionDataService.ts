import * as SDK from "azure-devops-extension-sdk";
import {
  CommonServiceIds,
  IExtensionDataService,
} from "azure-devops-extension-api";
import { getProject } from "./projectService";

export const getDataManager = async () => {
  await SDK.ready();

  const dataService = await SDK.getService<IExtensionDataService>(
    CommonServiceIds.ExtensionDataService
  );

  return await dataService.getExtensionDataManager(
    SDK.getExtensionContext().id,
    await SDK.getAccessToken()
  );
};

export const getValue = async <T>(key: string, defaultValue: T) => {
  const project = await getProject();
  const dataManager = await getDataManager();

  const result = await dataManager.getValue<T>(`${project.id}-${key}`);
  return result ?? defaultValue;
};

export const setValue = async <T>(key: string, value: T) => {
  const project = await getProject();
  const dataManager = await getDataManager();
  await dataManager.setValue<T>(`${project.id}-${key}`, value);
};

export async function getDocuments<T>(collectionName: string): Promise<T[]> {
  const project = await getProject();
  const dataManager = await getDataManager();

  const collections = await dataManager.queryCollectionsByName([
    `${project.id}-${collectionName}`,
  ]);

  return collections.flatMap((x) => x.documents);
}
