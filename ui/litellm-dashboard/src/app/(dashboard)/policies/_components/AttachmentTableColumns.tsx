"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdCell, StatusBadge } from "@/components/shared/table_cells";
import { PolicyAttachment } from "@/components/policies/types";
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

import ImpactPopover from "./impact_popover";

function ChipList({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.slice(0, 2).map((value) => (
        <StatusBadge key={value} tone="neutral" label={value} />
      ))}
      {values.length > 2 && (
        <StatusBadge tone="neutral" label={`+${values.length - 2}`} tooltip={values.slice(2).join(", ")} />
      )}
    </div>
  );
}

interface AttachmentRowActionsProps {
  attachment: PolicyAttachment;
  isAdmin: boolean;
  onDeleteClick: (attachmentId: string) => void;
  t?: (key: any, options?: any) => any;
}

const CONFIG_ATTACHMENT_HINT =
  "Config attachments are defined in the config file and cannot be deleted from the dashboard.";

function AttachmentRowActions({ attachment, isAdmin, onDeleteClick, t }: AttachmentRowActionsProps) {
  const tr = t ?? ((key: any, options?: any) => options?.defaultValue ?? key);
  const isConfigAttachment = attachment.definition_location === "config";
  const configHint = tr("policies:columns.config_attachment_hint", { defaultValue: CONFIG_ATTACHMENT_HINT });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open attachment actions"
        data-testid={`attachment-actions-${attachment.attachment_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid="attachment-action-copy-id"
          onClick={() => void copyToClipboard(attachment.attachment_id, tr("policies:columns.attachment_id_copied", { defaultValue: "Attachment ID copied" }))}
        >
          <Copy />
          {tr("policies:columns.copy_attachment_id", { defaultValue: "Copy attachment ID" })}
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="attachment-action-delete"
              disabled={isConfigAttachment}
              title={isConfigAttachment ? configHint : undefined}
              onClick={() => onDeleteClick(attachment.attachment_id)}
            >
              <Trash2 />
              {tr("policies:columns.delete_attachment", { defaultValue: "Delete attachment" })}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AttachmentTableColumnsDeps {
  isAdmin: boolean;
  accessToken: string | null;
  onDeleteClick: (attachmentId: string) => void;
  t?: (key: any, options?: any) => any;
}

export const getAttachmentTableColumns = ({
  isAdmin,
  accessToken,
  onDeleteClick,
  t,
}: AttachmentTableColumnsDeps): ColumnDef<PolicyAttachment>[] => {
  const tr = t ?? ((key: any, options?: any) => options?.defaultValue ?? key);

  return [
    {
      id: "attachment_id",
      accessorKey: "attachment_id",
      meta: { title: tr("policies:columns.attachment_id", { defaultValue: "Attachment ID" }) },
      header: tr("policies:columns.attachment_id", { defaultValue: "Attachment ID" }),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => <IdCell value={row.original.attachment_id} variant="plain" />,
    },
    {
      id: "policy_name",
      accessorKey: "policy_name",
      meta: { title: tr("policies:columns.policy", { defaultValue: "Policy" }), skeleton: "badge" },
      header: ({ column }) => <DataTableSortHeader column={column} title={tr("policies:columns.policy", { defaultValue: "Policy" })} />,
      size: 180,
      enableSorting: true,
      cell: ({ row }) => <StatusBadge tone="info" label={row.original.policy_name} />,
    },
    {
      id: "scope",
      accessorFn: (row) => row.scope ?? "",
      meta: { title: tr("policies:columns.scope", { defaultValue: "Scope" }), skeleton: "badge" },
      header: tr("policies:columns.scope", { defaultValue: "Scope" }),
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const scope = row.original.scope;
        if (!scope) {
          return <span className="text-muted-foreground">-</span>;
        }
        if (scope === "*") {
          return <StatusBadge tone="warning" label={tr("policies:columns.global_scope", { defaultValue: "Global (*)" })} />;
        }
        return (
          <span className="block max-w-40 truncate text-xs" title={scope}>
            {scope}
          </span>
        );
      },
    },
    {
      id: "teams",
      meta: { title: tr("policies:columns.teams", { defaultValue: "Teams" }), skeleton: "chips" },
      header: tr("policies:columns.teams", { defaultValue: "Teams" }),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => <ChipList values={row.original.teams ?? []} />,
    },
    {
      id: "keys",
      meta: { title: tr("policies:columns.keys", { defaultValue: "Keys" }), skeleton: "chips" },
      header: tr("policies:columns.keys", { defaultValue: "Keys" }),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => <ChipList values={row.original.keys ?? []} />,
    },
    {
      id: "models",
      meta: { title: tr("policies:columns.models", { defaultValue: "Models" }), skeleton: "chips" },
      header: tr("policies:columns.models", { defaultValue: "Models" }),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => <ChipList values={row.original.models ?? []} />,
    },
    {
      id: "tags",
      meta: { title: tr("policies:columns.tags", { defaultValue: "Tags" }), skeleton: "chips" },
      header: tr("policies:columns.tags", { defaultValue: "Tags" }),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => <ChipList values={row.original.tags ?? []} />,
    },
    {
      id: "created_at",
      accessorFn: (row) => row.created_at ?? "",
      meta: { title: tr("policies:columns.created_at", { defaultValue: "Created At" }) },
      header: ({ column }) => <DataTableSortHeader column={column} title={tr("policies:columns.created_at", { defaultValue: "Created At" })} />,
      size: 150,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
    {
      id: "actions",
      meta: { className: "text-right", headerClassName: "text-right" },
      header: () => <span className="sr-only">{tr("policies:columns.actions", { defaultValue: "Actions" })}</span>,
      size: 88,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <ImpactPopover attachment={row.original} accessToken={accessToken} />
          <AttachmentRowActions attachment={row.original} isAdmin={isAdmin} onDeleteClick={onDeleteClick} t={tr} />
        </div>
      ),
    },
  ];
};
