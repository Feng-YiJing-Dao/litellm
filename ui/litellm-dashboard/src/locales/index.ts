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
import zhPlayground from "./zh-CN/playground.json";
import zhAgents from "./zh-CN/agents.json";
import zhWorkflows from "./zh-CN/workflows.json";
import zhMemory from "./zh-CN/memory.json";
import zhMcp from "./zh-CN/mcp.json";
import zhGuardrails from "./zh-CN/guardrails.json";
import zhCaching from "./zh-CN/caching.json";
import zhBudgets from "./zh-CN/budgets.json";
import zhRouter from "./zh-CN/router.json";
import zhOrganizations from "./zh-CN/organizations.json";
import zhProjects from "./zh-CN/projects.json";
import zhAccessGroups from "./zh-CN/accessGroups.json";
import zhSkills from "./zh-CN/skills.json";
import zhPolicies from "./zh-CN/policies.json";
import zhTools from "./zh-CN/tools.json";
import zhCosts from "./zh-CN/costs.json";
import zhAdmin from "./zh-CN/admin.json";
import zhPrompts from "./zh-CN/prompts.json";

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
import enPlayground from "./en/playground.json";
import enAgents from "./en/agents.json";
import enWorkflows from "./en/workflows.json";
import enMemory from "./en/memory.json";
import enMcp from "./en/mcp.json";
import enGuardrails from "./en/guardrails.json";
import enCaching from "./en/caching.json";
import enBudgets from "./en/budgets.json";
import enRouter from "./en/router.json";
import enOrganizations from "./en/organizations.json";
import enProjects from "./en/projects.json";
import enAccessGroups from "./en/accessGroups.json";
import enSkills from "./en/skills.json";
import enPolicies from "./en/policies.json";
import enTools from "./en/tools.json";
import enCosts from "./en/costs.json";
import enAdmin from "./en/admin.json";
import enPrompts from "./en/prompts.json";

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
    playground: zhPlayground,
    agents: zhAgents,
    workflows: zhWorkflows,
    memory: zhMemory,
    mcp: zhMcp,
    guardrails: zhGuardrails,
    caching: zhCaching,
    budgets: zhBudgets,
    router: zhRouter,
    organizations: zhOrganizations,
    projects: zhProjects,
    accessGroups: zhAccessGroups,
    skills: zhSkills,
    policies: zhPolicies,
    tools: zhTools,
    costs: zhCosts,
    admin: zhAdmin,
    prompts: zhPrompts,
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
    playground: enPlayground,
    agents: enAgents,
    workflows: enWorkflows,
    memory: enMemory,
    mcp: enMcp,
    guardrails: enGuardrails,
    caching: enCaching,
    budgets: enBudgets,
    router: enRouter,
    organizations: enOrganizations,
    projects: enProjects,
    accessGroups: enAccessGroups,
    skills: enSkills,
    policies: enPolicies,
    tools: enTools,
    costs: enCosts,
    admin: enAdmin,
    prompts: enPrompts,
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
