import "./VersionsHub.scss";

import * as React from "react";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ConditionalChildren } from "azure-devops-ui/ConditionalChildren";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { Header, TitleSize } from "azure-devops-ui/Header";
import {
  IHeaderCommandBarItem,
  HeaderCommandBarWithFilter,
} from "azure-devops-ui/HeaderCommandBar";
import { Page } from "azure-devops-ui/Page";
import { DropdownFilterBarItem } from "azure-devops-ui/Dropdown";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Status, StatusSize } from "azure-devops-ui/Status";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { css } from "azure-devops-ui/Util";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { DropdownMultiSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { getPipelinesMetadata } from "./services/metadataService";
import { getCurrentProject } from "./services/external/projectService";
import { getEnvironments } from "./services/external/environmentsService";
import { getPipelines } from "./services/external/pipelinesService";
import {
  getStatusIndicatorData,
  VersionsTable,
  PipelineStatus,
  IVersionItem,
  IVersionItemEnvironments,
} from "./components/VersionsTable";
import { EnvironmentInstance } from "./services/external/Environment/Environments";
import { Pipeline } from "azure-devops-extension-api/Pipelines/Pipelines";

const selectedTabId = new ObservableValue<string>("home");
const filterToggled = new ObservableValue<boolean>(false);
const filter = new Filter();
const dropdownSelection = new DropdownMultiSelection();

const headerCommands: IHeaderCommandBarItem[] = [
  {
    id: "new-pipeline",
    text: "New pipeline",
    onActivate: () => {
      alert("New pipeline");
    },
    isPrimary: true,
    important: true,
  },
];

export const VersionsHub = () => {
  const [pipelinesMetadata, setPipelinesMetadata] = React.useState<{
    environments: EnvironmentInstance[];
    items: IVersionItem[];
  }>({
    environments: [],
    items: [],
  });

  React.useEffect(() => {
    const fetchData = async () => {
      const project = await getCurrentProject();
      const pipelines = await getPipelines(project.id);
      const environments = await getEnvironments(project.id);
      const pipelinesMetadata = await getPipelinesMetadata(
        pipelines.map((pipeline) => ({
          projectId: project.id,
          definitionId: pipeline.id,
          environments: environments.map((env) => env.id),
        }))
      );

      const pipelinesMap = pipelines.reduce((acc, pipeline) => {
        acc[pipeline.id] = pipeline;
        return acc;
      }, {} as Record<number, Pipeline>);

      const items: IVersionItem[] = pipelinesMetadata.map((item) => ({
        name: pipelinesMap[item.definitionId].name,
        definitionId: item.definitionId,
        environments: item.environments.reduce<IVersionItemEnvironments>(
          (acc, env) => {
            acc[env.id.toString()] = {
              status: PipelineStatus.succeeded,
              buildId: env.buildId,
              buildNumber: env.buildNumber,
            };
            return acc;
          },
          {}
        ),
      }));

      setPipelinesMetadata({
        environments,
        items,
      });
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    console.log("Documents loaded:", pipelinesMetadata);
  }, [pipelinesMetadata]);

  return (
    <Surface background={SurfaceBackground.neutral}>
      <Page className="pipelines-page flex-grow">
        <Header
          title="Versions"
          titleSize={TitleSize.Large}
          commandBarItems={headerCommands}
        />
        <TabBar
          selectedTabId={selectedTabId}
          onSelectedTabChanged={onSelectedTabChanged}
          renderAdditionalContent={renderTabBarCommands}
          disableSticky={false}
        >
          <Tab id="home" name="Home" />
          <Tab id="runs" name="Runs" />
        </TabBar>
        <ConditionalChildren renderChildren={filterToggled}>
          <div className="page-content-left page-content-right page-content-top">
            <FilterBar
              filter={filter}
              onDismissClicked={onFilterBarDismissClicked}
            >
              <KeywordFilterBarItem filterItemKey="keyword" />
              <DropdownFilterBarItem
                filterItemKey="status"
                filter={filter}
                items={getStatuses().map(getStatusListItem)}
                selection={dropdownSelection}
                placeholder="Status"
              />
            </FilterBar>
          </div>
        </ConditionalChildren>
        <div className="page-content page-content-top">
          <VersionsTable
            filter={filter}
            items={pipelinesMetadata.items}
            environments={pipelinesMetadata.environments}
          />
        </div>
      </Page>
    </Surface>
  );
};

const onFilterBarDismissClicked = () => {
  filterToggled.value = !filterToggled.value;
};

const renderTabBarCommands = () => {
  return (
    <HeaderCommandBarWithFilter
      filter={filter}
      filterToggled={filterToggled}
      items={[]}
    />
  );
};

const onSelectedTabChanged = (newTabId: string) => {
  selectedTabId.value = newTabId;
};

const getStatuses = () => {
  return [
    PipelineStatus.succeeded,
    PipelineStatus.failed,
    PipelineStatus.warning,
    PipelineStatus.running,
  ];
};
const getStatusListItem = (
  status: PipelineStatus
): IListBoxItem<PipelineStatus> => {
  const statusDetail = getStatusIndicatorData(status);

  return {
    data: status,
    id: status,
    text: statusDetail.label,
    iconProps: {
      render: (className) => (
        <Status
          {...statusDetail.statusProps}
          className={css(className, statusDetail.statusProps.className)}
          size={StatusSize.m}
          animated={false}
        />
      ),
    },
  };
};
