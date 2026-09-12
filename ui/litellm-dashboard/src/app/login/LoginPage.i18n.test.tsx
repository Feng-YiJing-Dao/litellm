import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import LoginPage from "./LoginPage";
import i18n from "@/locales";
import { useUIConfig } from "@/app/(dashboard)/hooks/uiConfig/useUIConfig";
import { useLogin } from "@/app/(dashboard)/hooks/login/useLogin";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}));

vi.mock("@/app/(dashboard)/hooks/uiConfig/useUIConfig", () => ({
  useUIConfig: vi.fn(),
}));

vi.mock("@/utils/cookieUtils", () => ({
  clearTokenCookies: vi.fn(),
  getCookieFromDocument: vi.fn(() => null),
}));

vi.mock("@/utils/jwtUtils", () => ({
  isJwtExpired: vi.fn(() => true),
}));

vi.mock("@/components/networking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/networking")>();
  return {
    ...actual,
    getProxyBaseUrl: vi.fn(() => "http://localhost:4000"),
  };
});

vi.mock("@/app/(dashboard)/hooks/login/useLogin", () => ({
  useLogin: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock("@/hooks/useWorker", () => ({
  useWorker: vi.fn(() => ({
    isControlPlane: false,
    workers: [],
    selectedWorkerId: null,
    selectedWorker: null,
    selectWorker: vi.fn(),
    disconnectFromWorker: vi.fn(),
  })),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

describe("LoginPage i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        auto_redirect_to_sso: false,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: true,
      },
      isLoading: false,
    });
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders English UI texts by default", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    expect(screen.getByText(/Access your LiteLLM Admin UI\./i)).toBeInTheDocument();
    expect(screen.getByText("Default Credentials")).toBeInTheDocument();
    expect(screen.getByText(/Need to set UI credentials or SSO\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login with SSO" })).toBeInTheDocument();
  });

  it("renders Chinese UI texts when language is changed to zh-CN", async () => {
    await i18n.changeLanguage("zh-CN");

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    });

    expect(screen.getByText(/访问您的 LiteLLM 管理控制台。/i)).toBeInTheDocument();
    expect(screen.getByText("默认登录凭据")).toBeInTheDocument();
    expect(screen.getByText(/默认用户名为/i)).toBeInTheDocument();
    expect(screen.getByText(/需要配置 UI 凭据或 SSO 单点登录？/i)).toBeInTheDocument();
    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("请输入密码")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "使用 SSO 登录" })).toBeInTheDocument();
  });

  it("toggles language using the LanguageToggle button", async () => {
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    // Language toggle button is present
    const toggleButton = screen.getByRole("button", { name: "切换为简体中文" });
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Switch to English" })).toBeInTheDocument();
    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
  });

  it("displays localized validation error messages in Chinese", async () => {
    await i18n.changeLanguage("zh-CN");
    const user = userEvent.setup();

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByText("请输入密码")).toBeInTheDocument();
  });

  it("displays localized Admin UI Disabled alert when admin_ui_disabled is true", async () => {
    await i18n.changeLanguage("zh-CN");
    (useUIConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        admin_ui_disabled: true,
        server_root_path: "/",
        proxy_base_url: null,
        sso_configured: false,
      },
      isLoading: false,
    });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByText("管理控制台已禁用")).toBeInTheDocument();
    expect(screen.getByText(/管理员已禁用管理控制台。如需重新启用，请更新以下环境变量：/i)).toBeInTheDocument();
  });

  it("displays localized Login Failed alert when loginMutation has an error", async () => {
    await i18n.changeLanguage("zh-CN");
    (useLogin as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      error: new Error("Invalid credentials"),
    });

    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("登录失败")).toBeInTheDocument();
    });

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("updates existing validation error messages when language toggles", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("Please enter your username")).toBeInTheDocument();
    expect(screen.getByText("Please enter your password")).toBeInTheDocument();

    const toggleButton = screen.getByRole("button", { name: "切换为简体中文" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "登录" })).toBeInTheDocument();
    });

    expect(screen.getByText("请输入用户名")).toBeInTheDocument();
    expect(screen.getByText("请输入密码")).toBeInTheDocument();
  });
});
