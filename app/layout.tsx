import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";

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
        <div className="app-layout">
          <Sidebar />

          <div className="main-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
