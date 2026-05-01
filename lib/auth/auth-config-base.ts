// Shared NextAuth configuration
// Used by both Node.js and Edge runtime instances

import Credentials from "next-auth/providers/credentials";
import { type NextAuthConfig } from "next-auth";

export const authConfigBase: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Import here to avoid bundling password utilities in Edge runtime
        const { findUserByEmail } = await import("@/lib/auth/user-service");
        const { verifyPassword } = await import("@/lib/auth/password");

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await findUserByEmail(email);

        if (!user || !user.passwordHash) {
          return null;
        }

        const isCorrectPassword = await verifyPassword(password, user.passwordHash);

        if (!isCorrectPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? "";
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};