import React from "react";
import { useTranslation, Trans } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export interface PassThroughSecuritySectionProps {
  premiumUser: boolean;
  authEnabled: boolean;
  onAuthChange: (checked: boolean) => void;
}

const PassThroughSecuritySection: React.FC<PassThroughSecuritySectionProps> = ({
  premiumUser,
  authEnabled,
  onAuthChange,
}) => {
  const { t } = useTranslation(["models", "common"]);
  return (
    <Card className="block p-6">
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {t("models:passthrough.security_title", { defaultValue: "Security" })}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("models:passthrough.security_desc", {
          defaultValue: "When enabled, requests to this endpoint will require a valid LiteLLM Virtual Key",
        })}
      </p>
      {premiumUser ? (
        <Switch checked={authEnabled} onCheckedChange={onAuthChange} />
      ) : (
        <div>
          <div className="mb-3 flex items-center">
            <Switch disabled checked={false} />
            <span className="ml-2 text-sm text-muted-foreground">
              {t("models:passthrough.auth_premium", { defaultValue: "Authentication (Premium)" })}
            </span>
          </div>
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
            <p className="text-sm text-warning">
              <Trans
                i18nKey="models:passthrough.auth_enterprise_note"
                defaults="Setting authentication for pass-through endpoints is a LiteLLM Enterprise feature. Get a trial key <link>here</link>."
                components={{
                  link: (
                    <a
                      href="https://www.litellm.ai/#pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    />
                  ),
                }}
              />
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PassThroughSecuritySection;
