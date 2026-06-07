import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReparNova Client Tracking",
  description: "Client-facing repair tracking site for QR code access.",
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
