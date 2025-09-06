"use client";

import React from "react";
import Link from "next/link";
import { Bot } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300 bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Flow</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-gray-900">
          <a href="#explore" className="hover:text-primary transition-colors text-sm font-medium">Explore Agents</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors text-sm font-medium">How It Works</a>
          <a href="#features" className="hover:text-primary transition-colors text-sm font-medium">Features</a>
        </div>
        
        <Link 
          href="/chat" 
          className="bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:opacity-90 px-5 py-2 text-base font-medium rounded-lg shadow-lg transition-all duration-300"
        >
          Launch App
        </Link>
      </nav>
    </header>
  );
}
