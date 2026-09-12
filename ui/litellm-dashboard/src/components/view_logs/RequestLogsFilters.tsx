"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useInfiniteSpendLogEndUsers } from "@/app/(dashboard)/hooks/spendLogs/useSpendLogEndUsers";
import { useInfiniteSpendLogUsers } from "@/app/(dashboard)/hooks/spendLogs/useSpendLogUsers";
import { useInfiniteKeyAliases } from "@/app/(dashboard)/hooks/keys/useKeyAliases";
import { useInfiniteModelInfo } from "@/app/(dashboard)/hooks/models/useModels";
import { DataTableFilterField } from "@/components/shared/DataTable";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Team } from "../key_team_helpers/key_list";
import { ERROR_CODE_OPTIONS } from "./constants";
import { LOG_FILTER_IDS, type LogsWindow } from "./log_filter_logic";

const ALL_VALUE = "all";

const STATUS_FILTER_ITEMS = [
  { value: ALL_VALUE, label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
] as const;

const CACHE_FILTER_ITEMS = [
  { value: ALL_VALUE, label: "All Requests" },
  { value: "hit", label: "Cache Hit" },
  { value: "miss", label: "Cache Miss" },
] as const;
const PAGE_SIZE = 50;

const SEARCH_INPUT_REASONS: ReadonlySet<string> = new Set(["input-change", "input-clear", "clear-press"]);

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const emptyToUndefined = (value: string): string | undefined => (value === "" ? undefined : value);

function TeamFilterField({
  value,
  onChange,
  teams,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  teams: Team[];
}) {
  const { t } = useTranslation(["logs", "common"]);
  const options = useMemo<SearchSelectOption[]>(
    () =>
      teams.map((team) => ({
        label: team.team_alias || team.team_id,
        value: team.team_id,
        sublabel: team.team_id,
      })),
    [teams],
  );

  return (
    <DataTableFilterField label={t("logs:filter_team_id", { defaultValue: "Team ID" })}>
      <SearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(emptyToUndefined(next))}
        placeholder={t("logs:placeholder_search_team", { defaultValue: "Search or select a team" })}
        emptyText={t("logs:no_teams_found", { defaultValue: "No teams found" })}
      />
    </DataTableFilterField>
  );
}

function KeyAliasFilterField({
  value,
  onChange,
  teamId,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  teamId: string;
}) {
  const { t } = useTranslation(["logs", "common"]);
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteKeyAliases(
    PAGE_SIZE,
    emptyToUndefined(search),
    emptyToUndefined(teamId),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.aliases.flatMap((alias) => {
        if (!alias || seen.has(alias)) return [];
        seen.add(alias);
        return [{ label: alias, value: alias }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={t("logs:filter_key_alias", { defaultValue: "Key Alias" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(emptyToUndefined(next))}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={t("logs:placeholder_search_key_alias", { defaultValue: "Search a key alias" })}
        emptyText={t("logs:no_key_aliases_found", { defaultValue: "No key aliases found" })}
      />
    </DataTableFilterField>
  );
}

function ModelFilterField({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) {
  const { t } = useTranslation(["logs", "common"]);
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteModelInfo(
    PAGE_SIZE,
    emptyToUndefined(search),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.data.flatMap((model) => {
        const modelId = model.model_info?.id ?? "";
        const modelName = model.model_name ?? "";
        if (!modelId || seen.has(modelId)) return [];
        seen.add(modelId);
        return [{ label: modelName || modelId, value: modelId, sublabel: `Model ID: ${modelId}` }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={t("logs:col_model", { defaultValue: "Model" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(emptyToUndefined(next))}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={t("logs:placeholder_search_model", { defaultValue: "Search a model" })}
        emptyText={t("logs:no_models_found", { defaultValue: "No models found" })}
      />
    </DataTableFilterField>
  );
}

function UserIdFilterField({
  value,
  onChange,
  logsWindow,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  logsWindow: LogsWindow;
}) {
  const { t } = useTranslation(["logs", "common"]);
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSpendLogUsers(
    logsWindow,
    PAGE_SIZE,
    emptyToUndefined(search),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.data.flatMap((userId) => {
        if (!userId || seen.has(userId)) return [];
        seen.add(userId);
        return [{ label: userId, value: userId }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={t("logs:filter_user_id", { defaultValue: "User ID" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(emptyToUndefined(next))}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={t("logs:placeholder_search_user", { defaultValue: "Search an internal user" })}
        emptyText={t("logs:no_users_found", { defaultValue: "No users found" })}
      />
    </DataTableFilterField>
  );
}

function EndUserFilterField({
  value,
  onChange,
  logsWindow,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  logsWindow: LogsWindow;
}) {
  const { t } = useTranslation(["logs", "common"]);
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSpendLogEndUsers(
    logsWindow,
    PAGE_SIZE,
    emptyToUndefined(search),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.data.flatMap((endUser) => {
        if (!endUser || seen.has(endUser)) return [];
        seen.add(endUser);
        return [{ label: endUser, value: endUser }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={t("logs:filter_end_user", { defaultValue: "End User" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(emptyToUndefined(next))}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={t("logs:placeholder_search_end_user", { defaultValue: "Search an end user" })}
        emptyText={t("logs:no_end_users_found", { defaultValue: "No end users in this time range" })}
      />
    </DataTableFilterField>
  );
}

function ErrorCodeFilterField({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) {
  const { t } = useTranslation(["logs", "common"]);
  const [query, setQuery] = useState("");

  const options = useMemo<SearchSelectOption[]>(() => {
    const trimmed = query.trim();
    const lowered = trimmed.toLowerCase();
    const matches = ERROR_CODE_OPTIONS.filter((option) => option.label.toLowerCase().includes(lowered));
    const isKnownCode = ERROR_CODE_OPTIONS.some(
      (option) => option.value === trimmed || option.label.toLowerCase() === lowered,
    );
    if (trimmed === "" || isKnownCode) return matches;
    return [...matches, { label: `Use custom code: ${trimmed}`, value: trimmed }];
  }, [query]);

  const selected = useMemo<SearchSelectOption | null>(() => {
    if (value === "") return null;
    return ERROR_CODE_OPTIONS.find((option) => option.value === value) ?? { label: value, value };
  }, [value]);

  const items = useMemo<SearchSelectOption[]>(() => {
    if (selected === null) return options;
    if (options.some((option) => option.value === selected.value)) return options;
    return [selected, ...options];
  }, [options, selected]);

  return (
    <DataTableFilterField label={t("logs:filter_error_code", { defaultValue: "Error Code" })}>
      <Combobox
        items={items}
        value={selected}
        onValueChange={(item: SearchSelectOption | null) => onChange(emptyToUndefined(item?.value ?? ""))}
        onInputValueChange={(next, eventDetails) => setQuery(SEARCH_INPUT_REASONS.has(eventDetails.reason) ? next : "")}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setQuery("");
        }}
        isItemEqualToValue={(a: SearchSelectOption, b: SearchSelectOption) => a.value === b.value}
        itemToStringLabel={(item: SearchSelectOption) => item.label}
        filter={null}
      >
        <ComboboxInput
          onFocus={(event) => event.currentTarget.select()}
          placeholder={t("logs:placeholder_error_code", { defaultValue: "Select or type an error code" })}
          showClear={value !== ""}
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>{t("logs:no_error_codes_found", { defaultValue: "No error codes found" })}</ComboboxEmpty>
          <ComboboxList data-testid="error-code-filter-list">
            {(item: SearchSelectOption) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </DataTableFilterField>
  );
}

interface RequestLogsFiltersProps {
  get: (columnId: string) => unknown;
  set: (columnId: string, value: unknown) => void;
  teams: Team[];
  logsWindow: LogsWindow;
}

export function RequestLogsFilters({ get, set, teams, logsWindow }: RequestLogsFiltersProps) {
  const { t } = useTranslation(["logs", "common"]);
  const valueOf = (id: string): string => asString(get(id));
  const setter = (id: string) => (next: string | undefined) => set(id, next);

  const statusFilterItems = useMemo(
    () => [
      { value: ALL_VALUE, label: t("logs:status_all", { defaultValue: "All Statuses" }) },
      { value: "success", label: t("logs:status_success", { defaultValue: "Success" }) },
      { value: "failure", label: t("logs:status_failure", { defaultValue: "Failure" }) },
    ],
    [t],
  );

  const cacheFilterItems = useMemo(
    () => [
      { value: ALL_VALUE, label: t("logs:cache_all", { defaultValue: "All Requests" }) },
      { value: "hit", label: t("logs:cache_hit", { defaultValue: "Cache Hit" }) },
      { value: "miss", label: t("logs:cache_miss", { defaultValue: "Cache Miss" }) },
    ],
    [t],
  );

  return (
    <>
      <TeamFilterField
        value={valueOf(LOG_FILTER_IDS.TEAM_ID)}
        onChange={setter(LOG_FILTER_IDS.TEAM_ID)}
        teams={teams}
      />

      <DataTableFilterField label={t("logs:filter_status", { defaultValue: "Status" })}>
        <Select
          items={statusFilterItems}
          value={valueOf(LOG_FILTER_IDS.STATUS) === "" ? ALL_VALUE : valueOf(LOG_FILTER_IDS.STATUS)}
          onValueChange={(next) => set(LOG_FILTER_IDS.STATUS, next === null || next === ALL_VALUE ? undefined : next)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("logs:status_all", { defaultValue: "All Statuses" })} />
          </SelectTrigger>
          <SelectContent>
            {statusFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableFilterField>

      <DataTableFilterField label={t("logs:filter_cache", { defaultValue: "Cache" })}>
        <Select
          items={cacheFilterItems}
          value={valueOf(LOG_FILTER_IDS.CACHE_STATUS) === "" ? ALL_VALUE : valueOf(LOG_FILTER_IDS.CACHE_STATUS)}
          onValueChange={(next) =>
            set(LOG_FILTER_IDS.CACHE_STATUS, next === null || next === ALL_VALUE ? undefined : next)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("logs:cache_all", { defaultValue: "All Requests" })} />
          </SelectTrigger>
          <SelectContent>
            {cacheFilterItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableFilterField>

      <KeyAliasFilterField
        value={valueOf(LOG_FILTER_IDS.KEY_ALIAS)}
        onChange={setter(LOG_FILTER_IDS.KEY_ALIAS)}
        teamId={valueOf(LOG_FILTER_IDS.TEAM_ID)}
      />

      <UserIdFilterField
        value={valueOf(LOG_FILTER_IDS.USER_ID)}
        onChange={setter(LOG_FILTER_IDS.USER_ID)}
        logsWindow={logsWindow}
      />

      <EndUserFilterField
        value={valueOf(LOG_FILTER_IDS.END_USER)}
        onChange={setter(LOG_FILTER_IDS.END_USER)}
        logsWindow={logsWindow}
      />

      <ErrorCodeFilterField value={valueOf(LOG_FILTER_IDS.ERROR_CODE)} onChange={setter(LOG_FILTER_IDS.ERROR_CODE)} />

      <DataTableFilterField label={t("logs:filter_error_message", { defaultValue: "Error Message" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.ERROR_MESSAGE)}
          onChange={(event) => set(LOG_FILTER_IDS.ERROR_MESSAGE, emptyToUndefined(event.target.value))}
          placeholder={t("logs:placeholder_error_msg", { defaultValue: "Enter error message…" })}
        />
      </DataTableFilterField>

      <DataTableFilterField label={t("logs:filter_key_hash", { defaultValue: "Key Hash" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.KEY_HASH)}
          onChange={(event) => set(LOG_FILTER_IDS.KEY_HASH, emptyToUndefined(event.target.value))}
          placeholder={t("logs:placeholder_key_hash", { defaultValue: "Enter key hash…" })}
        />
      </DataTableFilterField>

      <DataTableFilterField label={t("logs:filter_session_id", { defaultValue: "Session ID" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.SESSION_ID)}
          onChange={(event) => set(LOG_FILTER_IDS.SESSION_ID, emptyToUndefined(event.target.value))}
          placeholder={t("logs:placeholder_session_id", { defaultValue: "Enter session ID…" })}
        />
      </DataTableFilterField>

      <ModelFilterField value={valueOf(LOG_FILTER_IDS.MODEL_ID)} onChange={setter(LOG_FILTER_IDS.MODEL_ID)} />

      <DataTableFilterField label={t("logs:filter_public_model", { defaultValue: "Public model / search tool" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.PUBLIC_MODEL_OR_SEARCH_TOOL)}
          onChange={(event) => set(LOG_FILTER_IDS.PUBLIC_MODEL_OR_SEARCH_TOOL, emptyToUndefined(event.target.value))}
          placeholder={t("logs:placeholder_public_model", { defaultValue: "Enter public model or search tool…" })}
        />
      </DataTableFilterField>
    </>
  );
}
