import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Suspense } from "react";

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
              AI Dashboard
            </Link>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/chat"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Chat
              </Link>
              <Link
                href="/dashboard/documents"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documents
              </Link>
              <Link
                href="/dashboard/analytics"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Analytics
              </Link>
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
