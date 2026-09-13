import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_ITEMS } from "./action_options";

interface BlockedWord {
  id: string;
  keyword: string;
  action: "BLOCK" | "MASK";
  description?: string;
}

interface KeywordTableProps {
  keywords: BlockedWord[];
  onActionChange: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
}

const KeywordTable: React.FC<KeywordTableProps> = ({ keywords, onActionChange, onRemove }) => {
  const { t } = useTranslation("guardrails");

  const columns: ColumnDef<BlockedWord>[] = useMemo(() => [
    {
      header: t("content_filter.keyword", { defaultValue: "Keyword" }),
      accessorKey: "keyword",
    },
    {
      header: t("content_filter.action", { defaultValue: "Action" }),
      accessorKey: "action",
      size: 150,
      cell: ({ row }) => (
        <Select
          items={ACTION_ITEMS}
          value={row.original.action}
          onValueChange={(value: string | null) => value && onActionChange(row.original.id, "action", value)}
        >
          <SelectTrigger size="sm" className="w-[120px]" aria-label="Action">
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
      ),
    },
    {
      header: t("content_filter.description", { defaultValue: "Description" }),
      accessorKey: "description",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      header: "",
      id: "actions",
      size: 100,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onRemove(row.original.id)}>
          <Trash2 />
          {t("content_filter.delete", { defaultValue: "Delete" })}
        </Button>
      ),
    },
  ], [t, onActionChange, onRemove]);

  if (keywords.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        {t("content_filter.no_keywords", { defaultValue: "No keywords added." })}
      </div>
    );
  }

  return <DataTable data={keywords} columns={columns} getRowId={(row) => row.id} size="compact" />;
};

export default KeywordTable;
