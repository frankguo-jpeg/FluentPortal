"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { ChatPanel } from "./chat-panel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen">{children}</main>
      <ChatPanel />
    </div>
  );
}
