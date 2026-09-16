"use client";

import { ColumnDef } from "@tanstack/react-table";
import i18n from "@/locales";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, ModelsCell, MoneyCell } from "@/components/shared/table_cells";
import { DeletedTeam } from "@/app/(dashboard)/hooks/teams/useTeams";

const t = (key: string, defaultValue: string) => i18n.t(key, { defaultValue });

export const getDeletedTeamsTableColumns = (): ColumnDef<DeletedTeam>[] => [
    {
      id: "team_alias",
      accessorKey: "team_alias",
      meta: { title: t("teams:deleted_teams.columns.team_name", "Team Name") },
      header: t("teams:deleted_teams.columns.team_name", "Team Name"),
      size: 150,
      enableSorting: false,
      cell: ({ row }) => {
        const value = row.original.team_alias;
        if (!value) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <span className="block max-w-60 truncate font-medium" title={value}>
            {value}
          </span>
        );
      },
    },
    {
      id: "team_id",
      accessorKey: "team_id",
      meta: { title: t("teams:deleted_teams.columns.team_id", "Team ID") },
      header: t("teams:deleted_teams.columns.team_id", "Team ID"),
      size: 150,
      enableSorting: false,
      cell: ({ row }) => <IdCell value={row.original.team_id} variant="plain" />,
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      meta: { title: t("teams:deleted_teams.columns.created", "Created") },
      header: ({ column }) => <DataTableSortHeader column={column} title={t("teams:deleted_teams.columns.created", "Created")} />,
      size: 120,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
    },
    {
      id: "spend",
      accessorKey: "spend",
      meta: { title: t("teams:deleted_teams.columns.spend", "Spend (USD)"), numeric: true },
      header: ({ column }) => <DataTableSortHeader column={column} title={t("teams:deleted_teams.columns.spend", "Spend (USD)")} />,
      size: 100,
      enableSorting: true,
      cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
    },
    {
      id: "max_budget",
      accessorKey: "max_budget",
      meta: { title: t("teams:deleted_teams.columns.budget", "Budget (USD)"), numeric: true },
      header: t("teams:deleted_teams.columns.budget", "Budget (USD)"),
      size: 110,
      enableSorting: false,
      cell: ({ row }) => <MoneyCell value={row.original.max_budget} decimals={0} emptyText={t("common:unlimited", "Unlimited")} showZero />,
    },
    {
      id: "models",
      accessorKey: "models",
      meta: { title: t("teams:deleted_teams.columns.models", "Models"), skeleton: "chips" },
      header: t("teams:deleted_teams.columns.models", "Models"),
      size: 200,
      enableSorting: false,
      cell: ({ row }) => <ModelsCell models={row.original.models} />,
    },
    {
      id: "organization_id",
      accessorKey: "organization_id",
      meta: { title: t("teams:deleted_teams.columns.organization", "Organization") },
      header: t("teams:deleted_teams.columns.organization", "Organization"),
      size: 150,
      enableSorting: false,
      cell: ({ row }) => <IdCell value={row.original.organization_id} variant="plain" />,
    },
    {
      id: "deleted_at",
      accessorKey: "deleted_at",
      meta: { title: t("teams:deleted_teams.columns.deleted_at", "Deleted At") },
      header: ({ column }) => <DataTableSortHeader column={column} title={t("teams:deleted_teams.columns.deleted_at", "Deleted At")} />,
      size: 120,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.deleted_at} precision="date" />,
    },
    {
      id: "deleted_by",
      accessorKey: "deleted_by",
      meta: { title: t("teams:deleted_teams.columns.deleted_by", "Deleted By") },
      header: t("teams:deleted_teams.columns.deleted_by", "Deleted By"),
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const value = row.original.deleted_by;
        if (!value) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <span className="block max-w-60 truncate" title={value}>
            {value}
          </span>
        );
      },
    },
  ];
