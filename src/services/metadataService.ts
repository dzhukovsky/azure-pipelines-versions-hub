import {
  IEnvironmentMetadata,
  IPipelineMetadata,
  IPipelineMetadataSelector,
} from "src/models/metadataModels";
import {
  IEnvironmentMetadataDocument,
  pipelineMetadataCollectionNameFactory,
} from "../../shared/metadataContract";
import { getDataManager } from "./external/extensionDataService";

export async function getPipelinesMetadata(
  selectors: IPipelineMetadataSelector[]
): Promise<IPipelineMetadata[]> {
  const dataManager = await getDataManager();

  const environmentsByCollectionNames = selectors.reduce((acc, selector) => {
    const collectionName = pipelineMetadataCollectionNameFactory.construct(
      selector.projectId,
      selector.definitionId
    );

    acc[collectionName] = selector.environments;
    return acc;
  }, {} as Record<string, number[]>);

  /*
  //delete all documents
  for (const selector of selectors) {
    for (const environmentId of selector.environments) {
      const collectionName = pipelineMetadataCollectionNameFactory.construct(
        selector.projectId,
        selector.definitionId
      );

      await dataManager.deleteDocument(
        collectionName,
        environmentId.toString()
      );
    }
  }
  */

  const collections = await dataManager.queryCollectionsByName(
    Object.keys(environmentsByCollectionNames)
  );

  console.log("Collections fetched:", collections);

  const pipelines = collections.map((collection): IPipelineMetadata => {
    const [projectId, , definitionId] = collection.collectionName.split(":");

    return {
      projectId,
      definitionId: +definitionId,
      environments: (collection.documents ?? [])
        .filter((doc: IEnvironmentMetadataDocument) =>
          environmentsByCollectionNames[collection.collectionName].includes(
            +doc.id
          )
        )
        .map(
          (doc: IEnvironmentMetadataDocument): IEnvironmentMetadata => ({
            id: +doc.id,
            buildId: doc.buildId,
            buildNumber: doc.buildNumber,
            resourceId: doc.resourceId,
          })
        ),
    };
  });

  return pipelines;
}
