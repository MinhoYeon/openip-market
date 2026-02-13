import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Navbar from "@/components/Navigation/Navbar";

export const metadata: Metadata = {
  title: {
    template: '%s | OpenIP Market',
    default: 'OpenIP Market | Premium IP Transaction Platform',
  },
  description: "Secure, transparent, and efficient intellectual property marketplace for owners, buyers, and brokers.",
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://openip.market',
    siteName: 'OpenIP Market',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'OpenIP Market'
    }],
  },
  robots: {
    index: true,
    follow: true,
  }
};

import { I18nProvider } from "@/lib/i18n/i18n-context";

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
