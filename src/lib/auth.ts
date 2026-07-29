import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password || email.length > 320 || password.length > 256) {
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        let passwordMatches = false;
        let legacyPassword = false;

        try {
          passwordMatches = await bcrypt.compare(password, user.password);
        } catch {
          passwordMatches = false;
        }

        if (!passwordMatches) {
          const sha256Hash = createHash("sha256")
            .update(password)
            .digest("hex");
          passwordMatches = sha256Hash === user.password;
          legacyPassword = passwordMatches;
        }

        if (!passwordMatches) return null;

        if (legacyPassword) {
          await db.user.update({
            where: { id: user.id },
            data: { password: await bcrypt.hash(password, 12) },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.avatar = (user as { avatar: string | null }).avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
