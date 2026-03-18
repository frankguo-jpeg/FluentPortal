import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "COMPANY_ADMIN" | "MANAGER";
      companyId: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "COMPANY_ADMIN" | "MANAGER";
    companyId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "COMPANY_ADMIN" | "MANAGER";
    companyId: string | null;
  }
}
