"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { MemoryRow } from "@/components/networking";
import { DateCell, IdCell, IdentityCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

interface MemoryRowActionsProps {
  row: MemoryRow;
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
}

interface MemoryRowActionsProps {
  row: MemoryRow;
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
  translate?: (key: string, options?: any) => string;
}

function MemoryRowActions({ row, onViewClick, onEditClick, onDeleteClick, translate }: MemoryRowActionsProps) {
  const viewLabel = translate ? translate("common:view", { defaultValue: "View" }) : "View";
  const editLabel = translate ? translate("common:edit", { defaultValue: "Edit" }) : "Edit";
  const deleteLabel = translate ? translate("common:delete", { defaultValue: "Delete" }) : "Delete";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open memory actions"
        data-testid={`memory-actions-${row.memory_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem data-testid="memory-action-view" onClick={() => onViewClick(row)}>
          <Eye />
          {viewLabel}
        </DropdownMenuItem>
        <DropdownMenuItem data-testid="memory-action-edit" onClick={() => onEditClick(row)}>
          <Pencil />
          {editLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" data-testid="memory-action-delete" onClick={() => onDeleteClick(row)}>
          <Trash2 />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface MemoryTableColumnsDeps {
  onViewClick: (row: MemoryRow) => void;
  onEditClick: (row: MemoryRow) => void;
  onDeleteClick: (row: MemoryRow) => void;
  t?: (key: any, options?: any) => any;
}

export const getMemoryTableColumns = ({
  onViewClick,
  onEditClick,
  onDeleteClick,
  t,
}: MemoryTableColumnsDeps): ColumnDef<MemoryRow>[] => {
  const translate = t || ((_k: string, opts?: any) => (typeof opts === "string" ? opts : opts?.defaultValue || _k));
  return [
  {
    id: "memory_id",
    accessorKey: "memory_id",
    meta: { title: translate("memory:columns.id", { defaultValue: "ID" }) },
    header: translate("memory:columns.id", { defaultValue: "ID" }),
    size: 180,
    enableSorting: false,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.memory_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onViewClick(row.original)}
      />
    ),
  },
  {
    id: "key",
    accessorKey: "key",
    meta: { title: translate("memory:columns.name", { defaultValue: "Name" }) },
    header: translate("memory:columns.name", { defaultValue: "Name" }),
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-52 truncate font-mono text-xs" title={row.original.key}>
        {row.original.key}
      </span>
    ),
  },
  {
    id: "value",
    accessorKey: "value",
    meta: { title: translate("memory:columns.preview", { defaultValue: "Preview" }) },
    header: translate("memory:columns.preview", { defaultValue: "Preview" }),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="block max-w-72 truncate text-sm text-muted-foreground" title={row.original.value}>
        {row.original.value || "-"}
      </span>
    ),
  },
  {
    id: "user_id",
    accessorKey: "user_id",
    meta: { title: translate("memory:columns.user_id", { defaultValue: "User ID" }) },
    header: translate("memory:columns.user_id", { defaultValue: "User ID" }),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.user_id} />,
  },
  {
    id: "team_id",
    accessorKey: "team_id",
    meta: { title: translate("memory:columns.team_id", { defaultValue: "Team ID" }) },
    header: translate("memory:columns.team_id", { defaultValue: "Team ID" }),
    size: 160,
    enableSorting: false,
    cell: ({ row }) => <IdCell value={row.original.team_id} />,
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    meta: { title: translate("memory:columns.updated", { defaultValue: "Updated" }) },
    header: translate("memory:columns.updated", { defaultValue: "Updated" }),
    size: 170,
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.updated_at} />,
  },
  {
    id: "actions",
    meta: { className: "text-right", headerClassName: "text-right" },
    header: () => (
      <span className="sr-only">
        {translate("common:actions", { defaultValue: "Actions" })}
      </span>
    ),
    size: 64,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <MemoryRowActions
          row={row.original}
          onViewClick={onViewClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          translate={translate}
        />
      </div>
    ),
  },
];
};
