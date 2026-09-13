import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { toast } from "@/lib/toast";
import { StatusBadge } from "@/components/shared/table_cells/status_badge";
import {
  useCoordinationRedisSettings,
  useTestCoordinationRedisConnection,
  useUpdateCoordinationRedisSettings,
} from "@/app/(dashboard)/hooks/coordinationRedis/useCoordinationRedisSettings";
import CoordinationRedisFieldSection from "./CoordinationRedisFieldSection";
import CoordinationRedisTypeSelector from "./CoordinationRedisTypeSelector";
import { COORDINATION_FIELDS, CoordinationRedisType } from "./coordinationRedisFields";
import {
  buildCoordinationPayload,
  buildInitialValues,
  configuredSecretFields,
  CoordinationFormValues,
  inferRedisType,
  isFieldVisible,
  sourceBadge,
} from "./coordinationRedisUtils";

const CoordinationRedisSettings: React.FC = () => {
  const { t } = useTranslation(["caching", "common"]);
  const form = useForm<CoordinationFormValues>({ defaultValues: buildInitialValues({}) });
  const [selectedRedisType, setSelectedRedisType] = useState<CoordinationRedisType | null>(null);

  const { data, isLoading, isError } = useCoordinationRedisSettings();
  const updateSettings = useUpdateCoordinationRedisSettings();
  const testConnection = useTestCoordinationRedisConnection();

  const redisType = selectedRedisType ?? inferRedisType(data?.values ?? {});

  useEffect(() => {
    if (data) {
      form.reset(buildInitialValues(data.values));
    }
  }, [data, form]);

  useEffect(() => {
    if (isError) {
      toast.fromError(t("caching:coordination.load_failed", { defaultValue: "Failed to load coordination Redis settings" }));
    }
  }, [isError, t]);

  const validate = (): CoordinationFormValues | null => {
    const values = form.getValues();
    const failures = COORDINATION_FIELDS.filter((field) => isFieldVisible(field, redisType)).flatMap((field) => {
      const message = field.rules?.map((rule) => rule(values[field.name])).find((result) => result !== null);
      return message === undefined || message === null ? [] : [[field.name, message] as const];
    });

    form.clearErrors();
    failures.forEach(([name, message]) => form.setError(name, { message }));
    return failures.length > 0 ? null : values;
  };

  const handleTestConnection = async () => {
    const values = validate();
    if (values === null) {
      return;
    }

    try {
      const result = await testConnection.mutateAsync(buildCoordinationPayload(redisType, values));
      if (result.status === "healthy") {
        toast.success(t("caching:coordination.test_success", { defaultValue: "Coordination Redis connection test successful!" }));
      } else {
        toast.fromError(
          t("caching:coordination.test_failed", {
            error: result.error ?? "Unknown error",
            defaultValue: `Connection test failed: ${result.error ?? "Unknown error"}`,
          }),
        );
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      toast.fromError(
        t("caching:coordination.test_failed", {
          error: errMsg,
          defaultValue: `Connection test failed: ${errMsg}`,
        }),
      );
    }
  };

  const handleSaveChanges = async () => {
    const values = validate();
    if (values === null) {
      return;
    }

    try {
      await updateSettings.mutateAsync(buildCoordinationPayload(redisType, values));
      toast.success(t("caching:coordination.saved_success", { defaultValue: "Coordination Redis settings saved. Restart the proxy to apply them." }));
    } catch {
      toast.fromError(t("caching:coordination.update_failed", { defaultValue: "Failed to update coordination Redis settings" }));
    }
  };

  const badge = sourceBadge(data?.source);
  const configuredSecrets = useMemo(() => configuredSecretFields(data?.values ?? {}), [data]);

  return (
    <div className="w-full space-y-8 py-2">
      <FormProvider {...form}>
        <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-foreground">{t("caching:coordination.title", { defaultValue: "Coordination Redis" })}</h3>
              {!isLoading && (
                <StatusBadge tone={badge.tone} label={badge.label} dataTestId="coordination-redis-source" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("caching:coordination.desc", {
                defaultValue:
                  "Redis used to coordinate work across proxy pods: cross-pod rate limits, spend tracking, and the pod lock manager. It is configured independently of the response cache.",
              })}
            </p>
            <p className="text-xs text-muted-foreground">{badge.tooltip}</p>
            <p className="text-xs text-warning">{t("caching:coordination.restart_warning", { defaultValue: "Saved changes take effect on proxy restart." })}</p>
          </div>

          <CoordinationRedisTypeSelector redisType={redisType} onTypeChange={setSelectedRedisType} />

          <div className="pt-4 border-t border-border">
            <CoordinationRedisFieldSection
              title={t("caching:settings.connection_title", { defaultValue: "Connection Settings" })}
              section="connection"
              redisType={redisType}
              configuredSecrets={configuredSecrets}
            />
          </div>

          {redisType === "cluster" && (
            <div className="pt-4 border-t border-border">
              <CoordinationRedisFieldSection
                title={t("caching:settings.cluster_title", { defaultValue: "Cluster Configuration" })}
                section="cluster"
                redisType={redisType}
                configuredSecrets={configuredSecrets}
                gridCols="grid-cols-1 gap-6"
              />
            </div>
          )}

          {redisType === "sentinel" && (
            <div className="pt-4 border-t border-border">
              <CoordinationRedisFieldSection
                title={t("caching:settings.sentinel_title", { defaultValue: "Sentinel Configuration" })}
                section="sentinel"
                redisType={redisType}
                configuredSecrets={configuredSecrets}
              />
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <CoordinationRedisFieldSection
              title={t("caching:settings.ssl_title", { defaultValue: "SSL Settings" })}
              section="ssl"
              redisType={redisType}
              configuredSecrets={configuredSecrets}
            />
          </div>
        </form>
      </FormProvider>

      <div className="border-t border-border pt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={handleTestConnection} disabled={testConnection.isPending}>
          {testConnection.isPending && <UiLoadingSpinner className="size-4" />}
          {testConnection.isPending ? t("caching:settings.testing", { defaultValue: "Testing..." }) : t("caching:settings.test_connection", { defaultValue: "Test Connection" })}
        </Button>
        <Button onClick={handleSaveChanges} disabled={updateSettings.isPending}>
          {updateSettings.isPending && <UiLoadingSpinner className="size-4" />}
          {updateSettings.isPending ? t("caching:settings.saving", { defaultValue: "Saving..." }) : t("caching:settings.save", { defaultValue: "Save Changes" })}
        </Button>
      </div>
    </div>
  );
};

export default CoordinationRedisSettings;
