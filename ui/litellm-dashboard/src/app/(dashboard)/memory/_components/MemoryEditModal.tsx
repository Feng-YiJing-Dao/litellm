"use client";

import { CircleHelp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";

import type { MemoryRow } from "@/components/networking";
import { FieldGroup } from "@/components/ui/field";
import { FormField } from "@/components/shared/form/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useZodForm } from "@/lib/forms/useZodForm";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const memorySchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  metadata: z.string(),
});

type MemoryFormValues = z.output<typeof memorySchema>;

const labelWithHint = (label: React.ReactNode, hint: string): React.ReactNode => (
  <>
    {label}
    <Tooltip>
      <TooltipTrigger render={<CircleHelp className="size-3.5 shrink-0 cursor-help text-muted-foreground" />} />
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  </>
);

const EMPTY_MEMORY: MemoryFormValues = { key: "", value: "", metadata: "" };

interface MemoryEditModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialRow?: MemoryRow;
  onClose: () => void;
  onSave: (key: string, value: string, metadataText: string, isCreate: boolean) => Promise<boolean>;
}

export const MemoryEditModal: React.FC<MemoryEditModalProps> = ({ open, mode, initialRow, onClose, onSave }) => {
  const { t } = useTranslation(["memory", "common"]);
  const form = useZodForm(memorySchema, { defaultValues: EMPTY_MEMORY, mode: "onChange" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialRow) {
      form.reset({
        key: initialRow.key,
        value: initialRow.value,
        metadata: initialRow.metadata != null ? JSON.stringify(initialRow.metadata, null, 2) : "",
      });
      return;
    }
    form.reset(EMPTY_MEMORY);
  }, [open, mode, initialRow, form]);

  const handleOk = form.handleSubmit(async (values) => {
    setSubmitting(true);
    const ok = await onSave(values.key.trim(), values.value, values.metadata, mode === "create");
    setSubmitting(false);
    if (!ok) return;
    form.reset(EMPTY_MEMORY);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset(EMPTY_MEMORY);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("memory:modal.create_title", { defaultValue: "Create memory" })
              : t("memory:modal.edit_title", {
                  key: initialRow?.key ?? "",
                  defaultValue: `Edit ${initialRow?.key ?? ""}`,
                })}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <TooltipProvider>
            <FieldGroup>
              <FormField
                control={form.control}
                name="key"
                label={labelWithHint(
                  t("memory:modal.key_label", { defaultValue: "Key" }),
                  t("memory:modal.key_hint", {
                    defaultValue:
                      "Globally unique — two memories cannot share a key. Namespace your own keys if you need per-user isolation (e.g. user:123:notes).",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Input
                    {...field}
                    ref={ref}
                    placeholder={t("memory:modal.key_placeholder", { defaultValue: "e.g. user_role" })}
                    disabled={mode === "edit"}
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="value"
                label={labelWithHint(
                  t("memory:modal.value_label", { defaultValue: "Value" }),
                  t("memory:modal.value_hint", {
                    defaultValue: "The stored text value. Empty strings are allowed.",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Textarea
                    {...field}
                    ref={ref}
                    rows={8}
                    placeholder={t("memory:modal.value_placeholder", { defaultValue: "Enter text value..." })}
                  />
                )}
              </FormField>

              <FormField
                control={form.control}
                name="metadata"
                label={labelWithHint(
                  <span>
                    {t("memory:modal.metadata_label", { defaultValue: "Metadata (JSON)" })}
                  </span>,
                  t("memory:modal.metadata_hint", {
                    defaultValue: "Optional structured metadata — must be valid JSON if provided.",
                  }),
                )}
              >
                {({ ref, ...field }) => (
                  <Textarea
                    {...field}
                    ref={ref}
                    rows={4}
                    placeholder={t("memory:modal.metadata_placeholder", {
                      defaultValue: "Valid JSON or leave empty",
                    })}
                    className="font-mono"
                  />
                )}
              </FormField>
            </FieldGroup>
          </TooltipProvider>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              form.reset(EMPTY_MEMORY);
              onClose();
            }}
          >
            {t("common:cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={handleOk} disabled={submitting} aria-busy={submitting}>
            {mode === "create"
              ? t("common:create", { defaultValue: "Create" })
              : t("common:save", { defaultValue: "Save" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryEditModal;
