import { getDashboardStats } from "@/app/actions/analytics-actions";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

// Cache dashboard data for 60 seconds
export const revalidate = 60;

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-destructive">Unable to load dashboard data</h3>
          <p className="mb-4 text-muted-foreground">
            There was a problem loading your dashboard statistics. This could be due to a temporary network issue or server maintenance.
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button 
              variant="default"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
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
