import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TaskProvider } from "@/context/task-context";
import { Cinzel } from "next/font/google";
import { cn } from "@/lib/utils";
import Sparkles from "@/components/ui/sparkles";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "WizWare Taskmaster",
  description: "AI-powered dashboard for your project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          cinzel.variable
        )}
      >
        <Sparkles />
        <TaskProvider>
          {children}
        </TaskProvider>
        <Toaster />
      </body>
    </html>
  );
}
