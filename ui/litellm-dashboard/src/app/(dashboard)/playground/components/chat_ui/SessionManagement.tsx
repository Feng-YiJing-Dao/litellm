import React from "react";
import { Copy, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EndpointType } from "@/components/chat_ui/mode_endpoint_mapping";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionManagementProps {
  endpointType: string;
  responsesSessionId: string | null;
  useApiSessionManagement: boolean;
  onToggleSessionManagement: (useApi: boolean) => void;
}

const SessionManagement: React.FC<SessionManagementProps> = ({
  endpointType,
  responsesSessionId,
  useApiSessionManagement,
  onToggleSessionManagement,
}) => {
  const { t } = useTranslation(["playground"]);

  if (endpointType !== EndpointType.RESPONSES) {
    return null;
  }

  const handleCopySessionId = async () => {
    if (responsesSessionId) {
      try {
        await navigator.clipboard.writeText(responsesSessionId);
        toast.success(t("playground:session.copied", { defaultValue: "Response ID copied to clipboard!" }));
      } catch {
        toast.error(t("playground:session.copy_failed", { defaultValue: "Unable to copy response ID" }));
      }
    }
  };

  const getSessionDisplay = () => {
    if (!responsesSessionId) {
      return useApiSessionManagement
        ? t("playground:session.api_ready", { defaultValue: "API Session: Ready" })
        : t("playground:session.ui_ready", { defaultValue: "UI Session: Ready" });
    }

    const sessionPrefix = useApiSessionManagement
      ? t("playground:session.response_id", { defaultValue: "Response ID" })
      : t("playground:session.ui_session", { defaultValue: "UI Session" });
    const truncatedId = responsesSessionId.slice(0, 10);
    return `${sessionPrefix}: ${truncatedId}...`;
  };

  const getSessionDescription = () => {
    if (!responsesSessionId) {
      return useApiSessionManagement
        ? t("playground:session.api_desc_ready", {
            defaultValue: "LiteLLM will manage session using previous_response_id",
          })
        : t("playground:session.ui_desc_ready", { defaultValue: "UI will manage session using chat history" });
    }

    return useApiSessionManagement
      ? t("playground:session.api_desc_active", {
          defaultValue: "LiteLLM API session active - context maintained server-side",
        })
      : t("playground:session.ui_desc_active", {
          defaultValue: "UI session active - context maintained client-side",
        });
  };

  return (
    <div className="mb-4">
      {/* Session Management Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {t("playground:session.title", { defaultValue: "Session Management" })}
          </span>
          <Tooltip>
            <TooltipTrigger aria-label={t("playground:session.about_aria", { defaultValue: "About session management" })}>
              <Info className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {t("playground:session.tooltip", {
                defaultValue:
                  "Choose between LiteLLM API session management (using previous_response_id) or UI-based session management (using chat history)",
              })}
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true">UI</span>
          <Switch
            checked={useApiSessionManagement}
            onCheckedChange={onToggleSessionManagement}
            aria-label={t("playground:session.toggle_aria", { defaultValue: "Use API session management" })}
            size="sm"
          />
          <span aria-hidden="true">API</span>
        </div>
      </div>

      {/* Session Status Indicator */}
      <div
        className={`text-xs p-2 rounded-md ${
          responsesSessionId
            ? "bg-success/10 text-success border border-success/20"
            : "bg-info/10 text-info border border-info/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Info className="size-3" />
            {getSessionDisplay()}
          </div>
          {responsesSessionId && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopySessionId}
                    aria-label={t("playground:session.copy_aria", { defaultValue: "Copy response ID" })}
                    className="ml-2 hover:bg-success/15"
                  />
                }
              >
                <Copy className="size-3" />
              </TooltipTrigger>
              <TooltipContent className="max-w-lg">
                <div className="text-xs">
                  <div className="mb-1">
                    {t("playground:session.continue_session", { defaultValue: "Copy response ID to continue session:" })}
                  </div>
                  <div className="bg-gray-800 text-gray-100 p-2 rounded-sm font-mono text-xs whitespace-pre-wrap">
                    {`curl -X POST "your-proxy-url/v1/responses" \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model",
    "input": [{"role": "user", "content": "your message", "type": "message"}],
    "previous_response_id": "${responsesSessionId}",
    "stream": true
  }'`}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">{getSessionDescription()}</div>
      </div>
    </div>
  );
};

export default SessionManagement;
