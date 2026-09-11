"use client";

import { Globe } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("zh") ? "zh-CN" : "en";
  const nextLang = currentLang === "zh-CN" ? "en" : "zh-CN";
  const label = currentLang === "zh-CN" ? "Switch to English" : "切换为简体中文";

  const toggleLanguage = () => {
    i18n.changeLanguage(nextLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("litellm_ui_lang", nextLang);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className="h-8 w-auto gap-1 px-2 text-xs font-medium text-muted-foreground"
      onClick={toggleLanguage}
    >
      <Globe className="size-3.5 shrink-0" />
      <span>{currentLang === "zh-CN" ? "中" : "EN"}</span>
    </Button>
  );
};

export default LanguageToggle;
