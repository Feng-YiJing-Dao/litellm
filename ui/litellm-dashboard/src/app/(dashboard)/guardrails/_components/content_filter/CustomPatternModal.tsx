import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_ITEMS } from "./action_options";

interface CustomPatternModalProps {
  visible: boolean;
  patternName: string;
  patternRegex: string;
  patternAction: "BLOCK" | "MASK";
  onNameChange: (name: string) => void;
  onRegexChange: (regex: string) => void;
  onActionChange: (action: "BLOCK" | "MASK") => void;
  onAdd: () => void;
  onCancel: () => void;
}

const CustomPatternModal: React.FC<CustomPatternModalProps> = ({
  visible,
  patternName,
  patternRegex,
  patternAction,
  onNameChange,
  onRegexChange,
  onActionChange,
  onAdd,
  onCancel,
}) => {
  const { t } = useTranslation("guardrails");

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {t("content_filter.add_custom_pattern", { defaultValue: "Add custom regex pattern" })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="font-semibold">{t("content_filter.pattern_name", { defaultValue: "Pattern name" })}</p>
            <Input
              className="mt-2"
              placeholder={t("content_filter.pattern_name_placeholder", {
                defaultValue: "e.g., internal_id, employee_code",
              })}
              value={patternName}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>

          <div>
            <p className="font-semibold">{t("content_filter.regex_pattern", { defaultValue: "Regex pattern" })}</p>
            <Input
              className="mt-2"
              placeholder={t("content_filter.regex_placeholder", { defaultValue: "e.g., ID-[0-9]{6}" })}
              value={patternRegex}
              onChange={(e) => onRegexChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("content_filter.regex_hint", {
                defaultValue: "Enter a valid regular expression to match sensitive data",
              })}
            </p>
          </div>

          <div>
            <p className="font-semibold">{t("content_filter.action", { defaultValue: "Action" })}</p>
            <p className="mt-1 mb-2 text-muted-foreground">
              {t("content_filter.action_hint", {
                defaultValue: "Choose what action the guardrail should take when this pattern is detected",
              })}
            </p>
            <Select
              items={ACTION_ITEMS}
              value={patternAction}
              onValueChange={(value: string | null) => value && onActionChange(value as "BLOCK" | "MASK")}
            >
              <SelectTrigger className="w-full" aria-label="Action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t("content_filter.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={onAdd}>{t("content_filter.add", { defaultValue: "Add" })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomPatternModal;
