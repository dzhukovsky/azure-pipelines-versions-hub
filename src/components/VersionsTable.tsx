import * as React from "react";
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

export enum PipelineStatus {
  running = "running",
  succeeded = "succeeded",
  failed = "failed",
  warning = "warning",
}

interface IVersionsTableProps {
  filter: IFilter;
}

interface IPipelineItem {
  name: string;
  status: PipelineStatus;
}

interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}

const pipelineItems: IPipelineItem[] = [
  { name: "enterprise-distributed-service", status: PipelineStatus.running },
  { name: "microservice-architecture", status: PipelineStatus.succeeded },
  { name: "mobile-ios-app", status: PipelineStatus.succeeded },
  { name: "node-package", status: PipelineStatus.succeeded },
  { name: "parallel-stages", status: PipelineStatus.failed },
  { name: "simple-web-app", status: PipelineStatus.warning },
];

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

export const VersionsTable: React.FC<IVersionsTableProps> = ({ filter }) => {
  const [sortedItems, setSortedItems] = useState<IPipelineItem[]>([
    ...pipelineItems,
  ]);
  const [filteredItems, setFilteredItems] = useState<IPipelineItem[]>([
    ...pipelineItems,
  ]);
  const [filtering, setFiltering] = useState(false);

  const filterItems = useCallback(
    (items: IPipelineItem[]) => {
      if (filter.hasChangesToReset()) {
        const filterText = filter.getFilterItemValue<string>("keyword");
        const statuses = filter.getFilterItemValue<PipelineStatus[]>("status");
        return items.filter((item) => {
          let ok = true;
          if (filterText) ok = item.name.includes(filterText);
          if (ok && statuses?.length)
            ok = statuses.some((s) => s === item.status);
          return ok;
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

  const columns: ITableColumn<IPipelineItem>[] = useMemo(
    () => [
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
      ...["dev", "test", "prod"].map((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        readonly: true,
        renderCell: renderVersionColumn,
        sortProps: {
          ariaLabelAscending: "Sorted A to Z",
          ariaLabelDescending: "Sorted Z to A",
        },
        width: new ObservableValue(-10),
      })),
    ],
    []
  );

  const sortFunctions = useMemo(
    () =>
      columns.map((column) => {
        const key = column.id as keyof IPipelineItem;
        return (a: IPipelineItem, b: IPipelineItem) =>
          a[key]?.localeCompare(b[key]);
      }),
    [columns]
  );

  const sortingBehavior = useMemo(
    () =>
      new ColumnSorting<IPipelineItem>((columnIndex, proposedSortOrder) => {
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
      <Table<Partial<IPipelineItem>>
        behaviors={[sortingBehavior]}
        columns={columns}
        itemProvider={new ArrayItemProvider<IPipelineItem>(filteredItems)}
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
  const statusData = getStatusIndicatorData(tableItem.status);
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
      contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
    >
      <Status
        {...statusData.statusProps}
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
