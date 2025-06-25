import * as React from "react";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
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
import {
  Status,
  Statuses,
  StatusSize,
  IStatusProps,
} from "azure-devops-ui/Status";
import { Surface, SurfaceBackground } from "azure-devops-ui/Surface";
import {
  ITableColumn,
  SimpleTableCell,
  Table,
  ColumnSorting,
  SortOrder,
  sortItems,
} from "azure-devops-ui/Table";
import { Tab, TabBar } from "azure-devops-ui/Tabs";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { css } from "azure-devops-ui/Util";
import {
  IFilter,
  Filter,
  FILTER_CHANGE_EVENT,
} from "azure-devops-ui/Utilities/Filter";
import { DropdownMultiSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";

import "./App.scss";
import { getDocuments } from "./services/external/extensionDataService";

enum PipelineStatus {
  running = "running",
  succeeded = "succeeded",
  failed = "failed",
  warning = "warning",
}

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

export const App = () => {
  const [documents, setDocuments] = React.useState<object[]>([]);
  React.useEffect(() => {
    getDocuments<object>("pipelines-metadata").then(setDocuments);
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
          <PipelinesListingPageContent filter={filter} />
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

interface IPipelinesListingPageContentProps {
  filter: IFilter;
}

interface IPipelinesListingPageContentState {
  filtering: boolean;
  sortedItems: IPipelineItem[];
  filteredItems: IPipelineItem[];
}

class PipelinesListingPageContent extends React.Component<
  IPipelinesListingPageContentProps,
  IPipelinesListingPageContentState
> {
  constructor(props: IPipelinesListingPageContentProps) {
    super(props);

    this.state = {
      filtering: false,
      filteredItems: [...pipelineItems],
      sortedItems: [...pipelineItems],
    };
  }

  render() {
    if (this.state.filtering && this.state.filteredItems.length === 0) {
      return "No pipeline items";
    }
    return (
      <Card
        className="flex-grow bolt-card-no-vertical-padding"
        contentProps={{ contentPadding: false }}
      >
        <Table<Partial<IPipelineItem>>
          behaviors={[this.sortingBehavior]}
          columns={this.columns}
          itemProvider={
            new ArrayItemProvider<IPipelineItem>(this.state.filteredItems)
          }
          showLines={true}
          onSelect={(_, data) => console.log("Selected Row - " + data.index)}
          onActivate={(_, row) => console.log("Activated Row - " + row.index)}
        />
      </Card>
    );
  }

  componentDidMount() {
    this.props.filter.subscribe(this.onFilterChanged, FILTER_CHANGE_EVENT);
  }

  componentWillUnmount() {
    this.props.filter.unsubscribe(this.onFilterChanged, FILTER_CHANGE_EVENT);
  }

  private onFilterChanged = () => {
    const filteredItems = this.filterItems(this.state.sortedItems);
    this.setState({
      filtering: this.props.filter.hasChangesToReset(),
      filteredItems: filteredItems,
    });
  };

  private filterItems = (items: IPipelineItem[]) => {
    if (this.props.filter.hasChangesToReset()) {
      const filterText =
        this.props.filter.getFilterItemValue<string>("keyword");
      const statuses =
        this.props.filter.getFilterItemValue<PipelineStatus[]>("status");
      const filteredItems = items.filter((item) => {
        let includeItem = true;
        if (filterText) {
          includeItem = item.name.indexOf(filterText) !== -1;
        }
        if (includeItem && statuses && statuses.length) {
          includeItem = statuses.some((s) => s === item.status);
        }
        return includeItem;
      });
      return filteredItems;
    } else {
      return [...items];
    }
  };

  private sortFunctions = [
    // Sort on Name column
    (item1: IPipelineItem, item2: IPipelineItem): number => {
      return item1.name.localeCompare(item2.name);
    },
  ];

  // Create the sorting behavior (delegate that is called when a column is sorted).
  private sortingBehavior = new ColumnSorting<IPipelineItem>(
    (columnIndex: number, proposedSortOrder: SortOrder) => {
      const sortedItems = sortItems(
        columnIndex,
        proposedSortOrder,
        this.sortFunctions,
        this.columns,
        this.state.sortedItems
      );
      this.setState({
        sortedItems,
        filteredItems: this.filterItems(sortedItems),
      });
    }
  );

  private columns: ITableColumn<IPipelineItem>[] = [
    {
      id: "name",
      name: "Pipeline",
      readonly: true,
      renderCell: renderNameColumn,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A",
      },
      width: new ObservableValue(-10),
    },
    {
      id: "dev",
      name: "Dev",
      readonly: true,
      renderCell: renderVersionColumn,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A",
      },
      width: new ObservableValue(-10),
    },
    {
      id: "test",
      name: "Test",
      readonly: true,
      renderCell: renderVersionColumn,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A",
      },
      width: new ObservableValue(-10),
    },
    {
      id: "prod",
      name: "Prod",
      readonly: true,
      renderCell: renderVersionColumn,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A",
      },
      width: new ObservableValue(-10),
    },
  ];
}

function renderNameColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
      contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
    >
      <div className="flex-row scroll-hidden wrap-text">
        <Tooltip text={tableItem.name}>
          <span>{tableItem.name}</span>
        </Tooltip>
      </div>
    </SimpleTableCell>
  );
}

function renderVersionColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IPipelineItem>,
  tableItem: IPipelineItem
): JSX.Element {
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
      contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
    >
      <Status
        {...getStatusIndicatorData(tableItem.status).statusProps}
        className="icon-large-margin"
        size={StatusSize.m}
      />
      <div className="flex-row scroll-hidden wrap-text">
        <Tooltip text={tableItem.name}>
          <span>{tableItem.name}</span>
        </Tooltip>
      </div>
    </SimpleTableCell>
  );
}

const pipelineItems: IPipelineItem[] = [
  {
    name: "enterprise-distributed-service",
    status: PipelineStatus.running,
  },
  {
    name: "microservice-architecture",
    status: PipelineStatus.succeeded,
  },
  {
    name: "mobile-ios-app",
    status: PipelineStatus.succeeded,
  },
  {
    name: "node-package",
    status: PipelineStatus.succeeded,
  },
  {
    name: "parallel-stages",
    status: PipelineStatus.failed,
  },
  {
    name: "simple-web-app",
    status: PipelineStatus.warning,
  },
];

interface IPipelineItem {
  name: string;
  status: PipelineStatus;
}

interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}

function getStatusIndicatorData(status: string): IStatusIndicatorData {
  status = status || "";
  status = status.toLowerCase();
  const indicatorData: IStatusIndicatorData = {
    statusProps: Statuses.Success,
    label: "Success",
  };
  switch (status) {
    case PipelineStatus.failed:
      indicatorData.statusProps = Statuses.Failed;
      indicatorData.label = "Failed";
      break;
    case PipelineStatus.running:
      indicatorData.statusProps = Statuses.Running;
      indicatorData.label = "Running";
      break;
    case PipelineStatus.warning:
      indicatorData.statusProps = Statuses.Warning;
      indicatorData.label = "Warning";

      break;
  }

  return indicatorData;
}
