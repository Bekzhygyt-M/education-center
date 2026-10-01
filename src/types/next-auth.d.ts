import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/enums";

/**
 * Teaches TypeScript about the extra fields our callbacks attach to the
 * session and JWT. Without this, session.user.role would be a type error.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      teacherId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    teacherId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    teacherId?: string | null;
  }
}