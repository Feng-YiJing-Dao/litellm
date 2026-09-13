import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getCacheSettingsCall, testCacheConnectionCall, updateCacheSettingsCall } from "@/components/networking";
import { fetchAvailableModels, ModelGroup } from "@/components/llm_calls/fetch_models";
import { toast } from "@/lib/toast";
import RedisTypeSelector from "./RedisTypeSelector";
import CacheFieldSection from "./CacheFieldSection";
import { EmbeddingModelOption } from "./CacheFormField";
import { CACHE_FIELDS, REDIS_TYPES, REDIS_TYPE_DESCRIPTIONS, RedisType } from "./cacheSettingsFields";
import {
  buildCachePayload,
  buildInitialValues,
  CacheFormValues,
  configuredSecretFields,
  isFieldVisible,
} from "./cacheSettingsUtils";

const ADVANCED_SECTIONS = ["ssl", "cacheManagement", "gcp"] as const;

interface CacheSettingsProps {
  accessToken: string | null;
  userRole: string | null;
  userID: string | null;
}

const toRedisType = (value: unknown): RedisType =>
  REDIS_TYPES.includes(value as RedisType) ? (value as RedisType) : "node";

const CacheSettings: React.FC<CacheSettingsProps> = ({ accessToken }) => {
  const { t } = useTranslation(["caching", "common"]);
  const form = useForm<CacheFormValues>({ defaultValues: buildInitialValues({}) });
  const [redisType, setRedisType] = useState<RedisType>("node");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModelOption[]>([]);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [configuredSecrets, setConfiguredSecrets] = useState<ReadonlySet<string>>(new Set());

  const loadCacheSettings = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    try {
      const data = (await getCacheSettingsCall(accessToken)) as { current_values?: Record<string, unknown> };
      const currentValues = data.current_values ?? {};
      form.reset(buildInitialValues(currentValues));
      setConfiguredSecrets(configuredSecretFields(currentValues));
      setRedisType(toRedisType(currentValues.redis_type));
    } catch (error) {
      console.error("Failed to load cache settings:", error);
      toast.fromError(t("caching:settings.load_failed", { defaultValue: "Failed to load cache settings" }));
    }
  }, [accessToken, form, t]);

  useEffect(() => {
    loadCacheSettings();
  }, [loadCacheSettings]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    fetchAvailableModels(accessToken)
      .then((models: ModelGroup[]) =>
        setEmbeddingModels(
          models
            .filter((model) => model.mode === "embedding")
            .map((model) => ({ value: model.model_group, label: model.model_group })),
        ),
      )
      .catch((error) => console.error("Error fetching embedding models:", error));
  }, [accessToken]);

  const validate = (): CacheFormValues | null => {
    const values = form.getValues();
    const failures = CACHE_FIELDS.filter(
      (field) =>
        isFieldVisible(field, redisType) &&
        (advancedOpen || !ADVANCED_SECTIONS.some((section) => section === field.section)),
    ).flatMap((field) => {
      const message = field.rules?.map((rule) => rule(values[field.name])).find((result) => result !== null);
      return message === undefined || message === null ? [] : [[field.name, message] as const];
    });

    form.clearErrors();
    failures.forEach(([name, message]) => form.setError(name, { message }));
    return failures.length > 0 ? null : values;
  };

  const handleTestConnection = async () => {
    if (!accessToken) {
      return;
    }
    const values = validate();
    if (values === null) {
      return;
    }

    setIsTesting(true);
    try {
      const result = await testCacheConnectionCall(
        accessToken,
        buildCachePayload(redisType, values, { forTesting: true }),
      );
      if (result.status === "success") {
        toast.success(t("caching:settings.test_success", { defaultValue: "Cache connection test successful!" }));
      } else {
        toast.fromError(
          t("caching:settings.test_failed", {
            error: result.message || result.error,
            defaultValue: `Connection test failed: ${result.message || result.error}`,
          }),
        );
      }
    } catch (error) {
      console.error("Test connection error:", error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      toast.fromError(
        t("caching:settings.test_failed", {
          error: errMsg,
          defaultValue: `Connection test failed: ${errMsg}`,
        }),
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!accessToken) {
      return;
    }
    const values = validate();
    if (values === null) {
      return;
    }

    setIsSaving(true);
    try {
      await updateCacheSettingsCall(accessToken, buildCachePayload(redisType, values, { forTesting: false }));
      toast.success(t("caching:settings.update_success", { defaultValue: "Cache settings updated successfully" }));
      await loadCacheSettings();
    } catch (error) {
      console.error("Failed to save cache settings:", error);
      toast.fromError(t("caching:settings.update_failed", { defaultValue: "Failed to update cache settings" }));
    } finally {
      setIsSaving(false);
    }
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className="w-full space-y-8 py-2">
      <FormProvider {...form}>
        <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
          <div className="max-w-3xl">
            <h3 className="text-sm font-medium text-foreground">{t("caching:tabs.settings", { defaultValue: "Cache Settings" })}</h3>
            <p className="text-xs text-muted-foreground mt-1">{t("caching:settings.desc", { defaultValue: "Configure Redis cache for LiteLLM" })}</p>
          </div>

          <RedisTypeSelector
            redisType={redisType}
            redisTypeDescriptions={REDIS_TYPE_DESCRIPTIONS}
            onTypeChange={(type) => setRedisType(toRedisType(type))}
          />

          <div className="pt-4 border-t border-border">
            <CacheFieldSection
              title={t("caching:settings.connection_title", { defaultValue: "Connection Settings" })}
              section="connection"
              redisType={redisType}
              embeddingModels={embeddingModels}
              configuredSecrets={configuredSecrets}
            />
          </div>

          {redisType === "cluster" && (
            <div className="pt-4 border-t border-border">
              <CacheFieldSection
                title={t("caching:settings.cluster_title", { defaultValue: "Cluster Configuration" })}
                section="cluster"
                redisType={redisType}
                embeddingModels={embeddingModels}
                gridCols="grid-cols-1 gap-6"
              />
            </div>
          )}

          {redisType === "sentinel" && (
            <div className="pt-4 border-t border-border">
              <CacheFieldSection
                title={t("caching:settings.sentinel_title", { defaultValue: "Sentinel Configuration" })}
                section="sentinel"
                redisType={redisType}
                embeddingModels={embeddingModels}
                configuredSecrets={configuredSecrets}
              />
            </div>
          )}

          {redisType === "semantic" && (
            <div className="pt-4 border-t border-border">
              <CacheFieldSection
                title={t("caching:settings.semantic_title", { defaultValue: "Semantic Configuration" })}
                section="semantic"
                redisType={redisType}
                embeddingModels={embeddingModels}
              />
            </div>
          )}

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-4">
            <CollapsibleTrigger className="group flex w-full items-center justify-between py-2 text-left">
              <span className="text-sm font-medium text-foreground">{t("caching:settings.advanced", { defaultValue: "Advanced Settings" })}</span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-panel-open:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6">
                <CacheFieldSection
                  title={t("caching:settings.ssl_title", { defaultValue: "SSL Settings" })}
                  section="ssl"
                  redisType={redisType}
                  embeddingModels={embeddingModels}
                  headingLevel="h5"
                />
                <CacheFieldSection
                  title={t("caching:settings.management_title", { defaultValue: "Cache Management" })}
                  section="cacheManagement"
                  redisType={redisType}
                  embeddingModels={embeddingModels}
                  headingLevel="h5"
                />
                <CacheFieldSection
                  title={t("caching:settings.gcp_title", { defaultValue: "GCP Authentication" })}
                  section="gcp"
                  redisType={redisType}
                  embeddingModels={embeddingModels}
                  headingLevel="h5"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </FormProvider>

      <div className="border-t border-border pt-6 flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={handleTestConnection} disabled={isTesting} className="text-sm">
          {isTesting ? t("caching:settings.testing", { defaultValue: "Testing..." }) : t("caching:settings.test_connection", { defaultValue: "Test Connection" })}
        </Button>
        <Button size="sm" onClick={handleSaveChanges} disabled={isSaving} className="text-sm font-medium">
          {isSaving ? t("caching:settings.saving", { defaultValue: "Saving..." }) : t("caching:settings.save", { defaultValue: "Save Changes" })}
        </Button>
      </div>
    </div>
  );
};

export default CacheSettings;
