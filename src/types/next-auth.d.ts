import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    avatar: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    avatar: string | null;
  }
}
