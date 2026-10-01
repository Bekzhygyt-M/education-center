import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/server/db/prisma";
import { loginSchema } from "@/server/validation/auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * Credentials provider with email + password. Passwords are hashed with
 * bcryptjs; the plaintext is never stored and never returned. There is no
 * public registration — accounts are created by an admin in a later phase.
 *
 * The session is a signed, httpOnly JWT cookie managed by Auth.js
 * (AUTH_SECRET). Nothing sensitive is stored client-side.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 hours
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Email va parol",
      credentials: {
        email: { label: "Elektron pochta", type: "email" },
        password: { label: "Parol", type: "password" },
      },
      async authorize(rawCredentials) {
        // Validate shape before touching the database.
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { teacher: { select: { id: true } } },
        });

        // Compare against a dummy hash when the user is missing so that a
        // wrong email and a wrong password take the same amount of time,
        // which avoids leaking which accounts exist.
        const hash = user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const ok = await bcrypt.compare(password, hash);

        if (!user || !ok || !user.isActive) return null;

        // Record a successful login timestamp.
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          teacherId: user.teacher?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Persist the minimal identity in the JWT. Authorisation decisions are
     * NOT trusted from this token — server code re-reads role and isActive
     * from the database on each request (see getCurrentUser).
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teacherId = user.teacherId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.teacherId =
          typeof token.teacherId === "string" ? token.teacherId : null;
      }
      return session;
    },
  },
});