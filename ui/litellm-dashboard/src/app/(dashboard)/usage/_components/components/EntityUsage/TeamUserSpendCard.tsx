import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import React, { useMemo } from "react";

import { teamSpendByUserCall } from "@/components/networking";
import { DataTable } from "@/components/shared/DataTable";
import { MoneyCell } from "@/components/shared/table_cells";
import { Button } from "@/components/ui/button";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";

import { useTranslation } from "react-i18next";

import {
  buildTeamUserSpendCsv,
  downloadCsv,
  sortBySpendDesc,
  teamLabel,
  teamUserSpendCsvFileName,
  teamUserSpendRowId,
  userLabel,
  type TeamUserSpendRow,
} from "./teamUserSpend";

interface TeamUserSpendCardProps {
  accessToken: string | null;
  startTime: Date | null;
  endTime: Date | null;
  teamIds: string[];
}

const TeamUserSpendCard: React.FC<TeamUserSpendCardProps> = ({ accessToken, startTime, endTime, teamIds }) => {
  const { t } = useTranslation(["usage", "common"]);

  const columns: ColumnDef<TeamUserSpendRow>[] = useMemo(
    () => [
      { header: t("usage:team", "Team"), accessorFn: teamLabel, id: "team", cell: ({ row }) => teamLabel(row.original) },
      { header: t("usage:user", "User"), accessorFn: userLabel, id: "user", cell: ({ row }) => userLabel(row.original) },
      {
        header: t("usage:spend", "Spend"),
        accessorKey: "spend",
        meta: { numeric: true },
        cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={4} />,
      },
      {
        header: t("usage:requests", "Requests"),
        accessorKey: "api_requests",
        meta: { numeric: true },
        cell: ({ row }) => row.original.api_requests.toLocaleString(),
      },
      {
        header: t("usage:successful", "Successful"),
        accessorKey: "successful_requests",
        meta: { numeric: true, className: "text-success" },
        cell: ({ row }) => row.original.successful_requests.toLocaleString(),
      },
      {
        header: t("usage:failed", "Failed"),
        accessorKey: "failed_requests",
        meta: { numeric: true, className: "text-destructive" },
        cell: ({ row }) => row.original.failed_requests.toLocaleString(),
      },
      {
        header: t("usage:tokens", "Tokens"),
        accessorKey: "total_tokens",
        meta: { numeric: true },
        cell: ({ row }) => row.original.total_tokens.toLocaleString(),
      },
    ],
    [t],
  );

  const hasTeams = teamIds.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["teamSpendByUser", startTime?.toISOString(), endTime?.toISOString(), teamIds],
    queryFn: () =>
      accessToken && startTime && endTime ? teamSpendByUserCall(accessToken, startTime, endTime, teamIds) : null,
    enabled: Boolean(accessToken && startTime && endTime) && hasTeams,
  });
  const rows = useMemo(() => sortBySpendDesc(data?.results ?? []), [data]);

  return (
    <ShadcnCard>
      <CardContent className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {t("usage:spend_per_user_within_team", "Spend Per User Within Team")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t(
                "usage:spend_per_user_within_team_desc",
                "Attributed per request from spend logs, so it includes JWT/SSO traffic that does not use a virtual key",
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || rows.length === 0}
            onClick={() => data && downloadCsv(buildTeamUserSpendCsv(data), teamUserSpendCsvFileName(data))}
          >
            <Download />
            {t("common:download_csv", "Download CSV")}
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={teamUserSpendRowId}
          isLoading={isLoading}
          maxBodyHeight={320}
          noDataMessage={
            teamIds.length === 0
              ? t("usage:select_team_spend", "Select a team to see spend per user")
              : t("usage:no_user_spend", "No user spend in this range")
          }
          size="compact"
        />
      </CardContent>
    </ShadcnCard>
  );
};

export default TeamUserSpendCard;
