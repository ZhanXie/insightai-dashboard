import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Suspense } from "react";
import { NavigationLink } from "@/components/ui/NavigationLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guard = await requireAuth();
  if ("response" in guard) {
    redirect("/login");
  }
  const session = guard.session;
  const userId = session.user?.id;

  // 验证用户是否存在于数据库中，防止外键约束报错 (P2003)
  // 这种情况通常发生在数据库重置但浏览器缓存了旧 Session 时
  if (userId) {
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!userExists) {
      // 主动清除无效会话 Cookie，强制打破 307 重定向循环
      const cookieStore = await cookies();
      cookieStore.delete("next-auth.session-token");
      cookieStore.delete("__Secure-next-auth.session-token");
      redirect("/login?reason=session_expired");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Top Navigation */}
      <nav className="shrink-0 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-foreground"
            >
              InsightForge
            </Link>
            <div className="flex gap-4">
              <NavigationLink href="/dashboard">
                Overview
              </NavigationLink>
              <NavigationLink href="/dashboard/projects">
                Projects
              </NavigationLink>
              <NavigationLink href="/dashboard/reports">
                Reports
              </NavigationLink>
              <NavigationLink href="/dashboard/chat">
                Chat
              </NavigationLink>
              <NavigationLink href="/dashboard/documents">
                Documents
              </NavigationLink>
              <NavigationLink href="/dashboard/settings">
                Settings
              </NavigationLink>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">
              {session.user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="animate-pulse space-y-4 p-6">
              <div className="h-8 w-48 rounded bg-muted" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted" />
                ))}
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  );
}
