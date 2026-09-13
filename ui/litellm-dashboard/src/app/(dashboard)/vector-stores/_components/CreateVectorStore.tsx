import React, { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { CircleCheck, CircleHelp, Inbox, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { ragIngestCall } from "@/components/networking";
import { DocumentUpload, RAGIngestResponse } from "@/components/vector_store_management/types";
import DocumentsTable from "./DocumentsTable";
import {
  VectorStoreProviders,
  vectorStoreProviderLogoMap,
  vectorStoreProviderMap,
  getProviderSpecificFields,
  VectorStoreFieldConfig,
} from "@/components/vector_store_providers";
import { Logo } from "@/components/molecules/logo/Logo";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UiLoadingSpinner } from "@/components/ui/ui-loading-spinner";
import S3VectorsConfig from "./S3VectorsConfig";

const ACCEPTED_DOCUMENT_EXTENSIONS = ".pdf,.txt,.docx,.md,.doc";

const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/markdown",
];

const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;

const RAG_INGEST_UNSUPPORTED_PROVIDERS = new Set(["valkey"]);

const providerItems = Object.entries(VectorStoreProviders)
  .filter(([providerEnum]) => !RAG_INGEST_UNSUPPORTED_PROVIDERS.has(vectorStoreProviderMap[providerEnum]))
  .map(([providerEnum, providerDisplayName]) => ({
    value: vectorStoreProviderMap[providerEnum],
    label: providerDisplayName,
  }));

const asText = (value: unknown): string => (typeof value === "string" ? value : "");

const IngestSuccessAlert: React.FC<{ ingestResults: RAGIngestResponse[] }> = ({ ingestResults }) => {
  const { t } = useTranslation(["tools", "common"]);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert variant="success">
      <CircleCheck />
      <AlertTitle>
        {t("tools:vector_stores.create_store.success_alert_title", {
          defaultValue: "Vector Store Created Successfully",
        })}
      </AlertTitle>
      <AlertDescription>
        <div>
          <p>
            <strong>
              {t("tools:vector_stores.create_store.success_alert_id", { defaultValue: "Vector Store ID:" })}
            </strong>{" "}
            {ingestResults[0]?.vector_store_id}
          </p>
          <p>
            <strong>
              {t("tools:vector_stores.create_store.success_alert_docs", { defaultValue: "Documents Ingested:" })}
            </strong>{" "}
            {ingestResults.length}
          </p>
        </div>
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("common:close", { defaultValue: "Close" })}
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </AlertAction>
    </Alert>
  );
};

const labelWithHint = (label: string, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

interface CreateVectorStoreProps {
  accessToken: string | null;
  onSuccess?: (vectorStoreId: string) => void;
}

const CreateVectorStore: React.FC<CreateVectorStoreProps> = ({ accessToken, onSuccess }) => {
  const { t } = useTranslation(["tools", "common"]);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("bedrock");
  const [vectorStoreName, setVectorStoreName] = useState<string>("");
  const [vectorStoreDescription, setVectorStoreDescription] = useState<string>("");
  const [ingestResults, setIngestResults] = useState<RAGIngestResponse[]>([]);
  const [providerParams, setProviderParams] = useState<Record<string, unknown>>({});
  const documentsInputId = useId();

  const isSupportedDocument = (file: File): boolean => {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      toast.error(
        t("tools:vector_stores.create_store.unsupported_file", {
          name: file.name,
          defaultValue: `${file.name} is not a supported file type. Please upload PDF, TXT, DOCX, or MD files.`,
        }),
      );
      return false;
    }
    if (file.size >= MAX_DOCUMENT_BYTES) {
      toast.error(
        t("tools:vector_stores.create_store.file_too_large", {
          name: file.name,
          defaultValue: `${file.name} must be smaller than 50MB!`,
        }),
      );
      return false;
    }
    return true;
  };

  const handleAddDocuments = (files: readonly File[]) => {
    const accepted: DocumentUpload[] = files.filter(isSupportedDocument).map((file) => ({
      uid: uuidv4(),
      name: file.name,
      status: "done",
      size: file.size,
      type: file.type,
      originFileObj: file,
    }));

    if (accepted.length > 0) {
      setDocuments((prev) => [...prev, ...accepted]);
    }
  };

  const handleRemoveDocument = (uid: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.uid !== uid));
  };

  const handleCreateVectorStore = async () => {
    if (documents.length === 0) {
      toast.warning(
        t("tools:vector_stores.create_store.upload_at_least_one", {
          defaultValue: "Please upload at least one document",
        }),
      );
      return;
    }

    if (!selectedProvider) {
      toast.warning(
        t("tools:vector_stores.create_store.select_provider", {
          defaultValue: "Please select a provider",
        }),
      );
      return;
    }

    // Validate provider-specific required fields
    const requiredFields = getProviderSpecificFields(selectedProvider).filter((field) => field.required);
    for (const field of requiredFields) {
      if (!providerParams[field.name]) {
        toast.warning(
          t("tools:vector_stores.create_store.provide_field", {
            label: field.label,
            defaultValue: `Please provide ${field.label}`,
          }),
        );
        return;
      }
    }

    // S3 Vectors specific validation
    if (selectedProvider === "s3_vectors") {
      const bucketName = asText(providerParams.vector_bucket_name);
      const indexName = asText(providerParams.index_name);
      if (bucketName && bucketName.length < 3) {
        toast.warning(
          t("tools:vector_stores.create_store.bucket_min_len", {
            defaultValue: "Vector bucket name must be at least 3 characters",
          }),
        );
        return;
      }
      if (indexName && indexName.length > 0 && indexName.length < 3) {
        toast.warning(
          t("tools:vector_stores.create_store.index_min_len", {
            defaultValue: "Index name must be at least 3 characters if provided",
          }),
        );
        return;
      }
    }

    if (!accessToken) {
      toast.error(
        t("tools:vector_stores.create_store.no_access_token", {
          defaultValue: "No access token available",
        }),
      );
      return;
    }

    setIsCreating(true);
    const results: RAGIngestResponse[] = [];
    let vectorStoreId: string | undefined;

    try {
      // Ingest each document
      for (const doc of documents) {
        if (!doc.originFileObj) continue;

        // Update document status to uploading
        setDocuments((prev) => prev.map((d) => (d.uid === doc.uid ? { ...d, status: "uploading" as const } : d)));

        try {
          const result = await ragIngestCall(
            accessToken,
            doc.originFileObj,
            selectedProvider,
            vectorStoreId, // Use the same vector store ID for subsequent uploads
            vectorStoreName || undefined,
            vectorStoreDescription || undefined,
            providerParams,
          );

          // Store the vector store ID from the first successful ingest
          if (!vectorStoreId && result.vector_store_id) {
            vectorStoreId = result.vector_store_id;
          }

          results.push(result);

          // Update document status to done
          setDocuments((prev) => prev.map((d) => (d.uid === doc.uid ? { ...d, status: "done" as const } : d)));
        } catch (error) {
          console.error(`Error ingesting ${doc.name}:`, error);
          // Update document status to error
          setDocuments((prev) => prev.map((d) => (d.uid === doc.uid ? { ...d, status: "error" as const } : d)));
          throw error; // Stop processing on first error
        }
      }

      setIngestResults(results);
      toast.success(
        t("tools:vector_stores.create_store.success_created", {
          count: results.length,
          id: vectorStoreId,
          defaultValue: `Successfully created vector store with ${results.length} document(s). Vector Store ID: ${vectorStoreId}`,
        }),
      );

      if (onSuccess && vectorStoreId) {
        onSuccess(vectorStoreId);
      }

      // Clear documents after successful creation
      setTimeout(() => {
        setDocuments([]);
        setIngestResults([]);
      }, 3000);
    } catch (error) {
      console.error("Error creating vector store:", error);
      toast.fromError(
        t("tools:vector_stores.create_store.failed_create", {
          error: String(error),
          defaultValue: `Failed to create vector store: ${error}`,
        }),
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">
            {t("tools:vector_stores.create_store.title", { defaultValue: "Create Vector Store" })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("tools:vector_stores.create_store.subtitle", {
              defaultValue:
                "Upload documents and select a provider to create a new vector store with embedded content.",
            })}
          </p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent>
            <div className="mb-4">
              <p className="font-medium">
                {t("tools:vector_stores.create_store.step_1_title", { defaultValue: "Step 1: Upload Documents" })}
              </p>
              <p className="text-sm text-muted-foreground block mt-1">
                {t("tools:vector_stores.create_store.step_1_desc", {
                  defaultValue:
                    "Upload one or more documents (PDF, TXT, DOCX, MD). Maximum file size: 50MB per file.",
                })}
              </p>
            </div>
            <label
              htmlFor={documentsInputId}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/50 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleAddDocuments(Array.from(event.dataTransfer.files));
              }}
            >
              <Inbox className="size-12 text-primary" />
              <span className="text-base">
                {t("tools:vector_stores.create_store.dropzone_primary", {
                  defaultValue: "Click or drag files to this area to upload",
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("tools:vector_stores.create_store.dropzone_secondary", {
                  defaultValue: "Support for single or bulk upload. Supported formats: PDF, TXT, DOCX, MD",
                })}
              </span>
              <input
                id={documentsInputId}
                type="file"
                multiple
                accept={ACCEPTED_DOCUMENT_EXTENSIONS}
                className="sr-only"
                onChange={(event) => {
                  handleAddDocuments(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </label>
          </CardContent>
        </Card>

        {/* Documents Table */}
        {documents.length > 0 && (
          <Card>
            <CardContent>
              <div className="mb-4">
                <p className="font-medium">
                  {t("tools:vector_stores.create_store.uploaded_title", {
                    count: documents.length,
                    defaultValue: `Uploaded Documents (${documents.length})`,
                  })}
                </p>
              </div>
              <DocumentsTable documents={documents} onRemove={handleRemoveDocument} />
            </CardContent>
          </Card>
        )}

        {/* Provider Selection and Vector Store Details */}
        <Card>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {t("tools:vector_stores.create_store.step_2_title", {
                  defaultValue: "Step 2: Configure Vector Store",
                })}
              </p>
              <p className="text-sm text-muted-foreground block mt-1">
                {t("tools:vector_stores.create_store.step_2_desc", {
                  defaultValue:
                    "Choose the provider and optionally provide a name and description for your vector store.",
                })}
              </p>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="vector-store-name">
                  {labelWithHint(
                    t("tools:vector_stores.create_store.name_label", { defaultValue: "Vector Store Name" }),
                    t("tools:vector_stores.create_store.name_hint", {
                      defaultValue: "Optional: Give your vector store a meaningful name",
                    }),
                  )}
                </FieldLabel>
                <Input
                  id="vector-store-name"
                  value={vectorStoreName}
                  onChange={(e) => setVectorStoreName(e.target.value)}
                  placeholder={t("tools:vector_stores.create_store.name_placeholder", {
                    defaultValue: "e.g., Product Documentation, Customer Support KB",
                  })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="vector-store-description">
                  {labelWithHint(
                    t("tools:vector_stores.create_store.desc_label", { defaultValue: "Description" }),
                    t("tools:vector_stores.create_store.desc_hint", {
                      defaultValue: "Optional: Describe what this vector store contains",
                    }),
                  )}
                </FieldLabel>
                <Textarea
                  id="vector-store-description"
                  value={vectorStoreDescription}
                  onChange={(e) => setVectorStoreDescription(e.target.value)}
                  placeholder={t("tools:vector_stores.create_store.desc_placeholder", {
                    defaultValue: "e.g., Contains all product documentation and user guides",
                  })}
                  rows={2}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="vector-store-provider">
                  {labelWithHint(
                    t("tools:vector_stores.create_store.provider_label", { defaultValue: "Provider" }),
                    t("tools:vector_stores.create_store.provider_hint", {
                      defaultValue: "Select the provider for embedding and vector store operations",
                    }),
                  )}
                </FieldLabel>
                <Select
                  items={providerItems}
                  value={selectedProvider}
                  onValueChange={(value: string | null) => value !== null && setSelectedProvider(value)}
                >
                  <SelectTrigger id="vector-store-provider" className="w-full">
                    <SelectValue
                      placeholder={t("tools:vector_stores.create_store.provider_placeholder", {
                        defaultValue: "Select a provider",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {providerItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        <Logo src={vectorStoreProviderLogoMap[item.label]} label={item.label} className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* S3 Vectors Configuration */}
              {selectedProvider === "s3_vectors" && (
                <S3VectorsConfig
                  accessToken={accessToken}
                  providerParams={providerParams}
                  onParamsChange={setProviderParams}
                />
              )}

              {/* Other Provider-specific fields */}
              {selectedProvider !== "s3_vectors" &&
                getProviderSpecificFields(selectedProvider).map((field: VectorStoreFieldConfig) => (
                  <Field key={field.name}>
                    <FieldLabel htmlFor={`vector-store-${field.name}`}>
                      {labelWithHint(field.label, field.tooltip)}
                    </FieldLabel>
                    <Input
                      id={`vector-store-${field.name}`}
                      type={field.type === "password" ? "password" : "text"}
                      value={asText(providerParams[field.name])}
                      onChange={(e) => setProviderParams((prev) => ({ ...prev, [field.name]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  </Field>
                ))}
            </FieldGroup>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleCreateVectorStore}
                disabled={isCreating || documents.length === 0 || !selectedProvider}
              >
                {isCreating && <UiLoadingSpinner className="size-4" />}
                {isCreating
                  ? t("tools:vector_stores.create_store.creating_btn", {
                      defaultValue: "Creating Vector Store...",
                    })
                  : t("tools:vector_stores.create_store.create_btn", {
                      defaultValue: "Create Vector Store",
                    })}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {ingestResults.length > 0 && <IngestSuccessAlert ingestResults={ingestResults} />}
      </div>
    </TooltipProvider>
  );
};

export default CreateVectorStore;
