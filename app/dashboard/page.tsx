import { getDashboardStats } from "@/app/actions/analytics-actions";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, BarChart3, FolderKanban, FileText, Layers } from "lucide-react";
import Link from "next/link";

// Cache dashboard data for 60 seconds
export const revalidate = 60;

export default async function DashboardPage() {
  const guard = await requireAuth();
  if ("response" in guard) {
    redirect("/login");
  }
  const userId = guard.userId;

  const [stats, projectStats, reportStats, usageStats] = await Promise.all([
    getDashboardStats(),
    userId
      ? prisma.project.count({ where: { userId } }).then(async (count) => ({
          projectCount: count,
          documentCount: await prisma.document.count({ where: { userId, projectId: { not: null } } }),
          reportCount: await prisma.report.count({ where: { userId } }),
        }))
      : null,
    userId
      ? prisma.report.groupBy({
          by: ["status"],
          where: { userId },
          _count: true,
        })
      : null,
    userId
      ? prisma.usageLog.aggregate({
          where: { userId },
          _sum: { tokensUsed: true },
          _count: true,
        })
      : null,
  ]);

  const reportStatusMap = (reportStats || []).reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">InsightForge 仪表盘</h1>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" className="whitespace-nowrap">
            <Link href="/dashboard/projects" className="flex items-center">
              <FolderKanban className="h-4 w-4 mr-2 shrink-0" />
              <span>管理项目</span>
            </Link>
          </Button>
          <Button asChild className="whitespace-nowrap">
            <Link href="/dashboard/reports" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 shrink-0" />
              <span>查看报告</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* InsightForge 核心指标 */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          研究与项目概览
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="项目总数" value={projectStats?.projectCount || 0} />
          <StatCard label="知识库文档" value={projectStats?.documentCount || 0} />
          <StatCard label="生成报告" value={projectStats?.reportCount || 0} />
          <StatCard
            label="已完成报告"
            value={reportStatusMap.completed || 0}
          />
        </div>
      </div>

      {/* 报告状态分布 */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          报告状态分布
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="草稿" value={reportStatusMap.draft || 0} />
          <StatCard label="生成中" value={reportStatusMap.generating || 0} />
          <StatCard label="已完成" value={reportStatusMap.completed || 0} />
          <StatCard label="生成错误" value={reportStatusMap.error || 0} />
        </div>
      </div>

      {/* 用量统计 */}
      {usageStats && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Token 消耗统计</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="累计 Token 消耗"
              value={(usageStats._sum.tokensUsed || 0)}
            />
            <StatCard
              label="总操作次数"
              value={usageStats._count || 0}
            />
          </div>
        </div>
      )}

      {/* 原有文档与聊天统计 */}
      {stats && (
        <div>
          <h2 className="text-lg font-semibold mb-4">文档与对话</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="文档总数" value={stats.totalDocuments} />
            <StatCard label="知识块" value={stats.totalChunks} />
            <StatCard label="聊天会话" value={stats.totalSessions} />
            <StatCard label="消息总数" value={stats.totalMessages} />
          </div>
        </div>
      )}
    </div>
  );
}
