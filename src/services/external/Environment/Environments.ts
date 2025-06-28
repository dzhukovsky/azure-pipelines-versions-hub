import { IdentityRef } from "azure-devops-extension-api/WebApi";

export interface EnvironmentInstance {
  createdBy: IdentityRef;
  createdOn: string;
  description: string;
  id: number;
  lastModifiedBy: IdentityRef;
  lastModifiedOn: string;
  name: string;
  project: ProjectReference;
  resources: EnvironmentResourceReference[];
}

export interface EnvironmentResourceReference {
  id: number;
  name: string;
  tags: string[];
  type: EnvironmentResourceType;
}

export enum EnvironmentResourceType {
  Generic = "generic",
  Kubernetes = "kubernetes",
  Undefined = "undefined",
  VirtualMachine = "virtualMachine",
}

export interface ProjectReference {
  id: string;
  name: string;
}
