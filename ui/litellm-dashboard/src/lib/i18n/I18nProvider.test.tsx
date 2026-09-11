import { describe, expect, it } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import I18nProvider from "./I18nProvider";
import i18n from "@/locales";
import { LOCAL_STORAGE_EVENT, setLocalStorageItem, emitLocalStorageChange } from "@/utils/localStorageUtils";

describe("I18nProvider", () => {
  it("synchronizes language when LOCAL_STORAGE_EVENT is emitted", async () => {
    await i18n.changeLanguage("en");

    render(
      <I18nProvider>
        <div>Content</div>
      </I18nProvider>
    );

    expect(document.documentElement.lang).toBe("en");

    act(() => {
      setLocalStorageItem("litellm_ui_lang", "zh-CN");
      emitLocalStorageChange("litellm_ui_lang");
    });

    expect(i18n.language).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");

    // Reset back to en
    await i18n.changeLanguage("en");
  });

  it("synchronizes language when window storage event fires", async () => {
    await i18n.changeLanguage("en");

    render(
      <I18nProvider>
        <div>Content</div>
      </I18nProvider>
    );

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "litellm_ui_lang",
          newValue: "zh-CN",
        })
      );
    });

    expect(i18n.language).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");

    // Reset back to en
    await i18n.changeLanguage("en");
  });
});
