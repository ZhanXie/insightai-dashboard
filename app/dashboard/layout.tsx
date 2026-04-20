import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
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
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Navigation */}
      <nav className="shrink-0 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              AI Dashboard
            </Link>
            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/chat"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Chat
              </Link>
              <Link
                href="/dashboard/documents"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Documents
              </Link>
              <Link
                href="/dashboard/analytics"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Analytics
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
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
              <div className="h-8 w-48 rounded bg-gray-200" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-gray-200" />
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
