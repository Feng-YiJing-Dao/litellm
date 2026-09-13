"use client";

import React, { useState } from "react";
import { CircleAlert, TriangleAlert, X } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { LicenseInfo } from "@/components/networking";
import { useLicenseInfo } from "@/app/(dashboard)/hooks/license/useLicenseInfo";
import { formatExpiryDate, getDaysUntilExpiration, getLicenseExpiryTier } from "@/utils/licenseUtils";

const DISMISS_KEY_PREFIX = "litellm:licenseExpiryBannerDismissed:";
const SALES_EMAIL = "sales@berri.ai";

const salesLink = <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>;

interface LicenseExpiryBannerProps {
  accessToken: string | null;
}

interface LicenseExpiryBannerViewProps {
  licenseInfo: LicenseInfo | null;
}

export const LicenseExpiryBannerView: React.FC<LicenseExpiryBannerViewProps> = ({ licenseInfo }) => {
  const { t } = useTranslation("common");
  const [locallyDismissed, setLocallyDismissed] = useState(false);

  const expirationDate = licenseInfo?.expiration_date ?? null;
  const tier = getLicenseExpiryTier(expirationDate);
  const days = getDaysUntilExpiration(expirationDate);

  if (expirationDate === null || tier === "none" || days === null) {
    return null;
  }

  const isDismissible = tier === "warning";
  const dismissKey = `${DISMISS_KEY_PREFIX}${expirationDate}`;
  const previouslyDismissed =
    isDismissible && typeof window !== "undefined" ? sessionStorage.getItem(dismissKey) === "true" : false;

  if (isDismissible && (locallyDismissed || previouslyDismissed)) {
    return null;
  }

  const formattedDate = formatExpiryDate(expirationDate);

  const describeCountdown = (d: number): string => {
    if (d <= 0) {
      return t("banners.license_expiry.expires_today", { defaultValue: "expires today" });
    }
    if (d === 1) {
      return t("banners.license_expiry.expires_in_one_day", { defaultValue: "expires in 1 day" });
    }
    return t("banners.license_expiry.expires_in_days", {
      days: d,
      defaultValue: `expires in ${d} days`,
    });
  };

  const expiryDescription = (tTier: "warning" | "critical" | "expired"): React.ReactNode => {
    if (tTier === "expired") {
      return (
        <Trans
          i18nKey="banners.license_expiry.desc_expired"
          ns="common"
          values={{ email: SALES_EMAIL }}
          components={{ link1: <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a> }}
        >
          Enterprise features are now disabled. Reach out to {salesLink} to restore access
        </Trans>
      );
    }
    if (tTier === "critical") {
      return (
        <Trans
          i18nKey="banners.license_expiry.desc_critical"
          ns="common"
          values={{ email: SALES_EMAIL }}
          components={{ link1: <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a> }}
        >
          Renew now to avoid losing enterprise features. Reach out to {salesLink}
        </Trans>
      );
    }
    return (
      <Trans
        i18nKey="banners.license_expiry.desc_warning"
        ns="common"
        values={{ email: SALES_EMAIL }}
        components={{ link1: <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a> }}
      >
        Renew before it lapses to keep enterprise features. Reach out to {salesLink}
      </Trans>
    );
  };

  const message =
    tier === "expired"
      ? t("banners.license_expiry.expired_title", {
          date: formattedDate,
          defaultValue: `Your LiteLLM Enterprise license expired on ${formattedDate}`,
        })
      : t("banners.license_expiry.expiring_title", {
          countdown: describeCountdown(days),
          date: formattedDate,
          defaultValue: `Your LiteLLM Enterprise license ${describeCountdown(days)} (${formattedDate})`,
        });

  const description = expiryDescription(tier);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(dismissKey, "true");
    }
    setLocallyDismissed(true);
  };

  return (
    <Alert variant={tier === "warning" ? "warning" : "error"} className="rounded-none border-x-0 border-t-0">
      {tier === "warning" ? (
        <TriangleAlert className="size-4" aria-hidden />
      ) : (
        <CircleAlert className="size-4" aria-hidden />
      )}
      <AlertTitle>{message}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {isDismissible && (
        <AlertAction>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("banners.license_expiry.close", { defaultValue: "Close" })}
            onClick={handleClose}
          >
            <X className="size-4" />
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
};

export const LicenseExpiryBanner: React.FC<LicenseExpiryBannerProps> = ({ accessToken }) => {
  const { data } = useLicenseInfo(accessToken);
  return <LicenseExpiryBannerView licenseInfo={data ?? null} />;
};
