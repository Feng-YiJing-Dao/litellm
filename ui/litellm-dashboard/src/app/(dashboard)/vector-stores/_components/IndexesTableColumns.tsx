"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell } from "@/components/shared/table_cells";
import { userDetailHref } from "@/utils/entityLinks";

import type { VectorStoreIndex } from "./IndexesTab";

import type { TFunction } from "i18next";

interface IndexesTableColumnsDeps {
  resolveVectorStoreId: (name: string) => string | undefined;
  onViewVectorStore: (vectorStoreId: string) => void;
  t?: (key: any, options?: any) => any;
}

export const getIndexesTableColumns = ({
  resolveVectorStoreId,
  onViewVectorStore,
  t,
}: IndexesTableColumnsDeps): ColumnDef<VectorStoreIndex>[] => {
  const tr = (key: string, def: string) => (t ? t(key, def) : def);

  return [
    {
      id: "index_name",
      accessorKey: "index_name",
      meta: { title: tr("tools:vector_stores.indexes.columns.index_name", "Index Name") },
      header: ({ column }) => (
        <DataTableSortHeader
          column={column}
          title={tr("tools:vector_stores.indexes.columns.index_name", "Index Name")}
        />
      ),
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="block max-w-60 truncate text-sm font-medium" title={row.original.index_name}>
          {row.original.index_name || "-"}
        </span>
      ),
    },
    {
      id: "vector_store_name",
      accessorFn: (row) => row.litellm_params.vector_store_name,
      meta: { title: tr("tools:vector_stores.indexes.columns.vector_store", "Vector Store") },
      header: ({ column }) => (
        <DataTableSortHeader
          column={column}
          title={tr("tools:vector_stores.indexes.columns.vector_store", "Vector Store")}
        />
      ),
      size: 200,
      enableSorting: true,
      cell: ({ row }) => {
        const name = row.original.litellm_params.vector_store_name;
        const vectorStoreId = name ? resolveVectorStoreId(name) : undefined;
        if (vectorStoreId) {
          return (
            <IdentityCell
              title={name}
              titleClassName="font-normal"
              className="max-w-60"
              onClick={() => onViewVectorStore(vectorStoreId)}
            />
          );
        }
        return (
          <span className="block max-w-60 truncate text-sm" title={name}>
            {name || "-"}
          </span>
        );
      },
    },
    {
      id: "vector_store_index",
      accessorFn: (row) => row.litellm_params.vector_store_index,
      meta: { title: tr("tools:vector_stores.indexes.columns.provider_index", "Provider Index") },
      header: tr("tools:vector_stores.indexes.columns.provider_index", "Provider Index"),
      size: 220,
      enableSorting: false,
      cell: ({ row }) => (
        <span
          className="block max-w-60 truncate font-mono text-xs"
          title={row.original.litellm_params.vector_store_index}
        >
          {row.original.litellm_params.vector_store_index || "-"}
        </span>
      ),
    },
    {
      id: "created_by",
      accessorKey: "created_by",
      meta: { title: tr("tools:vector_stores.indexes.columns.created_by", "Created By") },
      header: tr("tools:vector_stores.indexes.columns.created_by", "Created By"),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => {
        const createdBy = row.original.created_by;
        if (createdBy) {
          return (
            <IdentityCell
              title={createdBy}
              titleClassName="font-normal"
              className="max-w-48"
              href={userDetailHref(createdBy)}
            />
          );
        }
        return <span className="block max-w-48 truncate text-sm">-</span>;
      },
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      sortingFn: "datetime",
      meta: { title: tr("tools:vector_stores.indexes.columns.created_at", "Created At") },
      header: ({ column }) => (
        <DataTableSortHeader
          column={column}
          title={tr("tools:vector_stores.indexes.columns.created_at", "Created At")}
        />
      ),
      size: 150,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
    },
  ];
};
