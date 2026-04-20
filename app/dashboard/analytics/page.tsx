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

export default async function AnalyticsPage() {
  const [documentsOverTime, chatActivity, formatDistribution] =
    await Promise.all([
      getDocumentsOverTime(),
      getChatActivity(),
      getDocumentFormatDistribution(),
    ]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Documents Over Time */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Documents Over Time</h2>
          <DocumentsOverTimeChart data={documentsOverTime} />
        </div>

        {/* Chat Activity */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Chat Activity (30 Days)</h2>
          <ChatActivityChart data={chatActivity} />
        </div>

        {/* Format Distribution */}
        <div className="rounded-lg bg-white p-6 shadow md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            Document Format Distribution
          </h2>
          <FormatDistributionChart data={formatDistribution} />
        </div>
      </div>
    </div>
  );
}
