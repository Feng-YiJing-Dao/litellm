"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DateCell, IdCell, IdentityCell, StatusBadge, type StatusTone } from "@/components/shared/table_cells";

import DefaultProxyAdminTag from "../common_components/DefaultProxyAdminTag";
import i18n from "@/locales";

const t = (key: string, defaultValue: string) => i18n.t(key, { defaultValue });

export type AuditLogEntry = {
  id: string;
  updated_at: string;
  changed_by: string;
  changed_by_api_key: string;
  action: string;
  table_name: string;
  object_id: string;
  before_value: Record<string, unknown>;
  updated_values: Record<string, unknown>;
};

export const AUDIT_TABLE_NAME_DISPLAY: Record<string, string> = {
  LiteLLM_VerificationToken: "Keys",
  LiteLLM_TeamTable: "Teams",
  LiteLLM_UserTable: "Users",
  LiteLLM_OrganizationTable: "Organizations",
  LiteLLM_ProxyModelTable: "Models",
};

const ACTION_TONE: Record<string, StatusTone> = {
  created: "success",
  updated: "info",
  deleted: "error",
  rotated: "warning",
};

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

interface AuditLogsTableColumnsDeps {
  onViewLog: (log: AuditLogEntry) => void;
}

export const getAuditLogsTableColumns = ({ onViewLog }: AuditLogsTableColumnsDeps): ColumnDef<AuditLogEntry>[] => [
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: t("logs:col_timestamp", "Timestamp"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "action",
    accessorKey: "action",
    header: t("logs:col_action", "Action"),
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge tone={ACTION_TONE[row.original.action] ?? "neutral"} label={capitalize(row.original.action)} />
    ),
  },
  {
    id: "table_name",
    accessorKey: "table_name",
    header: t("logs:col_table", "Table"),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm">{AUDIT_TABLE_NAME_DISPLAY[row.original.table_name] ?? row.original.table_name}</span>
    ),
  },
  {
    id: "object_id",
    accessorKey: "object_id",
    header: t("logs:col_object_id", "Object ID"),
    minSize: 220,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.object_id}
        titleClassName="font-mono text-xs font-normal text-primary"
        className="max-w-72"
        onClick={() => onViewLog(row.original)}
      />
    ),
  },
  {
    id: "changed_by",
    accessorKey: "changed_by",
    header: t("logs:col_changed_by", "Changed By"),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => <DefaultProxyAdminTag userId={row.original.changed_by} />,
  },
  {
    id: "changed_by_api_key",
    accessorKey: "changed_by_api_key",
    header: t("logs:col_api_key_hash", "API Key (Hash)"),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.changed_by_api_key} variant="plain" />,
  },
];
