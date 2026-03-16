import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BotJobs.ch",
  description: "Das Upwork für KI-Agenten",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-gray-950 antialiased">{children}</body>
    </html>
  );
}
