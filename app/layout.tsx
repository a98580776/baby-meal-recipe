import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist_Mono } from "next/font/google";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
// 제목류 전용 (font-serif-kr Tailwind 유틸, globals.css) — 본문/버튼/숫자는
// 계속 Pretendard.
import "@fontsource/noto-serif-kr/500.css";
import "@fontsource/noto-serif-kr/700.css";
import "./globals.css";
import { BottomNavBar } from "@/components/common/BottomNavBar";

// font-mono utility (Cooking Mode's timer digits) still needs a monospace
// face — Pretendard has no numeral-specific mono variant, so Geist Mono
// stays for that one use.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "오늘의 이유식",
  description: "재료와 아기 단계를 입력하면 손질부터 조리, 안전 주의사항까지 한 화면에서 확인하는 이유식 조리 도구",
  manifest: "/manifest.json",
};

// metadata.themeColor is deprecated since Next.js 13.2 — theme-color now
// lives on the separate `viewport` export (see generateViewport docs).
// colorScheme: "light" prevents mobile OS dark mode from auto-inverting
// form controls/scrollbars — this app has no real dark theme yet.
export const viewport: Viewport = {
  themeColor: "#5F6E2A",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <BottomNavBar />
        </Suspense>
      </body>
    </html>
  );
}
