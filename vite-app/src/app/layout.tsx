import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FinanceProvider } from "@/context/FinanceContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { TransactionProvider } from "@/context/TransactionContext";
import { BudgetProvider } from "@/context/BudgetContext";
import { CardProvider } from "@/context/CardContext";
import { RecurringProvider } from "@/context/RecurringContext";
import Navigation from "@/components/Navigation";
import ClientOnly from "@/components/ClientOnly";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wealth and Finance Manager",
  description: "Track your personal wealth and finances with balance sheets and account management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white min-h-screen`}
        style={{ backgroundColor: 'white' }}
      >
        <GoogleAnalytics />

        <AuthProvider>
          <CurrencyProvider>
            <FinanceProvider>
              <CardProvider>
                <TransactionProvider>
                  <BudgetProvider>
                    <RecurringProvider>
                      <ClientOnly
                        fallback={
                          <nav className="bg-white shadow-lg border-b">
                            <div className="max-w-6xl mx-auto px-4">
                              <div className="flex justify-between items-center py-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-2xl">📈</span>
                                  <span className="text-xl font-bold text-gray-800 hidden sm:block">Wealth and Finance Manager</span>
                                  <span className="text-lg font-bold text-gray-800 sm:hidden">Wealth Manager</span>
                                </div>
                              </div>
                            </div>
                          </nav>
                        }
                      >
                        <Navigation />
                      </ClientOnly>
                      <main className="py-8 px-4">
                        {children}
                      </main>
                    </RecurringProvider>
                  </BudgetProvider>
                </TransactionProvider>
              </CardProvider>
            </FinanceProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
