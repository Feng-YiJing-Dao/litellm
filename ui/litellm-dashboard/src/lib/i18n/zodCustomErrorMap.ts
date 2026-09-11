import { z, type ZodErrorMap, ZodIssueCode } from "zod";
import i18n from "@/locales";
import type zhValidation from "@/locales/zh-CN/validation.json";

type ValidationKey = keyof typeof zhValidation;

export const customZodErrorMap: ZodErrorMap = (issue, ctx) => {
  const t = (key: ValidationKey, opt?: Record<string, unknown>): string => i18n.t(`validation:${key}` as any, opt);

  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === "undefined") {
        return { message: t("required_field") };
      }
      return { message: t("invalid_type", { expected: issue.expected, received: issue.received }) };
    case ZodIssueCode.too_small:
      if (issue.type === "string") {
        return { message: t("min_length", { min: issue.minimum }) };
      }
      if (issue.type === "number") {
        return { message: t("min_value", { min: issue.minimum }) };
      }
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: t("max_length", { max: issue.maximum }) };
      }
      if (issue.type === "number") {
        return { message: t("max_value", { max: issue.maximum }) };
      }
      break;
    case ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { message: t("invalid_email") };
      if (issue.validation === "url") return { message: t("invalid_url") };
      return { message: t("invalid_string") };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customZodErrorMap);
