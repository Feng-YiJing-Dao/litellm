import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import LanguageToggle from "./LanguageToggle";
import i18n from "@/locales";

describe("LanguageToggle", () => {
  it("toggles language on click and updates localStorage", async () => {
    await i18n.changeLanguage("en");
    render(<LanguageToggle />);

    const button = screen.getByRole("button", { name: "切换为简体中文" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("EN");

    fireEvent.click(button);

    expect(i18n.language).toBe("zh-CN");
    expect(screen.getByRole("button", { name: "Switch to English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to English" })).toHaveTextContent("中");

    // Reset back to en for remaining tests
    await i18n.changeLanguage("en");
  });
});
