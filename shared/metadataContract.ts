export interface IEnvironmentMetadataDocument {
  id: string;
  buildId: number;
  buildNumber: string;
  resourceId?: number;
  __etag?: number;
}

export const pipelineMetadataCollectionNameFactory = {
  construct: (projectId: string, definitionId: number) =>
    `${projectId}:pipeline-metadata:${definitionId}`,
  deconstruct: (collectionName: string) => {
    const parts = collectionName.split(":");

    if (parts.length !== 3 || parts[1] !== "pipeline-metadata") {
      throw new Error("Invalid collection name format");
    }

    return {
      projectId: parts[0],
      definitionId: parts[2],
    };
  },
};
