"use client";

import { useLogin } from "@/app/(dashboard)/hooks/login/useLogin";
import { useUIConfig } from "@/app/(dashboard)/hooks/uiConfig/useUIConfig";
import LoadingScreen from "@/components/common_components/LoadingScreen";
import LanguageToggle from "@/components/LanguageToggle/LanguageToggle";
import "@/locales";
import { exchangeLoginCode, getProxyBaseUrl, switchToWorkerUrl } from "@/components/networking";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";
import { clearTokenCookies, getCookieFromDocument } from "@/utils/cookieUtils";
import { isJwtExpired } from "@/utils/jwtUtils";
import { consumeReturnUrl, getLoginUrl, getReturnUrl, isValidReturnUrl } from "@/utils/returnUrlUtils";
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import type { TFunction } from "i18next";
import { z } from "zod/v4";
import { useWorker } from "@/hooks/useWorker";

const createLoginSchema = (t: TFunction) =>
  z.object({
    username: z.string().min(1, t("login.username_required")),
    password: z.string().min(1, t("login.password_required")),
  });

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

function SsoEnabledNotice() {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  if (dismissed) {
    return null;
  }

  return (
    <Alert variant="info" className="mt-4">
      <Info />
      <AlertTitle>
        <Trans
          i18nKey="login.sso_enabled_notice"
          components={{
            code1: <code className="bg-muted px-1 py-0.5 rounded-sm text-xs" />,
          }}
        >
          Single Sign-On (SSO) is enabled. LiteLLM no longer automatically redirects to the SSO login flow upon loading
          this page. To re-enable auto-redirect-to-SSO, set{" "}
          <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">AUTO_REDIRECT_UI_LOGIN_TO_SSO=true</code> in your
          environment configuration.
        </Trans>
      </AlertTitle>
      <AlertAction>
        <Button variant="ghost" size="icon-sm" aria-label={t("close", "Close")} onClick={() => setDismissed(true)}>
          <X className="size-4" />
        </Button>
      </AlertAction>
    </Alert>
  );
}

function LoginPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { data: uiConfig, isLoading: isConfigLoading } = useUIConfig();
  const loginMutation = useLogin();
  const router = useRouter();
  const { workers, selectWorker } = useWorker();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const workerFieldId = useId();
  const { t } = useTranslation(["common", "validation"]);
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const form = useZodForm(loginSchema, { defaultValues: { username: "", password: "" } });

  // When language changes, re-trigger validation if the form was already submitted
  // so that active validation error messages update dynamically to the new language
  useEffect(() => {
    if (form.formState.submitCount > 0) {
      void form.trigger();
    }
  }, [t, form]);

  // Pre-select worker from URL param (e.g. /ui/login?worker=team-b)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const workerParam = params.get("worker");
    if (workerParam) {
      setSelectedWorkerId(workerParam);
    }
  }, []);

  useEffect(() => {
    if (isConfigLoading) {
      return;
    }

    // Check if admin UI is disabled
    if (uiConfig && uiConfig.admin_ui_disabled) {
      setIsLoading(false);
      return;
    }

    // Cross-origin SSO: worker redirected back with a single-use code.
    // Exchange it for the JWT via the worker's /v3/login/exchange endpoint.
    const params = new URLSearchParams(window.location.search);
    const rawSsoCode = params.get("code");
    // Validate the SSO code is a plausible OAuth authorization code (alphanumeric
    // plus common URL-safe chars) so that arbitrary user input cannot trigger the
    // exchange endpoint.
    const ssoCode = rawSsoCode && /^[a-zA-Z0-9._~+/=-]+$/.test(rawSsoCode) ? rawSsoCode : null;
    if (ssoCode) {
      const rawWorkerUrl = localStorage.getItem("litellm_worker_url");
      // Validate the stored worker URL: only allow http(s) URLs.
      const workerUrl = rawWorkerUrl && /^https?:\/\/.+/.test(rawWorkerUrl) ? rawWorkerUrl : null;
      exchangeLoginCode(ssoCode, workerUrl).then(() => {
        params.delete("code");
        const cleanSearch = params.toString();
        window.history.replaceState(null, "", window.location.pathname + (cleanSearch ? `?${cleanSearch}` : ""));
        router.replace("/ui/?login=success");
      });
      return;
    }

    // If switching workers on a control plane, clear the old token and show login
    const switchingWorker = params.has("worker");
    if (switchingWorker && uiConfig?.is_control_plane) {
      clearTokenCookies();
      setIsLoading(false);
      return;
    }

    const rawToken = getCookieFromDocument("token");
    if (rawToken && !isJwtExpired(rawToken)) {
      // User already logged in - redirect to return URL or default
      const returnUrl = consumeReturnUrl();
      if (returnUrl) {
        router.replace(returnUrl);
      } else {
        router.replace("/ui");
      }
      return;
    }

    if (uiConfig && uiConfig.auto_redirect_to_sso) {
      // For SSO, pass the return URL to the SSO endpoint
      const returnUrl = getReturnUrl();
      let ssoUrl = `${getProxyBaseUrl()}/sso/key/generate`;
      if (returnUrl && isValidReturnUrl(returnUrl)) {
        ssoUrl += `?redirect_to=${encodeURIComponent(returnUrl)}`;
      }
      router.push(ssoUrl);
      return;
    }

    setIsLoading(false);
  }, [isConfigLoading, router, uiConfig]);

  const handleSubmit = ({ username, password }: LoginFormValues) => {
    // If a worker is selected, point proxyBaseUrl at it before login
    const selectedWorker = workers.find((w) => w.worker_id === selectedWorkerId);
    if (selectedWorker) {
      switchToWorkerUrl(selectedWorker.url);
    }

    loginMutation.mutate(
      { username, password, useV3: !!selectedWorker },
      {
        onSuccess: (data) => {
          // Update the worker context with the selected worker
          if (selectedWorker) {
            selectWorker(selectedWorker.worker_id);
            // Stay on the CP's UI — proxyBaseUrl already points at the worker
            router.push("/ui/?login=success");
          } else {
            // Normal (non-control-plane) login — follow the server's redirect
            const returnUrl = consumeReturnUrl();
            if (returnUrl) {
              router.push(returnUrl);
            } else {
              router.push(data.redirect_url);
            }
          }
        },
        onError: () => {
          // Reset proxyBaseUrl on login failure
          if (selectedWorker) {
            switchToWorkerUrl(null);
          }
        },
      },
    );
  };

  const error = loginMutation.error instanceof Error ? loginMutation.error.message : null;
  const isLoginLoading = loginMutation.isPending;

  if (isConfigLoading || isLoading) {
    return <LoadingScreen />;
  }

  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "LiteLLM";
  const isWhiteLabeled = process.env.NEXT_PUBLIC_WHITE_LABEL === "true" || !!process.env.NEXT_PUBLIC_BRAND_NAME;
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.litellm.ai/docs/proxy/ui";

  // Show disabled message if admin UI is disabled
  if (uiConfig && uiConfig.admin_ui_disabled) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>
        <Card className="w-full max-w-lg shadow-md">
          <CardContent>
            <div className="flex w-full flex-col gap-4">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-foreground">{brandName}</h2>
              </div>

              <Alert variant="warning">
                <TriangleAlert />
                <AlertTitle>{t("login.admin_ui_disabled_title")}</AlertTitle>
                <AlertDescription>
                  <p className="text-sm">{t("login.admin_ui_disabled_desc")}</p>
                  <p className="mt-2 text-sm">
                    <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">DISABLE_ADMIN_UI=False</code>
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-lg shadow-md">
        <CardContent>
          <TooltipProvider>
            <div className="flex w-full flex-col gap-4">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-foreground">{brandName}</h2>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-semibold text-foreground">{t("login.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("login.subtitle", { brandName })}</p>
              </div>

              {!uiConfig?.hide_default_credentials_hint && (
                <Alert variant="info">
                  <Info />
                  <AlertTitle>{t("login.default_credentials_title")}</AlertTitle>
                  <AlertDescription>
                    <p className="text-sm">
                      <Trans
                        i18nKey="login.default_credentials_desc"
                        values={{ brandName }}
                        components={{
                          code1: <code className="bg-muted px-1 py-0.5 rounded-sm text-xs" />,
                          code2: <code className="bg-muted px-1 py-0.5 rounded-sm text-xs" />,
                        }}
                      >
                        By default, Username is <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">admin</code>{" "}
                        and Password is your set {brandName} Proxy{" "}
                        <code className="bg-muted px-1 py-0.5 rounded-sm text-xs">MASTER_KEY</code>.
                      </Trans>
                    </p>
                    <p className="mt-2 text-sm">
                      {t("login.need_credentials_or_sso")}{" "}
                      {!isWhiteLabeled || !!process.env.NEXT_PUBLIC_DOCS_URL ? (
                        <a
                          href={docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          {t("login.see_documentation")}
                        </a>
                      ) : (
                        <span>{t("login.contact_admin")}</span>
                      )}
                      .
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="error">
                  <CircleAlert />
                  <AlertTitle>{t("login.login_failed")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <FieldGroup>
                  {uiConfig?.is_control_plane && workers.length > 0 && (
                    <Field>
                      <FieldLabel htmlFor={workerFieldId}>{t("login.worker")}</FieldLabel>
                      <Select
                        items={workers.map((worker) => ({ label: worker.name, value: worker.worker_id }))}
                        value={selectedWorkerId}
                        onValueChange={(value: string | null) => setSelectedWorkerId(value)}
                      >
                        <SelectTrigger id={workerFieldId} className="h-10 w-full">
                          <SelectValue placeholder={t("login.choose_worker")} />
                        </SelectTrigger>
                        <SelectContent>
                          {workers.map((worker) => (
                            <SelectItem key={worker.worker_id} value={worker.worker_id}>
                              {worker.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}

                  <FormField control={form.control} name="username" label={t("login.username")}>
                    {({ ref, ...field }) => (
                      <Input
                        {...field}
                        ref={ref}
                        placeholder={t("login.enter_username")}
                        autoComplete="username"
                        disabled={isLoginLoading}
                        className="h-10 rounded-md"
                      />
                    )}
                  </FormField>

                  <FormField control={form.control} name="password" label={t("login.password")}>
                    {({ ref, ...field }) => (
                      <PasswordInput
                        {...field}
                        ref={ref}
                        placeholder={t("login.enter_password")}
                        autoComplete="current-password"
                        disabled={isLoginLoading}
                        groupClassName="h-10"
                      />
                    )}
                  </FormField>

                  <Button type="submit" size="lg" disabled={isLoginLoading} className="w-full">
                    {isLoginLoading && <UiLoadingSpinner className="size-4" role="img" aria-label="loading" />}
                    {isLoginLoading ? t("login.logging_in") : t("login.sign_in")}
                  </Button>

                  {!uiConfig?.sso_configured ? (
                    <Tooltip>
                      <TooltipTrigger render={<span className="block w-full" />}>
                        <Button type="button" variant="outline" size="lg" disabled className="w-full">
                          {t("login.login_with_sso")}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("login.configure_sso_tooltip")}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={isLoginLoading || (!!selectedWorkerId && workers.length === 0)}
                      onClick={() => {
                        const selectedWorker = workers.find((w) => w.worker_id === selectedWorkerId);
                        if (selectedWorker) {
                          // Store worker selection so useWorker hook restores it after redirect
                          localStorage.setItem("litellm_selected_worker_id", selectedWorkerId!);
                          switchToWorkerUrl(selectedWorker.url);
                        }
                        // SSO on the worker (or this instance if no worker), always
                        // include return_to so the callback redirects back here
                        const ssoBase = selectedWorker?.url ?? getProxyBaseUrl();
                        const returnTo = encodeURIComponent(getLoginUrl(window.location.origin));
                        router.push(`${ssoBase}/sso/key/generate?return_to=${returnTo}`);
                      }}
                      className="w-full"
                    >
                      {t("login.login_with_sso")}
                    </Button>
                  )}
                </FieldGroup>
              </form>
            </div>
            {uiConfig?.sso_configured && <SsoEnabledNotice />}
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
