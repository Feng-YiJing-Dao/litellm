import React from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert, Info } from "lucide-react";
import { z } from "zod/v4";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import { useZodForm } from "@/lib/forms/useZodForm";

type OnboardingFormBodyProps = {
  variant: "signup" | "reset_password";
  userEmail: string;
  isPending: boolean;
  claimError: string | null;
  onSubmit: (values: { password: string }) => void;
};

const onboardingSchema = z.object({
  password: z.string().min(1, "password required to sign up"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export function OnboardingFormBody({ variant, userEmail, isPending, claimError, onSubmit }: OnboardingFormBodyProps) {
  const { t } = useTranslation(["common"]);
  const form = useZodForm(onboardingSchema, { defaultValues: { password: "" } });
  const emailFieldId = React.useId();
  const isResetPassword = variant === "reset_password";
  const actionLabel = isResetPassword
    ? t("onboarding.reset_password", { defaultValue: "Reset Password" })
    : t("onboarding.sign_up", { defaultValue: "Sign Up" });

  const handleSubmit = (values: OnboardingFormValues) => onSubmit({ password: values.password });

  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Card>
        <CardContent>
          <h5 className="text-center mb-5 text-base font-semibold text-foreground">
            {t("brand_name", { defaultValue: "🚅 LiteLLM" })}
          </h5>
          <h3 className="text-2xl font-semibold text-foreground">{actionLabel}</h3>
          <p className="text-sm text-foreground">
            {isResetPassword
              ? t("onboarding.reset_password_desc", { defaultValue: "Reset your password to access Admin UI." })
              : t("onboarding.claim_account_desc", { defaultValue: "Claim your user account to login to Admin UI." })}
          </p>

          {variant === "signup" && (
            <Alert className="mt-4" variant="info">
              <Info />
              <AlertTitle>{t("onboarding.sso", { defaultValue: "SSO" })}</AlertTitle>
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>{t("onboarding.sso_enterprise", { defaultValue: "SSO is under the Enterprise Tier." })}</span>
                  <Button size="sm" variant="outline" disabled className="cursor-default">
                    {t("onboarding.get_free_trial", { defaultValue: "Enterprise Feature" })}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form className="mt-10 mb-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={emailFieldId}>
                  {t("onboarding.email_address", { defaultValue: "Email Address" })}
                </FieldLabel>
                <Input id={emailFieldId} type="email" value={userEmail} readOnly disabled />
              </Field>

              <FormField
                control={form.control}
                name="password"
                label={t("onboarding.password", { defaultValue: "Password" })}
                description={
                  isResetPassword
                    ? t("onboarding.enter_new_password", { defaultValue: "Enter your new password" })
                    : t("onboarding.create_password_desc", { defaultValue: "Create a password for your account" })
                }
              >
                {({ ref, ...field }) => <PasswordInput {...field} ref={ref} />}
              </FormField>
            </FieldGroup>

            {claimError && (
              <Alert variant="error" className="mt-6 mb-4">
                <CircleAlert />
                <AlertTitle>{claimError}</AlertTitle>
              </Alert>
            )}

            <div className="mt-10">
              <Button type="submit" variant="outline" disabled={isPending}>
                {isPending && (
                  <UiLoadingSpinner
                    className="size-4"
                    role="img"
                    aria-label={t("loading", { defaultValue: "loading" })}
                  />
                )}
                {actionLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
