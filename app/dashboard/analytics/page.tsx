import {
  getDocumentsOverTime,
  getChatActivity,
  getDocumentFormatDistribution,
} from "@/app/actions/analytics-actions";
import {
  DocumentsOverTimeChart,
  ChatActivityChart,
  FormatDistributionChart,
} from "@/components/Charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const [documentsOverTime, chatActivity, formatDistribution] =
    await Promise.all([
      getDocumentsOverTime(),
      getChatActivity(),
      getDocumentFormatDistribution(),
    ]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documents Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsOverTimeChart data={documentsOverTime} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Activity (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatActivityChart data={chatActivity} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Document Format Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <FormatDistributionChart data={formatDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
