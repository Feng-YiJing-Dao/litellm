"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Info, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";

import { ProviderLogo } from "@/components/molecules/models/ProviderLogo";
import { ModelData } from "@/components/model_dashboard/types";
import { DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, formatCellDate, IdCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Switch } from "@/components/ui/switch";
import { getDisplayModelName } from "@/components/view_model/model_name_display";
import { copyToClipboard } from "@/utils/dataUtils";
import i18n from "@/locales";

const t = (key: string, defaultValue: string) => i18n.t(key, { defaultValue });

export const MODEL_ID_COLUMN_ID = "model_info_id";
export const MODEL_NAME_COLUMN_ID = "model_name";
export const CREDENTIALS_COLUMN_ID = "litellm_credential_name";
export const CREATED_BY_COLUMN_ID = "model_info_created_by";
export const UPDATED_AT_COLUMN_ID = "model_info_updated_at";
export const COSTS_COLUMN_ID = "input_cost";
export const TEAM_ID_COLUMN_ID = "model_info_team_id";
export const ACCESS_GROUPS_COLUMN_ID = "model_info_access_groups";
export const STATUS_COLUMN_ID = "model_info_db_model";

const COLUMN_ID_TO_SERVER_SORT_FIELD: Record<string, string> = {
  [COSTS_COLUMN_ID]: "costs",
  [STATUS_COLUMN_ID]: "status",
  [CREATED_BY_COLUMN_ID]: "created_at",
  [UPDATED_AT_COLUMN_ID]: "updated_at",
};

export const toServerSortField = (columnId: string): string => COLUMN_ID_TO_SERVER_SORT_FIELD[columnId] ?? columnId;

const formatShortDate = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : formatCellDate(date, "date");
};

function ModelInformationCell({ model, displayName }: { model: ModelData; displayName: string }) {
  const litellmModelName = model.litellm_model_name || "-";

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <div className="flex min-w-0 items-center gap-2.5" data-testid={`model-information-${model.model_info.id}`} />
        }
      >
        {model.provider ? (
          <ProviderLogo provider={model.provider} className="size-6 shrink-0" />
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            -
          </span>
        )}
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="max-w-60 truncate text-sm font-medium text-foreground" title={displayName}>
            {displayName}
          </span>
          <span className="max-w-60 truncate font-mono text-xs text-muted-foreground" title={litellmModelName}>
            {litellmModelName}
          </span>
        </span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {model.provider ? <ProviderLogo provider={model.provider} className="size-4 shrink-0" /> : null}
            <span className="truncate text-xs text-muted-foreground">{model.provider || "Unknown provider"}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("models:public_model_name", "Public Model Name")}</span>
            <span className="truncate text-sm font-medium text-foreground" title={displayName}>
              {displayName}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("models:litellm_model_name", "LiteLLM Model Name")}</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-mono text-sm text-foreground" title={litellmModelName}>
                {litellmModelName}
              </span>
              <button
                type="button"
                aria-label={t("models:copy_litellm_model_name", "Copy LiteLLM model name")}
                data-testid={`copy-litellm-model-name-${model.model_info.id}`}
                className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => void copyToClipboard(litellmModelName, t("models:copied_litellm_model_name", "LiteLLM model name copied"))}
              >
                <Copy className="size-3.5" />
              </button>
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function CredentialsHeader() {
  return (
    <span className="flex items-center gap-1">
      {t("models:credentials", "Credentials")}
      <HoverCard>
        <HoverCardTrigger
          render={
            <button
              type="button"
              aria-label={t("models:about_credential_types", "About credential types")}
              data-testid="credentials-header-info"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            />
          }
        >
          <Info className="size-3.5" />
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-foreground">{t("models:credential_types", "Credential types")}</span>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-info">
                <RefreshCw className="size-3.5" />
                {t("models:reusable", "Reusable")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("models:reusable_credentials_desc", "Credentials saved in LiteLLM that can be added to models repeatedly.")}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Pencil className="size-3.5" />
                {t("models:manual", "Manual")}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("models:manual_credentials_desc", "Credentials added directly during model creation or defined in the config file.")}
              </span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </span>
  );
}

function CredentialsCell({ credentialName }: { credentialName: string | undefined }) {
  if (!credentialName) {
    return (
      <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
        <Pencil className="size-3" />
        {t("models:manual", "Manual")}
      </Badge>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-info" title={credentialName}>
      <RefreshCw className="size-3 shrink-0" />
      <span className="truncate">{credentialName}</span>
    </span>
  );
}

function CreatedByCell({ model }: { model: ModelData }) {
  const isConfigModel = !model.model_info?.db_model;
  const createdAt = formatShortDate(model.model_info.created_at);
  const primary = isConfigModel ? t("models:defined_in_config", "Defined in config") : model.model_info.created_by || t("common:unknown", "Unknown");
  const secondaryForDbModel = createdAt ?? t("common:unknown_date", "Unknown date");

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="max-w-44 truncate text-sm text-foreground" title={primary}>
        {primary}
      </span>
      <span className="truncate text-xs text-muted-foreground">{isConfigModel ? "-" : secondaryForDbModel}</span>
    </div>
  );
}

function CostsCell({ model }: { model: ModelData }) {
  const { input_cost: inputCost, output_cost: outputCost } = model;

  if (inputCost == null && outputCost == null) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <CellTooltip
      content={t("models:cost_per_1m", "Cost per 1M tokens")}
      trigger={
        <div className="flex flex-col gap-0.5 whitespace-nowrap">
          {inputCost != null && (
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">IN</span>
              <span className="text-xs font-medium tabular-nums text-foreground">${inputCost}</span>
            </span>
          )}
          {outputCost != null && (
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">OUT</span>
              <span className="text-xs font-medium tabular-nums text-foreground">${outputCost}</span>
            </span>
          )}
        </div>
      }
    />
  );
}

function AccessGroupsCell({ accessGroups }: { accessGroups: string[] | null }) {
  if (!accessGroups || accessGroups.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const [first, ...overflow] = accessGroups;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Badge variant="outline" className="max-w-36 truncate border-info/20 bg-info/10 font-normal text-info">
        {first}
      </Badge>
      {overflow.length > 0 && (
        <CellTooltip
          content={
            <div className="flex max-w-[280px] flex-col gap-0.5">
              {overflow.map((group) => (
                <span key={group}>{group}</span>
              ))}
            </div>
          }
          trigger={
            <Badge variant="outline" className="shrink-0 cursor-default font-normal">
              +{overflow.length} {t("common:more", "more")}
            </Badge>
          }
        />
      )}
    </div>
  );
}

interface ModelRowActionsProps {
  model: ModelData;
  userRole: string;
  userID: string;
  isPausing: boolean;
  onDeleteClick?: (modelId: string) => void;
  onTogglePauseClick?: (modelId: string, blocked: boolean) => void | Promise<void>;
}

function ModelRowActions({
  model,
  userRole,
  userID,
  isPausing,
  onDeleteClick,
  onTogglePauseClick,
}: ModelRowActionsProps) {
  const modelId = model.model_info?.id;
  const isConfigModel = !model.model_info?.db_model;
  const isAdmin = userRole === "Admin";
  const canEditModel = isAdmin || model.model_info?.created_by === userID;
  const isBlocked = model.model_info?.blocked === true;
  const isPauseToggleable = !isConfigModel && isAdmin && Boolean(onTogglePauseClick);

  const resolvePauseTooltip = (): string => {
    if (isConfigModel) {
      return t("models:pause_tooltip_config", "Config models cannot be paused from the dashboard. Pause is DB-backed.");
    }
    if (!isAdmin) {
      return t("models:pause_tooltip_admin_only", "Only proxy admins can pause or resume a model.");
    }
    return isBlocked
      ? t("models:pause_tooltip_resume", "Resume model — restore normal routing.")
      : t("models:pause_tooltip_pause", "Pause model — stop routing requests until resumed.");
  };

  const deleteTooltip = isConfigModel
    ? t("models:delete_tooltip_config", "Config model cannot be deleted on the dashboard. Please delete it from the config file.")
    : t("models:delete_model", "Delete model");

  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="flex w-8 shrink-0 items-center justify-center">
        {isPausing ? (
          <Loader2
            className="size-4 animate-spin text-muted-foreground"
            data-testid={`model-pause-pending-${modelId}`}
          />
        ) : (
          <CellTooltip
            content={resolvePauseTooltip()}
            trigger={
              <span className="inline-flex">
                <Switch
                  size="sm"
                  checked={!isBlocked}
                  disabled={!isPauseToggleable}
                  aria-label={isBlocked ? t("models:resume_model", "Resume model") : t("models:pause_model", "Pause model")}
                  data-testid={`model-pause-toggle-${modelId}`}
                  onCheckedChange={(nextChecked) => {
                    if (isPauseToggleable && onTogglePauseClick && modelId) {
                      void onTogglePauseClick(modelId, !nextChecked);
                    }
                  }}
                />
              </span>
            }
          />
        )}
      </span>
      <CellTooltip
        content={deleteTooltip}
        trigger={
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("models:delete_model", "Delete model")}
              data-testid={`model-delete-${modelId}`}
              disabled={isConfigModel || !canEditModel}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (onDeleteClick && modelId) {
                  onDeleteClick(modelId);
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </span>
        }
      />
    </div>
  );
}

export interface ModelsTableColumnDeps {
  userRole: string;
  userID: string;
  onModelIdClick: (modelId: string) => void;
  onTeamIdClick: (teamId: string) => void;
  onDeleteClick?: (modelId: string) => void;
  onTogglePauseClick?: (modelId: string, blocked: boolean) => void | Promise<void>;
  pausingModelId?: string | null;
}

export const getModelsTableColumns = ({
  userRole,
  userID,
  onModelIdClick,
  onTeamIdClick,
  onDeleteClick,
  onTogglePauseClick,
  pausingModelId,
}: ModelsTableColumnDeps): ColumnDef<ModelData>[] => [
  {
    id: MODEL_ID_COLUMN_ID,
    accessorFn: (row) => row.model_info.id,
    meta: { title: t("models:model_id", "Model ID") },
    header: t("models:model_id", "Model ID"),
    enableSorting: false,
    size: 140,
    minSize: 90,
    cell: ({ row }) => (
      <IdCell
        value={row.original.model_info.id}
        onClick={onModelIdClick}
        dataTestId={`model-id-${row.original.model_info.id}`}
      />
    ),
  },
  {
    id: MODEL_NAME_COLUMN_ID,
    accessorFn: (row) => row.model_name ?? "",
    meta: { title: t("models:model_information", "Model Information"), skeleton: "twoLine" },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("models:model_information", "Model Information")} />,
    enableSorting: true,
    size: 280,
    minSize: 160,
    cell: ({ row }) => (
      <ModelInformationCell model={row.original} displayName={getDisplayModelName(row.original) || "-"} />
    ),
  },
  {
    id: CREDENTIALS_COLUMN_ID,
    accessorFn: (row) => row.litellm_params?.litellm_credential_name ?? "",
    meta: { title: t("models:credentials", "Credentials") },
    header: () => <CredentialsHeader />,
    enableSorting: false,
    size: 180,
    minSize: 110,
    cell: ({ row }) => <CredentialsCell credentialName={row.original.litellm_params?.litellm_credential_name} />,
  },
  {
    id: CREATED_BY_COLUMN_ID,
    accessorFn: (row) => row.model_info.created_by ?? "",
    meta: { title: t("models:created_by", "Created By"), skeleton: "twoLine" },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("models:created_by", "Created By")} />,
    enableSorting: true,
    size: 180,
    minSize: 110,
    cell: ({ row }) => <CreatedByCell model={row.original} />,
  },
  {
    id: UPDATED_AT_COLUMN_ID,
    accessorFn: (row) => row.model_info.updated_at ?? "",
    meta: { title: t("models:updated_at", "Updated At") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("models:updated_at", "Updated At")} />,
    enableSorting: true,
    size: 140,
    minSize: 100,
    cell: ({ row }) => <DateCell value={row.original.model_info.updated_at} precision="date" />,
  },
  {
    id: COSTS_COLUMN_ID,
    accessorFn: (row) => row.input_cost,
    meta: { title: t("models:costs", "Costs") },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("models:costs", "Costs")} />,
    enableSorting: true,
    size: 130,
    minSize: 90,
    cell: ({ row }) => <CostsCell model={row.original} />,
  },
  {
    id: TEAM_ID_COLUMN_ID,
    accessorFn: (row) => row.model_info.team_id ?? "",
    meta: { title: t("models:team_id", "Team ID") },
    header: t("models:team_id", "Team ID"),
    enableSorting: false,
    size: 140,
    minSize: 90,
    cell: ({ row }) => (
      <IdCell
        value={row.original.model_info.team_id}
        onClick={onTeamIdClick}
        dataTestId={`model-team-id-${row.original.model_info.id}`}
      />
    ),
  },
  {
    id: ACCESS_GROUPS_COLUMN_ID,
    accessorFn: (row) => row.model_info.access_groups ?? [],
    meta: { title: t("models:access_groups", "Model Access Group"), skeleton: "chips" },
    header: t("models:access_groups", "Model Access Group"),
    enableSorting: false,
    size: 200,
    minSize: 120,
    cell: ({ row }) => <AccessGroupsCell accessGroups={row.original.model_info.access_groups} />,
  },
  {
    id: STATUS_COLUMN_ID,
    accessorFn: (row) => row.model_info.db_model,
    meta: { title: t("models:source", "Source"), skeleton: "badge" },
    header: ({ column }) => <DataTableSortHeader column={column} title={t("models:source", "Source")} />,
    enableSorting: true,
    size: 140,
    minSize: 100,
    cell: ({ row }) =>
      row.original.model_info.db_model ? (
        <StatusBadge tone="info" label={t("models:db_model", "DB Model")} />
      ) : (
        <StatusBadge tone="neutral" label={t("models:config_model", "Config Model")} />
      ),
  },
  {
    id: "actions",
    meta: { title: t("models:actions", "Actions"), className: "text-right", headerClassName: "text-right" },
    header: t("models:actions", "Actions"),
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 110,
    minSize: 110,
    cell: ({ row }) => (
      <ModelRowActions
        model={row.original}
        userRole={userRole}
        userID={userID}
        isPausing={pausingModelId === row.original.model_info?.id}
        onDeleteClick={onDeleteClick}
        onTogglePauseClick={onTogglePauseClick}
      />
    ),
  },
];
