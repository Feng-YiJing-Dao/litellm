"use client";

import { Inbox, ShieldAlert } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BUDGET_DURATION_FILTER_OPTIONS,
  BUDGET_DURATION_UNSET,
  type CreatedAtFilterValue,
  type MaxBudgetFilterValue,
} from "@/app/(dashboard)/hooks/budgets/budgetFilters";
import type { budgetItem } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import type { ResourceListResult } from "@/app/(dashboard)/hooks/common/useResourceList";
import {
  DataTable,
  DataTableFilterDrawer,
  DataTableFilterField,
  DataTableToolbar,
  type FilterDraft,
} from "@/components/shared/DataTable";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/http/client";

import { BUDGET_TABLE_HIDDEN_COLUMNS, getBudgetTableColumns } from "./BudgetTableColumns";

interface BudgetTableProps {
  list: ResourceListResult<budgetItem>;
  canModify: boolean;
  onEditClick: (budget: budgetItem) => void;
  onDeleteClick: (budget: budgetItem) => void;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const FILTER_LABELS: Record<string, string> = {
  budget_duration: "Reset",
  max_budget: "Max Budget",
  created_at: "Created",
};

const durationLabel = (value: string): string =>
  BUDGET_DURATION_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? value;

const formatFilterValue = (columnId: string, value: unknown): string => {
  if (columnId === "budget_duration") {
    return (Array.isArray(value) ? value : []).map((entry) => durationLabel(String(entry))).join(", ");
  }
  if (columnId === "max_budget") {
    const { min, max, unlimitedOnly } = (value ?? {}) as MaxBudgetFilterValue;
    return unlimitedOnly === true ? "Unlimited only" : `${min ? `$${min}` : "any"} to ${max ? `$${max}` : "any"}`;
  }
  if (columnId === "created_at") {
    const { from, to } = (value ?? {}) as CreatedAtFilterValue;
    return `${from || "any"} to ${to || "any"}`;
  }
  return String(value);
};

/** The drawer keeps any non-empty object as an active filter, so collapse a blank draft to nothing. */
const normalizeMaxBudget = (draft: MaxBudgetFilterValue): MaxBudgetFilterValue | undefined => {
  if (draft.unlimitedOnly === true) {
    return { unlimitedOnly: true };
  }
  const min = draft.min?.trim() ?? "";
  const max = draft.max?.trim() ?? "";
  if (min === "" && max === "") {
    return undefined;
  }
  return { ...(min === "" ? {} : { min }), ...(max === "" ? {} : { max }) };
};

const normalizeCreatedAt = (draft: CreatedAtFilterValue): CreatedAtFilterValue | undefined => {
  const from = draft.from ?? "";
  const to = draft.to ?? "";
  if (from === "" && to === "") {
    return undefined;
  }
  return { ...(from === "" ? {} : { from }), ...(to === "" ? {} : { to }) };
};

function EmptyState({ hasQuery, t }: { hasQuery: boolean; t?: any }) {
  const translate = t || ((_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue || _k);
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {hasQuery
          ? translate("budgets:empty_state.no_matching", { defaultValue: "No matching budgets" })
          : translate("budgets:empty_state.no_budgets_yet", { defaultValue: "No budgets yet" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {hasQuery
          ? translate("budgets:empty_state.adjust_search", { defaultValue: "No budget matches your search or filters." })
          : translate("budgets:empty_state.cta", { defaultValue: "Create a budget to set spend, TPM and RPM limits for customers." })}
      </div>
    </div>
  );
}

function ErrorState({ error, t }: { error: Error; t?: any }) {
  const translate = t || ((_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue || _k);
  const forbidden = error instanceof ApiError && error.status === 403;
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <ShieldAlert className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {forbidden
          ? translate("budgets:errors.forbidden_title", { defaultValue: "You do not have access to budgets" })
          : translate("budgets:errors.load_failed", { defaultValue: "Could not load budgets" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {forbidden
          ? translate("budgets:errors.forbidden_desc", { defaultValue: "Ask a proxy admin to grant you the admin viewer role." })
          : error.message}
      </div>
    </div>
  );
}

/** "Not set" and the concrete durations are exclusive; see serializeBudgetFilters for why. */
function DurationFilter({ selected, onChange }: { selected: string[]; onChange: (selected: string[]) => void }) {
  const toggle = (value: string, checked: boolean): void => {
    if (!checked) {
      onChange(selected.filter((entry) => entry !== value));
      return;
    }
    const kept = value === BUDGET_DURATION_UNSET ? [] : selected.filter((entry) => entry !== BUDGET_DURATION_UNSET);
    onChange([...kept, value]);
  };

  return (
    <div className="flex flex-col gap-2">
      {BUDGET_DURATION_FILTER_OPTIONS.map((option) => (
        <Label key={option.value} className="font-normal">
          <Checkbox
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked === true)}
            data-testid={`budget-filter-duration-${option.value}`}
          />
          {option.label}
        </Label>
      ))}
    </div>
  );
}

function BudgetFilterFields({ get, set, t }: FilterDraft & { t?: any }) {
  const translate = t || ((_k: string, opts?: { defaultValue?: string }) => opts?.defaultValue || _k);
  const maxBudget = (get("max_budget") as MaxBudgetFilterValue | undefined) ?? {};
  const created = (get("created_at") as CreatedAtFilterValue | undefined) ?? {};
  const unlimitedOnly = maxBudget.unlimitedOnly === true;

  return (
    <>
      <DataTableFilterField label={translate("budgets:columns.budget_reset", { defaultValue: "Reset" })}>
        <DurationFilter
          selected={(get("budget_duration") as string[] | undefined) ?? []}
          onChange={(selected) => set("budget_duration", selected)}
        />
      </DataTableFilterField>
      <DataTableFilterField label={translate("budgets:columns.max_budget_usd", { defaultValue: "Max Budget (USD)" })}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={maxBudget.min ?? ""}
            disabled={unlimitedOnly}
            onChange={(event) => set("max_budget", normalizeMaxBudget({ ...maxBudget, min: event.target.value }))}
            placeholder={translate("budgets:filter.min_placeholder", { defaultValue: "Min" })}
            aria-label={translate("budgets:filter.min_aria", { defaultValue: "Minimum max budget" })}
            data-testid="budget-filter-max-budget-min"
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={maxBudget.max ?? ""}
            disabled={unlimitedOnly}
            onChange={(event) => set("max_budget", normalizeMaxBudget({ ...maxBudget, max: event.target.value }))}
            placeholder={translate("budgets:filter.max_placeholder", { defaultValue: "Max" })}
            aria-label={translate("budgets:filter.max_aria", { defaultValue: "Maximum max budget" })}
            data-testid="budget-filter-max-budget-max"
          />
        </div>
        <Label className="mt-1 font-normal">
          <Checkbox
            checked={unlimitedOnly}
            onCheckedChange={(checked) => set("max_budget", normalizeMaxBudget({ unlimitedOnly: checked === true }))}
            data-testid="budget-filter-max-budget-unlimited"
          />
          {translate("budgets:filter.unlimited_only", { defaultValue: "Unlimited only" })}
        </Label>
      </DataTableFilterField>
      <DataTableFilterField label={translate("budgets:columns.created_at", { defaultValue: "Created" })}>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={created.from ?? ""}
            onChange={(event) => set("created_at", normalizeCreatedAt({ ...created, from: event.target.value }))}
            aria-label={translate("budgets:filter.created_from", { defaultValue: "Created from" })}
            data-testid="budget-filter-created-from"
          />
          <Input
            type="date"
            value={created.to ?? ""}
            onChange={(event) => set("created_at", normalizeCreatedAt({ ...created, to: event.target.value }))}
            aria-label={translate("budgets:filter.created_to", { defaultValue: "Created to" })}
            data-testid="budget-filter-created-to"
          />
        </div>
      </DataTableFilterField>
    </>
  );
}

const BudgetTable: React.FC<BudgetTableProps> = ({ list, canModify, onEditClick, onDeleteClick }) => {
  const { t } = useTranslation(["budgets", "common"]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const columns = useMemo(
    () => getBudgetTableColumns({ canModify, onEditClick, onDeleteClick, t }),
    [canModify, onEditClick, onDeleteClick, t],
  );

  const filterLabels = useMemo<Record<string, string>>(
    () => ({
      budget_duration: t("budgets:columns.budget_reset", { defaultValue: "Reset" }),
      max_budget: t("budgets:columns.max_budget", { defaultValue: "Max Budget" }),
      created_at: t("budgets:columns.created_at", { defaultValue: "Created" }),
    }),
    [t],
  );

  const formatFilterVal = useMemo(
    () => (columnId: string, value: unknown): string => {
      if (columnId === "budget_duration") {
        return (Array.isArray(value) ? value : []).map((entry) => durationLabel(String(entry))).join(", ");
      }
      if (columnId === "max_budget") {
        const { min, max, unlimitedOnly } = (value ?? {}) as MaxBudgetFilterValue;
        return unlimitedOnly === true
          ? t("budgets:filter.unlimited_only", { defaultValue: "Unlimited only" })
          : `${min ? `$${min}` : t("budgets:filter.any", { defaultValue: "any" })} ${t("budgets:filter.to", { defaultValue: "to" })} ${max ? `$${max}` : t("budgets:filter.any", { defaultValue: "any" })}`;
      }
      if (columnId === "created_at") {
        const { from, to } = (value ?? {}) as CreatedAtFilterValue;
        return `${from || t("budgets:filter.any", { defaultValue: "any" })} ${t("budgets:filter.to", { defaultValue: "to" })} ${to || t("budgets:filter.any", { defaultValue: "any" })}`;
      }
      return String(value);
    },
    [t],
  );

  const hasQuery = list.searchValue.trim() !== "" || list.columnFilters.length > 0;
  const emptyMessage = list.error === null ? <EmptyState hasQuery={hasQuery} t={t} /> : <ErrorState error={list.error} t={t} />;

  return (
    <DataTable
      data={list.rows}
      columns={columns}
      getRowId={(budget, index) => budget.budget_id || String(index)}
      defaultColumnVisibility={BUDGET_TABLE_HIDDEN_COLUMNS}
      fillHeight
      sortingMode="server"
      sorting={list.sorting}
      onSortingChange={list.onSortingChange}
      paginationMode="server"
      pagination={list.pagination}
      onPaginationChange={list.onPaginationChange}
      rowCount={list.rowCount}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      filterMode="server"
      columnFilters={list.columnFilters}
      onColumnFiltersChange={list.onColumnFiltersChange}
      isLoading={list.isLoading}
      loadingMessage={t("budgets:loading", { defaultValue: "Loading budgets…" })}
      noDataMessage={emptyMessage}
      size="compact"
      toolbar={(table) => (
        <>
          <DataTableToolbar
            table={table}
            searchValue={list.searchValue}
            onSearchChange={list.onSearchChange}
            searchPlaceholder={t("budgets:search_placeholder", { defaultValue: "Search by budget ID…" })}
            onOpenFilters={() => setFiltersOpen(true)}
            onRefresh={list.refetch}
            isRefreshing={list.isFetching}
            filterLabels={filterLabels}
            formatFilterValue={formatFilterVal}
          />
          <DataTableFilterDrawer
            table={table}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t("budgets:filter.title", { defaultValue: "Filters" })}
            description={t("budgets:filter.description", { defaultValue: "Narrow down your budgets" })}
          >
            {(draft) => <BudgetFilterFields {...draft} t={t} />}
          </DataTableFilterDrawer>
        </>
      )}
    />
  );
};

export default BudgetTable;
