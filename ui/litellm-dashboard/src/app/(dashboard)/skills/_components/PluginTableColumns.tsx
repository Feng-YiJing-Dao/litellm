"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
import { getCategoryBadgeColor } from "@/components/claude_code_plugins/helpers";
import { Plugin } from "@/components/claude_code_plugins/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const CATEGORY_BADGE_CLASS: Record<ReturnType<typeof getCategoryBadgeColor>, string> = {
  blue: "border-info/20 bg-info/10 text-info",
  green: "border-success/20 bg-success/10 text-success",
  purple:
    "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300",
  red: "border-destructive/20 bg-destructive/10 text-destructive",
  orange: "border-warning/20 bg-warning/10 text-warning",
  yellow: "border-warning/20 bg-warning/10 text-warning",
  gray: "border-border bg-muted text-muted-foreground",
};

function PluginCategoryBadge({ category, t }: { category?: string; t?: (key: any, options?: any) => any }) {
  const tr = t ?? ((key: any, options?: any) => options?.defaultValue ?? key);
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-normal", CATEGORY_BADGE_CLASS[getCategoryBadgeColor(category)])}
    >
      {category || tr("skills:columns.uncategorized", { defaultValue: "Uncategorized" })}
    </Badge>
  );
}

interface PluginRowActionsProps {
  plugin: Plugin;
  isAdmin: boolean;
  onDeleteClick: (pluginName: string, displayName: string) => void;
  t?: (key: any, options?: any) => any;
}

function PluginRowActions({ plugin, isAdmin, onDeleteClick, t }: PluginRowActionsProps) {
  const tr = t ?? ((key: any, options?: any) => options?.defaultValue ?? key);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open skill actions"
        data-testid={`plugin-actions-${plugin.name}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="plugin-action-copy"
          onClick={() => void copyToClipboard(plugin.id, tr("skills:columns.copied", { defaultValue: "Skill ID copied" }))}
        >
          <Copy />
          {tr("skills:columns.copy_id", { defaultValue: "Copy skill ID" })}
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="plugin-action-delete"
              onClick={() => onDeleteClick(plugin.name, plugin.name)}
            >
              <Trash2 />
              {tr("skills:columns.delete", { defaultValue: "Delete" })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PluginTableColumnsDeps {
  isAdmin: boolean;
  onPluginClick: (pluginId: string) => void;
  onDeleteClick: (pluginName: string, displayName: string) => void;
  t?: (key: any, options?: any) => any;
}

export const getPluginTableColumns = ({
  isAdmin,
  onPluginClick,
  onDeleteClick,
  t,
}: PluginTableColumnsDeps): ColumnDef<Plugin>[] => {
  const tr = t ?? ((key: any, options?: any) => options?.defaultValue ?? key);
  return [
    {
      id: "name",
      accessorKey: "name",
      meta: { title: tr("skills:columns.name", { defaultValue: "Skill Name" }) },
      header: ({ column }) => <DataTableSortHeader column={column} title={tr("skills:columns.name", { defaultValue: "Skill Name" })} />,
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <IdentityCell
          title={row.original.name}
          titleClassName="font-mono text-xs font-normal"
          className="max-w-60"
          onClick={() => onPluginClick(row.original.id)}
        />
      ),
    },
    {
      id: "version",
      accessorKey: "version",
      meta: { title: tr("skills:columns.version", { defaultValue: "Version" }) },
      header: tr("skills:columns.version", { defaultValue: "Version" }),
      size: 100,
      enableSorting: false,
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.version || "N/A"}</span>,
    },
    {
      id: "description",
      accessorKey: "description",
      meta: { title: tr("skills:columns.description", { defaultValue: "Description" }) },
      header: tr("skills:columns.description", { defaultValue: "Description" }),
      size: 300,
      enableSorting: false,
      cell: ({ row }) => {
        const description = row.original.description;
        return (
          <span className="block max-w-72 truncate text-sm text-muted-foreground" title={description}>
            {description || tr("skills:columns.no_description", { defaultValue: "No description" })}
          </span>
        );
      },
    },
    {
      id: "category",
      accessorKey: "category",
      meta: { title: tr("skills:columns.category", { defaultValue: "Category" }), skeleton: "badge" },
      header: tr("skills:columns.category", { defaultValue: "Category" }),
      size: 150,
      enableSorting: false,
      cell: ({ row }) => <PluginCategoryBadge category={row.original.category} t={tr} />,
    },
    {
      id: "enabled",
      accessorKey: "enabled",
      meta: { title: tr("skills:columns.public", { defaultValue: "Public" }), skeleton: "badge" },
      header: tr("skills:columns.public", { defaultValue: "Public" }),
      size: 100,
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge
          tone={row.original.enabled ? "success" : "neutral"}
          label={row.original.enabled ? tr("skills:columns.yes", { defaultValue: "Yes" }) : tr("skills:columns.no", { defaultValue: "No" })}
        />
      ),
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      sortingFn: "datetime",
      meta: { title: tr("skills:columns.created_at", { defaultValue: "Created At" }) },
      header: ({ column }) => <DataTableSortHeader column={column} title={tr("skills:columns.created_at", { defaultValue: "Created At" })} />,
      size: 160,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
    {
      id: "actions",
      meta: { className: "text-right", headerClassName: "text-right" },
      header: () => <span className="sr-only">{tr("skills:columns.actions", { defaultValue: "Actions" })}</span>,
      size: 64,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PluginRowActions plugin={row.original} isAdmin={isAdmin} onDeleteClick={onDeleteClick} t={tr} />
        </div>
      ),
    },
  ];
};
