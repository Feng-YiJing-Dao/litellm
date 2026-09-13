import { SearchSelect } from "@/components/shared/SearchSelect";
import React from "react";
import { useTranslation } from "react-i18next";
import { ENDPOINT_OPTIONS } from "./chatConstants";

interface EndpointSelectorProps {
  endpointType: string; // Accept string to avoid type conflicts
  onEndpointChange: (value: string) => void;
  className?: string;
}

const EndpointSelector: React.FC<EndpointSelectorProps> = ({ endpointType, onEndpointChange, className }) => {
  const { t } = useTranslation(["playground", "common"]);
  return (
    <div className={className}>
      <SearchSelect
        value={endpointType}
        onValueChange={onEndpointChange}
        options={ENDPOINT_OPTIONS}
        placeholder={t("playground:select_endpoint", { defaultValue: "Select an endpoint" })}
      />
    </div>
  );
};

export default EndpointSelector;
