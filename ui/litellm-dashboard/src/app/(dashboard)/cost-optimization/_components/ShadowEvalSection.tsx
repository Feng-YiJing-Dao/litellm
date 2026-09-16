"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type TFn = (key: string, options?: any) => any;
type I18nLike = { language?: string };

import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/http/client";

import { usd } from "./costOptimizationUtils";
import { StartForm } from "./ShadowEvalStartForm";
import {
  useShadowEvalJob,
  useShadowEvalJobs,
  useStopShadowEval,
  type ShadowEvalJob,
  type ShadowEvalJobTarget,
  type ShadowEvalSlice,
} from "./useShadowEval";

const pct = (value: number): string => `${value.toFixed(1)}%`;

const MIN_TURNS_FOR_CONFIDENCE = 30;

type ShadowEvalDirection = ShadowEvalJob["direction"];

const otherArmLabel = (direction: ShadowEvalDirection, t: TFn): string =>
  direction === "reverse"
    ? t("shadow_eval.baseline", { defaultValue: "Baseline" })
    : t("shadow_eval.current_model", { defaultValue: "Current model" });

const routerWinRate = (direction: ShadowEvalDirection, slice: ShadowEvalSlice): number =>
  direction === "reverse" ? slice.real_win_rate_pct : slice.shadow_win_rate_pct;

const otherArmWinRate = (direction: ShadowEvalDirection, slice: ShadowEvalSlice): number =>
  direction === "reverse" ? slice.shadow_win_rate_pct : slice.real_win_rate_pct;

const routerArmSpend = (direction: ShadowEvalDirection, results: NonNullable<ShadowEvalJob["results"]>): number =>
  direction === "reverse" ? results.sampled_real_spend : results.sampled_shadow_spend;

const otherArmSpend = (direction: ShadowEvalDirection, results: NonNullable<ShadowEvalJob["results"]>): number =>
  direction === "reverse" ? results.sampled_shadow_spend : results.sampled_real_spend;

const routerSliceSpend = (direction: ShadowEvalDirection, slice: ShadowEvalSlice): number =>
  direction === "reverse" ? slice.real_spend : slice.shadow_spend;

const otherSliceSpend = (direction: ShadowEvalDirection, slice: ShadowEvalSlice): number =>
  direction === "reverse" ? slice.shadow_spend : slice.real_spend;

const routerMatchedOrBeatPct = (
  direction: ShadowEvalDirection,
  results: NonNullable<ShadowEvalJob["results"]>,
): number =>
  direction === "reverse"
    ? 100 - results.overall_shadow_win_rate_pct
    : results.overall_shadow_win_rate_pct + results.overall_tie_rate_pct;

export const shadowedTargetLabel = (target: ShadowEvalJobTarget): string =>
  target.target_alias ||
  target.key_name ||
  (target.target_type === "key" ? `${target.target_id.slice(0, 10)}…` : target.target_id);

const shadowedTargetsLabel = (job: ShadowEvalJob, t: TFn): string =>
  job.targets.length === 1
    ? shadowedTargetLabel(job.targets[0])
    : t("shadow_eval.targets_count", { count: job.targets.length, defaultValue: `${job.targets.length} targets` });

const totalBudget = (job: ShadowEvalJob): number | null =>
  job.targets.reduce<number | null>(
    (sum, target) => (sum === null || target.max_budget == null ? null : sum + target.max_budget),
    0,
  );

const totalSpend = (job: ShadowEvalJob): number => job.targets.reduce((sum, target) => sum + (target.spend ?? 0), 0);

const targetSpent = (target: ShadowEvalJobTarget): boolean => {
  const spendBudgetReached = target.max_budget != null && target.spend != null && target.spend >= target.max_budget;
  const turnValveReached = target.attempt_count != null && target.attempt_count >= target.max_turns;
  return spendBudgetReached || turnValveReached;
};

const targetStatus = (job: ShadowEvalJob, target: ShadowEvalJobTarget): string => {
  if (job.status === "completed" || (target.stopped_at == null && targetSpent(target))) return "completed";
  return target.stopped_at != null ? "stopped" : "running";
};

const jobRouters = (job: ShadowEvalJob): string => (job.router_names ?? [job.router_name]).join(", ");

const jobModelScope = (job: ShadowEvalJob, t: TFn): React.ReactNode =>
  job.models && job.models.length > 0 ? (
    <>
      {" "}
      {t("shadow_eval.on_models", { defaultValue: "on" })}{" "}
      <span className="font-mono text-xs">{job.models.join(", ")}</span>
    </>
  ) : null;

const jobHeadline = (job: ShadowEvalJob, t: TFn, i18n: I18nLike): React.ReactNode => {
  const isZh = i18n.language?.startsWith("zh");
  if (job.direction === "reverse") {
    if (isZh) {
      return (
        <>
          {t("shadow_eval.comparing", { defaultValue: "Comparing" })}{" "}
          <span className="font-mono text-xs">{jobRouters(job)}</span>{" "}
          {t("shadow_eval.to", { defaultValue: "to" })}{" "}
          <span className="font-mono text-xs">{job.baseline_model}</span>（针对{" "}
          <span className="font-mono text-xs">{shadowedTargetsLabel(job, t)}</span> {job.shadow_percentage}% 的流量
          {jobModelScope(job, t)}）
        </>
      );
    }
    return (
      <>
        Comparing <span className="font-mono text-xs">{jobRouters(job)}</span> to{" "}
        <span className="font-mono text-xs">{job.baseline_model}</span> on {job.shadow_percentage}% of{" "}
        <span className="font-mono text-xs">{shadowedTargetsLabel(job, t)}</span> traffic{jobModelScope(job, t)}
      </>
    );
  }
  if (isZh) {
    return (
      <>
        通过 <span className="font-mono text-xs">{jobRouters(job)}</span> 对{" "}
        <span className="font-mono text-xs">{shadowedTargetsLabel(job, t)}</span> {job.shadow_percentage}% 的流量
        {jobModelScope(job, t)} 进行影子评估
      </>
    );
  }
  return (
    <>
      Shadowing {job.shadow_percentage}% of <span className="font-mono text-xs">{shadowedTargetsLabel(job, t)}</span>{" "}
      traffic{jobModelScope(job, t)} via <span className="font-mono text-xs">{jobRouters(job)}</span>
    </>
  );
};

const isActive = (job: ShadowEvalJob): boolean => job.status === "running";

const endsIn = (endsAt: string | null | undefined, t: TFn): string | null => {
  if (!endsAt) return null;
  const remainingMs = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(remainingMs)) return null;
  if (remainingMs <= 0) return t("shadow_eval.ending_now", { defaultValue: "ending now" });
  const days = Math.round(remainingMs / 86_400_000);
  return days >= 2
    ? t("shadow_eval.ends_in_days", { count: days, defaultValue: `ends in ${days} days` })
    : t("shadow_eval.ends_within_a_day", { defaultValue: "ends within a day" });
};

const STATUS_STYLES: Record<string, string> = {
  running: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  stopped: "bg-secondary text-muted-foreground",
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  return (
    <Badge variant="secondary" className={STATUS_STYLES[status] ?? STATUS_STYLES.stopped}>
      {t(`shadow_eval.status.${status}`, { defaultValue: status })}
    </Badge>
  );
};

const SliceTable: React.FC<{
  groupHeader: string;
  direction: ShadowEvalDirection;
  slices: readonly ShadowEvalSlice[];
}> = ({ groupHeader, direction, slices }) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const otherArm = otherArmLabel(direction, t);
  const otherWinsLabel = t("shadow_eval.other_arm_wins", {
    arm: otherArm,
    defaultValue: `${otherArm} wins`,
  });
  const otherCostLabel = t("shadow_eval.other_arm_cost", {
    arm: otherArm,
    defaultValue: `${otherArm} cost`,
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{groupHeader}</TableHead>
          {[
            t("shadow_eval.judged_turns", { defaultValue: "Judged turns" }),
            t("shadow_eval.router_wins", { defaultValue: "Router wins" }),
            otherWinsLabel,
            t("shadow_eval.ties", { defaultValue: "Ties" }),
            t("shadow_eval.judge_confidence", { defaultValue: "Judge confidence" }),
            t("shadow_eval.router_cost", { defaultValue: "Router cost" }),
            otherCostLabel,
          ].map((label) => (
            <TableHead key={label} className="text-right">
              {label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {slices.map((slice) => (
          <TableRow key={slice.group}>
            <TableCell className="font-medium text-foreground">
              {slice.group}
              {slice.turn_count < MIN_TURNS_FOR_CONFIDENCE && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {t("shadow_eval.low_sample", { defaultValue: "(low sample)" })}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums">{slice.turn_count.toLocaleString()}</TableCell>
            <TableCell className="text-right font-medium tabular-nums text-foreground">
              {pct(routerWinRate(direction, slice))}
            </TableCell>
            <TableCell className="text-right tabular-nums">{pct(otherArmWinRate(direction, slice))}</TableCell>
            <TableCell className="text-right tabular-nums">{pct(slice.tie_rate_pct)}</TableCell>
            <TableCell className="text-right tabular-nums">{slice.avg_judge_confidence.toFixed(2)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {routerSliceSpend(direction, slice) > 0 ? usd(routerSliceSpend(direction, slice)) : "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {otherSliceSpend(direction, slice) > 0 ? usd(otherSliceSpend(direction, slice)) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const CostComparison: React.FC<{
  direction: ShadowEvalDirection;
  results: NonNullable<ShadowEvalJob["results"]>;
}> = ({ direction, results }) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const routerSpend = routerArmSpend(direction, results);
  const otherSpend = otherArmSpend(direction, results);
  if (routerSpend <= 0 || otherSpend <= 0) return null;
  const savingsPct = otherSpend > 0 ? ((otherSpend - routerSpend) / otherSpend) * 100 : null;
  const cacheHits = results.by_tier.reduce((sum, slice) => sum + slice.cache_hit_turns, 0);
  const otherModelLabel =
    direction === "reverse"
      ? t("shadow_eval.the_baseline", { defaultValue: "the baseline" })
      : t("shadow_eval.your_current_model", { defaultValue: "your current model" });

  return (
    <div className="flex min-w-[240px] flex-1 flex-col gap-1 border-t px-6 py-4 sm:border-l sm:border-t-0">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {t("shadow_eval.router_cost_vs", {
          against: otherModelLabel,
          defaultValue: `Router cost vs ${direction === "reverse" ? "the baseline" : "your current model"}`,
        })}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help" />} />
            <TooltipContent>
              {t("shadow_eval.cost_comparison_tooltip", {
                defaultValue:
                  "Each arm is priced as its completion plus its own routing classifier call, measured on the same judged turns; the judge's cost is excluded from both arms",
              })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
      <p
        className={`text-3xl font-semibold ${savingsPct != null && savingsPct > 0 ? "text-success" : "text-foreground"}`}
      >
        {savingsPct != null ? `${savingsPct > 0 ? "-" : "+"}${Math.abs(savingsPct).toFixed(1)}%` : "n/a"}
      </p>
      <p className="text-xs text-muted-foreground">
        {cacheHits > 0
          ? t("shadow_eval.cost_comparison_note_with_cache", {
              routerSpend: usd(routerSpend),
              otherSpend: usd(otherSpend),
              cacheHits: cacheHits.toLocaleString(),
              defaultValue: `${usd(routerSpend)} vs ${usd(otherSpend)} on the same judged turns; ${cacheHits.toLocaleString()} cache-served turns excluded`,
            })
          : t("shadow_eval.cost_comparison_note", {
              routerSpend: usd(routerSpend),
              otherSpend: usd(otherSpend),
              defaultValue: `${usd(routerSpend)} vs ${usd(otherSpend)} on the same judged turns`,
            })}
      </p>
    </div>
  );
};

const VerdictBar: React.FC<{ direction: ShadowEvalDirection; results: NonNullable<ShadowEvalJob["results"]> }> = ({
  direction,
  results,
}) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const ties = results.overall_tie_rate_pct;
  const routerWins =
    direction === "reverse"
      ? Math.max(0, 100 - results.overall_shadow_win_rate_pct - ties)
      : results.overall_shadow_win_rate_pct;
  const otherArm = otherArmLabel(direction, t);
  const segments = [
    { label: t("shadow_eval.router_won", { defaultValue: "Router won" }), value: routerWins, fill: "bg-success" },
    { label: t("shadow_eval.tie", { defaultValue: "Tie" }), value: ties, fill: "bg-success/20" },
    {
      label: t("shadow_eval.other_arm_won", { arm: otherArm, defaultValue: `${otherArm} won` }),
      value: Math.max(0, 100 - routerWins - ties),
      fill: "bg-muted-foreground/30",
    },
  ];
  return (
    <div className="space-y-2 border-b px-6 py-4">
      <div
        className="flex h-2 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={t("shadow_eval.verdict_breakdown", { defaultValue: "Verdict breakdown" })}
      >
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <div key={segment.label} className={segment.fill} style={{ width: `${segment.value}%` }} />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <span key={segment.label} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${segment.fill}`} />
            {segment.label} {pct(segment.value)}
          </span>
        ))}
      </div>
    </div>
  );
};

const TargetTable: React.FC<{ job: ShadowEvalJob }> = ({ job }) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const otherArm = otherArmLabel(job.direction, t);
  const otherWinsLabel = t("shadow_eval.other_arm_wins", {
    arm: otherArm,
    defaultValue: `${otherArm} wins`,
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("shadow_eval.table.target", { defaultValue: "Target" })}</TableHead>
          <TableHead>{t("shadow_eval.table.status", { defaultValue: "Status" })}</TableHead>
          <TableHead className="text-right">
            {t("shadow_eval.table.budget_used", { defaultValue: "Budget used" })}
          </TableHead>
          <TableHead className="text-right">
            {t("shadow_eval.router_wins", { defaultValue: "Router wins" })}
          </TableHead>
          <TableHead className="text-right">{otherWinsLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {job.targets.map((target) => {
          const slice = target.verdicts;
          return (
            <TableRow key={`${target.target_type}:${target.target_id}`}>
              <TableCell className="font-medium text-foreground">
                {shadowedTargetLabel(target)}
                {target.target_type !== "key" && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{target.target_type}</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={targetStatus(job, target)} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {target.max_budget != null
                  ? `${usd(target.spend ?? 0)} / ${usd(target.max_budget)}`
                  : t("shadow_eval.turns_progress", {
                      count: (target.attempt_count ?? slice?.turn_count ?? 0).toLocaleString(),
                      max: target.max_turns.toLocaleString(),
                      defaultValue: `${(target.attempt_count ?? slice?.turn_count ?? 0).toLocaleString()} / ${target.max_turns.toLocaleString()} turns`,
                    })}
              </TableCell>
              {slice ? (
                <>
                  <TableCell className="text-right font-medium tabular-nums text-foreground">
                    {pct(routerWinRate(job.direction, slice))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {pct(otherArmWinRate(job.direction, slice))}
                  </TableCell>
                </>
              ) : (
                <TableCell colSpan={2} className="text-right text-muted-foreground">
                  {t("shadow_eval.no_verdicts_yet", { defaultValue: "No verdicts yet" })}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const emptyResultsText = (job: ShadowEvalJob, resultsError: boolean, t: TFn): string => {
  if (resultsError) {
    return t("shadow_eval.results_load_error", { defaultValue: "Results could not be loaded. Retrying." });
  }
  if (isActive(job)) {
    return t("shadow_eval.collecting_verdicts", {
      defaultValue: "Collecting verdicts. Results appear as sampled requests are judged.",
    });
  }
  if (job.judged_count === 0) {
    return t("shadow_eval.no_verdicts_recorded", { defaultValue: "No verdicts were recorded for this job." });
  }
  return t("shadow_eval.loading_results", { defaultValue: "Loading results..." });
};

const ResultsBody: React.FC<{ job: ShadowEvalJob; resultsError?: boolean }> = ({ job, resultsError = false }) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const results = job.results;
  const hasVerdicts = results != null && (results.by_tier.length > 0 || results.by_current_model.length > 0);
  const otherModelLabel =
    job.direction === "reverse"
      ? t("shadow_eval.the_baseline", { defaultValue: "the baseline" })
      : t("shadow_eval.your_current_model", { defaultValue: "your current model" });

  return (
    <>
      {job.targets.length > 1 && (
        <div className="border-b">
          <TargetTable job={job} />
        </div>
      )}
      {!hasVerdicts || results == null ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">{emptyResultsText(job, resultsError, t)}</p>
      ) : (
        <>
          <div className="flex flex-wrap border-b">
            <div className="flex min-w-[240px] flex-1 flex-col gap-1 px-6 py-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("shadow_eval.router_matched_or_beat", {
                  against: otherModelLabel,
                  defaultValue: `Router matched or beat ${job.direction === "reverse" ? "the baseline" : "your current model"}`,
                })}
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {pct(routerMatchedOrBeatPct(job.direction, results))}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("shadow_eval.of_judged_responses", {
                  count: (job.judged_count ?? 0).toLocaleString(),
                  defaultValue: `of ${(job.judged_count ?? 0).toLocaleString()} judged responses`,
                })}
              </p>
            </div>
            <CostComparison direction={job.direction} results={results} />
          </div>
          <VerdictBar direction={job.direction} results={results} />
          {(results.by_router ?? []).length > 1 && (
            <div className="border-b">
              <SliceTable
                groupHeader={t("shadow_eval.group_router", { defaultValue: "Router" })}
                direction={job.direction}
                slices={results.by_router ?? []}
              />
            </div>
          )}
          {results.by_current_model.length > 0 && (
            <SliceTable
              groupHeader={
                job.direction === "reverse"
                  ? t("shadow_eval.router_pick", { defaultValue: "Router pick" })
                  : t("shadow_eval.compared_against", { defaultValue: "Compared against" })
              }
              direction={job.direction}
              slices={results.by_current_model}
            />
          )}
          {results.by_tier.length > 0 && (
            <div className={results.by_current_model.length > 0 ? "border-t" : ""}>
              <SliceTable
                groupHeader={t("shadow_eval.prompt_difficulty", { defaultValue: "Prompt difficulty" })}
                direction={job.direction}
                slices={results.by_tier}
              />
            </div>
          )}
        </>
      )}
    </>
  );
};

const JobResults: React.FC<{
  job: ShadowEvalJob;
  onStop: () => void;
  stopPending: boolean;
  resultsError?: boolean;
  readOnly?: boolean;
}> = ({ job, onStop, stopPending, resultsError = false, readOnly = false }) => {
  const { t: rawT, i18n } = useTranslation("costs"); const t = rawT as any;
  const active = isActive(job);
  const remaining = endsIn(job.ends_at, t);

  const spendText =
    totalBudget(job) !== null
      ? t("shadow_eval.eval_spend_of_budget", {
          spend: usd(totalSpend(job)),
          budget: usd(totalBudget(job) ?? 0),
          defaultValue: `${usd(totalSpend(job))} of ${usd(totalBudget(job) ?? 0)} eval spend`,
        })
      : t("shadow_eval.eval_spend", {
          spend: usd(totalSpend(job)),
          defaultValue: `${usd(totalSpend(job))} eval spend`,
        });

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />
          <div>
            <p className="text-sm font-medium text-foreground">{jobHeadline(job, t, i18n)}</p>
            <p className="text-xs text-muted-foreground">
              {t("shadow_eval.job_summary_stats", {
                judged: (job.judged_count ?? 0).toLocaleString(),
                errored: (job.error_count ?? 0).toLocaleString(),
                spend: spendText,
                defaultValue: `${(job.judged_count ?? 0).toLocaleString()} turns judged · ${(job.error_count ?? 0).toLocaleString()} errored · ${spendText}`,
              })}
              {active && remaining ? ` · ${remaining}` : ""}
            </p>
          </div>
        </div>
        {active && !readOnly && (
          <Button variant="outline" size="sm" onClick={onStop} disabled={stopPending}>
            {stopPending
              ? t("shadow_eval.stopping", { defaultValue: "Stopping..." })
              : t("shadow_eval.stop", { defaultValue: "Stop" })}
          </Button>
        )}
      </div>
      {(job.error_count ?? 0) > 0 && job.last_error != null && (
        <p className="border-b bg-destructive/10 px-6 py-2 text-xs text-destructive">
          {t("shadow_eval.last_failure", { defaultValue: "Last failure:" })}{" "}
          <span className="font-mono">{job.last_error}</span>
        </p>
      )}
      <ResultsBody job={job} resultsError={resultsError} />
    </Card>
  );
};

const previousSummary = (job: ShadowEvalJob, t: TFn): string => {
  const results = job.results;
  if (results) return pct(routerMatchedOrBeatPct(job.direction, results));
  return job.judged_count === 0
    ? t("shadow_eval.no_verdicts", { defaultValue: "no verdicts" })
    : t("shadow_eval.view_results", { defaultValue: "view results" });
};

const PreviousJob: React.FC<{ job: ShadowEvalJob }> = ({ job }) => {
  const { t: rawT, i18n } = useTranslation("costs"); const t = rawT as any;
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isError } = useShadowEvalJob(expanded ? job.job_id : null);
  const shown = detail ?? job;
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-3 text-left hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={shown.status} />
          <div>
            <p className="text-sm font-medium text-foreground">{jobHeadline(shown, t, i18n)}</p>
            <p className="text-xs text-muted-foreground">
              {shown.judged_count != null &&
                t("shadow_eval.previous_job_summary", {
                  judged: shown.judged_count.toLocaleString(),
                  errored: (shown.error_count ?? 0).toLocaleString(),
                  spend: usd(totalSpend(shown)),
                  date: new Date(shown.created_at).toLocaleDateString(),
                  defaultValue: `${shown.judged_count.toLocaleString()} judged · ${(shown.error_count ?? 0).toLocaleString()} errored · ${usd(totalSpend(shown))} eval spend · ${new Date(shown.created_at).toLocaleDateString()}`,
                })}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-foreground">{previousSummary(shown, t)}</span>
      </button>
      {expanded && (
        <div className="border-t">
          <ResultsBody job={shown} resultsError={isError} />
        </div>
      )}
    </div>
  );
};

const PreviousJobs: React.FC<{ jobs: readonly ShadowEvalJob[] }> = ({ jobs }) => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const [open, setOpen] = useState(false);
  if (jobs.length === 0) return null;
  return (
    <Card className="overflow-hidden py-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left hover:bg-muted/50"
      >
        <span className="text-sm font-medium text-foreground">
          {t("shadow_eval.previous_evaluations_count", {
            count: jobs.length,
            defaultValue: `Previous evaluations (${jobs.length})`,
          })}
        </span>
        <span className="text-xs text-muted-foreground">
          {open ? t("shadow_eval.hide", { defaultValue: "Hide" }) : t("shadow_eval.show", { defaultValue: "Show" })}
        </span>
      </button>
      {open && (
        <div className="border-t">
          {jobs.map((job) => (
            <PreviousJob key={job.job_id} job={job} />
          ))}
        </div>
      )}
    </Card>
  );
};

const JobCard: React.FC<{ job: ShadowEvalJob; readOnly: boolean }> = ({ job, readOnly }) => {
  const { data: detail, isError } = useShadowEvalJob(job.job_id);
  const stop = useStopShadowEval();
  const shown = detail ?? job;
  return (
    <JobResults
      job={shown}
      onStop={() => stop.mutate(shown.job_id)}
      stopPending={stop.isPending}
      resultsError={isError}
      readOnly={readOnly}
    />
  );
};

const ShadowEvalSection: React.FC = () => {
  const { t: rawT } = useTranslation("costs"); const t = rawT as any;
  const { data: jobs, error, isPending } = useShadowEvalJobs();
  const { isViewOnly } = useAuthorized();
  const { showcased, listed } = useMemo(() => {
    const active = (jobs ?? []).filter(isActive);
    const finished = (jobs ?? []).filter((job) => !isActive(job));
    const shown = active.length > 0 ? active : finished.slice(0, 1);
    return { showcased: shown, listed: finished.filter((job) => !shown.includes(job)) };
  }, [jobs]);

  if (error instanceof ApiError && error.status === 403) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-xl font-semibold text-foreground">
          {t("shadow_eval.title", { defaultValue: "Shadow eval" })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("shadow_eval.description", {
            defaultValue:
              "Blind-judge the auto-router on the real traffic of a key, team, or user (teams and users cover JWT-authenticated traffic): against the models they use today before switching, or against a fixed baseline after they have switched.",
          })}
        </p>
      </div>

      {error != null && (
        <p className="text-sm text-destructive">
          {t("shadow_eval.load_error", {
            defaultValue: "Existing evaluations could not be loaded. Refresh the page to retry.",
          })}
        </p>
      )}

      {isPending && error == null && (
        <p className="text-sm text-muted-foreground">
          {t("shadow_eval.loading", { defaultValue: "Loading evaluations..." })}
        </p>
      )}

      {showcased.map((job) => (
        <JobCard key={job.job_id} job={job} readOnly={isViewOnly} />
      ))}

      {!isViewOnly && <StartForm />}

      <PreviousJobs jobs={listed} />
    </div>
  );
};

export default ShadowEvalSection;
