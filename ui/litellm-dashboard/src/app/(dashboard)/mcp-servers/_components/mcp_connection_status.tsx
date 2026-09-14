import React from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, CircleAlert, RefreshCw, Wrench, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";

interface MCPConnectionStatusProps {
  formValues: Record<string, any>;
  tools: any[];
  isLoadingTools: boolean;
  toolsError: string | null;
  toolsErrorStatus?: number | null;
  toolsErrorStackTrace: string | null;
  canFetchTools: boolean;
  fetchTools: () => Promise<void>;
}

const MCPConnectionStatus: React.FC<MCPConnectionStatusProps> = ({
  formValues,
  tools,
  isLoadingTools,
  toolsError,
  toolsErrorStatus = null,
  toolsErrorStackTrace,
  canFetchTools,
  fetchTools,
}) => {
  const { t } = useTranslation("mcp");
  const isPreviewForbidden = toolsErrorStatus === 403;
  // Don't show anything if required fields aren't filled
  if (!canFetchTools && !formValues.url && !formValues.spec_path) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CircleCheck className="size-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">
            {t("connection_status.title", { defaultValue: "Connection Status" })}
          </h3>
        </div>

        {!canFetchTools && (formValues.url || formValues.spec_path) && (
          <div className="rounded-lg border border-dashed py-6 text-center text-muted-foreground">
            <Wrench className="mx-auto mb-2 size-6" />
            <p className="text-sm">
              {t("connection_status.complete_required", { defaultValue: "Complete required fields to test connection" })}
            </p>
            <p className="text-sm">
              {t("connection_status.fill_in_prompt", {
                defaultValue: "Fill in URL, Transport, and Authentication to test MCP server connection",
              })}
            </p>
          </div>
        )}

        {canFetchTools && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isLoadingTools
                    ? t("connection_status.testing", { defaultValue: "Testing connection to MCP server..." })
                    : tools.length > 0
                      ? t("connection_status.successful", { defaultValue: "Connection successful" })
                      : toolsError
                        ? isPreviewForbidden
                          ? t("connection_status.ready_to_submit", { defaultValue: "Ready to submit" })
                          : t("connection_status.failed", { defaultValue: "Connection failed" })
                        : t("connection_status.ready_to_test", { defaultValue: "Ready to test connection" })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("connection_status.server", {
                    target: formValues.url || formValues.spec_path,
                    defaultValue: `Server: ${formValues.url || formValues.spec_path}`,
                  })}
                </p>
              </div>

              {isLoadingTools && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UiLoadingSpinner className="size-4" />
                  <p className="text-sm">{t("connection_status.connecting", { defaultValue: "Connecting..." })}</p>
                </div>
              )}

              {!isLoadingTools && !toolsError && tools.length > 0 && (
                <div className="flex items-center gap-1">
                  <CircleCheck className="size-4" />
                  <p className="text-sm font-medium">{t("connection_status.connected", { defaultValue: "Connected" })}</p>
                </div>
              )}

              {toolsError && !isPreviewForbidden && (
                <div className="flex items-center gap-1 text-destructive">
                  <CircleAlert className="size-4" />
                  <p className="text-sm font-medium">{t("connection_status.failed_short", { defaultValue: "Failed" })}</p>
                </div>
              )}
            </div>

            {isLoadingTools && (
              <div className="flex items-center justify-center gap-3 py-6">
                <UiLoadingSpinner className="size-6 text-muted-foreground" />
                <p className="text-sm">
                  {t("connection_status.testing_loading_tools", {
                    defaultValue: "Testing connection and loading tools...",
                  })}
                </p>
              </div>
            )}

            {toolsError && isPreviewForbidden && (
              <Alert>
                <Info />
                <AlertTitle>
                  {t("connection_status.preview_unavailable", { defaultValue: "Tool preview unavailable" })}
                </AlertTitle>
                <AlertDescription>{toolsError}</AlertDescription>
              </Alert>
            )}

            {toolsError && !isPreviewForbidden && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>{t("connection_status.failed_title", { defaultValue: "Connection Failed" })}</AlertTitle>
                <AlertDescription>
                  <div>{toolsError}</div>
                  {toolsErrorStackTrace && (
                    <Collapsible className="mt-3">
                      <CollapsibleTrigger
                        render={
                          <Button variant="link" size="sm" className="h-auto p-0">
                            {t("connection_status.stack_trace", { defaultValue: "Stack Trace" })}
                          </Button>
                        }
                      />
                      <CollapsibleContent>
                        <pre className="mt-2 max-h-100 overflow-auto rounded-sm bg-muted p-2 font-mono text-xs break-words whitespace-pre-wrap">
                          {toolsErrorStackTrace}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </AlertDescription>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={fetchTools}>
                    <RefreshCw />
                    {t("connection_status.retry", { defaultValue: "Retry" })}
                  </Button>
                </div>
              </Alert>
            )}

            {!isLoadingTools && tools.length === 0 && !toolsError && (
              <div className="rounded-lg border border-dashed py-6 text-center">
                <CircleCheck className="mx-auto mb-2 size-6" />
                <p className="text-sm font-medium">
                  {t("connection_status.successful_no_tools", { defaultValue: "Connection successful!" })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("connection_status.no_tools_found", {
                    defaultValue: "No tools found for this MCP server",
                  })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MCPConnectionStatus;
