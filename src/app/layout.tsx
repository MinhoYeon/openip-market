import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Navbar from "@/components/Navigation/Navbar";

export const metadata: Metadata = {
  title: "OpenIP Market | Premium IP Transaction Platform",
  description: "Secure, transparent, and efficient intellectual property marketplace for owners, buyers, and brokers.",
};

import { I18nProvider } from "@/components/I18nProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <I18nProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
