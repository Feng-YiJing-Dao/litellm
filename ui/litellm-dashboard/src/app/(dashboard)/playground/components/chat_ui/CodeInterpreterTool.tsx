import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Code, Info, TriangleAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CodeInterpreterToolProps {
  accessToken: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  selectedContainerId: string | null;
  onContainerChange: (containerId: string | null) => void;
  selectedModel: string;
  disabled?: boolean;
}

const isOpenAIModel = (model: string): boolean => {
  if (!model) return false;
  const lowerModel = model.toLowerCase();
  return (
    lowerModel.startsWith("openai/") ||
    lowerModel.startsWith("gpt-") ||
    lowerModel.startsWith("o1") ||
    lowerModel.startsWith("o3") ||
    lowerModel.includes("openai")
  );
};

const CodeInterpreterTool: React.FC<CodeInterpreterToolProps> = ({
  enabled,
  onEnabledChange,
  selectedModel,
  disabled = false,
}) => {
  const { t } = useTranslation(["playground"]);
  const isOpenAI = isOpenAIModel(selectedModel);
  const isDisabled = disabled || !isOpenAI;

  const handleToggle = (checked: boolean) => {
    if (checked && !isOpenAI) {
      toast.warning(
        t("code_interpreter_tool.only_openai_toast", {
          defaultValue: "Code Interpreter is only available for OpenAI models",
        }),
      );
      return;
    }
    onEnabledChange(checked);
  };

  return (
    <div className="border border-border rounded-lg p-3 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="size-4 text-info" />
          <span className="font-medium text-foreground">
            {t("code_interpreter_tool.title", { defaultValue: "Code Interpreter" })}
          </span>
          <Tooltip>
            <TooltipTrigger
              aria-label={t("code_interpreter_tool.info_aria", { defaultValue: "About Code Interpreter" })}
            >
              <Info className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              {t("code_interpreter_tool.tooltip", {
                defaultValue:
                  "Run Python code to generate files, charts, and analyze data. Container is created automatically.",
              })}
            </TooltipContent>
          </Tooltip>
        </div>
        <Switch
          checked={enabled && isOpenAI}
          onCheckedChange={handleToggle}
          disabled={isDisabled}
          size="sm"
          aria-label={t("code_interpreter_tool.switch_aria", { defaultValue: "Enable Code Interpreter" })}
        />
      </div>

      {!isOpenAI && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="text-xs text-muted-foreground">
              <span>
                {t("code_interpreter_tool.only_openai", {
                  defaultValue: "Code Interpreter is currently only supported for OpenAI models.",
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeInterpreterTool;

