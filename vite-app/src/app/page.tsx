'use client';

import { BalanceSheet } from "@/components/BalanceSheet";
import ClientOnly from "@/components/ClientOnly";

export default function Home() {
  return (
    <div>
      <ClientOnly
        fallback={
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">Loading...</div>
                <p className="text-gray-400">Please wait while we load your financial data.</p>
              </div>
            </div>
          </div>
        }
      >
        <BalanceSheet />
      </ClientOnly>
    </div>
  );
}
