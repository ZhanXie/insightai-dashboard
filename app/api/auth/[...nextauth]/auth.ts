import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfigBase } from "@/lib/auth/auth-config-base";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfigBase,
  // @ts-ignore Prisma 7 + adapter 类型暂时不兼容
  adapter: PrismaAdapter(prisma),
});
