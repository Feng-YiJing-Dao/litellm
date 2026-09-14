import CopyButton from "@/components/shared/CopyButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { JsonViewer } from "./JsonViewer";

interface ClassifierAuditViewProps {
  request: Record<string, unknown>;
  response: unknown;
}

export function ClassifierAuditView({ request, response }: ClassifierAuditViewProps) {
  const { t } = useTranslation(["logs", "common"]);
  return (
    <div className="mb-6 space-y-4">
      <AuditField
        title={t("logs:classifier_audit.title_input", "Classifier input")}
        value={request.classifier_input}
      >
        {t(
          "logs:classifier_audit.desc_input",
          "Provider request payload. A cached call or disabled message logging may have no capture.",
        )}
      </AuditField>
      <AuditField
        title={t("logs:classifier_audit.title_origin", "Originating request, credentials masked")}
        value={request.originating_request_masked}
      >
        {t(
          "logs:classifier_audit.desc_origin",
          "Comparison only. This source request was not appended to the classifier input.",
        )}
      </AuditField>
      <AuditField
        title={t("logs:classifier_audit.title_response", "Classifier response")}
        value={response}
      >
        {t(
          "logs:classifier_audit.desc_response",
          "The returned verdict and any explanation supplied by the classifier. Later routing rules may change the tier.",
        )}
      </AuditField>
    </div>
  );
}

function AuditField({ title, value, children }: { title: string; value: unknown; children: ReactNode }) {
  const { t } = useTranslation(["logs", "common"]);
  const serialized = JSON.stringify(value);
  const truncated = serialized?.includes("litellm_truncated") ?? false;

  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {value != null && (
          <CopyButton
            value={JSON.stringify(value, null, 2)}
            label={t("logs:classifier_audit.copy_button", `Copy ${title}`, { title })}
          />
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">{children}</p>
        {truncated && (
          <p role="status" className="mb-3 text-sm text-warning">
            {t(
              "logs:classifier_audit.truncated",
              "This stored copy is truncated. The complete payload is unavailable from the configured log storage.",
            )}
          </p>
        )}
        {value == null ? (
          <p className="text-sm text-muted-foreground">
            {t("logs:classifier_audit.not_captured", "Not captured or message logging disabled")}
          </p>
        ) : (
          <JsonViewer data={value} mode="formatted" />
        )}
      </CardContent>
    </Card>
  );
}
