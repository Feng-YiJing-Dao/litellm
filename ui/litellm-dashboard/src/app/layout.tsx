import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/contexts/AuthContext";
import ReactQueryProvider from "@/contexts/ReactQueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

const inter = Inter({ subsets: ["latin"] });

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "LiteLLM";

export const metadata: Metadata = {
  title: `${brandName} Dashboard`,
  description: `${brandName} Proxy Admin UI`,
  icons: { icon: "/get_favicon" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <NuqsAdapter>
            <I18nProvider>
              <ReactQueryProvider>
                <AuthProvider>{children}</AuthProvider>
                <Toaster />
              </ReactQueryProvider>
            </I18nProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
