import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from './components/Header'
import AuthGuard from './components/AuthGuard'; // 추가


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "폐기물 감사 정보 시스템",
  description: "Waste Audit Information System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* 모든 페이지 상단에 공통 헤더 배치 */}
        <Header />
        
        {/* [수정] 페이지 콘텐츠 영역을 AuthGuard로 감싸줍니다. */}
        <AuthGuard>
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}

