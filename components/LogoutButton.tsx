"use client";

import { signOut } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="gap-1.5"
    >
      <LogOutIcon className="size-3.5" />
      Sign Out
    </Button>
  );
}
