import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReparNova Track",
  description: "Client-facing repair tracking portal for QR code access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
