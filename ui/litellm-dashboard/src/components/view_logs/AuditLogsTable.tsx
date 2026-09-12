"use client";

import { ColumnFiltersState, OnChangeFn, PaginationState } from "@tanstack/react-table";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AUDIT_TABLE_NAME_DISPLAY, AuditLogEntry, getAuditLogsTableColumns } from "./AuditLogsTableColumns";

interface AuditLogsTableProps {
  data: AuditLogEntry[];
  rowCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh: () => void;
  onViewLog: (log: AuditLogEntry) => void;
}

const ALL_VALUE = "all";

const ACTION_OPTIONS = [
  { label: "Created", value: "created" },
  { label: "Updated", value: "updated" },
  { label: "Deleted", value: "deleted" },
  { label: "Rotated", value: "rotated" },
] as const;

const TABLE_OPTIONS = [
  { label: "Keys", value: "LiteLLM_VerificationToken" },
  { label: "Teams", value: "LiteLLM_TeamTable" },
  { label: "Users", value: "LiteLLM_UserTable" },
  { label: "Organizations", value: "LiteLLM_OrganizationTable" },
  { label: "Models", value: "LiteLLM_ProxyModelTable" },
] as const;

const ACTION_FILTER_ITEMS = [
  { value: ALL_VALUE, label: "All Actions" },
  ...ACTION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const TABLE_FILTER_ITEMS = [
  { value: ALL_VALUE, label: "All Tables" },
  ...TABLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
];

const FILTER_LABELS: Record<string, string> = {
  object_id: "Object ID",
  changed_by: "Changed By",
  team_id: "Team ID",
  key_hash: "Key Hash",
  action: "Action",
  table_name: "Table",
};

const formatFilterValue = (columnId: string, value: unknown): string => {
  const raw = String(value);
  if (columnId === "action") {
    return ACTION_OPTIONS.find((option) => option.value === raw)?.label ?? raw;
  }
  if (columnId === "table_name") {
    return AUDIT_TABLE_NAME_DISPLAY[raw] ?? raw;
  }
  return raw;
};

function AuditLogsEmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useTranslation(["logs", "common"]);
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ScrollText className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {filtered
          ? t("logs:empty_matching_audit_logs", { defaultValue: "No matching audit logs" })
          : t("logs:empty_no_audit_logs_yet", { defaultValue: "No audit logs yet" })}
      </div>
      <div className="max-w-xs text-center text-sm text-muted-foreground">
        {filtered
          ? t("logs:empty_audit_filter_hint", { defaultValue: "No audit log entries match your filters." })
          : t("logs:empty_audit_appear_hint", {
              defaultValue: "Administrative changes to keys, teams, users, and models will appear here.",
            })}
      </div>
    </div>
  );
}

export function AuditLogsTable({
  data,
  rowCount,
  isLoading,
  isRefreshing,
  pagination,
  onPaginationChange,
  columnFilters,
  onColumnFiltersChange,
  searchValue,
  onSearchChange,
  onRefresh,
  onViewLog,
}: AuditLogsTableProps) {
  const { t } = useTranslation(["logs", "common"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const columns = useMemo(() => getAuditLogsTableColumns({ onViewLog }), [onViewLog]);
  const hasActiveSearch = Boolean(searchValue?.trim());

  return (
    <DataTable
      data={data}
      columns={columns}
      getRowId={(row) => row.id}
      paginationMode="server"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      rowCount={rowCount}
      filterMode="server"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      isLoading={isLoading}
      loadingMessage={t("logs:loading_audit_logs", { defaultValue: "Loading audit logs…" })}
      noDataMessage={<AuditLogsEmptyState filtered={columnFilters.length > 0 || hasActiveSearch} />}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={t("logs:search_audit_placeholder", { defaultValue: "Search audit logs by ID…" })}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
            onOpenFilters={() => setFiltersOpen(true)}
            filterLabels={FILTER_LABELS}
            formatFilterValue={formatFilterValue}
            showViewOptions={false}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("logs:filters_title", { defaultValue: "Filters" })}
            description={t("logs:filters_audit_description", { defaultValue: "Narrow down audit log entries" })}
          >
            {({ get, set }) => (
              <>
                <DataTableFilterField label={t("logs:col_object_id", { defaultValue: "Object ID" })}>
                  <Input
                    value={(get("object_id") as string) ?? ""}
                    onChange={(event) => set("object_id", event.target.value)}
                    placeholder={t("logs:placeholder_object_id", { defaultValue: "Enter object ID…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs:col_changed_by", { defaultValue: "Changed By" })}>
                  <Input
                    value={(get("changed_by") as string) ?? ""}
                    onChange={(event) => set("changed_by", event.target.value)}
                    placeholder={t("logs:placeholder_changed_by", { defaultValue: "Enter user ID…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs:filter_team_id", { defaultValue: "Team ID" })}>
                  <Input
                    value={(get("team_id") as string) ?? ""}
                    onChange={(event) => set("team_id", event.target.value)}
                    placeholder={t("logs:placeholder_team_id", { defaultValue: "Enter team ID…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs:filter_key_hash", { defaultValue: "Key Hash" })}>
                  <Input
                    value={(get("key_hash") as string) ?? ""}
                    onChange={(event) => set("key_hash", event.target.value)}
                    placeholder={t("logs:placeholder_key_hash", { defaultValue: "Enter key hash…" })}
                  />
                </DataTableFilterField>
                <DataTableFilterField label={t("logs:col_action", { defaultValue: "Action" })}>
                  <Select
                    items={ACTION_FILTER_ITEMS}
                    value={(get("action") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("action", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("logs:status_all", { defaultValue: "All Actions" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("logs:status_all", { defaultValue: "All Actions" })}</SelectItem>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
                <DataTableFilterField label={t("logs:col_table", { defaultValue: "Table" })}>
                  <Select
                    items={TABLE_FILTER_ITEMS}
                    value={(get("table_name") as string) ?? ALL_VALUE}
                    onValueChange={(value) => set("table_name", value === ALL_VALUE ? undefined : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("logs:status_all", { defaultValue: "All Tables" })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>{t("logs:status_all", { defaultValue: "All Tables" })}</SelectItem>
                      {TABLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DataTableFilterField>
              </>
            )}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
}
