# LiteLLM Proxy UI 本地化 (i18n)、企业品牌定制 (White-label) 与上游同步完整实施方案

---

## 1. 架构现状与核心约束深度分析

LiteLLM 的管理后台（Admin Dashboard）位于 `ui/litellm-dashboard`，是一个高度专业化的大模型网关管理系统。在对代码库源码、测试套件（Vitest 4.1 + 6,700+ 测试用例）、编译流水线及 Docker 运行时容器进行全面实测与静态分析后，我们总结出以下核心架构与技术约束：

### 1.1 前端技术栈与编译约束
- **核心框架**：Next.js 16.3.3 (Turbopack) + React 19.2.8 + TypeScript 5.9.3。
- **构建目标**：`next.config.mjs` 中显式配置 `output: "export"`，编译为纯静态 HTML/JS/CSS 文件输出至 `out/` 目录（完全无 Node.js 服务端运行时）。
- **资源路径与路由**：配置了 `assetPrefix: "/litellm-asset-prefix"` 和 `trailingSlash: true`。静态导出意味着**不能依赖 Next.js 服务端中间件（Middleware）或服务端动态重写（`/[locale]/...`）进行多语言分发**，所有语言切换与持久化必须完全在客户端（Client-Side）由前端状态管理接管。
- **UI 与状态管理栈**：Tailwind CSS 4、Base UI / Radix 原语、TanStack Query v5、TanStack Table v8、React Hook Form v7 + Zod 3.25.76。

### 1.2 运行时交付与代理服务架构
- **静态资源托管机制**：LiteLLM Python 代理服务在 `litellm/proxy/proxy_server.py` 中挂载 FastAPI，前端静态产物 `out/` 在官方镜像中存放于 `/app/litellm/proxy/_experimental/out`，直接由 Python FastAPI 静态目录对外托管。
- **全量重构的代价**：官方完整镜像基于 Python 3.13、`uv` 同步大量依赖、Prisma 引擎及 C 扩展编译，从零构建镜像需要 15~30 分钟。而前端 Next.js 构建仅需约 30~45 秒。因此，必须将前端定制与 Python 运行层解耦，实现轻量级交付。

### 1.3 核心测试套件约束（重点规避回归隐患）
在本项目中，前端拥有严格的单元与组件测试守卫：
1. **`src/components/leftnav.test.tsx`**：第 597-623 行严格断言了 `getBreadcrumb` 函数的返回值（例如 `expect(getBreadcrumb("/ui/api-keys")).toEqual({ section: "AI Gateway", title: "Virtual Keys" })`）。若直接修改 `getBreadcrumb` 输出为中文，会导致该测试直接失败！
2. **`src/components/page_utils.test.ts`**：严格检查 `menuGroups` 中的每一个 `page` 是否在 `src/components/page_metadata.ts` 的 `pageDescriptions` 中存在映射，并且禁止出现孤立描述（Orphaned Descriptions）。若直接从 `menuGroups` 数组中物理删除菜单项（如 `learning-resources`），会导致孤立描述断言失败！
3. **改造准则**：必须采用**展示层国际化（Presentation-Layer i18n）**策略，数据元结构保持原有英文标识与键名，在组件渲染边界（Render Phase）调用 `t(key, fallback)` 动态汉化，确保现有核心逻辑与测试套件 100% 兼容。

### 1.4 i18n 适用边界清晰化（界面文案 vs 接口报错与日志）
根据管理后台作为“企业大模型中转站”的运维与开发者定位，明确划分国际化边界，**不盲目全量翻译，保障排障精准度**：

| 范畴 | 是否做 i18n | 具体内容与规范 |
| :--- | :---: | :--- |
| **前端用户界面 (UI)** | **✅ 是** | 侧边栏/顶部导航、页面标题、表格列头、操作按钮（创建/编辑/删除/导出）、表单标签、输入框占位符、Tooltip 提示、前端静态校验提示、业务状态标签（已启用/已禁用/已过期等）。 |
| **接口报错信息 (API Errors)** | **❌ 否** | 保持原始返回（如 `RateLimitError`, `context_window_exceeded`, `AuthenticationError`, `model_not_found`, HTTP 429/500 等）。便于开发与运维人员直接精准检索官方文档与上游日志。 |
| **审计与日志原始 Payload** | **❌ 否** | 请求日志（Logs）抽屉中的 Prompt、Completion、Request/Response Headers、Raw JSON 严格保持原样展示，不进行任何翻译介入。 |
| **系统运行时日志与异常堆栈** | **❌ 否** | 后端 FastAPI / LiteLLM 抛出的 Python Traceback 与错误日志保持原生英文。 |
| **技术标识与参数名** | **❌ 否** | `tpm`, `rpm`, 模型唯一标识（如 `gpt-4o`, `deepseek-chat`）, `bearer`, HTTP Method 等行业标准词汇保持原样。 |

---

## 2. 方案一：前端国际化 (i18n) 完整落地方案

### 2.1 技术选型：`i18next` + `react-i18next` + `i18next-browser-languagedetector`
在 React 19 + Next.js `output: 'export'` 体系下：
- **为什么不选 Next-Intl**：Next-Intl 深度耦合 Next.js App Router 的服务端功能与路由动态重写（`/[locale]/page`），在静态导出模式下会导致所有静态 HTML 需要为每个语言生成完整路由副本，增加复杂度并破坏外部已有的系统直链。
- **`react-i18next` 的优势**：行业成熟度最高，完美适配 React 19 Client Components；支持多命名空间按需分块；支持浏览器语言与 LocalStorage 自动侦测；零服务端依赖，在客户端完成文本替换，保持 URL 路由纯净稳定。

### 2.2 依赖引入规范
在 `ui/litellm-dashboard` 中安装兼容 React 19 的依赖：
```bash
npm install i18next@^24.2.2 react-i18next@^15.4.1 i18next-browser-languagedetector@^8.0.2
```

### 2.3 目录结构设计 (`ui/litellm-dashboard/src/locales`)
采用**模块化命名空间（Namespaces）**划分词条，避免单个文件臃肿并方便协同维护：

```
ui/litellm-dashboard/src/
├── locales/
│   ├── index.ts                   # i18n 初始化配置与导出
│   ├── types.ts                   # 强类型定义 (提供 IDE 自动补全)
│   ├── zh-CN/                     # 简体中文语言包
│   │   ├── common.json            # 通用操作 (保存、取消、删除、复制、状态、分页等)
│   │   ├── nav.json               # 侧边栏与头部导航 (菜单分组、面包屑、Tab)
│   │   ├── keys.json              # 虚拟密钥页面 (创建密钥、额度、模型权限、过期)
│   │   ├── models.json            # 模型与终端 (添加模型、网关路由、凭证管理)
│   │   ├── usage.json             # 用量与成本分析 (Token消耗、费用图表、筛选器)
│   │   ├── logs.json              # 审计日志 (请求追踪、延迟、Payload 查看器)
│   │   ├── teams.json             # 团队协作与配额管理
│   │   ├── users.json             # 用户管理与权限角色
│   │   ├── settings.json          # 系统设置、路由策略、警报与通知
│   │   └── validation.json        # 表单与 Zod 校验提示
│   └── en/                        # 英文基准语言包 (结构对称)
│       ├── common.json
│       ├── nav.json
│       └── ...
└── lib/
    └── i18n/
        ├── I18nProvider.tsx       # React 客户端 Provider
        └── zodCustomErrorMap.ts   # 全局 Zod 错误消息汉化映射器
```

### 2.4 关键实现代码与设计

#### 1) 初始化配置 (`src/locales/index.ts`)
```typescript
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

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN", // 默认优先简体中文
    defaultNS,
    interpolation: {
      escapeValue: false, // React 已具备防 XSS 能力
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "litellm_ui_lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
```

#### 2) TypeScript 强类型增强 (`src/locales/types.ts`)
```typescript
import "i18next";
import type { resources, defaultNS } from "./index";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["zh-CN"];
  }
}
```
*优势*：业务组件中使用 `useTranslation("keys")` 时，`t("create_key")` 会拥有 IDE 路径与键名的严格自动推导及拼写检查。

#### 3) 全局 Provider 与水合保护 (`src/lib/i18n/I18nProvider.tsx`)
```tsx
"use client";

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/locales";
import "@/lib/i18n/zodCustomErrorMap"; // 自动激活 Zod 全局汉化

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 同步更新 html 标签的 lang 属性
    if (typeof document !== "undefined") {
      document.documentElement.lang = i18n.language || "zh-CN";
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
```
在 `src/app/layout.tsx` 中挂载：
```tsx
<NuqsAdapter>
  <I18nProvider>
    <ReactQueryProvider>
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
    </ReactQueryProvider>
  </I18nProvider>
</NuqsAdapter>
```

#### 4) Zod 表单校验消息统一汉化 (`src/lib/i18n/zodCustomErrorMap.ts`)
LiteLLM 的所有表单均通过 `src/lib/forms/useZodForm.ts` 结合 Zod 进行验证。通过注入全局 Zod Error Map，即可在零侵入现有 Schema 代码的前提下，全量汉化表单校验提示：
```typescript
import { z, ZodErrorMap, ZodIssueCode } from "zod";
import i18n from "@/locales";

export const customZodErrorMap: ZodErrorMap = (issue, ctx) => {
  const t = (key: string, opt?: Record<string, unknown>) =>
    i18n.t(`validation:${key}`, opt);

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
      break;
  }
  return { message: ctx.defaultError };
};

// 全局注册
z.setErrorMap(customZodErrorMap);
```

#### 5) 导航菜单无破坏汉化适配 (`src/components/leftnav.tsx` & `DashboardHeader.tsx`)
为保证 `src/components/leftnav.test.tsx` 和 `page_utils.test.ts` 原有测试绝对不崩：
1. `menuGroups` 数组中的基础数据（`groupLabel: "AI GATEWAY"`, `label: "Virtual Keys"`）保持原生英文结构不变。
2. 在 `leftnav.tsx` 的渲染逻辑中，针对分组标题和菜单项进行翻译包装：
   ```tsx
   // 分组标题
   <SidebarGroupLabel>{t(`nav.groups.${group.groupLabel}`, group.groupLabel)}</SidebarGroupLabel>
   
   // 菜单项
   const displayLabel = typeof item.label === "string" 
     ? t(`nav.items.${item.key}`, item.label) 
     : item.label;
   ```
3. 在 `DashboardHeader.tsx` 的面包屑渲染中：
   ```tsx
   const { section, title } = getBreadcrumb(usePathname());
   const localizedTitle = t(`nav.breadcrumbs.${title}`, { defaultValue: title });
   ...
   <BreadcrumbPage className="truncate">{localizedTitle}</BreadcrumbPage>
   ```

---

## 3. 方案二：企业品牌定制 (White-label Branding) 替代方案

为满足私有化交付、内网部署与企业自研平台统一品牌的诉求，我们需要彻底清理官方外链、支持完全自定义 Logo 与标题。

### 3.1 深度移除官方外链与社区导流组件（全面审计清单）

经过对代码库的全面排查，以下 8 个核心文件存在官方导流和品牌标识，均需彻底改造：

| 模块文件 | 原始组件 / 内容 | 改造方案 |
| :--- | :--- | :--- |
| `src/app/layout.tsx` | `<title>LiteLLM Dashboard</title>`, `description: "LiteLLM Proxy Admin UI"` | 替换为环境变量注入的品牌名称（如 `NEXT_PUBLIC_BRAND_NAME`） |
| `src/app/login/LoginPage.tsx` | `🚅 LiteLLM` (L225)、`Access your LiteLLM Admin UI.`、官方 UI 文档外链 | 替换为自研平台名称，文档外链指向内部知识库或隐藏 |
| `src/components/leftnav.tsx` | `v{version}` Badge 带有 `https://docs.litellm.ai/release_notes` 外链 (L619) | 移除外链 `<a>` 标签，改为纯展示当前版本号的 `<Badge>` |
| `src/components/SidebarAccountMenu/SidebarAccountMenu.tsx` | `LiteLLM` 文本 (L172)、`🌴` 跳动椰子树 (L174)、Release Notes 外链 (L187) | 替换为企业品牌名称，移除跳动动画及外部 Release Notes 链接 |
| `src/components/navbar.tsx` | `🌑` 跳动月亮 (L107)、`Thanks for using LiteLLM!`、Release Notes 外链 | 彻底移除该 DOM 节点及相关动画与外链 |
| `src/components/DashboardHeader.tsx` | `<DocsLink />`、`<BlogDropdown />`、`<CommunityEngagementButtons />` | 隐藏或条件化渲染；移除 Slack / GitHub 社区按钮与官方博客轮询 |
| `src/components/Navbar/NotificationsBell/NotificationsBell.tsx` | 硬编码的 `LiteLLM Auto Router` 营销弹窗及 docs 外链 | 替换为系统通知中心或隐藏促销 Popover |
| `src/components/Navbar/BlogDropdown/BlogDropdown.tsx` | 轮询 `/public/litellm_blog_posts` 及 `https://docs.litellm.ai/blog` 外链 | 关闭自动网络轮询请求，屏蔽官方博客展示 |

### 3.2 静态资源替换与品牌资产管理
1. **网站图标 (Favicon)**：
   - 替换 `ui/litellm-dashboard/public/favicon.ico` 与 `ui/litellm-dashboard/src/app/favicon.ico`。
   - 替换后端静态托管兜底文件 `litellm/proxy/favicon.ico`。
2. **Logo 资产标准目录**：
   - 新建 `ui/litellm-dashboard/public/brand/`：
     - `logo-light.svg` (浅色主题 Logo)
     - `logo-dark.svg` (深色主题 Logo)
     - `logo-mark.svg` (折叠侧边栏时展示的紧凑单图标)
3. **零代码运行时配置支持（复用 LiteLLM 现有机制）**：
   LiteLLM 原生内置了 `/get/ui_theme_settings` 接口，支持通过环境变量直接在运行时覆盖品牌 Logo：
   - `UI_LOGO_PATH`: 浅色 Logo URL 或本地绝对路径。
   - `UI_LOGO_PATH_DARK`: 深色 Logo URL 或本地绝对路径。
   - `LITELLM_FAVICON_URL`: Favicon 直链。

---

## 4. 方案三：轻量级镜像打包与上游无缝同步策略

### 4.1 核心解耦架构：多阶段轻量重构 Dockerfile
我们不应该每次都重新编译 Python 运行时环境，而应利用官方发布的稳定镜像作为基础底座，仅通过两阶段构建替换静态前端资产：

新建项目根目录 `Dockerfile.branded`：
```dockerfile
# ==========================================
# 阶段 1: 仅构建经过汉化和品牌定制的前端 UI
# ==========================================
FROM node:24-alpine AS ui-builder

ENV NEXT_TELEMETRY_DISABLED=1 \
    npm_config_fund=false \
    npm_config_audit=false

WORKDIR /app

# 优先利用 Docker 缓存层
COPY ui/litellm-dashboard/package.json ui/litellm-dashboard/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# 拷贝前端代码并打包出静态 out 目录
COPY ui/litellm-dashboard/ ./
RUN npm run build

# ==========================================
# 阶段 2: 注入官方已编译就绪的 Python 运行时
# ==========================================
FROM docker.litellm.ai/berriai/litellm:main-stable AS runtime

USER root

# 替换 Python 后端静态托管目录
RUN rm -rf /app/litellm/proxy/_experimental/out
COPY --from=ui-builder /app/out/. /app/litellm/proxy/_experimental/out/

EXPOSE 4000

# 沿用官方原有 Entrypoint
ENTRYPOINT ["docker/prod_entrypoint.sh"]
CMD ["--port", "4000"]
```

#### 构建收益：
1. **构建极速**：全流程仅需 **30~60 秒**（无需重新下载 2GB+ Python 工具链、构建 Rust/C 扩展与编译 Prisma）。
2. **极低冲突率**：定制范围严格限定在 `ui/litellm-dashboard/` 内部，完全不改动任何核心 Python 网关代码、认证逻辑、路由中间件和数据库迁移文件。
3. **镜像体积可控**：复用官方多架构（ARM64 / AMD64）现成基础层。

### 4.2 本地极速开发验证模式 (Mac 开发环境)
在日常二次开发时，无需每次打包 Docker 镜像，有两种即时验证方式：

- **模式 A（本地静态目录映射，0 秒生效）**：
  在 Mac 上运行 `npm run build` 生成 `ui/litellm-dashboard/out` 目录后，直接在 `docker-compose.yml` 中挂载该目录到运行中容器的托管路径：
  ```yaml
  volumes:
    - ./litellm_config.yaml:/app/config.yaml
    - ./ui/litellm-dashboard/out:/app/litellm/proxy/_experimental/out:ro
  ```
  刷新浏览器 `http://localhost:4000/ui` 即可立即看到最新 UI！
- **模式 B（纯前端 HMR 热更新）**：
  保持当前 Docker 容器作为后端 API 服务（端口 4000），在本地执行：
  ```bash
  cd ui/litellm-dashboard
  export PROXY_BASE_URL="http://localhost:4000"
  npm run dev
  ```
  访问 `http://localhost:3000` 即可享受毫秒级热更新开发。

### 4.3 Git 上游追踪与版本同步工作流 (Upstream Sync)
```
                    ┌───────────────────────────────┐
                    │ upstream/main (BerriAI/litellm) │
                    └───────────────┬───────────────┘
                                    │ git fetch upstream
                                    ▼
┌───────────────────────────────┐   rebase / merge   ┌───────────────────────────────┐
│     main (上游镜像追踪分支)       ├──────────────────►│   brand-custom (定制化分支)     │
└───────────────────────────────┘                    └───────────────┬───────────────┘
                                                                     │ CI/CD 自动触发
                                                                     ▼
                                                     ┌───────────────────────────────┐
                                                     │ 轻量级 Docker 打包与内网镜像发布 │
                                                     └───────────────────────────────┘
```

#### 具体操作规范：
1. **远程仓库配置**：
   ```bash
   git remote add upstream https://github.com/BerriAI/litellm.git
   ```
2. **定制代码边界隔离**：
   所有定制文件收敛在 `ui/litellm-dashboard/src/locales/`、`ui/litellm-dashboard/src/lib/i18n/`、以及微调过的页面展示组件中。
3. **同步周期与验证流程**：
   ```bash
   git checkout main
   git pull upstream main
   git checkout brand-custom
   git merge main -m "chore: sync with upstream $(date +%Y%m%d)"
   
   # 验证测试套件与类型
   cd ui/litellm-dashboard
   npm run test:types
   npm run build
   ```

---

## 5. Mac 本地环境运行实测与避坑指南

本次实测中发现两个影响 Mac 开发者体验的关键点，已在配置中妥善处理并予以记录：

1. **端口冲突规避**：
   Mac 本地可能已存在正在运行的 PostgreSQL (5432) 和 Valkey/Redis (6379)。我们在 `docker-compose.yml` 中将容器映射端口调整为：
   - PostgreSQL 宿主机端口：`5433:5432`（容器内仍为 5432）
   - Redis/Valkey 宿主机端口：`6380:6379`（容器内仍为 6379）
   - LiteLLM Proxy 宿主机端口：`4000:4000`
2. **macOS 终端代理拦截问题（关键避坑）**：
   在 Mac 上配置了 Clash / Surge 等本地代理软件时，终端会默认注入 `http_proxy` / `https_proxy` 环境变量（例如 `http://127.0.0.1:54572`）。
   若直接执行 `curl http://localhost:4000/...`，请求会被外部代理中间件截获并报错 `403 Forbidden: Port 4000 not allowed for HTTP`。
   **正确访问方式**：
   - 终端命令需加上 `--noproxy "*"`，例如：
     ```bash
     curl --noproxy "*" -i http://localhost:4000/health/liveliness
     ```
   - 或在 `~/.zshrc` 中永久配置白名单：
     ```bash
     export no_proxy="localhost,127.0.0.1,0.0.0.0"
     ```
   - 浏览器直接访问 `http://localhost:4000/ui` 则不受影响。
3. **Redis 真实缓存联动配置**：
   在 `litellm_config.yaml` 中需明确指定：
   ```yaml
   litellm_settings:
     telemetry: False
     drop_params: True
     cache: True
     cache_params:
       type: redis
       host: redis
       port: 6379
   ```
   并在 `.env` 中加入 `REDIS_URL=redis://redis:6379`，容器启动时即可自动完成 Redis 缓存挂载与连接池初始化。

---

## 6. 分阶段实施排期与里程碑 (Roadmap)

```
[阶段一: 基础设施与品牌重塑] (1-2天)
  ├─ 引入 i18next 核心依赖与类型系统 (react-i18next, LanguageDetector)
  ├─ 构建 I18nProvider、语言检测与 LocalStorage 持久化
  ├─ 替换 Favicon、Logo、页面标题 (layout.tsx)
  ├─ 改造 LoginPage.tsx，移除官方文档链接与 LiteLLM 标头
  └─ 清理 Header 外部导流链接 (DocsLink, BlogDropdown, CommunityButtons, NotificationsBell)

[阶段二: 导航与全局公共组件汉化] (2天)
  ├─ Sidebar (leftnav.tsx) 菜单项、分组标签汉化 (保持 getBreadcrumb 测试兼容)
  ├─ Header 面包屑与顶部工具栏汉化
  ├─ SidebarAccountMenu.tsx 移除 🌴 跳动动画，修改品牌名
  ├─ DataTable 分页器、行数选择、排序过滤栏汉化
  └─ 注入全局 Zod 错误汉化映射器 (zodCustomErrorMap.ts)

[阶段三: 核心业务页面翻译与联调] (3-4天)
  ├─ 虚拟密钥 (api-keys) 列表、详情与创建弹窗
  ├─ 模型与终端 (models-and-endpoints) 配置与测试表单
  ├─ 用量与成本分析 (usage) 统计指标与时间范围选择器
  ├─ 请求与审计日志 (logs) 字段与请求体展示器
  └─ 团队 (teams) 与用户 (users) 权限控制面板

[阶段四: 自动化打包与发布体系] (1天)
  ├─ 编写 Dockerfile.branded 两阶段极速构建脚本
  ├─ 配置 docker-compose 本地挂载验证模式
  ├─ 编写 upstream 同步校验流水线 (npm run test:types && npm run build)
  └─ 输出团队私有化镜像交付文档
```
