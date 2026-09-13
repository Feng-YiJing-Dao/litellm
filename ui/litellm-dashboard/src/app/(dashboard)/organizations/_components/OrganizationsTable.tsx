"use client";

import { SortingState } from "@tanstack/react-table";
import { Building2, SearchX } from "lucide-react";
import React, { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/shared/DataTable";
import { Organization } from "@/components/networking";

import { getOrganizationsTableColumns } from "./OrganizationsTableColumns";

interface OrganizationsTableProps {
  organizations: Organization[];
  isLoading: boolean;
  userRole: string;
  searchActive: boolean;
  onOrganizationClick: (organizationId: string) => void;
  onEditClick: (organizationId: string) => void;
  onDeleteClick: (organizationId: string) => void;
}

const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }];

function EmptyState({ searchActive, t }: { searchActive: boolean; t: (key: any, options?: any) => any }) {
  const Icon = searchActive ? SearchX : Building2;
  return (
    <div className="flex flex-col items-center gap-1 py-6">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-medium text-foreground">
        {searchActive
          ? t("organizations:empty.no_match_title", { defaultValue: "No matching organizations" })
          : t("organizations:empty.no_orgs_title", { defaultValue: "No organizations yet" })}
      </div>
      <div className="text-sm text-muted-foreground">
        {searchActive
          ? t("organizations:empty.no_match_desc", {
              defaultValue: "No organizations match your search. Try a different name or ID.",
            })
          : t("organizations:empty.no_orgs_desc", {
              defaultValue: "Create an organization to group teams, models, and budgets.",
            })}
      </div>
    </div>
  );
}

const OrganizationsTable: React.FC<OrganizationsTableProps> = ({
  organizations,
  isLoading,
  userRole,
  searchActive,
  onOrganizationClick,
  onEditClick,
  onDeleteClick,
}) => {
  const { t } = useTranslation(["organizations", "common"]);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);

  const columns = useMemo(() => {
    const deps = { userRole, onOrganizationClick, onEditClick, onDeleteClick, t };
    return getOrganizationsTableColumns(deps);
  }, [userRole, onOrganizationClick, onEditClick, onDeleteClick, t]);

  return (
    <DataTable
      data={organizations}
      paginationMode="client"
      columns={columns}
      getRowId={(organization, index) => organization.organization_id || String(index)}
      sortingMode="client"
      sorting={sorting}
      onSortingChange={setSorting}
      isLoading={isLoading}
      loadingMessage={t("organizations:empty.loading", { defaultValue: "Loading organizations…" })}
      noDataMessage={<EmptyState searchActive={searchActive} t={t} />}
      size="compact"
    />
  );
};

export default OrganizationsTable;
