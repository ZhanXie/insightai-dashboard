"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Brain, Shield, Zap, BarChart3, FolderKanban } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: FolderKanban,
      title: "项目与知识库管理",
      description: "按项目组织文档，构建专属知识库，支持多维度筛选与关联分析。",
    },
    {
      icon: Brain,
      title: "Multi-Agent 研究工作流",
      description: "Research → Retrieval → Analysis → Writing 四阶段自动化，从网页搜索到洞察提炼一气呵成。",
    },
    {
      icon: BarChart3,
      title: "智能报告生成",
      description: "基于模板的结构化报告输出，支持 Markdown/Word/PDF 导出，引用自动溯源。",
    },
    {
      icon: Shield,
      title: "企业级安全与订阅",
      description: "Stripe 订阅体系，按量计费与 Token 配额管理，保障资源合理分配。",
    },
    {
      icon: Zap,
      title: "流式实时反馈",
      description: "SSE 流式状态推送，生成进度实时可见，告别漫长等待焦虑。",
    },
    {
      icon: FileText,
      title: "保留经典 RAG 能力",
      description: "文档上传、向量检索、混合搜索与多轮对话完整保留，无缝衔接新工作流。",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-foreground">
            InsightForge
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/register">免费开始</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              从研究到报告，<br />
              <span className="text-primary">AI 全流程自动化</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              InsightForge 将网页搜索、文档检索、洞察提炼与结构化报告生成整合至一个 Multi-Agent 工作流中。
              上传资料、设定主题，剩下的交给 AI。
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button asChild size="lg" className="min-w-[160px]">
                <Link href="/register">立即体验</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                <Link href="/dashboard/chat">试用 RAG 对话</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-muted/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">核心能力</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-background p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Visual */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">四阶段研究工作流</h2>
            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
              {["Research Agent", "Retrieval Agent", "Analysis Agent", "Writing Agent"].map(
                (stage, idx) => (
                  <div key={stage} className="relative text-center p-6 rounded-lg border bg-card">
                    <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                      {idx + 1}
                    </div>
                    <h4 className="font-semibold mb-2">{stage}</h4>
                    <p className="text-sm text-muted-foreground">
                      {
                        [
                          "网页搜索与内容抓取",
                          "文档混合检索与上下文增强",
                          "关键洞察提取与图表数据生成",
                          "结构化报告撰写与引用溯源",
                        ][idx]
                      }
                    </p>
                    {idx < 3 && (
                      <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        →
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 py-16 border-t">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-4">准备好提升研究效率了吗？</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              免费版已包含完整研究工作流，无需绑定信用卡。
            </p>
            <Button asChild size="lg">
              <Link href="/register">免费创建账户</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} InsightForge. All rights reserved.</p>
      </footer>
    </div>
  );
}
