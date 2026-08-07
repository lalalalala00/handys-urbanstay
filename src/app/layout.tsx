import type { Metadata } from "next";
import { Sidebar } from "@/components/common/Sidebar";
import { Header } from "@/components/common/Header";
import { ToastProvider } from "@/components/common/Toast";
import { LayoutAlignProvider } from "@/components/common/LayoutAlignProvider";
import { AppShellFrame } from "@/components/common/AppShellFrame";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handys Stay Operations",
  description: "객실 상태 중심의 청소 작업·운영 이슈 통합 대시보드",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="h-full overflow-hidden">
        <LayoutAlignProvider>
          <ToastProvider>
            <AppShellFrame sidebar={<Sidebar />} header={<Header />}>
              {children}
            </AppShellFrame>
            {modal}
          </ToastProvider>
        </LayoutAlignProvider>
      </body>
    </html>
  );
}
