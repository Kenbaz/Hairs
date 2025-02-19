import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./_components/_providers/ToastProvider";
import { ReduxProvider } from "@/src/libs/_redux/Provider";
import { QueryProvider } from "./_components/_providers/QueryProvider";
import { CurrencyProvider } from "./_components/_providers/CurrencyContext";
import { PaymentProvider } from "./_components/_providers/PaymentContext";
import { CartInitializer } from "./_components/_providers/CartInitializer";
import { WishlistInitializer } from "./_components/_providers/WishlistInitializer";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased overflow-y-hidden`}
      >
        <QueryProvider>
          <ReduxProvider>
            <PaymentProvider>
              <CurrencyProvider>
                <CartInitializer />
                <WishlistInitializer />
                {children}
                <ToastProvider />
              </CurrencyProvider>
            </PaymentProvider>
          </ReduxProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
