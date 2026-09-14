import { Code, CircleAlert, CirclePlay, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ModelSelector from "@/components/common_components/ModelSelector";
import { TestResult } from "./semanticFilterTestUtils";

interface MCPSemanticFilterTestPanelProps {
  accessToken: string | null;
  testQuery: string;
  setTestQuery: (value: string) => void;
  testModel: string;
  setTestModel: (value: string) => void;
  isTesting: boolean;
  onTest: () => void;
  filterEnabled: boolean;
  testResult: TestResult | null;
  testError: string | null;
  curlCommand: string;
}

export default function MCPSemanticFilterTestPanel({
  accessToken,
  testQuery,
  setTestQuery,
  testModel,
  setTestModel,
  isTesting,
  onTest,
  filterEnabled,
  testResult,
  testError,
  curlCommand,
}: MCPSemanticFilterTestPanelProps) {
  const { t } = useTranslation(["mcp"]);
  const canRunTest = testQuery && testModel && filterEnabled;
  const testDisabled = isTesting || !canRunTest;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t("mcp:semantic_filter_test.test_configuration", "Test Configuration")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test">
          <TabsList>
            <TabsTrigger value="test" className="flex-none">
              {t("mcp:semantic_filter_test.tab_test", "Test")}
            </TabsTrigger>
            <TabsTrigger value="api" className="flex-none">
              {t("mcp:semantic_filter_test.tab_api", "API Usage")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <div className="flex w-full flex-col gap-6">
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-medium">
                  <CirclePlay className="size-4" /> {t("mcp:semantic_filter_test.test_query", "Test Query")}
                </p>
                <Textarea
                  className="field-sizing-fixed"
                  placeholder={t(
                    "mcp:semantic_filter_test.test_query_placeholder",
                    "Enter a test query to see which tools would be selected...",
                  )}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  rows={4}
                  disabled={isTesting}
                />
              </div>

              <div>
                <ModelSelector
                  accessToken={accessToken || ""}
                  value={testModel}
                  onChange={setTestModel}
                  disabled={isTesting}
                  showLabel={true}
                  labelText={t("mcp:semantic_filter_test.select_model", "Select Model")}
                />
              </div>

              <Button className="w-full" onClick={onTest} disabled={testDisabled}>
                <CirclePlay />
                {t("mcp:semantic_filter_test.test_filter_button", "Test Filter")}
              </Button>

              {!filterEnabled && (
                <Alert>
                  <Info />
                  <AlertTitle>
                    {t("mcp:semantic_filter_test.disabled_title", "Semantic filtering is disabled")}
                  </AlertTitle>
                  <AlertDescription>
                    {t(
                      "mcp:semantic_filter_test.disabled_desc",
                      "Enable semantic filtering and save settings to test the filter.",
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {testError && (
                <Alert variant="destructive" className="mb-4">
                  <CircleAlert />
                  <AlertTitle>
                    {t("mcp:semantic_filter_test.not_run_title", "Semantic filtering did not run")}
                  </AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}

              {testResult && (
                <div>
                  <h5 className="mb-2 text-base font-medium">{t("mcp:semantic_filter_test.results", "Results")}</h5>
                  <Alert className="mb-4">
                    <Info />
                    <AlertTitle>
                      {t(
                        "mcp:semantic_filter_test.tools_selected",
                        `${testResult.selectedTools} of ${testResult.totalTools} tools selected`,
                        {
                          defaultValue: `${testResult.selectedTools} of ${testResult.totalTools} tools selected`,
                          selected: testResult.selectedTools,
                          total: testResult.totalTools,
                        },
                      )}
                    </AlertTitle>
                    <AlertDescription>
                      {t(
                        "mcp:semantic_filter_test.tools_filtered_out",
                        `${testResult.totalTools - testResult.selectedTools} tools filtered out`,
                        {
                          defaultValue: `${testResult.totalTools - testResult.selectedTools} tools filtered out`,
                          count: testResult.totalTools - testResult.selectedTools,
                        },
                      )}
                    </AlertDescription>
                  </Alert>
                  <div>
                    <p className="mb-2 block font-medium">
                      {t("mcp:semantic_filter_test.selected_tools_label", "Selected Tools:")}
                    </p>
                    <ul className="m-0 list-disc pl-5">
                      {testResult.tools.map((tool, index) => (
                        <li key={index} className="mb-1">
                          <span>{tool}</span>
                        </li>
                      ))}
                    </ul>
                    {testResult.selectedTools > testResult.tools.length && (
                      <p className="mt-2 block text-sm text-muted-foreground">
                        {t(
                          "mcp:semantic_filter_test.more_selected_not_shown",
                          `+${testResult.selectedTools - testResult.tools.length} more selected tools not shown`,
                          {
                            defaultValue: `+${testResult.selectedTools - testResult.tools.length} more selected tools not shown`,
                            count: testResult.selectedTools - testResult.tools.length,
                          },
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Code className="size-4" />
                <p className="font-medium">{t("mcp:semantic_filter_test.api_usage_title", "API Usage")}</p>
              </div>
              <p className="mb-2 block text-sm text-muted-foreground">
                {t(
                  "mcp:semantic_filter_test.api_usage_desc",
                  "Use this curl command to test the semantic filter with your current configuration.",
                )}
              </p>
              <p className="mb-2 block font-medium">
                {t("mcp:semantic_filter_test.response_headers_title", "Response headers to check:")}
              </p>
              <ul className="mt-0 mr-0 mb-3 ml-0 list-disc pl-5">
                <li>
                  <span>
                    {t(
                      "mcp:semantic_filter_test.header_filter_info",
                      "x-litellm-semantic-filter: shows total tools → selected tools",
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t("mcp:semantic_filter_test.header_filter_example", "Example: 10→3")}
                  </span>
                </li>
                <li>
                  <span>
                    {t(
                      "mcp:semantic_filter_test.header_tools_info",
                      "x-litellm-semantic-filter-tools: CSV of selected tool names",
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {t(
                      "mcp:semantic_filter_test.header_tools_example",
                      "Example: wikipedia-fetch,github-search,slack-post",
                    )}
                  </span>
                </li>
              </ul>
              <pre className="m-0 overflow-auto rounded-sm bg-muted p-3 text-xs">{curlCommand}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
