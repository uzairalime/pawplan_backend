import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PawPlan Admin",
  description: "Admin portal for PawPlan"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
