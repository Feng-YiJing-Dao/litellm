"use client";
import { useKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { SimpleTooltip } from "@/components/ui/tooltip";
import {
  DateCell,
  ENTITY_CELL_TITLE_CLASSES,
  IdCell,
  IdentityCell,
  MoneyCell,
  UserPopoverCell,
} from "@/components/shared/table_cells";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableSortHeader,
  DataTableToolbar,
} from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { orgDetailHref, userDetailHref } from "@/utils/entityLinks";
import { DEFAULT_PROXY_ADMIN_USER_ID } from "@/utils/sentinels";
import { DEBOUNCE_WAIT_MS } from "@/utils/debounceConstants";
import { useDebouncedValue } from "@tanstack/react-pacer/debouncer";
import { ColumnDef, ColumnFiltersState, OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getModelDisplayName } from "../key_team_helpers/fetch_available_models_team_key";
import { deriveKeyModelScope } from "../key_scope";
import { KeyResponse, Team } from "../key_team_helpers/key_list";
import { Organization } from "../networking";
import KeyInfoView from "../templates/key_info_view";

interface TeamVirtualKeysTableProps {
  teamId: string;
  teamAlias?: string;
  organization: Organization | null;
}

/**
 * TeamVirtualKeysTable – variant of VirtualKeysTable scoped to a single team.
 * Displays all virtual keys belonging to the team with same format and styling.
 */
const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

export function TeamVirtualKeysTable({ teamId, teamAlias, organization }: TeamVirtualKeysTableProps) {
  const { t } = useTranslation(["teams", "common"]);
  const [selectedKey, setSelectedKey] = useState<KeyResponse | null>(null);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery] = useDebouncedValue(searchInput, { wait: DEBOUNCE_WAIT_MS });

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const getFilterValue = useCallback(
    (columnId: string): string | undefined => {
      const entry = columnFilters.find((filter) => filter.id === columnId);
      return typeof entry?.value === "string" && entry.value.trim() ? entry.value.trim() : undefined;
    },
    [columnFilters],
  );

  const sortBy = sorting.length > 0 ? sorting[0].id : "created_at";
  const sortOrder = sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

  const pageIndex = tablePagination.pageIndex;
  const pageSize = tablePagination.pageSize;

  const keyListOptions = {
    teamID: teamId,
    search: searchQuery.trim() || undefined,
    userID: getFilterValue("user_id"),
    keyHash: getFilterValue("key_hash"),
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
    expand: "user",
  };

  const { data: keys, isPending: isLoading, isFetching, refetch } = useKeys(pageIndex + 1, pageSize, keyListOptions);

  const displayKeys = useMemo(() => {
    const kList = keys?.keys || [];
    const orgId = organization?.organization_id;
    if (!orgId) return kList;
    return kList.map((k: KeyResponse) => ({
      ...k,
      organization_id: (k.organization_id ?? k.org_id) || orgId,
    }));
  }, [keys?.keys, organization?.organization_id]);

  const rowCount = keys?.total_count ?? 0;
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});

  const currentTeam: Team = useMemo(
    () => ({
      team_id: teamId,
      team_alias: teamAlias || teamId,
      models: [],
      max_budget: null,
      budget_duration: null,
      tpm_limit: null,
      rpm_limit: null,
      organization_id: organization?.organization_id || "",
      created_at: "",
      keys: [],
      members_with_roles: [],
      spend: 0,
    }),
    [teamId, teamAlias, organization],
  );

  const handleStorageChange = useCallback(() => {
    refetch?.();
  }, [refetch]);

  useEffect(() => {
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [handleStorageChange]);

  const handleColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>((updaterOrValue) => {
    setColumnFilters(updaterOrValue);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns: ColumnDef<KeyResponse>[] = useMemo(
    () => [
      {
        id: "token",
        accessorKey: "token",
        meta: { title: t("teams:virtual_keys_table.key_id", "Key ID") },
        header: ({ column }) => (
          <DataTableSortHeader
            column={column}
            title={t("teams:virtual_keys_table.key_id", "Key ID")}
            variant="header-cycle"
          />
        ),
        size: 120,
        enableSorting: true,
        cell: (info) => (
          <IdCell value={info.getValue() as string | null} onClick={() => setSelectedKey(info.row.original)} />
        ),
      },
      {
        id: "key_alias",
        accessorKey: "key_alias",
        meta: { title: t("teams:virtual_keys_table.key_alias", "Key Alias") },
        header: ({ column }) => (
          <DataTableSortHeader
            column={column}
            title={t("teams:virtual_keys_table.key_alias", "Key Alias")}
            variant="header-cycle"
          />
        ),
        size: 150,
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue() as string;
          return (
            <SimpleTooltip content={value}>
              <span className="block max-w-full truncate font-mono text-xs">{value ?? "-"}</span>
            </SimpleTooltip>
          );
        },
      },
      {
        id: "key_name",
        accessorKey: "key_name",
        header: t("teams:virtual_keys_table.secret_key", "Secret Key"),
        size: 120,
        enableSorting: false,
        cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        id: "organization_id",
        accessorKey: "organization_id",
        header: t("teams:virtual_keys_table.organization_id", "Organization ID"),
        size: 140,
        enableSorting: false,
        cell: (info) => {
          const orgId = info.getValue() as string | null;
          if (!orgId) return "-";
          return (
            <SimpleTooltip content={orgId}>
              <IdentityCell title={orgId} titleClassName={ENTITY_CELL_TITLE_CLASSES} href={orgDetailHref(orgId)} />
            </SimpleTooltip>
          );
        },
      },
      {
        id: "user_email",
        accessorKey: "user",
        header: t("teams:virtual_keys_table.user_email", "User Email"),
        size: 160,
        enableSorting: false,
        cell: (info) => {
          const user = info.getValue() as { user_email?: string } | undefined;
          const value = user?.user_email;
          const userId = info.row.original.user_id;
          return (
            <SimpleTooltip content={value}>
              <IdentityCell
                title={value ?? "-"}
                titleClassName={ENTITY_CELL_TITLE_CLASSES}
                href={value && userId ? userDetailHref(userId) : undefined}
              />
            </SimpleTooltip>
          );
        },
      },
      {
        id: "user_id",
        accessorKey: "user_id",
        header: t("teams:virtual_keys_table.user_id", "User ID"),
        size: 70,
        enableSorting: false,
        cell: (info) => {
          const userId = info.getValue() as string | null;
          if (userId === DEFAULT_PROXY_ADMIN_USER_ID) {
            return <DefaultProxyAdminTag userId={userId} />;
          }
          return (
            <SimpleTooltip content={userId}>
              <IdentityCell
                title={userId ?? "-"}
                titleClassName={ENTITY_CELL_TITLE_CLASSES}
                href={userId ? userDetailHref(userId) : undefined}
              />
            </SimpleTooltip>
          );
        },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        meta: { title: t("teams:virtual_keys_table.created_at", "Created At") },
        header: ({ column }) => (
          <DataTableSortHeader
            column={column}
            title={t("teams:virtual_keys_table.created_at", "Created At")}
            variant="header-cycle"
          />
        ),
        size: 120,
        enableSorting: true,
        cell: (info) => <DateCell value={info.getValue() as string | null} precision="date" />,
      },
      {
        id: "created_by",
        accessorKey: "created_by",
        header: t("teams:virtual_keys_table.created_by", "Created By"),
        size: 130,
        enableSorting: false,
        cell: (info) => {
          const userId = info.getValue() as string | null;
          if (!userId) return "-";
          const { created_by_user } = info.row.original;
          return (
            <UserPopoverCell
              userAlias={created_by_user?.user_alias ?? null}
              userEmail={created_by_user?.user_email ?? null}
              userId={userId}
              width={130}
            />
          );
        },
      },
      {
        id: "updated_at",
        accessorKey: "updated_at",
        meta: { title: t("teams:virtual_keys_table.updated_at", "Updated At") },
        header: ({ column }) => (
          <DataTableSortHeader
            column={column}
            title={t("teams:virtual_keys_table.updated_at", "Updated At")}
            variant="header-cycle"
          />
        ),
        size: 120,
        enableSorting: true,
        cell: (info) => (
          <DateCell value={info.getValue() as string | null} precision="date" fallback={t("common:never", "Never")} />
        ),
      },
      {
        id: "last_active",
        accessorKey: "last_active",
        header: t("teams:virtual_keys_table.last_active", "Last Active"),
        size: 130,
        enableSorting: false,
        cell: (info) => (
          <DateCell
            value={info.getValue() as string | null}
            precision="date"
            fallback={t("common:unknown", "Unknown")}
          />
        ),
      },
      {
        id: "expires",
        accessorKey: "expires",
        header: t("teams:virtual_keys_table.expires", "Expires"),
        size: 120,
        enableSorting: false,
        cell: (info) => (
          <DateCell value={info.getValue() as string | null} precision="date" fallback={t("common:never", "Never")} />
        ),
      },
      {
        id: "spend",
        accessorKey: "spend",
        meta: { title: t("teams:virtual_keys_table.spend_usd", "Spend (USD)") },
        header: ({ column }) => (
          <DataTableSortHeader
            column={column}
            title={t("teams:virtual_keys_table.spend_usd", "Spend (USD)")}
            variant="header-cycle"
          />
        ),
        size: 100,
        enableSorting: true,
        cell: (info) => <MoneyCell value={info.getValue() as number | null} decimals={4} />,
      },
      {
        id: "max_budget",
        accessorKey: "max_budget",
        meta: { title: t("teams:virtual_keys_table.budget_usd", "Budget (USD)") },
        header: ({ column }) => (
          <DataTableSortHeader
            column={column}
            title={t("teams:virtual_keys_table.budget_usd", "Budget (USD)")}
            variant="header-cycle"
          />
        ),
        size: 110,
        enableSorting: true,
        cell: (info) => (
          <MoneyCell
            value={info.getValue() as number | null}
            decimals={0}
            emptyText={t("common:unlimited", "Unlimited")}
            showZero
          />
        ),
      },
      {
        id: "budget_reset_at",
        accessorKey: "budget_reset_at",
        header: t("teams:virtual_keys_table.budget_reset", "Budget Reset"),
        size: 130,
        enableSorting: false,
        cell: (info) => <DateCell value={info.getValue() as string | null} fallback={t("common:never", "Never")} />,
      },
      {
        id: "models",
        accessorKey: "models",
        header: t("common:models", "Models"),
        size: 200,
        enableSorting: false,
        cell: (info) => {
          const models = info.getValue() as string[];
          const scope = deriveKeyModelScope(info.row.original.allowed_routes, info.row.original.key_type);
          const emptyModelsBadge = !scope.hasModelAccess ? (
            <SimpleTooltip
              content={t(
                "teams:virtual_keys_table.no_model_access_tooltip",
                `Scoped to ${scope.label} routes; this key cannot call any models`,
                { label: scope.label },
              )}
            >
              <Badge variant="secondary" className="mb-1">
                {t("teams:virtual_keys_table.no_model_access", "No model access")}
              </Badge>
            </SimpleTooltip>
          ) : (
            <Badge variant="destructive" className="mb-1">
              {t("teams:virtual_keys_table.all_proxy_models", "All Proxy Models")}
            </Badge>
          );
          return (
            <div className="flex flex-col py-2">
              {Array.isArray(models) ? (
                <div className="flex flex-col">
                  {models.length === 0 ? (
                    emptyModelsBadge
                  ) : (
                    <>
                      <div className="flex items-start">
                        {models.length > 3 && (
                          <button
                            type="button"
                            aria-label={
                              expandedAccordions[info.row.id]
                                ? t("teams:virtual_keys_table.collapse_models", "Collapse models")
                                : t("teams:virtual_keys_table.expand_models", "Expand models")
                            }
                            className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() =>
                              setExpandedAccordions((prev) => ({
                                ...prev,
                                [info.row.id]: !prev[info.row.id],
                              }))
                            }
                          >
                            {expandedAccordions[info.row.id] ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {models.slice(0, 3).map((model, index) =>
                            model === "all-proxy-models" ? (
                              <Badge key={index} variant="destructive">
                                {t("teams:virtual_keys_table.all_proxy_models", "All Proxy Models")}
                              </Badge>
                            ) : (
                              <Badge key={index}>
                                {model.length > 30
                                  ? `${getModelDisplayName(model).slice(0, 30)}...`
                                  : getModelDisplayName(model)}
                              </Badge>
                            ),
                          )}
                          {models.length > 3 && !expandedAccordions[info.row.id] && (
                            <Badge variant="secondary">
                              +{models.length - 3}{" "}
                              {models.length - 3 === 1
                                ? t("teams:virtual_keys_table.more_model", "more model")
                                : t("teams:virtual_keys_table.more_models", "more models")}
                            </Badge>
                          )}
                          {expandedAccordions[info.row.id] && (
                            <div className="flex flex-wrap gap-1">
                              {models.slice(3).map((model, index) =>
                                model === "all-proxy-models" ? (
                                  <Badge key={index + 3} variant="destructive">
                                    {t("teams:virtual_keys_table.all_proxy_models", "All Proxy Models")}
                                  </Badge>
                                ) : (
                                  <Badge key={index + 3}>
                                    {model.length > 30
                                      ? `${getModelDisplayName(model).slice(0, 30)}...`
                                      : getModelDisplayName(model)}
                                  </Badge>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "rate_limits",
        header: t("teams:virtual_keys_table.rate_limits", "Rate Limits"),
        size: 140,
        enableSorting: false,
        cell: ({ row }) => {
          const key = row.original;
          return (
            <div>
              <div>TPM: {key.tpm_limit !== null ? key.tpm_limit : t("common:unlimited", "Unlimited")}</div>
              <div>RPM: {key.rpm_limit !== null ? key.rpm_limit : t("common:unlimited", "Unlimited")}</div>
            </div>
          );
        },
      },
    ],
    [expandedAccordions, t],
  );

  const handleSortingChange = useCallback((updaterOrValue: React.SetStateAction<SortingState>) => {
    setSorting(updaterOrValue);
    setTablePagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  return (
    <div className="w-full">
      {selectedKey ? (
        <KeyInfoView
          keyId={selectedKey.token}
          onClose={() => setSelectedKey(null)}
          keyData={selectedKey}
          teams={[currentTeam]}
          onDelete={refetch}
        />
      ) : (
        <div className="py-4">
          <DataTable
            data={displayKeys}
            columns={columns}
            sortingMode="server"
            sorting={sorting}
            onSortingChange={handleSortingChange}
            paginationMode="server"
            pagination={tablePagination}
            onPaginationChange={setTablePagination}
            rowCount={rowCount}
            filterMode="server"
            columnFilters={columnFilters}
            onColumnFiltersChange={handleColumnFiltersChange}
            enableColumnResizing
            columnResizeMode="onChange"
            isLoading={isLoading || isFetching}
            loadingMessage={t("teams:virtual_keys_table.loading_keys", "Loading keys...")}
            size="compact"
            toolbar={(table) => (
              <>
                <DataTableToolbar
                  table={table}
                  searchValue={searchInput}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder={t("teams:virtual_keys_table.search_placeholder", "Search by key alias or ID…")}
                  onRefresh={() => refetch?.()}
                  isRefreshing={isFetching}
                  onOpenFilters={() => setFiltersOpen(true)}
                  filterLabels={{
                    user_id: t("teams:virtual_keys_table.user_id", "User ID"),
                    key_hash: t("teams:virtual_keys_table.key_id", "Key ID"),
                  }}
                />
                <DataTableFilterDrawer
                  table={table}
                  open={filtersOpen}
                  onOpenChange={setFiltersOpen}
                  title={t("teams:filters_title", "Filters")}
                  description={t(
                    "teams:virtual_keys_table.filters_desc",
                    `Narrow down keys for ${teamAlias ?? "this team"}`,
                    { team: teamAlias ?? "this team" },
                  )}
                >
                  {({ get, set }) => (
                    <>
                      <DataTableFilterField label={t("teams:virtual_keys_table.user_id", "User ID")}>
                        <Input
                          value={(get("user_id") as string) ?? ""}
                          onChange={(event) => set("user_id", event.target.value)}
                          placeholder={t("teams:virtual_keys_table.filter_user_id_placeholder", "Filter by user ID…")}
                        />
                      </DataTableFilterField>
                      <DataTableFilterField label={t("teams:virtual_keys_table.key_id", "Key ID")}>
                        <Input
                          value={(get("key_hash") as string) ?? ""}
                          onChange={(event) => set("key_hash", event.target.value)}
                          placeholder={t("teams:virtual_keys_table.filter_key_id_placeholder", "Enter Key ID…")}
                        />
                      </DataTableFilterField>
                    </>
                  )}
                </DataTableFilterDrawer>
              </>
            )}
          />
        </div>
      )}
    </div>
  );
}
