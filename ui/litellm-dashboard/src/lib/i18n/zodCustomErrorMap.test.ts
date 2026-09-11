import { describe, expect, it } from "vitest";
import { z } from "zod";
import i18n from "@/locales";
import "./zodCustomErrorMap";

describe("zodCustomErrorMap", () => {
  it("translates validation errors into localized messages", async () => {
    await i18n.changeLanguage("zh-CN");

    const schema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
      age: z.number().min(18),
    });

    const result = schema.safeParse({ name: "a", email: "invalid", age: 10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      expect(messages).toContain("长度不能少于 3 个字符");
      expect(messages).toContain("请输入有效的电子邮箱地址");
      expect(messages).toContain("数值不能小于 18");
    }

    // Reset back to en
    await i18n.changeLanguage("en");
  });
});
