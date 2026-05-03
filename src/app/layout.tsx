import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Market Signal Intelligence Engine",
  description: "Frontend MVP for explainable market intelligence."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
