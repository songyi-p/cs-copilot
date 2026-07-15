import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "CS Copilot | 고객 지원",
  description: "AI 기반 고객 지원 운영 화면",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
