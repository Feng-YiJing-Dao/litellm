import React, { useState } from "react";
import {
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Copy,
  FileText,
  Link,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export interface A2ATaskMetadata {
  taskId?: string;
  contextId?: string;
  status?: {
    state?: string;
    timestamp?: string;
    message?: string;
  };
  metadata?: Record<string, unknown>;
}

interface A2AMetricsProps {
  a2aMetadata?: A2ATaskMetadata;
  timeToFirstToken?: number;
  totalLatency?: number;
}

const getStatusIcon = (state?: string) => {
  switch (state) {
    case "completed":
      return <CheckCircle className="size-3 text-success" />;
    case "working":
    case "submitted":
      return <LoaderCircle className="size-3 animate-spin text-info" />;
    case "failed":
    case "canceled":
      return <CircleAlert className="size-3 text-destructive" />;
    default:
      return <Clock className="size-3 text-muted-foreground" />;
  }
};

const getStatusColor = (state?: string) => {
  switch (state) {
    case "completed":
      return "bg-success/15 text-success";
    case "working":
    case "submitted":
      return "bg-info/15 text-info";
    case "failed":
    case "canceled":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-foreground";
  }
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return timestamp;
  }
};

const truncateId = (id?: string, length = 8) => {
  if (!id) return null;
  return id.length > length ? `${id.substring(0, length)}…` : id;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

const A2AMetrics: React.FC<A2AMetricsProps> = ({ a2aMetadata, timeToFirstToken, totalLatency }) => {
  const { t } = useTranslation(["playground"]);
  const [showDetails, setShowDetails] = useState(false);

  if (!a2aMetadata && !timeToFirstToken && !totalLatency) return null;

  const { taskId, contextId, status, metadata } = a2aMetadata || {};
  const formattedTime = formatTimestamp(status?.timestamp);

  return (
    <div className="a2a-metrics mt-3 pt-2 border-t border-border text-xs">
      {/* A2A Metadata Header */}
      <div className="flex items-center mb-2 text-muted-foreground">
        <Bot className="mr-1.5 size-4 text-info" />
        <span className="font-medium text-foreground">{t("playground:a2a.header", { defaultValue: "A2A Metadata" })}</span>
      </div>

      {/* Main metrics row */}
      <div className="flex flex-wrap items-center gap-2 text-muted-foreground ml-4">
        {/* Status badge */}
        {status?.state && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status.state)}`}
          >
            {getStatusIcon(status.state)}
            <span className="ml-1 capitalize">
              {t(`playground:a2a.state_${status.state}`, { defaultValue: status.state })}
            </span>
          </span>
        )}

        {/* Timestamp */}
        {formattedTime && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center" />}>
              <Clock className="mr-1 size-3" />
              {formattedTime}
            </TooltipTrigger>
            <TooltipContent>{status?.timestamp}</TooltipContent>
          </Tooltip>
        )}

        {/* Latency */}
        {totalLatency !== undefined && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center text-info" />}>
              <Clock className="mr-1 size-3" />
              {(totalLatency / 1000).toFixed(2)}s
            </TooltipTrigger>
            <TooltipContent>{t("playground:a2a.total_latency", { defaultValue: "Total latency" })}</TooltipContent>
          </Tooltip>
        )}

        {/* Time to first token */}
        {timeToFirstToken !== undefined && (
          <Tooltip>
            <TooltipTrigger render={<span className="flex items-center text-success" />}>
              {t("playground:a2a.ttft", { defaultValue: "TTFT" })}: {(timeToFirstToken / 1000).toFixed(2)}s
            </TooltipTrigger>
            <TooltipContent>{t("playground:a2a.ttft_tooltip", { defaultValue: "Time to first token" })}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* IDs row */}
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground ml-4 mt-1.5">
        {/* Task ID */}
        {taskId && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => copyToClipboard(taskId)}
                  aria-label={t("playground:a2a.copy_task_id_aria", { id: taskId, defaultValue: `Copy task ID ${taskId}` })}
                />
              }
            >
              <FileText className="size-3" />
              {t("playground:a2a.task_label", { defaultValue: "Task" })}: {truncateId(taskId)}
              <Copy className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{t("playground:a2a.click_to_copy", { id: taskId, defaultValue: `Click to copy: ${taskId}` })}</TooltipContent>
          </Tooltip>
        )}

        {/* Context/Session ID */}
        {contextId && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => copyToClipboard(contextId)}
                  aria-label={t("playground:a2a.copy_session_id_aria", { id: contextId, defaultValue: `Copy session ID ${contextId}` })}
                />
              }
            >
              <Link className="size-3" />
              {t("playground:a2a.session_label", { defaultValue: "Session" })}: {truncateId(contextId)}
              <Copy className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{t("playground:a2a.click_to_copy", { id: contextId, defaultValue: `Click to copy: ${contextId}` })}</TooltipContent>
          </Tooltip>
        )}

        {/* Details toggle */}
        {(metadata || status?.message) && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-auto p-0 text-xs text-info hover:bg-transparent hover:text-info/80"
                />
              }
            >
              {showDetails ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              {t("playground:a2a.details", { defaultValue: "Details" })}
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>

      {/* Expandable details panel */}
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleContent>
          <div className="mt-2 ml-4 p-3 bg-muted rounded-md text-muted-foreground border border-border">
            {/* Status message */}
            {status?.message && (
              <div className="mb-2">
                <span className="font-medium text-foreground">
                  {t("playground:a2a.status_message", { defaultValue: "Status Message:" })}
                </span>
                <span className="ml-2">{status.message}</span>
              </div>
            )}

            {/* Full IDs */}
            {taskId && (
              <div className="mb-1.5 flex items-center">
                <span className="font-medium text-foreground w-24">
                  {t("playground:a2a.task_id", { defaultValue: "Task ID:" })}
                </span>
                <code className="ml-2 px-2 py-1 bg-card border border-border rounded-sm text-xs font-mono">
                  {taskId}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-2 text-muted-foreground hover:text-info"
                  onClick={() => copyToClipboard(taskId)}
                  aria-label={t("playground:a2a.copy_task_id_aria", { id: taskId, defaultValue: `Copy task ID ${taskId}` })}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            )}

            {contextId && (
              <div className="mb-1.5 flex items-center">
                <span className="font-medium text-foreground w-24">
                  {t("playground:a2a.session_id", { defaultValue: "Session ID:" })}
                </span>
                <code className="ml-2 px-2 py-1 bg-card border border-border rounded-sm text-xs font-mono">
                  {contextId}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="ml-2 text-muted-foreground hover:text-info"
                  onClick={() => copyToClipboard(contextId)}
                  aria-label={t("playground:a2a.copy_session_id_aria", { id: contextId, defaultValue: `Copy session ID ${contextId}` })}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            )}

            {/* Metadata fields */}
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-foreground">
                  {t("playground:a2a.custom_metadata", { defaultValue: "Custom Metadata:" })}
                </span>
                <pre className="mt-1.5 p-2 bg-card border border-border rounded-sm text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default A2AMetrics;
