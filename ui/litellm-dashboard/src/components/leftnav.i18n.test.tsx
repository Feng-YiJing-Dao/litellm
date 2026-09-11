import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderWithProviders, screen } from "../../tests/test-utils";
import Sidebar from "./leftnav";
import i18n from "@/locales";

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    logoUrl: null,
    logoUrlDark: null,
    faviconUrl: null,
    setLogoUrl: vi.fn(),
    setLogoUrlDark: vi.fn(),
    setFaviconUrl: vi.fn(),
  }),
}));

vi.mock("@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails", () => ({
  useHealthReadinessDetails: () => ({ data: undefined }),
}));

vi.mock("@/app/(dashboard)/hooks/useLogout", () => ({
  useLogout: () => vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/useAuthorized", () => ({
  default: () => ({
    userId: "test-user-id",
    accessToken: "test-access-token",
    userRole: "Admin",
    isViewOnly: false,
  }),
}));

vi.mock("@/app/(dashboard)/hooks/teams/useTeams", () => ({
  useTeams: () => ({ data: [], isLoading: false }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/ui/api-keys",
}));

describe("Sidebar i18n", () => {
  it("renders localized group labels and menu items when language is zh-CN", async () => {
    await i18n.changeLanguage("zh-CN");

    const defaultProps = {
      collapsed: false,
      onToggleCollapsed: () => {},
      enabledPagesInternalUsers: null,
      enableProjectsUI: true,
      disableAgentsForInternalUsers: false,
      allowAgentsForTeamAdmins: true,
      disableVectorStoresForInternalUsers: false,
      allowVectorStoresForTeamAdmins: true,
    };

    renderWithProviders(<Sidebar {...defaultProps} />);

    expect(screen.getByText("AI 网关")).toBeInTheDocument();
    expect(screen.getByText("可观测性")).toBeInTheDocument();
    expect(screen.getByText("访问控制")).toBeInTheDocument();
    expect(screen.getByText("虚拟密钥")).toBeInTheDocument();
    expect(screen.getByText("模型与终端")).toBeInTheDocument();

    // Reset language to en
    await i18n.changeLanguage("en");
  });
});
