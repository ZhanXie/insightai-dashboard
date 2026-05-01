"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
    >
      <LogOutIcon className="size-3.5" />
      Sign Out
    </button>
  );
}
