"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/locales";
import "@/lib/i18n/zodCustomErrorMap";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = i18n.language || "zh-CN";
      const handleLanguageChanged = (lng: string) => {
        document.documentElement.lang = lng;
      };
      i18n.on("languageChanged", handleLanguageChanged);
      return () => {
        i18n.off("languageChanged", handleLanguageChanged);
      };
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18nProvider;
