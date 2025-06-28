export interface IPipelineMetadataSelector {
  projectId: string;
  definitionId: number;
  environments: number[];
}

export interface IPipelineMetadata {
  projectId: string;
  definitionId: number;
  environments: IEnvironmentMetadata[];
}

export interface IEnvironmentMetadata {
  id: number;
  buildId: number;
  buildNumber: string;
  resourceId?: number;
}
