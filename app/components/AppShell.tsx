"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const publicPage =
    pathname === "/view" || pathname === "/login";

  return (
    <div className={publicPage ? "public-layout" : "app-layout"}>
      {!publicPage && <Sidebar />}

      <div
        className={
          publicPage ? "public-content" : "main-content"
        }
      >
        {children}
      </div>
    </div>
  );
}
