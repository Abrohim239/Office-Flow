import "./globals.css";
import type { Metadata } from "next";
import LayoutWrapper from "./components/LayoutWrapper";

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
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
