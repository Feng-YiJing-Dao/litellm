"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Agent } from "@/components/agents/types";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { DateCell, IdentityCell, MoneyCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

interface AgentRowActionsProps {
  agent: Agent;
  onDeleteClick: (agentId: string, agentName: string) => void;
  translate?: (key: string, options?: any) => string;
}

function AgentRowActions({ agent, onDeleteClick, translate }: AgentRowActionsProps) {
  const deleteLabel = translate ? translate("common:delete", { defaultValue: "Delete" }) : "Delete";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open agent actions"
        data-testid={`agent-actions-${agent.agent_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          variant="destructive"
          data-testid="agent-action-delete"
          onClick={() => onDeleteClick(agent.agent_id, agent.agent_name)}
        >
          <Trash2 />
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AgentsTableColumnsDeps {
  isAdmin: boolean;
  onAgentClick: (agentId: string) => void;
  onDeleteClick: (agentId: string, agentName: string) => void;
  t?: (key: any, options?: any) => any;
}

export const getAgentsTableColumns = ({
  isAdmin,
  onAgentClick,
  onDeleteClick,
  t,
}: AgentsTableColumnsDeps): ColumnDef<Agent>[] => {
  const translate = t || ((_k: string, opts?: any) => (typeof opts === "string" ? opts : opts?.defaultValue || _k));
  return [
  {
    id: "agent_name",
    accessorKey: "agent_name",
    meta: { title: translate("agents:columns.agent_name", { defaultValue: "Agent Name" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={translate("agents:columns.agent_name", { defaultValue: "Agent Name" })}
      />
    ),
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.original.agent_name;
      return (
        <span className="block max-w-52 truncate text-sm font-medium text-foreground" title={name || undefined}>
          {name || "-"}
        </span>
      );
    },
  },
  {
    id: "agent_id",
    accessorKey: "agent_id",
    meta: { title: translate("agents:columns.agent_id", { defaultValue: "Agent ID" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={translate("agents:columns.agent_id", { defaultValue: "Agent ID" })}
      />
    ),
    size: 200,
    enableSorting: true,
    cell: ({ row }) => (
      <IdentityCell
        title={row.original.agent_id}
        titleClassName="font-mono text-xs font-normal"
        onClick={() => onAgentClick(row.original.agent_id)}
      />
    ),
  },
  {
    id: "spend",
    accessorKey: "spend",
    meta: { title: translate("agents:columns.spend", { defaultValue: "Spend (USD)" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={translate("agents:columns.spend", { defaultValue: "Spend (USD)" })}
      />
    ),
    size: 130,
    enableSorting: true,
    cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
  },
  {
    id: "model",
    meta: { title: translate("agents:columns.model", { defaultValue: "Model" }) },
    header: translate("agents:columns.model", { defaultValue: "Model" }),
    size: 170,
    enableSorting: false,
    cell: ({ row }) => {
      const model = row.original.litellm_params?.model;
      if (!model) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      return (
        <Badge variant="outline" className="max-w-40 font-normal">
          <span className="min-w-0 truncate" title={model}>
            {model}
          </span>
        </Badge>
      );
    },
  },
  {
    id: "created_at",
    accessorFn: (agent) => {
      const timestamp = agent.created_at ? new Date(agent.created_at).getTime() : 0;
      return Number.isNaN(timestamp) ? 0 : timestamp;
    },
    meta: { title: translate("agents:columns.created_at", { defaultValue: "Created" }) },
    header: ({ column }) => (
      <DataTableSortHeader
        column={column}
        title={translate("agents:columns.created_at", { defaultValue: "Created" })}
      />
    ),
    size: 150,
    enableSorting: true,
    cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
  },
  {
    id: "status",
    meta: { title: translate("agents:columns.status", { defaultValue: "Status" }) },
    header: translate("agents:columns.status", { defaultValue: "Status" }),
    size: 130,
    enableSorting: false,
    cell: ({ row }) => {
      const hasKeys = (row.original.keys?.length ?? 0) > 0;
      return hasKeys ? (
        <StatusBadge tone="success" label={translate("agents:status_active", { defaultValue: "Active" })} />
      ) : (
        <StatusBadge tone="warning" label={translate("agents:status_needs_setup", { defaultValue: "Needs Setup" })} />
      );
    },
  },
  ...(isAdmin
    ? [
        {
          id: "actions",
          meta: { className: "text-right", headerClassName: "text-right" },
          header: () => (
            <span className="sr-only">
              {translate("agents:columns.actions", { defaultValue: "Actions" })}
            </span>
          ),
          size: 64,
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <AgentRowActions agent={row.original} onDeleteClick={onDeleteClick} translate={translate} />
            </div>
          ),
        } satisfies ColumnDef<Agent>,
      ]
    : []),
];
};
