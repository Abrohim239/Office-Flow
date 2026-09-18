import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OfficeFlow Pro",
  description: "Office Task & Delivery Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            padding: "15px 25px",
            borderBottom: "1px solid #ddd",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "20px" }}>
            OfficeFlow Pro
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/employees">Employees</Link>
            <Link href="/tasks">Tasks</Link>
            <Link href="/reports">Reports</Link>
          </div>
        </nav>

        <main>{children}</main>
      </body>
    </html>
  );
}
