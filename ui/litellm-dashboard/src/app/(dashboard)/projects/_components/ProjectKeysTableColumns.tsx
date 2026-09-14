"use client";

import { ColumnDef } from "@tanstack/react-table";

import DefaultProxyAdminTag from "@/components/common_components/DefaultProxyAdminTag";
import { KeyResponse } from "@/components/key_team_helpers/key_list";
import { CellTooltip, DateCell, IdentityCell } from "@/components/shared/table_cells";
import { keyDetailHref } from "@/utils/entityLinks";

function OwnerCell({ record }: { record: KeyResponse }) {
  const email = record.user?.user_email ?? record.user_id ?? null;
  if (!email) return <span className="text-sm">—</span>;
  return (
    <CellTooltip
      content={email}
      trigger={
        <span className="inline-flex max-w-60 truncate">
          <DefaultProxyAdminTag userId={email} />
        </span>
      }
    />
  );
}

export const getProjectKeysTableColumns = (
  t?: (key: any, options?: any) => any
): ColumnDef<KeyResponse>[] => {
  const tr = t ?? ((key: any, options?: any) => options?.defaultValue ?? key);
  return [
    {
      id: "key_alias",
      accessorKey: "key_alias",
      meta: { title: tr("common:table.key_name", { defaultValue: "Key Name" }) },
      header: tr("common:table.key_name", { defaultValue: "Key Name" }),
      enableSorting: false,
      cell: ({ row }) => (
        <IdentityCell
          title={<span title={row.original.key_alias ?? undefined}>{row.original.key_alias || "—"}</span>}
          href={row.original.token ? keyDetailHref(row.original.token) : undefined}
          className="max-w-60"
        />
      ),
    },
    {
      id: "owner",
      meta: { title: tr("common:table.owner", { defaultValue: "Owner" }) },
      header: tr("common:table.owner", { defaultValue: "Owner" }),
      enableSorting: false,
      cell: ({ row }) => <OwnerCell record={row.original} />,
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      meta: { title: tr("common:table.created", { defaultValue: "Created" }) },
      header: tr("common:table.created", { defaultValue: "Created" }),
      size: 130,
      enableSorting: false,
      cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
    },
    {
      id: "last_active",
      accessorKey: "last_active",
      meta: { title: tr("common:table.last_active", { defaultValue: "Last Active" }) },
      header: tr("common:table.last_active", { defaultValue: "Last Active" }),
      size: 130,
      enableSorting: false,
      cell: ({ row }) => (
        <DateCell
          value={row.original.last_active}
          precision="date"
          fallback={tr("common:never", { defaultValue: "Never" })}
        />
      ),
    },
  ];
};
