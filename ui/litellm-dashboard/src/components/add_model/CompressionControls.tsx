import { SimpleTooltip } from "@/components/ui/tooltip";
import { SearchSelect, SearchSelectOption } from "@/components/shared/SearchSelect";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useGuardrails } from "@/app/(dashboard)/hooks/guardrails/useGuardrails";
import {
  AutoRouterCompressionState,
  isCompressionGuardrailProvider,
  NO_COMPRESSION,
} from "./buildAutoRouterCompression";

interface CompressionControlsProps {
  value: AutoRouterCompressionState;
  onChange: (state: AutoRouterCompressionState) => void;
}

const CompressionControls: React.FC<CompressionControlsProps> = ({ value, onChange }) => {
  const { t } = useTranslation(["models"]);
  const { routing, sameAsRouting, model } = value;
  const onRoutingChange = (newRouting: string | undefined) =>
    onChange({ ...value, routing: newRouting, sameAsRouting: newRouting === undefined ? true : sameAsRouting });
  const onSameAsRoutingChange = (newSameAsRouting: boolean) => onChange({ ...value, sameAsRouting: newSameAsRouting });
  const onModelChange = (newModel: string | undefined) => onChange({ ...value, model: newModel });

  const noneOption: SearchSelectOption = {
    label: t("models:compression_controls.none_option", "None (no compression)"),
    value: NO_COMPRESSION,
  };

  const { data } = useGuardrails();
  const compressionOptions: SearchSelectOption[] = (data?.guardrails ?? [])
    .filter((g) => isCompressionGuardrailProvider(g.litellm_params?.guardrail))
    .map((g) => ({ label: g.guardrail_name, value: g.guardrail_name }));
  const options: SearchSelectOption[] = [noneOption, ...compressionOptions];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium">
            {t("models:compression_controls.routing_decision", "Routing decision")}
          </span>
          <SimpleTooltip
            content={t(
              "models:compression_controls.routing_decision_tooltip",
              "Compression applied to the classifier's own call that picks a tier, separate from the model the request routes to.",
            )}
          >
            <Info className="size-4 text-muted-foreground" />
          </SimpleTooltip>
        </div>
        <SearchSelect
          options={options}
          value={routing ?? ""}
          onValueChange={(value) => onRoutingChange(value === "" ? undefined : value)}
          placeholder={t(
            "models:compression_controls.inherit_placeholder",
            "Inherit from the request's own compression guardrails",
          )}
          emptyText={t("models:compression_controls.no_guardrails_found", "No compression guardrails found")}
          aria-label="Routing decision compression"
        />
      </div>

      {routing !== undefined && (
        <div>
          <span className="mb-2 block text-sm font-medium">
            {t("models:compression_controls.model_call", "Model call")}
          </span>
          <RadioGroup
            value={sameAsRouting ? "same" : "different"}
            onValueChange={(value: unknown) => onSameAsRoutingChange(value === "same")}
            className="w-full"
          >
            <div className="flex w-full flex-col items-start gap-2">
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="same" className="mt-0.5" />
                <span>{t("models:compression_controls.same_as_routing", "Same as the routing decision")}</span>
              </Label>
              <Label className="items-start font-normal leading-normal">
                <RadioGroupItem value="different" className="mt-0.5" />
                <span>{t("models:compression_controls.different_compression", "Use a different compression")}</span>
              </Label>
            </div>
          </RadioGroup>

          {!sameAsRouting && (
            <div className="mt-3">
              <SearchSelect
                options={options}
                value={model ?? ""}
                onValueChange={(value) => onModelChange(value === "" ? undefined : value)}
                placeholder={t("models:compression_controls.none_option", "None (no compression)")}
                emptyText={t("models:compression_controls.no_guardrails_found", "No compression guardrails found")}
                aria-label="Model call compression"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompressionControls;
