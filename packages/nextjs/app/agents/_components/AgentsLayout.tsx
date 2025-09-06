"use client";

import { ReactNode } from "react";
import { Header } from "../../../components/Header";
import Footer from "../../../components/Footer";

interface AgentsLayoutProps {
  children: ReactNode;
}

export function AgentsLayout({ children }: AgentsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
