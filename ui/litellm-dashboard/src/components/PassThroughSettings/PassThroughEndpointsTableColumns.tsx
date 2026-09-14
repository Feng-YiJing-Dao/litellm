"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, EyeOff, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import React, { useState } from "react";

import { CellTooltip, IdentityCell, StatusBadge } from "@/components/shared/table_cells";
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

import type { passThroughItem } from "./PassThroughSettings";

const CONFIG_ENDPOINT_HINT =
  "This endpoint is defined in the config file and cannot be edited or deleted on the dashboard.";

function HeaderWithTooltip({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-1">
      <span>{title}</span>
      <CellTooltip content={tooltip} trigger={<Info className="size-3.5 cursor-help text-muted-foreground" />} />
    </div>
  );
}

function HeadersCell({ value, t }: { value: object; t?: (key: any, options?: any) => any }) {
  const [showHeaders, setShowHeaders] = useState(false);
  const headerString = JSON.stringify(value);

  return (
    <div className="flex items-center gap-2">
      <span className="block max-w-60 truncate font-mono text-xs">{showHeaders ? headerString : "••••••••"}</span>
      <button
        type="button"
        onClick={() => setShowHeaders(!showHeaders)}
        aria-label={
          showHeaders
            ? t
              ? t("models:passthrough.hide_headers", { defaultValue: "Hide headers" })
              : "Hide headers"
            : t
              ? t("models:passthrough.show_headers", { defaultValue: "Show headers" })
              : "Show headers"
        }
        className="rounded-sm p-1 hover:bg-muted"
      >
        {showHeaders ? (
          <EyeOff className="size-4 text-muted-foreground" />
        ) : (
          <Eye className="size-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function MethodsCell({
  methods,
  t,
}: {
  methods: string[] | undefined;
  t?: (key: any, options?: any) => any;
}) {
  if (!methods || methods.length === 0) {
    return (
      <Badge variant="secondary">
        {t ? t("models:passthrough.table.all_methods", { defaultValue: "ALL" }) : "ALL"}
      </Badge>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((method) => (
        <Badge key={method} variant="outline" className="font-mono text-xs font-normal">
          {method}
        </Badge>
      ))}
    </div>
  );
}

interface EndpointRowActionsProps {
  endpoint: passThroughItem;
  onEndpointClick: (endpointId: string) => void;
  onDeleteClick: (endpointId: string) => void;
  t?: (key: any, options?: any) => any;
}

function EndpointRowActions({ endpoint, onEndpointClick, onDeleteClick, t }: EndpointRowActionsProps) {
  const endpointId = endpoint.id;
  const isFromConfig = endpoint.is_from_config ?? false;
  const configHint = t
    ? t("models:passthrough.config_endpoint_hint", { defaultValue: CONFIG_ENDPOINT_HINT })
    : CONFIG_ENDPOINT_HINT;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={
          t
            ? t("models:passthrough.open_endpoint_actions", { defaultValue: "Open endpoint actions" })
            : "Open endpoint actions"
        }
        data-testid={`endpoint-actions-${endpointId || endpoint.path}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="endpoint-action-edit"
          disabled={isFromConfig || !endpointId}
          onClick={() => !isFromConfig && endpointId && onEndpointClick(endpointId)}
        >
          <Pencil />
          {t ? t("models:passthrough.edit", { defaultValue: "Edit" }) : "Edit"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          data-testid="endpoint-action-delete"
          disabled={isFromConfig || !endpointId}
          onClick={() => !isFromConfig && endpointId && onDeleteClick(endpointId)}
        >
          <Trash2 />
          {t ? t("models:passthrough.delete", { defaultValue: "Delete" }) : "Delete"}
        </DropdownMenuItem>
        {isFromConfig && (
          <div data-testid="endpoint-config-hint" className="px-2 py-1.5 text-xs text-muted-foreground">
            {configHint}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PassThroughEndpointsTableColumnsDeps {
  onEndpointClick: (endpointId: string) => void;
  onDeleteClick: (endpointId: string) => void;
  t?: (key: any, options?: any) => any;
}

export const getPassThroughEndpointsTableColumns = ({
  onEndpointClick,
  onDeleteClick,
  t,
}: PassThroughEndpointsTableColumnsDeps): ColumnDef<passThroughItem>[] => {
  const tr = (key: string, def: string, opts?: any) => (t ? t(key, { defaultValue: def, ...opts }) : def);
  return [
    {
      id: "id",
      accessorKey: "id",
      meta: { title: "ID" },
      header: "ID",
      size: 190,
      enableSorting: false,
      cell: ({ row }) => {
        const endpointId = row.original.id;
        if (!endpointId || row.original.is_from_config) {
          return <span className="font-mono text-xs text-muted-foreground">—</span>;
        }
        return (
          <IdentityCell
            title={endpointId}
            titleClassName="font-mono text-xs font-normal"
            onClick={() => onEndpointClick(endpointId)}
          />
        );
      },
    },
    {
      id: "source",
      meta: { title: tr("models:passthrough.table.col_source", "Source"), skeleton: "badge" },
      header: tr("models:passthrough.table.col_source", "Source"),
      size: 100,
      enableSorting: false,
      cell: ({ row }) => {
        const isFromConfig = row.original.is_from_config ?? false;
        return (
          <StatusBadge
            tone={isFromConfig ? "neutral" : "info"}
            label={
              isFromConfig
                ? tr("models:passthrough.table.source_config", "Config")
                : tr("models:passthrough.table.source_db", "DB")
            }
          />
        );
      },
    },
    {
      id: "path",
      accessorKey: "path",
      meta: { title: tr("models:passthrough.table.col_path", "Path Prefix") },
      header: tr("models:passthrough.table.col_path", "Path Prefix"),
      size: 200,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-60 truncate text-sm font-medium" title={row.original.path}>
          {row.original.path}
        </span>
      ),
    },
    {
      id: "target",
      accessorKey: "target",
      meta: { title: tr("models:passthrough.table.col_target", "Target URL") },
      header: tr("models:passthrough.table.col_target", "Target URL"),
      size: 240,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-72 truncate text-sm" title={row.original.target}>
          {row.original.target}
        </span>
      ),
    },
    {
      id: "methods",
      meta: { title: tr("models:passthrough.table.col_methods", "Methods"), skeleton: "chips" },
      header: () => (
        <HeaderWithTooltip
          title={tr("models:passthrough.table.col_methods", "Methods")}
          tooltip={tr("models:passthrough.methods_hint", "HTTP methods supported by this endpoint")}
        />
      ),
      size: 150,
      enableSorting: false,
      cell: ({ row }) => <MethodsCell methods={row.original.methods} t={t} />,
    },
    {
      id: "auth",
      accessorKey: "auth",
      meta: { title: tr("models:passthrough.table.col_auth", "Authentication"), skeleton: "badge" },
      header: () => (
        <HeaderWithTooltip
          title={tr("models:passthrough.table.col_auth", "Authentication")}
          tooltip={tr("models:passthrough.security_desc", "LiteLLM Virtual Key required to call endpoint")}
        />
      ),
      size: 140,
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge
          tone={row.original.auth ? "success" : "neutral"}
          label={
            row.original.auth
              ? tr("models:passthrough.table.yes", "Yes")
              : tr("models:passthrough.table.no", "No")
          }
        />
      ),
    },
    {
      id: "headers",
      meta: { title: tr("models:passthrough.table.col_headers", "Headers") },
      header: tr("models:passthrough.table.col_headers", "Headers"),
      size: 180,
      enableSorting: false,
      cell: ({ row }) => <HeadersCell value={row.original.headers || {}} t={t} />,
    },
    {
      id: "actions",
      meta: { className: "text-right", headerClassName: "text-right" },
      header: () => <span className="sr-only">{tr("models:passthrough.table.actions", "Actions")}</span>,
      size: 64,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <EndpointRowActions
            endpoint={row.original}
            onEndpointClick={onEndpointClick}
            onDeleteClick={onDeleteClick}
            t={t}
          />
        </div>
      ),
    },
  ];
};
