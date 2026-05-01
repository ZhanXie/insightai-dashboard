import { getDashboardStats } from "@/app/actions/analytics-actions";
import StatCard from "@/components/StatCard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Unable to load dashboard data.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents" value={stats.totalDocuments} />
        <StatCard label="Knowledge Chunks" value={stats.totalChunks} />
        <StatCard label="Chat Sessions" value={stats.totalSessions} />
        <StatCard label="Total Messages" value={stats.totalMessages} />
      </div>
    </div>
  );
}
