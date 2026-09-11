import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCommon from "./zh-CN/common.json";
import zhNav from "./zh-CN/nav.json";
import zhKeys from "./zh-CN/keys.json";
import zhModels from "./zh-CN/models.json";
import zhUsage from "./zh-CN/usage.json";
import zhLogs from "./zh-CN/logs.json";
import zhTeams from "./zh-CN/teams.json";
import zhUsers from "./zh-CN/users.json";
import zhSettings from "./zh-CN/settings.json";
import zhValidation from "./zh-CN/validation.json";

import enCommon from "./en/common.json";
import enNav from "./en/nav.json";
import enKeys from "./en/keys.json";
import enModels from "./en/models.json";
import enUsage from "./en/usage.json";
import enLogs from "./en/logs.json";
import enTeams from "./en/teams.json";
import enUsers from "./en/users.json";
import enSettings from "./en/settings.json";
import enValidation from "./en/validation.json";

export const defaultNS = "common";
export const resources = {
  "zh-CN": {
    common: zhCommon,
    nav: zhNav,
    keys: zhKeys,
    models: zhModels,
    usage: zhUsage,
    logs: zhLogs,
    teams: zhTeams,
    users: zhUsers,
    settings: zhSettings,
    validation: zhValidation,
  },
  en: {
    common: enCommon,
    nav: enNav,
    keys: enKeys,
    models: enModels,
    usage: enUsage,
    logs: enLogs,
    teams: enTeams,
    users: enUsers,
    settings: enSettings,
    validation: enValidation,
  },
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: isTest ? "en" : undefined,
    fallbackLng: isTest ? "en" : "zh-CN",
    defaultNS,
    supportedLngs: ["zh-CN", "en"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "litellm_ui_lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
