import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // Try bcrypt comparison first (for new users)
        let passwordMatch = false;
        try {
          passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
        } catch {
          // If bcrypt compare fails, the password might be SHA256 hashed (legacy admin)
          passwordMatch = false;
        }

        // Fallback: try SHA256 comparison for legacy admin accounts
        if (!passwordMatch) {
          const sha256Hash = crypto
            .createHash("sha256")
            .update(credentials.password)
            .digest("hex");
          passwordMatch = sha256Hash === user.password;
        }

        if (!passwordMatch) {
          return null;
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
