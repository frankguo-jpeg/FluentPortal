"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isChatPage = pathname === "/chat";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto h-screen ${isChatPage ? "" : "p-8"}`}>{children}</main>
    </div>
  );
}
