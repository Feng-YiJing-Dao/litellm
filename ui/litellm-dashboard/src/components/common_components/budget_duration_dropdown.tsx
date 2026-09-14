import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import i18n from "@/locales";
import { useTranslation } from "react-i18next";

export const NEVER_RESETS_BUDGET_DURATION = "none";

export const DURATION_LABELS: Record<string, string> = {
  [NEVER_RESETS_BUDGET_DURATION]: "Never resets",
  "1h": "hourly",
  "24h": "daily",
  "7d": "weekly",
  "30d": "monthly",
};

interface BudgetDurationDropdownProps {
  id?: string;
  value?: string | null;
  onChange?: (value: string | undefined) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  showNeverResets?: boolean;
}

const BudgetDurationDropdown: React.FC<BudgetDurationDropdownProps> = ({
  id,
  value,
  onChange,
  className = "",
  style = {},
  placeholder = "n/a",
  showNeverResets = false,
}) => {
  const { t } = useTranslation(["budgets"]);

  const localizedDurationLabels: Record<string, string> = {
    [NEVER_RESETS_BUDGET_DURATION]: t("budgets:durations.never_resets", "Never resets"),
    "1h": t("budgets:durations.hourly", "hourly"),
    "24h": t("budgets:durations.daily", "daily"),
    "7d": t("budgets:durations.weekly", "weekly"),
    "30d": t("budgets:durations.monthly", "monthly"),
  };

  return (
    <Select
      items={localizedDurationLabels}
      value={value || null}
      onValueChange={(next: string | null) => onChange?.(next ?? undefined)}
    >
      <SelectTrigger id={id} className={`w-full ${className}`} style={style}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={null}>{placeholder}</SelectItem>
        {showNeverResets ? (
          <SelectItem value={NEVER_RESETS_BUDGET_DURATION}>
            {t("budgets:durations.never_resets", "Never resets")}
          </SelectItem>
        ) : null}
        <SelectItem value="1h">{t("budgets:durations.hourly", "hourly")}</SelectItem>
        <SelectItem value="24h">{t("budgets:durations.daily", "daily")}</SelectItem>
        <SelectItem value="7d">{t("budgets:durations.weekly", "weekly")}</SelectItem>
        <SelectItem value="30d">{t("budgets:durations.monthly", "monthly")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export const getBudgetDurationLabel = (value: string | null | undefined): string => {
  if (!value) return i18n.t("budgets:durations.not_set", "Not set");

  const budgetDurationMap: Record<string, string> = {
    "1h": i18n.t("budgets:durations.hourly", "hourly"),
    "24h": i18n.t("budgets:durations.daily", "daily"),
    "7d": i18n.t("budgets:durations.weekly", "weekly"),
    "30d": i18n.t("budgets:durations.monthly", "monthly"),
  };

  return budgetDurationMap[value] || value;
};

export default BudgetDurationDropdown;
