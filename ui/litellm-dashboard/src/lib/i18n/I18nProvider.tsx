"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/locales";
import "@/lib/i18n/zodCustomErrorMap";
import { LOCAL_STORAGE_EVENT, getLocalStorageItem } from "@/utils/localStorageUtils";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (typeof document !== "undefined") {
      document.documentElement.lang = i18n.language || "zh-CN";
    }

    const handleLanguageChanged = (lng: string) => {
      if (typeof document !== "undefined") {
        document.documentElement.lang = lng;
      }
    };
    i18n.on("languageChanged", handleLanguageChanged);

    const syncLanguage = (newLang: string | null) => {
      if (newLang && newLang !== i18n.language && (newLang === "en" || newLang.startsWith("zh"))) {
        i18n.changeLanguage(newLang);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "litellm_ui_lang" && e.newValue) {
        syncLanguage(e.newValue);
      }
    };

    const onCustomStorage = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === "litellm_ui_lang") {
        syncLanguage(getLocalStorageItem("litellm_ui_lang"));
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_STORAGE_EVENT, onCustomStorage);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_STORAGE_EVENT, onCustomStorage);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18nProvider;

