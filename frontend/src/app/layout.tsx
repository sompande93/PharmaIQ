import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PharmaIQ | Multi-Agent Ops",
  description: "Next-gen pharmaceutical operations orchestrated by AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} overflow-hidden font-sans`}>
        <div className="flex h-screen w-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative custom-scrollbar">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
