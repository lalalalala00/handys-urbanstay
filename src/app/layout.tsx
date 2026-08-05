import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/Toast";
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
        <ToastProvider>
          <div className="flex h-full w-full min-w-0 overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-6">
                {children}
              </main>
            </div>
          </div>
          {modal}
        </ToastProvider>
      </body>
    </html>
  );
}
