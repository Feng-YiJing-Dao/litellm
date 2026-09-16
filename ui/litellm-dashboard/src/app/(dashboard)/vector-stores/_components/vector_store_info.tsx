import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { z } from "zod/v4";
import {
  vectorStoreInfoCall,
  vectorStoreUpdateCall,
  credentialListCall,
  CredentialItem,
} from "@/components/networking";
import { VectorStore } from "@/components/vector_store_management/types";
import { Providers, provider_map } from "@/components/provider_info_helpers";
import { getVectorStoreProviderLogoAndName } from "@/components/vector_store_providers";
import { Logo } from "@/components/molecules/logo/Logo";
import VectorStoreTester from "./VectorStoreTester";
import { toast } from "@/lib/toast";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";

interface VectorStoreInfoViewProps {
  vectorStoreId: string;
  onClose: () => void;
  accessToken: string | null;
  is_admin: boolean;
  editVectorStore: boolean;
}

const vectorStoreEditShape = {
  vector_store_id: z.string().min(1, "Please input a vector store ID"),
  vector_store_name: z.string().nullish(),
  vector_store_description: z.string().nullish(),
  custom_llm_provider: z.string().min(1, "Please select a provider"),
  litellm_credential_name: z.string().nullable().optional(),
};

const vectorStoreEditSchema = z.object(vectorStoreEditShape);

type VectorStoreEditValues = z.output<typeof vectorStoreEditSchema>;

const EMPTY_VALUES: VectorStoreEditValues = {
  vector_store_id: "",
  custom_llm_provider: "",
};

const toFormValues = (vectorStore: VectorStore): VectorStoreEditValues => ({
  vector_store_id: vectorStore.vector_store_id,
  vector_store_name: vectorStore.vector_store_name,
  vector_store_description: vectorStore.vector_store_description,
  custom_llm_provider: vectorStore.custom_llm_provider ?? "",
  litellm_credential_name: vectorStore.litellm_credential_name,
});

interface CredentialOption {
  label: string;
  value: string | null;
}

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const VectorStoreInfoView: React.FC<VectorStoreInfoViewProps> = ({
  vectorStoreId,
  onClose,
  accessToken,
  is_admin,
  editVectorStore,
}) => {
  const { t } = useTranslation(["tools", "common"]);
  const form = useZodForm(vectorStoreEditSchema, { defaultValues: EMPTY_VALUES });
  const [vectorStoreDetails, setVectorStoreDetails] = useState<VectorStore | null>(null);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(editVectorStore);
  const [metadataString, setMetadataString] = useState<string>("{}");
  const [credentials, setCredentials] = useState<CredentialItem[]>([]);

  const fetchVectorStoreDetails = async () => {
    if (!accessToken) return;
    try {
      setLoadFailed(false);
      const response = await vectorStoreInfoCall(accessToken, vectorStoreId);
      if (!response || !response.vector_store) {
        setLoadFailed(true);
        return;
      }
      setVectorStoreDetails(response.vector_store);

      if (response.vector_store.vector_store_metadata) {
        const metadata =
          typeof response.vector_store.vector_store_metadata === "string"
            ? JSON.parse(response.vector_store.vector_store_metadata)
            : response.vector_store.vector_store_metadata;
        setMetadataString(JSON.stringify(metadata, null, 2));
      }

      form.reset(toFormValues(response.vector_store));
    } catch (error) {
      console.error("Error fetching vector store details:", error);
      toast.fromError("Error fetching vector store details: " + error);
      setLoadFailed(true);
    }
  };

  const fetchCredentials = async () => {
    if (!accessToken) return;
    try {
      const response = await credentialListCall(accessToken);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    }
  };

  useEffect(() => {
    fetchVectorStoreDetails();
    fetchCredentials();
  }, [vectorStoreId, accessToken]);

  const startEditing = () => {
    if (vectorStoreDetails) {
      form.reset(toFormValues(vectorStoreDetails));
    }
    setIsEditing(true);
  };

  const handleSave = async (values: VectorStoreEditValues) => {
    if (!accessToken) return;
    try {
      let metadata = {};
      try {
        metadata = metadataString ? JSON.parse(metadataString) : {};
      } catch (e) {
        toast.fromError(
          t("tools:vector_stores.form.metadata_invalid", { defaultValue: "Invalid JSON in metadata field" })
        );
        return;
      }

      const updateData = {
        vector_store_id: values.vector_store_id,
        custom_llm_provider: values.custom_llm_provider,
        vector_store_name: values.vector_store_name,
        vector_store_description: values.vector_store_description,
        vector_store_metadata: metadata,
      };

      await vectorStoreUpdateCall(accessToken, updateData);
      toast.success(
        t("tools:vector_stores.info.updated_success", { defaultValue: "Vector store updated successfully" })
      );
      setIsEditing(false);
      fetchVectorStoreDetails();
    } catch (error) {
      console.error("Error updating vector store:", error);
      toast.fromError(
        t("tools:vector_stores.info.updated_failed", { defaultValue: "Error updating vector store: " }) + error
      );
    }
  };

  const credentialOptions: CredentialOption[] = [
    { value: null, label: t("tools:vector_stores.form.credentials_none", { defaultValue: "None" }) },
    ...credentials.map((credential) => ({
      value: credential.credential_name,
      label: credential.credential_name,
    })),
  ];

  if (loadFailed) {
    return (
      <div className="p-4 max-w-full">
        <Button variant="ghost" className="mb-4" onClick={onClose}>
          <ArrowLeft />
          {t("tools:vector_stores.info.back_to_stores", { defaultValue: "Back to Vector Stores" })}
        </Button>
        <h1 className="text-xl font-semibold">
          {t("tools:vector_stores.info.not_found", { defaultValue: "Vector store not found" })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("tools:vector_stores.info.load_failed_desc", {
            id: vectorStoreId,
            defaultValue: `Vector store ${vectorStoreId} could not be loaded. It may have been deleted.`,
          })}
        </p>
      </div>
    );
  }

  if (!vectorStoreDetails) {
    return <div>{t("tools:vector_stores.info.loading", { defaultValue: "Loading..." })}</div>;
  }

  return (
    <div className="p-4 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button variant="ghost" className="mb-4" onClick={onClose}>
            <ArrowLeft />
            {t("tools:vector_stores.info.back_to_stores", { defaultValue: "Back to Vector Stores" })}
          </Button>
          <h1 className="text-xl font-semibold">Vector Store ID: {vectorStoreDetails.vector_store_id}</h1>
          <p className="text-sm text-muted-foreground">
            {vectorStoreDetails.vector_store_description ||
              t("tools:vector_stores.info.no_description", { defaultValue: "No description" })}
          </p>
        </div>
        {is_admin && !isEditing && (
          <Button onClick={startEditing}>
            {t("tools:vector_stores.info.edit_store", { defaultValue: "Edit Vector Store" })}
          </Button>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList variant="line" className="mb-6 h-auto w-full justify-start rounded-none p-0">
          <TabsTrigger value="details" className="flex-none rounded-none px-4 py-2">
            {t("tools:vector_stores.info.tabs_details", { defaultValue: "Details" })}
          </TabsTrigger>
          <TabsTrigger value="test" className="flex-none rounded-none px-4 py-2">
            {t("tools:vector_stores.info.tabs_test", { defaultValue: "Test Vector Store" })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" keepMounted>
          {isEditing ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {t("tools:vector_stores.info.edit_store", { defaultValue: "Edit Vector Store" })}
                </h3>
              </div>
              <Card>
                <CardContent>
                  <TooltipProvider>
                    <form onSubmit={form.handleSubmit(handleSave)}>
                      <FieldGroup>
                        <FormField
                          control={form.control}
                          name="vector_store_id"
                          label={t("tools:vector_stores.form.id_label", { defaultValue: "Vector Store ID" })}
                        >
                          {({ ref, ...field }) => <Input {...field} ref={ref} disabled />}
                        </FormField>

                        <FormField
                          control={form.control}
                          name="vector_store_name"
                          label={t("tools:vector_stores.form.name_label", { defaultValue: "Vector Store Name" })}
                        >
                          {({ ref, value, ...field }) => <Input {...field} ref={ref} value={value ?? ""} />}
                        </FormField>

                        <FormField
                          control={form.control}
                          name="vector_store_description"
                          label={t("tools:vector_stores.form.desc_label", { defaultValue: "Description" })}
                        >
                          {({ ref, value, ...field }) => <Textarea {...field} ref={ref} value={value ?? ""} rows={4} />}
                        </FormField>

                        <FormField
                          control={form.control}
                          name="custom_llm_provider"
                          label={labelWithHint("Provider", "Select the provider for this vector store")}
                        >
                          {({
                            id,
                            value,
                            onChange,
                            "aria-invalid": ariaInvalid,
                            "aria-describedby": ariaDescribedBy,
                          }) => (
                            <Select value={value} onValueChange={onChange}>
                              <SelectTrigger
                                id={id}
                                aria-invalid={ariaInvalid}
                                aria-describedby={ariaDescribedBy}
                                className="w-full"
                              >
                                <SelectValue>
                                  {(provider: string) => {
                                    const { displayName, logo } = getVectorStoreProviderLogoAndName(provider);
                                    return (
                                      <>
                                        <Logo src={logo} label={displayName} className="w-5 h-5" />
                                        <span>{displayName}</span>
                                      </>
                                    );
                                  }}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(Providers)
                                  .filter(([providerEnum]) => providerEnum === "Bedrock")
                                  .map(([providerEnum, providerDisplayName]) => (
                                    <SelectItem key={providerEnum} value={provider_map[providerEnum]}>
                                      <Logo provider={providerEnum} label={providerDisplayName} className="w-5 h-5" />
                                      <span>{providerDisplayName}</span>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        </FormField>

                        <p className="text-sm text-muted-foreground">
                          Either select existing credentials OR enter provider credentials below
                        </p>

                        <FormField
                          control={form.control}
                          name="litellm_credential_name"
                          label={t("tools:vector_stores.form.credentials_label", { defaultValue: "Existing Credentials" })}
                        >
                          {({
                            id,
                            value,
                            onChange,
                            "aria-invalid": ariaInvalid,
                            "aria-describedby": ariaDescribedBy,
                          }) => (
                            <Combobox
                              items={credentialOptions}
                              value={credentialOptions.find((option) => option.value === value) ?? null}
                              onValueChange={(option: CredentialOption | null) =>
                                onChange(option ? option.value : undefined)
                              }
                              itemToStringLabel={(option: CredentialOption) => option.label}
                              isItemEqualToValue={(option: CredentialOption, selected: CredentialOption) =>
                                option.value === selected.value
                              }
                            >
                              <ComboboxInput
                                id={id}
                                aria-invalid={ariaInvalid}
                                aria-describedby={ariaDescribedBy}
                                placeholder={t("tools:vector_stores.form.credentials_placeholder", {
                                  defaultValue: "Select or search for existing credentials",
                                })}
                                className="w-full"
                                showClear={value !== undefined}
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>
                                  {t("tools:vector_stores.form.credentials_empty", {
                                    defaultValue: "No matching credentials",
                                  })}
                                </ComboboxEmpty>
                                <ComboboxList>
                                  {(option: CredentialOption) => (
                                    <ComboboxItem key={option.label} value={option}>
                                      {option.label}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          )}
                        </FormField>

                        <div className="flex items-center">
                          <div className="grow border-t border-border"></div>
                          <span className="px-4 text-muted-foreground text-sm">OR</span>
                          <div className="grow border-t border-border"></div>
                        </div>

                        <div role="group" className="flex w-full flex-col gap-3">
                          <span className="flex w-fit gap-2 text-sm leading-snug font-medium">
                            {labelWithHint(
                              t("tools:vector_stores.form.metadata_label", { defaultValue: "Metadata" }),
                              t("tools:vector_stores.info.metadata_hint", {
                                defaultValue: "JSON metadata for the vector store",
                              }),
                            )}
                          </span>
                          <Textarea
                            rows={4}
                            value={metadataString}
                            onChange={(event) => setMetadataString(event.target.value)}
                            placeholder='{"key": "value"}'
                          />
                        </div>
                      </FieldGroup>

                      <div className="mt-6 flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          {t("tools:vector_stores.info.cancel", { defaultValue: "Cancel" })}
                        </Button>
                        <Button type="submit">
                          {t("tools:vector_stores.info.save_changes", { defaultValue: "Save Changes" })}
                        </Button>
                      </div>
                    </form>
                  </TooltipProvider>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {t("tools:vector_stores.info.tabs_details", { defaultValue: "Vector Store Details" })}
                </h3>
                {is_admin && (
                  <Button onClick={startEditing}>
                    {t("tools:vector_stores.info.edit_store", { defaultValue: "Edit Vector Store" })}
                  </Button>
                )}
              </div>
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">
                        {t("tools:vector_stores.columns.vector_store_id", { defaultValue: "ID" })}
                      </p>
                      <p>{vectorStoreDetails.vector_store_id}</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {t("tools:vector_stores.columns.name", { defaultValue: "Name" })}
                      </p>
                      <p>{vectorStoreDetails.vector_store_name || "-"}</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {t("tools:vector_stores.columns.description", { defaultValue: "Description" })}
                      </p>
                      <p>{vectorStoreDetails.vector_store_description || "-"}</p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {t("tools:vector_stores.columns.provider", { defaultValue: "Provider" })}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {(() => {
                          const provider = vectorStoreDetails.custom_llm_provider || "bedrock";
                          const { displayName, logo } = getVectorStoreProviderLogoAndName(provider);

                          return (
                            <>
                              <Logo src={logo} label={displayName} className="w-5 h-5" />
                              <Badge variant="secondary">{displayName}</Badge>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">
                        {t("tools:vector_stores.form.metadata_label", { defaultValue: "Metadata" })}
                      </p>
                      <div className="bg-muted p-3 rounded-sm mt-2 font-mono text-xs overflow-auto max-h-48">
                        <pre>{metadataString}</pre>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p>
                        {vectorStoreDetails.created_at ? new Date(vectorStoreDetails.created_at).toLocaleString() : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p>
                        {vectorStoreDetails.updated_at ? new Date(vectorStoreDetails.updated_at).toLocaleString() : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="test" keepMounted>
          <VectorStoreTester vectorStoreId={vectorStoreDetails.vector_store_id} accessToken={accessToken || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VectorStoreInfoView;
