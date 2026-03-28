import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import MobileMenuHandler from "@/components/layout/MobileMenuHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mapleki | 매왕 대시보드",
  description: "메이플스토리 키우기 '매왕' 길드 관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <MobileMenuHandler />
          <input type="checkbox" id="mobile-menu" className="peer hidden" />
          <label htmlFor="mobile-menu" className="peer-checked:block hidden md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm cursor-pointer" aria-hidden="true" />
          
          <Sidebar />
          <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full relative transition-all duration-300 min-w-0">
            <Header />
            <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
