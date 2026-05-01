// HTTP handler wrappers for consistent auth, error handling, and JSON responses
// Eliminates repetitive requireAuth() boilerplate

import { ApiError } from "@/lib/http/api-error";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { NextResponse } from "next/server";

// Helper to create JSON responses with proper headers
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Wrapper for authenticated routes
// Automatically validates session and injects userId
export function withAuth(
  handler: (
    req: Request,
    context: { userId: string }
  ) => Promise<Response | unknown>
) {
  return async (req: Request) => {
    try {
      const session = await auth();

      if (!session?.user?.id) {
        return json({ error: "Unauthorized" }, 401);
      }

      const result = await handler(req, { userId: session.user.id });

      // If handler returns a Response, send it directly
      if (result instanceof Response) {
        return result;
      }

      // Otherwise wrap in JSON response
      return json(result);
    } catch (error) {
      // Handle ApiErrors with specific status codes
      if (error instanceof ApiError) {
        return json(
          { error: error.safeMessage(), details: error.details },
          error.status
        );
      }

      // Handle other errors as 500s
      console.error("Unhandled error in withAuth handler:", error);
      return json({ error: "An error occurred" }, 500);
    }
  };
}

// Wrapper for public API routes
// Provides consistent error handling and JSON responses
export function withApi(
  handler: (req: Request) => Promise<Response | unknown>
) {
  return async (req: Request) => {
    try {
      const result = await handler(req);

      // If handler returns a Response, send it directly
      if (result instanceof Response) {
        return result;
      }

      // Otherwise wrap in JSON response
      return json(result);
    } catch (error) {
      // Handle ApiErrors with specific status codes
      if (error instanceof ApiError) {
        return json(
          { error: error.safeMessage(), details: error.details },
          error.status
        );
      }

      // Handle other errors as 500s
      console.error("Unhandled error in withApi handler:", error);
      return json({ error: "An error occurred" }, 500);
    }
  };
}
