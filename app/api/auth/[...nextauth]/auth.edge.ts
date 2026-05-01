import NextAuth from "next-auth";
import { authConfigBase } from "@/lib/auth/auth-config-base";

// Edge-compatible auth config (no Prisma, no bcrypt)
export const { handlers, auth, signIn, signOut } = NextAuth(authConfigBase);
