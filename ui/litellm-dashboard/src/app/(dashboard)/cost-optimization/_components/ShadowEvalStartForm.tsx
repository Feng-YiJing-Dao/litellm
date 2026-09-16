"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useInfiniteKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import { useInfiniteUsers } from "@/app/(dashboard)/hooks/users/useUsers";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import {
  useAutoRouters,
  usePlainChatModelDeployments,
  usePlainChatModelGroups,
  usePlainModelGroups,
} from "@/app/(dashboard)/hooks/models/useModels";
import { buildModelAvailability, deploymentRefsFromModelInfo, resolveAvailableModels } from "@/lib/autorouter_presets";
import { MultiSelect } from "@/components/shared/MultiSelect";
import { PaginatedMultiSelect } from "@/components/shared/PaginatedMultiSelect";
import TeamMultiSelect from "@/components/common_components/team_multi_select";
import { userOptionLabel } from "@/components/common_components/UserDropdown";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useStartShadowEval, type ShadowEvalJob } from "./useShadowEval";

type ShadowEvalDirection = ShadowEvalJob["direction"];

const MAX_ROUTERS = 4;
const MAX_MODELS = 100;
const RECOMMENDED_JUDGE_MODELS = ["anthropic/claude-sonnet-5", "openai/gpt-4o", "gemini/gemini-2.5-pro"] as const;

const Field: React.FC<{ label: string; htmlFor?: string; className?: string; children: React.ReactNode }> = ({
  label,
  htmlFor,
  className,
  children,
}) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <Label htmlFor={htmlFor} className="text-xs">
      {label}
    </Label>
    {children}
  </div>
);

const KeySelect: React.FC<{ value: string[]; onChange: (tokens: string[]) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation("costs");
  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteKeys(50, {
    selectedKeyAlias: search || null,
  });
  const options = useMemo<SearchSelectOption[]>(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.keys)
        .map((key) => ({
          label: key.key_alias || key.key_name || key.token,
          value: key.token,
          sublabel: key.token,
        })),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-key"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={t("shadow_eval.form.placeholder_keys", { defaultValue: "Search keys by alias" })}
      emptyText={t("shadow_eval.form.empty_keys", { defaultValue: "No matching keys" })}
      errorText={isError ? t("shadow_eval.form.error_keys", { defaultValue: "Keys could not be loaded. Refresh the page to retry." }) : undefined}
    />
  );
};

const UserSelect: React.FC<{ value: string[]; onChange: (ids: string[]) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation("costs");
  const [search, setSearch] = useState("");
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteUsers(
    50,
    search || undefined,
  );
  const options = useMemo<SearchSelectOption[]>(
    () =>
      Array.from(
        new Map(
          (data?.pages ?? [])
            .flatMap((page) => page.users)
            .map((user) => [user.user_id, { label: userOptionLabel(user), value: user.user_id }] as const),
        ).values(),
      ),
    [data],
  );
  return (
    <PaginatedMultiSelect
      inputId="shadow-eval-user"
      options={options}
      value={value}
      onValueChange={onChange}
      onSearchChange={setSearch}
      onLoadMore={() => void fetchNextPage()}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isPending}
      placeholder={t("shadow_eval.form.placeholder_users", { defaultValue: "Search users by email" })}
      emptyText={t("shadow_eval.form.empty_users", { defaultValue: "No matching users" })}
      errorText={isError ? t("shadow_eval.form.error_users", { defaultValue: "Users could not be loaded. Refresh the page to retry." }) : undefined}
    />
  );
};

const RouterField: React.FC<{
  options: SearchSelectOption[];
  routerNames: string[];
  onChange: (names: string[]) => void;
  direction: ShadowEvalDirection;
}> = ({ options, routerNames, onChange, direction }) => {
  const { t } = useTranslation("costs");
  return (
    <Field label={t("shadow_eval.form.field_auto_routers", { defaultValue: "Auto-routers" })}>
      <MultiSelect
        options={options}
        value={routerNames}
        onValueChange={onChange}
        placeholder={t("shadow_eval.form.placeholder_routers", { defaultValue: "Select up to 4 auto-routers" })}
        emptyText={t("shadow_eval.form.empty_routers", { defaultValue: "No auto-routers configured" })}
      />
      {routerNames.length > MAX_ROUTERS && (
        <p className="text-xs text-destructive">
          {t("shadow_eval.form.pick_max_routers", { max: MAX_ROUTERS, defaultValue: `Pick at most ${MAX_ROUTERS} auto-routers` })}
        </p>
      )}
      {direction === "reverse" && routerNames.length > 1 && (
        <p className="text-xs text-destructive">
          {t("shadow_eval.form.regression_single_router_note", { defaultValue: "A regression check compares one router to its baseline" })}
        </p>
      )}
      {direction === "forward" && routerNames.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {t("shadow_eval.form.forward_multiple_routers_note", {
            defaultValue: "Every router sees the same sampled requests, judged against the same live responses",
          })}
        </p>
      )}
    </Field>
  );
};

interface StartFormValidityInputs {
  accessToken: string | null | undefined;
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string;
  judgeModel: string;
  percentage: string;
  maxBudget: string;
}

const startFormValidity = (inputs: StartFormValidityInputs) => {
  const parsedPct = Number.parseFloat(inputs.percentage);
  const percentageValid = parsedPct >= 0.1 && parsedPct <= 100;
  const parsedMaxBudget = Number.parseFloat(inputs.maxBudget);
  const maxBudgetValid = parsedMaxBudget >= 0.01 && parsedMaxBudget <= 10000;
  const baselinePicked = inputs.direction === "forward" || inputs.baselineModel !== "";
  const targetsPicked = inputs.apiKeyIds.length + inputs.teamIds.length + inputs.userIds.length > 0;
  const routerCountValid = inputs.routerNames.length >= 1 && inputs.routerNames.length <= MAX_ROUTERS;
  const routersMatchDirection = inputs.direction === "forward" || inputs.routerNames.length === 1;
  const routersValid = routerCountValid && routersMatchDirection;
  const scopeValid = routersValid && (inputs.direction === "reverse" || inputs.models.length <= MAX_MODELS);
  const modelsPicked = scopeValid && inputs.judgeModel !== "" && baselinePicked;
  const filled = targetsPicked && modelsPicked;
  const boundsValid = percentageValid && maxBudgetValid;
  const valid = Boolean(inputs.accessToken) && filled && boundsValid;
  return { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid };
};

interface StartBodyInputs {
  apiKeyIds: string[];
  teamIds: string[];
  userIds: string[];
  models: string[];
  routerNames: string[];
  direction: ShadowEvalDirection;
  baselineModel: string;
  shadowPercentage: number;
  durationDays: number;
  maxBudget: number;
  judgeModel: string;
}

const buildStartBody = (inputs: StartBodyInputs) => ({
  api_key_ids: inputs.apiKeyIds,
  team_ids: inputs.teamIds,
  user_ids: inputs.userIds,
  models: inputs.direction === "forward" ? inputs.models : [],
  router_names: inputs.routerNames,
  direction: inputs.direction,
  ...(inputs.direction === "reverse" ? { baseline_model: inputs.baselineModel } : {}),
  shadow_percentage: inputs.shadowPercentage,
  duration_days: inputs.durationDays,
  max_budget: inputs.maxBudget,
  judge_model: inputs.judgeModel,
});

export const StartForm: React.FC = () => {
  const { t } = useTranslation("costs");
  const { accessToken } = useAuthorized();
  const [apiKeyIds, setApiKeyIds] = useState<string[]>([]);
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [routerNames, setRouterNames] = useState<string[]>([]);
  const [direction, setDirection] = useState<ShadowEvalDirection>("forward");
  const [baselineModel, setBaselineModel] = useState("");
  const [percentage, setPercentage] = useState("10");
  const [durationDays, setDurationDays] = useState("7");
  const [judgeModel, setJudgeModel] = useState("");
  const [maxBudget, setMaxBudget] = useState("10");
  const { data: autoRouters } = useAutoRouters();
  const configuredGroups = usePlainModelGroups();
  const chatGroups = usePlainChatModelGroups();
  const chatDeployments = usePlainChatModelDeployments();

  const directionOptions = useMemo(
    () => [
      {
        value: "forward" as const,
        label: t("shadow_eval.form.direction_forward", { defaultValue: "Adoption check: key's traffic vs the router" }),
      },
      {
        value: "reverse" as const,
        label: t("shadow_eval.form.direction_reverse", {
          defaultValue: "Regression check: router's picks vs a baseline",
        }),
      },
    ],
    [t],
  );

  const startFormDescription = useMemo(
    () => ({
      forward: t("shadow_eval.form.desc_forward", {
        defaultValue:
          "Duplicates a sampled slice of the selected targets' traffic (keys, teams, or users) through the auto-router and has an LLM judge compare both answers blind. Each target gets its own spend budget. The router's answers are never served to users; judge calls bill to the sampled traffic's own identity.",
      }),
      reverse: t("shadow_eval.form.desc_reverse", {
        defaultValue:
          "Duplicates a sampled slice of the traffic the auto-router already serves against a fixed baseline model and has an LLM judge compare both answers blind. Each target gets its own spend budget. The baseline's answers are never served to users; judge calls bill to the sampled traffic's own identity.",
      }),
    }),
    [t],
  );

  const durationOptions = useMemo(
    () => [
      { value: "1", label: t("shadow_eval.form.duration_1d", { defaultValue: "1 day" }) },
      { value: "3", label: t("shadow_eval.form.duration_3d", { defaultValue: "3 days" }) },
      { value: "7", label: t("shadow_eval.form.duration_7d", { defaultValue: "7 days" }) },
      { value: "14", label: t("shadow_eval.form.duration_14d", { defaultValue: "14 days" }) },
      { value: "30", label: t("shadow_eval.form.duration_30d", { defaultValue: "30 days" }) },
    ],
    [t],
  );

  const modelOptions = useMemo<SearchSelectOption[]>(
    () => [...configuredGroups].toSorted((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name })),
    [configuredGroups],
  );
  const chatOptions = useMemo(
    () => modelOptions.filter((option) => chatGroups.has(option.value)),
    [modelOptions, chatGroups],
  );
  const chatAvailability = useMemo(
    () => buildModelAvailability(chatGroups, deploymentRefsFromModelInfo(chatDeployments)),
    [chatDeployments, chatGroups],
  );
  const recommendedJudgeModels = useMemo(
    () => new Set(RECOMMENDED_JUDGE_MODELS.flatMap((model) => resolveAvailableModels(model, chatAvailability))),
    [chatAvailability],
  );
  const judgeOptions = useMemo(
    () =>
      chatOptions.map((option) =>
        recommendedJudgeModels.has(option.value)
          ? { ...option, sublabel: t("shadow_eval.form.recommended", { defaultValue: "Recommended" }) }
          : option,
      ),
    [chatOptions, recommendedJudgeModels, t],
  );
  const start = useStartShadowEval();

  const routerOptions = useMemo<SearchSelectOption[]>(() => {
    const names = new Set(
      (autoRouters ?? []).map((deployment) => deployment.model_name).filter((name): name is string => Boolean(name)),
    );
    return [...names].toSorted().map((name) => ({ label: name, value: name }));
  }, [autoRouters]);

  const validityInputs: StartFormValidityInputs = {
    accessToken,
    apiKeyIds,
    teamIds,
    userIds,
    models,
    routerNames,
    direction,
    baselineModel,
    judgeModel,
    percentage,
    maxBudget,
  };
  const { parsedPct, parsedMaxBudget, percentageValid, maxBudgetValid, valid } = startFormValidity(validityInputs);
  const handleStart = () => {
    const bodyInputs: StartBodyInputs = {
      apiKeyIds,
      teamIds,
      userIds,
      models,
      routerNames,
      direction,
      baselineModel,
      shadowPercentage: parsedPct,
      durationDays: Number.parseInt(durationDays, 10),
      maxBudget: parsedMaxBudget,
      judgeModel,
    };
    start.mutate(buildStartBody(bodyInputs));
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          {t("shadow_eval.form.card_title", { defaultValue: "Start a shadow eval" })}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{startFormDescription[direction]}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t("shadow_eval.form.direction", { defaultValue: "Direction" })}>
            <Select
              value={direction}
              onValueChange={(v: string | null) => setDirection(v === "reverse" ? "reverse" : "forward")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{directionOptions.find((o) => o.value === direction)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {directionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("shadow_eval.form.keys_to_shadow", { defaultValue: "Keys to shadow" })} htmlFor="shadow-eval-key">
            <KeySelect value={apiKeyIds} onChange={setApiKeyIds} />
          </Field>
          <Field label={t("shadow_eval.form.teams_to_shadow", { defaultValue: "Teams to shadow" })}>
            <TeamMultiSelect
              value={teamIds}
              onChange={setTeamIds}
              placeholder={t("shadow_eval.form.placeholder_teams", { defaultValue: "Search teams by alias" })}
            />
          </Field>
          <Field label={t("shadow_eval.form.users_to_shadow", { defaultValue: "Users to shadow" })} htmlFor="shadow-eval-user">
            <UserSelect value={userIds} onChange={setUserIds} />
          </Field>
          {direction === "forward" && (
            <Field label={t("shadow_eval.form.only_on_models", { defaultValue: "Only on models" })}>
              <MultiSelect
                options={modelOptions}
                value={models}
                onValueChange={setModels}
                placeholder={t("shadow_eval.form.placeholder_models", { defaultValue: "Every model the targets use" })}
                emptyText={t("shadow_eval.form.empty_models", { defaultValue: "No models configured" })}
              />
              {models.length > MAX_MODELS ? (
                <p className="text-xs text-destructive">
                  {t("shadow_eval.form.pick_max_models", {
                    max: MAX_MODELS,
                    defaultValue: `Pick at most ${MAX_MODELS} models`,
                  })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("shadow_eval.form.narrows_models_desc", {
                    defaultValue: "Narrows every target above to requests for these models",
                  })}
                </p>
              )}
            </Field>
          )}
          <RouterField
            options={routerOptions}
            routerNames={routerNames}
            onChange={setRouterNames}
            direction={direction}
          />
          <Field label={t("shadow_eval.form.traffic_sampled", { defaultValue: "Traffic sampled" })} htmlFor="shadow-eval-pct">
            <div className="flex items-center gap-2">
              <Input
                id="shadow-eval-pct"
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                className="w-24"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                {t("shadow_eval.form.pct_of_traffic", { defaultValue: "% of traffic" })}
              </span>
            </div>
            <div>
              {percentage.trim() !== "" && !percentageValid && (
                <p className="text-xs text-destructive">
                  {t("shadow_eval.form.error_percentage_range", { defaultValue: "Enter a value from 0.1 to 100" })}
                </p>
              )}
            </div>
          </Field>
          <Field label={t("shadow_eval.form.duration", { defaultValue: "Duration" })}>
            <Select value={durationDays} onValueChange={(v: string | null) => setDurationDays(v ?? "7")}>
              <SelectTrigger className="w-full">
                <SelectValue>{durationOptions.find((o) => o.value === durationDays)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("shadow_eval.form.spend_budget", { defaultValue: "Spend budget" })}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                min={0.01}
                max={10000}
                step={0.01}
                className="w-24"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">
                {t("shadow_eval.form.spend_budget_desc", { defaultValue: "max shadow + judge spend, per target" })}
              </span>
            </div>
            {maxBudget.trim() !== "" && !maxBudgetValid && (
              <p className="text-xs text-destructive">
                {t("shadow_eval.form.error_budget_range", { defaultValue: "Enter a value from 0.01 to 10000" })}
              </p>
            )}
          </Field>
          {direction === "reverse" && (
            <Field label={t("shadow_eval.form.baseline_model", { defaultValue: "Baseline model" })}>
              <SearchSelect
                options={chatOptions}
                value={baselineModel}
                onValueChange={setBaselineModel}
                placeholder={t("shadow_eval.form.placeholder_baseline", { defaultValue: "Select a baseline model" })}
                emptyText={t("shadow_eval.form.empty_chat_models", { defaultValue: "No chat models available" })}
              />
            </Field>
          )}
          <Field label={t("shadow_eval.form.judge_model", { defaultValue: "Judge model" })} className="sm:col-span-2">
            <SearchSelect
              options={judgeOptions}
              value={judgeModel}
              onValueChange={setJudgeModel}
              placeholder={t("shadow_eval.form.placeholder_judge", { defaultValue: "Select a judge model" })}
              emptyText={t("shadow_eval.form.empty_chat_models", { defaultValue: "No chat models available" })}
            />
          </Field>
        </div>
        <Button disabled={!valid || start.isPending} onClick={handleStart}>
          {start.isPending
            ? t("shadow_eval.form.starting", { defaultValue: "Starting..." })
            : t("shadow_eval.form.start_button", { defaultValue: "Start shadow eval" })}
        </Button>
      </CardContent>
    </Card>
  );
};
