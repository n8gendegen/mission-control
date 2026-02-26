import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Autonomous revenue and ops dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
