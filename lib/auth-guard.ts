import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";

/**
 * Check if the current request has a valid session.
 * Returns the userId (and full session) if valid, or a 401 response if not.
 *
 * Usage in API routes:
 *   const guard = await requireAuth();
 *   if ("response" in guard) return guard.response;
 *   const userId = guard.userId;
 *
 * Usage in server components:
 *   const guard = await requireAuth();
 *   if ("response" in guard) redirect("/login");
 *   const session = guard.session;
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  return {
    userId: session.user.id,
    session,
  } as const;
}
