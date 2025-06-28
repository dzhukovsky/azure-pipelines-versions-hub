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
} from "./components/VersionsTable";

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

const fetchData = async () => {
  const project = await getCurrentProject();

  const pipelines = await getPipelines(project.id);
  console.log("Pipelines fetched:", pipelines);

  const environments = await getEnvironments(project.id);
  console.log("Environments fetched:", environments);

  return getPipelinesMetadata([
    {
      projectId: project.id,
      definitionId: 156,
      environments: environments.map((env) => env.id),
    },
  ]);
};

export const VersionsHub = () => {
  const [documents, setDocuments] = React.useState<object[]>([]);
  React.useEffect(() => {
    fetchData().then(setDocuments);
  }, []);

  React.useEffect(() => {
    console.log("Documents loaded:", documents);
  }, [documents]);

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
          <VersionsTable filter={filter} />
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
