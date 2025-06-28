import { IVssRestClientOptions } from "azure-devops-extension-api/Common/Context";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { EnvironmentInstance } from "./Environments";

export class EnvironmentsRestClient extends RestClientBase {
  constructor(options: IVssRestClientOptions) {
    super(options);
  }
  /*
   * Get a list of environments.
   *
   * @param project - Project ID or project name
   * @param name - Name of the environment to filter by
   * @param top - Maximum number of environments to return
   * @param continuationToken - Token for pagination
   *
   * @returns Promise that resolves to an array of EnvironmentInstance objects
   */
  public async listEnvironments(
    project: string,
    name?: string,
    top?: number,
    continuationToken?: string
  ): Promise<EnvironmentInstance[]> {
    const queryValues = {
      name: name,
      $top: top,
      continuationToken: continuationToken,
    };

    return this.beginRequest<EnvironmentInstance[]>({
      apiVersion: "7.2-preview.1",
      routeTemplate: "{project}/_apis/pipelines/environments",
      routeValues: {
        project: project,
      },
      queryParams: queryValues,
    });
  }
}
