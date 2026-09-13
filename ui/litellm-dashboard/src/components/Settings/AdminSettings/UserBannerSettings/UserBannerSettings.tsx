"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useUpdateUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUpdateUserBanner";
import { useUserBanner } from "@/app/(dashboard)/hooks/userBanner/useUserBanner";
import { toast } from "@/lib/toast";
import { UserBanner, UserBannerSeverity, UserBannerUpdate } from "@/components/networking";
import { Alert, AlertDescription } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SEVERITY_ICONS, UserBannerMarkdown } from "@/components/UserBanner";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_BANNER: UserBanner = { enabled: false, message: "", severity: "info", revision: "" };

export default function UserBannerSettings() {
  const { accessToken } = useAuthorized();
  const { data: banner, isLoading } = useUserBanner(accessToken);
  const { mutate: saveBanner, isPending } = useUpdateUserBanner(accessToken);
  const persisted = banner ?? EMPTY_BANNER;

  return (
    <UserBannerSettingsForm
      key={JSON.stringify(persisted)}
      persisted={persisted}
      isLoading={isLoading}
      isPending={isPending}
      saveBanner={saveBanner}
    />
  );
}

interface UserBannerSettingsFormProps {
  persisted: UserBanner;
  isLoading: boolean;
  isPending: boolean;
  saveBanner: ReturnType<typeof useUpdateUserBanner>["mutate"];
}

function UserBannerSettingsForm({ persisted, isLoading, isPending, saveBanner }: UserBannerSettingsFormProps) {
  const { t } = useTranslation(["settings", "common"]);
  const [draft, setDraft] = useState<UserBannerUpdate>({
    enabled: persisted.enabled,
    message: persisted.message,
    severity: persisted.severity,
  });

  const severityItems = useMemo(
    () => [
      {
        value: "info" as UserBannerSeverity,
        label: t("settings:user_banner.severity_info", { defaultValue: "Info" }),
      },
      {
        value: "warning" as UserBannerSeverity,
        label: t("settings:user_banner.severity_warning", { defaultValue: "Warning" }),
      },
      {
        value: "error" as UserBannerSeverity,
        label: t("settings:user_banner.severity_error", { defaultValue: "Error" }),
      },
    ],
    [t],
  );

  const messageMissing = draft.enabled && draft.message.trim() === "";

  const handleSave = () => {
    saveBanner(draft, {
      onSuccess: () => {
        toast.success(t("settings:user_banner.update_success", { defaultValue: "User banner updated successfully" }));
      },
      onError: (error) => {
        toast.fromError(error);
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings:user_banner.title", { defaultValue: "User Banner" })}</CardTitle>
        <CardDescription>
          {t("settings:user_banner.description", {
            defaultValue:
              "Publish an announcement to all dashboard users. Markdown is supported; the banner appears below the header on every page until you unpublish it. Users can dismiss it, and it reappears whenever the content changes.",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={draft.enabled}
                onCheckedChange={(checked: boolean) => setDraft({ ...draft, enabled: checked })}
                aria-label="Publish user banner"
              />
              <Label>{t("settings:user_banner.publish_label", { defaultValue: "Publish user banner" })}</Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="user-banner-message">
                {t("settings:user_banner.message_label", { defaultValue: "Message" })}
              </Label>
              <Textarea
                id="user-banner-message"
                value={draft.message}
                maxLength={4000}
                rows={3}
                placeholder={t("settings:user_banner.message_placeholder", {
                  defaultValue:
                    "**Scheduled maintenance** tonight at 10 PM UTC. See [status page](https://example.com).",
                })}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDraft({ ...draft, message: event.target.value })
                }
              />
              {messageMissing && (
                <p className="text-sm text-destructive">
                  {t("settings:user_banner.message_missing", {
                    defaultValue: "Add a message before publishing.",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("settings:user_banner.severity_label", { defaultValue: "Severity" })}</Label>
              <Select
                items={severityItems}
                value={draft.severity}
                onValueChange={(value: string | null) =>
                  setDraft({ ...draft, severity: (value ?? "info") as UserBannerSeverity })
                }
              >
                <SelectTrigger className="w-48" aria-label="Banner severity">
                  <SelectValue
                    placeholder={t("settings:user_banner.severity_placeholder", { defaultValue: "Severity" })}
                  />
                </SelectTrigger>
                <SelectContent>
                  {severityItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {draft.message.trim() !== "" && (
              <div className="flex flex-col gap-2">
                <Label>{t("settings:user_banner.preview_label", { defaultValue: "Preview" })}</Label>
                <Alert variant={draft.severity}>
                  {SEVERITY_ICONS[draft.severity]}
                  <AlertDescription>
                    <UserBannerMarkdown message={draft.message} />
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div>
              <Button onClick={handleSave} disabled={isPending || messageMissing}>
                {isPending
                  ? t("settings:user_banner.saving", { defaultValue: "Saving..." })
                  : t("settings:user_banner.save", { defaultValue: "Save banner" })}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
