import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GiveOrGrow — Bet on yourself",
  description:
    "Finish your course and get your deposit back. Or it goes to charity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
