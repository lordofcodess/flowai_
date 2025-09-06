"use client";

import { ReactNode } from "react";

interface ChatLayoutProps {
  children: ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <div className="h-screen bg-background overflow-hidden">
      <main className="h-full">
        {children}
      </main>
    </div>
  );
}
