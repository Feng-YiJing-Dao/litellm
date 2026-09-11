import { renderWithProviders, screen } from "../../tests/test-utils";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Navbar from "./navbar";
import SidebarAccountMenu from "./SidebarAccountMenu/SidebarAccountMenu";
import DashboardHeader from "./DashboardHeader";

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: vi.fn(() => ({
    logoUrl: null,
    logoUrlDark: null,
  })),
}));

vi.mock("@/components/networking", () => ({
  getProxyBaseUrl: vi.fn().mockReturnValue("https://proxy.example.com"),
  switchToWorkerUrl: vi.fn(),
  exchangeLoginCode: vi.fn(),
}));

vi.mock("@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails", () => ({
  useHealthReadinessDetails: vi.fn(() => ({
    data: { litellm_version: "1.99.0" },
  })),
}));

vi.mock("@/app/(dashboard)/hooks/proxySettings/useProxySettings", () => ({
  default: vi.fn(() => ({
    PROXY_LOGOUT_URL: "https://example.com/logout",
  })),
}));

vi.mock("@/app/(dashboard)/hooks/useDisableBouncingIcon", () => ({
  useDisableBouncingIcon: vi.fn(() => false),
}));

vi.mock("@/app/(dashboard)/hooks/useDisableShowPrompts", () => ({
  useDisableShowPrompts: vi.fn(() => false),
}));

vi.mock("@/app/(dashboard)/hooks/useDisableBlogPosts", () => ({
  useDisableBlogPosts: vi.fn(() => false),
}));

vi.mock("@/app/(dashboard)/hooks/useDisableShowNewBadge", () => ({
  useDisableShowNewBadge: vi.fn(() => false),
}));

vi.mock("@/hooks/useWorker", () => ({
  useWorker: vi.fn(() => ({
    isControlPlane: false,
    selectedWorker: null,
    workers: [],
    selectWorker: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/ui/api-keys"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

describe("White-label branding and link suppression", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("should suppress bouncing moon and official blog/community links in Navbar when white-labeled", () => {
    process.env.NEXT_PUBLIC_WHITE_LABEL = "true";
    process.env.NEXT_PUBLIC_BRAND_NAME = "Enterprise Gateway";

    renderWithProviders(<Navbar accessToken="token" isPublicPage={false} />);

    // Brand alt text should be updated
    expect(screen.getByAltText("Enterprise Gateway Brand")).toBeInTheDocument();

    // Bouncing moon should be suppressed
    expect(screen.queryByTitle(/Thanks for using/i)).not.toBeInTheDocument();

    // Community links should be suppressed
    expect(screen.queryByRole("link", { name: /github/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /slack/i })).not.toBeInTheDocument();
  });

  it("should suppress bouncing palm tree and official release notes link in SidebarAccountMenu when white-labeled", async () => {
    process.env.NEXT_PUBLIC_WHITE_LABEL = "true";
    process.env.NEXT_PUBLIC_BRAND_NAME = "Enterprise Gateway";

    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();

    renderWithProviders(<SidebarAccountMenu onLogout={vi.fn()} />);

    // Open account menu
    const trigger = screen.getByRole("button", { name: /account menu/i });
    await user.click(trigger);

    // Brand name should be displayed
    expect(screen.getByText("Enterprise Gateway")).toBeInTheDocument();

    // Bouncing palm tree should be suppressed
    expect(screen.queryByTitle(/Thanks for using/i)).not.toBeInTheDocument();

    // Version badge should exist but not link to docs.litellm.ai
    expect(screen.getByText(/v1\.99\.0/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /v1\.99\.0/ })).not.toBeInTheDocument();
  });

  it("should suppress official blog and community links in DashboardHeader when white-labeled", () => {
    process.env.NEXT_PUBLIC_WHITE_LABEL = "true";
    process.env.NEXT_PUBLIC_BRAND_NAME = "Enterprise Gateway";

    renderWithProviders(<DashboardHeader />);

    // Community engagement buttons should be hidden
    expect(screen.queryByRole("link", { name: /slack/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /github/i })).not.toBeInTheDocument();
  });

  it("should filter out learning-resources external link in leftnav when white-labeled", async () => {
    const Sidebar = (await import("./leftnav")).default;

    // First render with default (not white-labeled)
    delete process.env.NEXT_PUBLIC_WHITE_LABEL;
    delete process.env.NEXT_PUBLIC_BRAND_NAME;

    const { unmount } = renderWithProviders(
      <Sidebar setPage={vi.fn()} userRole="Admin" defaultOpen={true} />
    );

    expect(screen.getByText("Learning Resources")).toBeInTheDocument();
    unmount();

    // Now render with white-label enabled
    process.env.NEXT_PUBLIC_WHITE_LABEL = "true";
    process.env.NEXT_PUBLIC_BRAND_NAME = "Enterprise Gateway";

    renderWithProviders(
      <Sidebar setPage={vi.fn()} userRole="Admin" defaultOpen={true} />
    );

    expect(screen.queryByText("Learning Resources")).not.toBeInTheDocument();
  });
});
