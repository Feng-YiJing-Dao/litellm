"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BotIcon, InfoIcon, LayersIcon, ServerIcon } from "lucide-react";
import * as React from "react";

import { accessGroupKeys } from "@/app/(dashboard)/hooks/accessGroups/useAccessGroups";
import { useAgents } from "@/app/(dashboard)/hooks/agents/useAgents";
import { useMCPServers } from "@/app/(dashboard)/hooks/mcpServers/useMCPServers";
import { ModelSelect } from "@/components/ModelSelect/ModelSelect";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useZodForm } from "@/lib/forms/useZodForm";
import { fetchClient } from "@/lib/http/api";

import { buildAccessGroupCreateBody, emptyAccessGroupFormValues, type AccessGroupCreateBody } from "./mapper";
import { accessGroupCreateSchema } from "./schema";

const GENERAL_TAB = "general";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
}

const MultiSelect = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: MultiSelectProps) => (
  <Select multiple items={options} value={value} onValueChange={onChange}>
    <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className="w-full">
      <SelectValue placeholder={placeholder}>
        {(selected: string[]) =>
          selected.length === 0
            ? placeholder
            : options
                .filter((option) => selected.includes(option.value))
                .map((option) => option.label)
                .join(", ")
        }
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const defaultCreateAccessGroup = async (body: AccessGroupCreateBody): Promise<unknown> => {
  const { data } = await fetchClient.POST("/v1/access_group", { body });
  return data;
};

interface AccessGroupCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createAccessGroup?: (body: AccessGroupCreateBody) => Promise<unknown>;
}

export const AccessGroupCreateDialog = ({
  open,
  onOpenChange,
  createAccessGroup = defaultCreateAccessGroup,
}: AccessGroupCreateDialogProps) => {
  const { t } = useTranslation(["accessGroups", "common"]);
  const queryClient = useQueryClient();
  const form = useZodForm(accessGroupCreateSchema, { defaultValues: emptyAccessGroupFormValues });
  const [activeTab, setActiveTab] = React.useState(GENERAL_TAB);

  const { data: agentsData } = useAgents();
  const { data: mcpServersData } = useMCPServers();

  const mcpServerOptions = (mcpServersData ?? []).map((server) => ({
    value: server.server_id,
    label: server.server_name ?? server.server_id,
  }));
  const agentOptions = (agentsData?.agents ?? []).map((agent) => ({
    value: agent.agent_id,
    label: agent.agent_name,
  }));

  const closeAndReset = () => {
    form.reset(emptyAccessGroupFormValues);
    setActiveTab(GENERAL_TAB);
    onOpenChange(false);
  };

  const mutation = useMutation({
    mutationFn: (body: AccessGroupCreateBody) => createAccessGroup(body),
    onSuccess: () => {
      toast.success(t("accessGroups:create_dialog.created_success", { defaultValue: "Access group created successfully" }));
      queryClient.invalidateQueries({ queryKey: accessGroupKeys.all });
      closeAndReset();
    },
    onError: (error: unknown) =>
      toast.fromError(
        error instanceof Error
          ? error.message
          : t("accessGroups:create_dialog.create_failed", { defaultValue: "Failed to create access group" }),
      ),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && mutation.isPending) return;
    if (!nextOpen) {
      form.reset(emptyAccessGroupFormValues);
      setActiveTab(GENERAL_TAB);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      if (mutation.isPending) return;
      mutation.mutate(buildAccessGroupCreateBody(values));
    },
    // the only validated field (name) lives on the General Info tab
    () => setActiveTab(GENERAL_TAB),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("accessGroups:create_dialog.title", { defaultValue: "Create Access Group" })}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value={GENERAL_TAB}>
                <InfoIcon />
                {t("accessGroups:form.tabs.general", { defaultValue: "General Info" })}
              </TabsTrigger>
              <TabsTrigger value="models">
                <LayersIcon />
                {t("accessGroups:form.tabs.models", { defaultValue: "Models" })}
              </TabsTrigger>
              <TabsTrigger value="mcp-servers">
                <ServerIcon />
                {t("accessGroups:form.tabs.mcp_servers", { defaultValue: "MCP Servers" })}
              </TabsTrigger>
              <TabsTrigger value="agents">
                <BotIcon />
                {t("accessGroups:form.tabs.agents", { defaultValue: "Agents" })}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={GENERAL_TAB} className="pt-4">
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="name"
                  label={t("accessGroups:form.group_name", { defaultValue: "Group Name" })}
                >
                  {({ ref, ...field }) => (
                    <Input
                      {...field}
                      ref={ref}
                      placeholder={t("accessGroups:form.group_name_placeholder", { defaultValue: "e.g. Engineering Team" })}
                    />
                  )}
                </FormField>
                <FormField
                  control={form.control}
                  name="description"
                  label={t("accessGroups:form.description", { defaultValue: "Description" })}
                >
                  {({ ref, ...field }) => (
                    <Textarea
                      {...field}
                      ref={ref}
                      rows={4}
                      placeholder={t("accessGroups:form.description_placeholder", {
                        defaultValue: "Describe the purpose of this access group...",
                      })}
                    />
                  )}
                </FormField>
              </FieldGroup>
            </TabsContent>

            <TabsContent value="models" className="pt-4">
              <FormField
                control={form.control}
                name="modelIds"
                label={t("accessGroups:form.allowed_models", { defaultValue: "Allowed Models" })}
              >
                {(field) => <ModelSelect context="global" value={field.value} onChange={field.onChange} />}
              </FormField>
            </TabsContent>

            <TabsContent value="mcp-servers" className="pt-4">
              <FormField
                control={form.control}
                name="mcpServerIds"
                label={t("accessGroups:form.allowed_mcp", { defaultValue: "Allowed MCP Servers" })}
              >
                {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                  <MultiSelect
                    id={id}
                    value={value}
                    onChange={onChange}
                    options={mcpServerOptions}
                    placeholder={t("accessGroups:form.select_mcp", { defaultValue: "Select MCP servers" })}
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedBy}
                  />
                )}
              </FormField>
            </TabsContent>

            <TabsContent value="agents" className="pt-4">
              <FormField
                control={form.control}
                name="agentIds"
                label={t("accessGroups:form.allowed_agents", { defaultValue: "Allowed Agents" })}
              >
                {({ id, value, onChange, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy }) => (
                  <MultiSelect
                    id={id}
                    value={value}
                    onChange={onChange}
                    options={agentOptions}
                    placeholder={t("accessGroups:form.select_agents", { defaultValue: "Select agents" })}
                    aria-invalid={ariaInvalid}
                    aria-describedby={ariaDescribedBy}
                  />
                )}
              </FormField>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t("common:cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? t("accessGroups:create_dialog.submitting", { defaultValue: "Creating..." })
                : t("accessGroups:create_dialog.submit", { defaultValue: "Create Group" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
