"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cva.config";

import { useTranslation } from "react-i18next";

export const AUTOROUTER_CLASSIFIER_ORIGIN = "autorouter_classifier";

export function ClassifyTag({ origin, className }: { origin?: string | null; className?: string }) {
  const { t } = useTranslation(["logs", "common"]);
  if (origin !== AUTOROUTER_CLASSIFIER_ORIGIN) return null;
  return (
    <Badge
      variant="secondary"
      title={t(
        "logs:classify_tag_title",
        "Tier classification call made by the auto-router, not a request the caller sent",
      )}
      className={cn("px-2 py-0 text-[10px] font-normal", className)}
    >
      {t("logs:classify_tag", "Classify")}
    </Badge>
  );
}
