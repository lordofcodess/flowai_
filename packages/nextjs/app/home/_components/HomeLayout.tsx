"use client";

import { ReactNode } from "react";
interface HomeLayoutProps {
  children: ReactNode;
}

export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pt-20">
        {children}
      </main>
    
    </div>
  );
}
