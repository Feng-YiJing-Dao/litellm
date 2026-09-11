import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import DashboardHeader from "./DashboardHeader";
import i18n from "@/locales";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ui/models-and-endpoints",
}));

vi.mock("@/hooks/useWorker", () => ({
  useWorker: () => ({ isControlPlane: false, selectedWorker: null }),
}));

vi.mock("@/app/(dashboard)/hooks/useDisableShowPrompts", () => ({
  useDisableShowPrompts: () => false,
}));

vi.mock("@/components/Navbar/BlogDropdown/BlogDropdown", () => ({
  BlogDropdown: () => null,
}));

vi.mock("@/components/Navbar/CommunityEngagementButtons/CommunityEngagementButtons", () => ({
  CommunityEngagementButtons: () => null,
}));

vi.mock("@/components/Navbar/NotificationsBell/NotificationsBell", () => ({
  NotificationsBell: () => null,
}));

vi.mock("@/components/Navbar/WorkerDropdown/WorkerDropdown", () => ({
  default: () => null,
}));

vi.mock("@/components/Navbar/ViewSwitcher", () => ({
  default: () => <div data-testid="view-switcher" />,
}));

vi.mock("@/components/ThemeToggle/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle" />,
}));

describe("DashboardHeader i18n", () => {
  it("renders localized breadcrumb when language is zh-CN", async () => {
    await i18n.changeLanguage("zh-CN");
    render(<DashboardHeader />);

    expect(screen.getByText("模型与终端")).toBeInTheDocument();

    // Reset language
    await i18n.changeLanguage("en");
  });
});
