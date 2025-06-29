import { useState, useEffect, useCallback, useMemo } from "react";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Card } from "azure-devops-ui/Card";
import {
  Status,
  Statuses,
  StatusSize,
  IStatusProps,
} from "azure-devops-ui/Status";
import {
  ITableColumn,
  SimpleTableCell,
  Table,
  ColumnSorting,
  sortItems,
} from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { IFilter, FILTER_CHANGE_EVENT } from "azure-devops-ui/Utilities/Filter";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { EnvironmentInstance } from "src/services/external/Environment/Environments";

export enum PipelineStatus {
  running = "running",
  succeeded = "succeeded",
  failed = "failed",
  warning = "warning",
}

interface IVersionsTableProps {
  environments: EnvironmentInstance[];
  items: IVersionItem[];
  filter: IFilter;
}

export interface IVersionItemEnvironments {
  [id: string]: {
    status: PipelineStatus;
    buildId: number;
    buildNumber: string;
  };
}

export interface IVersionItem {
  name: string;
  definitionId: number;
  environments: IVersionItemEnvironments;
}

interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}

export function getStatusIndicatorData(status: string): IStatusIndicatorData {
  status = (status || "").toLowerCase();
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

export const VersionsTable = ({
  filter,
  environments,
  items,
}: IVersionsTableProps) => {
  const [sortedItems, setSortedItems] = useState<IVersionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IVersionItem[]>([]);
  const [filtering, setFiltering] = useState(false);

  const filterItems = useCallback(
    (items: IVersionItem[]) => {
      if (filter.hasChangesToReset()) {
        const filterText = filter
          .getFilterItemValue<string>("keyword")
          ?.toLocaleLowerCase();
        const statuses = filter.getFilterItemValue<PipelineStatus[]>("status");
        const buildNumbers = filter.getFilterItemValue<string[]>("buildNumber");

        return items.filter((item) => {
          const nameMatch =
            !filterText || item.name.toLocaleLowerCase().includes(filterText);

          return Object.values(item.environments).some((env) => {
            const buildNumberTextMatch =
              !filterText ||
              env.buildNumber.toLocaleLowerCase().includes(filterText);
            const statusMatch =
              !statuses?.length || statuses.includes(env.status);
            const buildNumberMatch =
              !buildNumbers?.length || buildNumbers.includes(env.buildNumber);

            return (
              (buildNumberTextMatch || nameMatch) &&
              statusMatch &&
              buildNumberMatch
            );
          });
        });
      } else {
        return [...items];
      }
    },
    [filter]
  );

  const onFilterChanged = useCallback(() => {
    const newFiltered = filterItems(sortedItems);
    setFilteredItems(newFiltered);
    setFiltering(filter.hasChangesToReset());
  }, [filter, filterItems, sortedItems]);

  useEffect(() => {
    filter.subscribe(onFilterChanged, FILTER_CHANGE_EVENT);
    return () => filter.unsubscribe(onFilterChanged, FILTER_CHANGE_EVENT);
  }, [filter, onFilterChanged]);

  useEffect(() => {
    setSortedItems([...items]);
    setFilteredItems([...items]);
  }, [items]);

  const columns: (ITableColumn<IVersionItem> & {
    sortFunction: (a: IVersionItem, b: IVersionItem) => number;
  })[] = useMemo(
    () => [
      {
        id: "name",
        name: "Pipeline",
        readonly: true,
        renderCell: renderNameColumn,
        sortFunction: (a: IVersionItem, b: IVersionItem) =>
          a.name.localeCompare(b.name),
        sortProps: {
          ariaLabelAscending: "Sorted A to Z",
          ariaLabelDescending: "Sorted Z to A",
        },
        width: new ObservableValue(-10),
      },
      ...environments.map((environment) => ({
        id: environment.id.toString(),
        name: environment.name,
        readonly: true,
        renderCell: renderVersionColumn,
        sortFunction: (a: IVersionItem, b: IVersionItem) =>
          a.environments[environment.id]?.buildNumber.localeCompare(
            b.environments[environment.id]?.buildNumber
          ),
        sortProps: {
          ariaLabelAscending: "Sorted A to Z",
          ariaLabelDescending: "Sorted Z to A",
        },
        width: new ObservableValue(-10),
      })),
    ],
    [environments]
  );

  const sortFunctions = useMemo(
    () => columns.map((column) => column.sortFunction),
    [columns]
  );

  const sortingBehavior = useMemo(
    () =>
      new ColumnSorting<IVersionItem>((columnIndex, proposedSortOrder) => {
        const newSorted = sortItems(
          columnIndex,
          proposedSortOrder,
          sortFunctions,
          columns,
          sortedItems
        );
        setSortedItems(newSorted);
        setFilteredItems(filterItems(newSorted));
      }),
    [columns, sortFunctions, sortedItems, filterItems]
  );

  if (filtering && filteredItems.length === 0) {
    return <>No pipeline items</>;
  }

  return (
    <Card
      className="flex-grow bolt-card-no-vertical-padding"
      contentProps={{ contentPadding: false }}
    >
      <Table<Partial<IVersionItem>>
        behaviors={[sortingBehavior]}
        columns={columns}
        itemProvider={new ArrayItemProvider<IVersionItem>(filteredItems)}
        showLines
        onSelect={(_, data) => console.log("Selected Row - " + data.index)}
        onActivate={(_, row) => console.log("Activated Row - " + row.index)}
      />
    </Card>
  );
};

function renderNameColumn(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IVersionItem>,
  tableItem: IVersionItem
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
  tableColumn: ITableColumn<IVersionItem>,
  tableItem: IVersionItem
): JSX.Element {
  const item = tableItem.environments[tableColumn.id];

  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
    >
      {!!item && (
        <>
          <Status
            {...getStatusIndicatorData(item.status).statusProps}
            className="icon-large-margin"
            size={StatusSize.m}
          />
          <div className="flex-row scroll-hidden wrap-text">
            <Tooltip text={item.buildNumber}>
              <span>{item.buildNumber}</span>
            </Tooltip>
          </div>
        </>
      )}
    </SimpleTableCell>
  );
}
