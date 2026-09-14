"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, UserPlus } from "lucide-react";

import { DataTableSortHeader } from "@/components/shared/DataTable";
import { IdentityCell, ModelsCell } from "@/components/shared/table_cells";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";

export interface AvailableTeam {
  team_id: string;
  team_alias: string;
  description?: string;
  models: string[];
  members_with_roles: { user_id?: string; user_email?: string; role: string }[];
}

function AvailableTeamRowActions({
  team,
  onJoinTeam,
  t,
}: {
  team: AvailableTeam;
  onJoinTeam: (teamId: string) => void;
  t?: (key: string, fallback: string) => string;
}) {
  const tr = t || ((_k: string, fb: string) => fb);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open team actions"
        data-testid={`available-team-actions-${team.team_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem data-testid="available-team-action-join" onClick={() => onJoinTeam(team.team_id)}>
          <UserPlus />
          {tr("teams:available_teams.join_team", "Join team")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AvailableTeamsTableColumnsDeps {
  onJoinTeam: (teamId: string) => void;
  t?: (key: string, fallback: string) => string;
}

export const getAvailableTeamsTableColumns = ({
  onJoinTeam,
  t,
}: AvailableTeamsTableColumnsDeps): ColumnDef<AvailableTeam>[] => {
  const tr = t || ((_k: string, fb: string) => fb);
  return [
    {
      id: "team_alias",
      accessorKey: "team_alias",
      meta: { title: tr("teams:team_name", "Team Name") },
      header: ({ column }) => <DataTableSortHeader column={column} title={tr("teams:team_name", "Team Name")} />,
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <IdentityCell title={row.original.team_alias} className="max-w-72" titleClassName="font-medium" />
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      meta: { title: tr("teams:description", "Description") },
      header: tr("teams:description", "Description"),
      size: 280,
      enableSorting: false,
      cell: ({ row }) => {
        const description = row.original.description;
        return (
          <span className="block max-w-72 truncate text-sm text-muted-foreground" title={description || undefined}>
            {description || tr("teams:available_teams.no_description", "No description available")}
          </span>
        );
      },
    },
    {
      id: "members",
      accessorFn: (team) => team.members_with_roles.length,
      meta: { title: tr("teams:members", "Members") },
      header: ({ column }) => <DataTableSortHeader column={column} title={tr("teams:members", "Members")} />,
      size: 120,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.members_with_roles.length} {tr("teams:members_count", "members")}
        </span>
      ),
    },
    {
      id: "models",
      meta: { title: tr("teams:models", "Models") },
      header: tr("teams:models", "Models"),
      size: 260,
      enableSorting: false,
      cell: ({ row }) => <ModelsCell models={row.original.models} />,
    },
    {
      id: "actions",
      meta: { className: "text-right", headerClassName: "text-right" },
      header: () => <span className="sr-only">{tr("common:actions", "Actions")}</span>,
      size: 64,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <AvailableTeamRowActions team={row.original} onJoinTeam={onJoinTeam} t={t} />
        </div>
      ),
    },
  ];
};
